'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Hash,
  User,
  Hash as HashIcon,
  Hash as NumberIcon,
  Loader2,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useExplorerStore } from '@/stores/explorer';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import { useRouter } from 'next/navigation';

// Регулярные выражения для валидации
export const PATTERNS = {
  // 0x + 64 hex символа (хэш транзакции)
  TRANSACTION_HASH: /^0x[a-fA-F0-9]{64}$/,
  // 0x + 40-66 hex символов (адрес)
  ADDRESS: /^0x[a-fA-F0-9]{40,66}$/,
  // Только цифры (версия/высота блока)
  VERSION_OR_HEIGHT: /^\d+$/,
  // Частичный хэш (минимум 8 символов)
  PARTIAL_HASH: /^0x[a-fA-F0-9]{8,}$/,
  // Частичный адрес (минимум 8 символов)
  PARTIAL_ADDRESS: /^0x[a-fA-F0-9]{8,}$/,
} as const;

// Типы поиска
export type SearchType =
  | 'transaction'
  | 'address'
  | 'version'
  | 'block'
  | 'unknown';

// Интерфейс для результата поиска
export interface SearchResult {
  type: SearchType;
  value: string;
  url: string;
  exists: boolean;
  errorMessage?: string;
}

// Определение типа поиска на основе регулярных выражений
export const getSearchType = (query: string): SearchType => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return 'unknown';

  // Проверяем числа - считаем их адресами кошельков
  if (PATTERNS.VERSION_OR_HEIGHT.test(trimmedQuery)) {
    return 'address';
  }

  // Проверяем адрес (включая длинные хэши как адреса кошельков)
  if (PATTERNS.ADDRESS.test(trimmedQuery)) {
    return 'address';
  }

  // Проверяем полный хэш транзакции (только если это не адрес)
  if (PATTERNS.TRANSACTION_HASH.test(trimmedQuery)) {
    // Если это выглядит как адрес кошелька (64 символа), считаем его адресом
    if (trimmedQuery.length === 66) {
      // 0x + 64 символа
      return 'address';
    }
    return 'transaction';
  }

  // Проверяем частичные совпадения
  if (PATTERNS.PARTIAL_HASH.test(trimmedQuery)) {
    return 'transaction';
  }

  if (PATTERNS.PARTIAL_ADDRESS.test(trimmedQuery)) {
    return 'address';
  }

  return 'unknown';
};

export function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 500);
  const { setFilters } = useExplorerStore();
  const router = useRouter();

  // Получение иконки для типа поиска
  const getSearchIcon = (type: SearchType) => {
    switch (type) {
      case 'transaction':
        return <HashIcon className='h-4 w-4' />;
      case 'address':
        return <User className='h-4 w-4' />;
      default:
        return <Search className='h-4 w-4' />;
    }
  };

  // Получение placeholder для типа поиска
  const getPlaceholder = (type: SearchType) => {
    switch (type) {
      case 'transaction':
        return 'Search by transaction version number (not hash)';
      case 'address':
        return 'Search by wallet address or number';
      default:
        return 'Search by wallet address, number, or transaction version';
    }
  };

  // Lightweight поиск
  const performLightweightSearch = useCallback(
    async (query: string): Promise<SearchResult> => {
      const trimmedQuery = query.trim();
      const searchType = getSearchType(trimmedQuery);

      if (searchType === 'unknown') {
        return {
          type: 'unknown',
          value: trimmedQuery,
          url: '',
          exists: false,
        };
      }

      try {
        let exists = false;
        let url = '';
        let errorMessage = '';

        // 1. Сначала пробуем найти транзакцию по хэшу
        if (searchType === 'transaction') {
          try {
            // Временно отключаем поиск транзакций по хэшу
            // так как схема GraphQL не поддерживает прямой поиск по хэшу
            errorMessage =
              'Transaction search by hash is not supported in current GraphQL schema. Please use transaction version number instead.';

            // Альтернативно, можем попробовать поиск по версии, если пользователь знает версию
            console.log(
              'Transaction search by hash not implemented - schema limitation'
            );
          } catch (txError) {
            console.error('Transaction search error:', txError);
            if (txError instanceof Error) {
              if (
                txError.message.includes('Network') ||
                txError.message.includes('fetch')
              ) {
                errorMessage =
                  'Network error: Unable to connect to Aptos Indexer';
              } else if (txError.message.includes('timeout')) {
                errorMessage = 'Request timeout: Indexer is not responding';
              } else if (
                txError.message.includes('401') ||
                txError.message.includes('403')
              ) {
                errorMessage = 'Authentication error: Invalid API key';
              } else {
                errorMessage = `Search failed: ${txError.message}`;
              }
            } else {
              errorMessage = 'Failed to search transaction: Unknown error';
            }
          }
        }

        // 2. Иначе пробуем как адрес (включая числа как номера кошельков)
        else if (searchType === 'address') {
          try {
            const addressQuery = `
            query AccountTransactions($address: String!) {
              user_transactions(where: { sender: { _eq: $address } }, limit: 1) {
                sender
                version
              }
            }
          `;

            console.log('Searching for address/wallet:', trimmedQuery);
            const result = await executeQueryWithRetry(addressQuery, {
              address: trimmedQuery,
            });
            console.log('Address search result:', result);

            if (
              result.user_transactions &&
              result.user_transactions.length > 0
            ) {
              exists = true;
              url = `/explorer/account/${trimmedQuery}`;
            } else {
              errorMessage = 'Account not found or has no transactions';
            }
          } catch (addressError) {
            console.error('Address search error:', addressError);
            if (addressError instanceof Error) {
              errorMessage = `Failed to search account: ${addressError.message}`;
            } else {
              errorMessage = 'Failed to search account: Unknown error';
            }
          }
        }

        return {
          type: searchType,
          value: trimmedQuery,
          url,
          exists,
          errorMessage,
        };
      } catch (error) {
        console.error('Search error:', error);
        return {
          type: searchType,
          value: trimmedQuery,
          url: '',
          exists: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Search failed due to network error',
        };
      }
    },
    []
  );

  // Обработка поиска
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResult(null);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      setError(null);

      try {
        const result = await performLightweightSearch(debouncedQuery);
        setSearchResult(result);
      } catch (err) {
        setError('Search failed');
        setSearchResult(null);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, performLightweightSearch]);

  // Обработка отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim() || !searchResult?.exists) {
      return;
    }

    // Обновляем глобальное состояние поиска
    setFilters({ searchQuery });

    // Переходим на страницу результата
    if (searchResult.url) {
      router.push(searchResult.url);
    }
  };

  // Обработка клика по кнопке поиска
  const handleSearchClick = () => {
    if (searchResult?.exists && searchResult.url) {
      setFilters({ searchQuery });
      router.push(searchResult.url);
    }
  };

  const searchType = getSearchType(searchQuery);
  const isValidInput = searchQuery.trim() && searchType !== 'unknown';

  return (
    <div className='relative w-full max-w-2xl'>
      <form onSubmit={handleSubmit} className='relative flex gap-2'>
        <div className='relative flex-1'>
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
            {isSearching ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              getSearchIcon(searchType)
            )}
          </div>

          <Input
            type='text'
            placeholder={getPlaceholder(searchType)}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`pl-10 ${
              searchResult?.exists
                ? 'border-green-500 focus:border-green-500'
                : searchResult && !searchResult.exists
                  ? 'border-red-500 focus:border-red-500'
                  : ''
            }`}
          />
        </div>

        <Button
          type='submit'
          size='default'
          disabled={!isValidInput || isSearching}
          onClick={handleSearchClick}
          className='px-6'
        >
          {isSearching ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            'Search'
          )}
        </Button>
      </form>

      {/* Блок с информацией о поиске */}
      {searchResult && (
        <div className='mt-3 p-3 bg-muted/50 border rounded-md'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              {getSearchIcon(searchResult.type)}
              <span className='text-sm font-medium'>
                {searchResult.type === 'transaction' && 'Transaction (Version)'}
                {searchResult.type === 'address' && 'Account/Wallet'}
                {searchResult.type === 'unknown' && 'Unknown'}
              </span>
              <span className='text-xs text-muted-foreground font-mono'>
                {searchResult.exists ? (
                  <button
                    onClick={() => {
                      setFilters({ searchQuery });
                      router.push(searchResult.url);
                    }}
                    className='hover:text-blue-600 hover:underline cursor-pointer transition-colors'
                    title='Перейти на страницу аккаунта'
                  >
                    {searchResult.value}
                  </button>
                ) : (
                  searchResult.value
                )}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              {searchResult.exists ? (
                <span className='text-xs text-green-600 font-medium'>
                  Found
                </span>
              ) : (
                <span className='text-xs text-red-600 font-medium'>
                  Not found
                </span>
              )}
            </div>
          </div>

          {(error || searchResult?.errorMessage) && (
            <div className='text-sm text-red-600'>
              <div className='whitespace-pre-wrap break-words'>
                {error || searchResult?.errorMessage}
              </div>
              {searchResult?.errorMessage && (
                <div className='mt-1 text-xs text-muted-foreground'>
                  Current network: mainnet
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Блок отладки */}
      {process.env.NODE_ENV === 'development' && (
        <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md'>
          <h4 className='text-sm font-medium text-blue-800 mb-2'>Отладка</h4>
          <div className='text-xs text-blue-700 space-y-1'>
            <div>
              <strong>API URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_INDEXER_GQL_URL ||
                'https://indexer-v1.mainnet.aptoslabs.com/v1/graphql (default)'}
            </div>
            <div>
              <strong>API Key:</strong>{' '}
              {process.env.NEXT_PUBLIC_INDEXER_API_KEY ? 'Set' : 'Not set'}
            </div>
            <div>
              <strong>Search Type:</strong> {searchResult?.type || 'None'}
            </div>
            <div>
              <strong>Query:</strong> {searchQuery || 'Empty'}
            </div>
            {searchResult && (
              <div>
                <strong>Result:</strong> {JSON.stringify(searchResult, null, 2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
