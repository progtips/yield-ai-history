"use client";

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Hash, User, Hash as HashIcon, Hash as NumberIcon, Loader2 } from 'lucide-react';
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
  PARTIAL_ADDRESS: /^0x[a-fA-F0-9]{8,}$/
} as const;

// Типы поиска
export type SearchType = 'transaction' | 'address' | 'version' | 'block' | 'unknown';

// Интерфейс для результата поиска
export interface SearchResult {
  type: SearchType;
  value: string;
  url: string;
  exists: boolean;
}

// Определение типа поиска на основе регулярных выражений
export const getSearchType = (query: string): SearchType => {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) return 'unknown';
  
  // Проверяем полный хэш транзакции
  if (PATTERNS.TRANSACTION_HASH.test(trimmedQuery)) {
    return 'transaction';
  }
  
  // Проверяем версию/высоту блока (только цифры)
  if (PATTERNS.VERSION_OR_HEIGHT.test(trimmedQuery)) {
    const num = parseInt(trimmedQuery);
    // Если число большое, скорее всего это версия
    if (num > 1000000) {
      return 'version';
    }
    // Иначе это высота блока
    return 'block';
  }
  
  // Проверяем адрес
  if (PATTERNS.ADDRESS.test(trimmedQuery)) {
    return 'address';
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
        return <HashIcon className="h-4 w-4" />;
      case 'address':
        return <User className="h-4 w-4" />;
      case 'version':
      case 'block':
        return <NumberIcon className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  // Получение placeholder для типа поиска
  const getPlaceholder = (type: SearchType) => {
    switch (type) {
      case 'transaction':
        return 'Search by transaction hash (0x...)';
      case 'address':
        return 'Search by address (0x...)';
      case 'version':
        return 'Search by version number';
      case 'block':
        return 'Search by block height';
      default:
        return 'Search by hash, address, version, or block height';
    }
  };

  // Lightweight поиск
  const performLightweightSearch = useCallback(async (query: string): Promise<SearchResult> => {
    const trimmedQuery = query.trim();
    const searchType = getSearchType(trimmedQuery);
    
    if (searchType === 'unknown') {
      return {
        type: 'unknown',
        value: trimmedQuery,
        url: '',
        exists: false
      };
    }

    try {
      let exists = false;
      let url = '';

      // 1. Сначала пробуем найти транзакцию по хэшу
      if (searchType === 'transaction') {
        const txQuery = `
          query TransactionByHash($hash: String!) {
            transactions(where: { hash: { _eq: $hash } }, limit: 1) {
              hash
            }
          }
        `;
        
        const result = await executeQueryWithRetry(txQuery, { hash: trimmedQuery });
        if (result.transactions && result.transactions.length > 0) {
          exists = true;
          url = `/explorer/tx/${trimmedQuery}`;
        }
      }
      
      // 2. Если это число (версия/блок)
      else if (searchType === 'version' || searchType === 'block') {
        const num = parseInt(trimmedQuery);
        
        // Для больших чисел пробуем как версию
        if (searchType === 'version' || num > 1000000) {
          const versionQuery = `
            query TransactionByVersion($version: Int!) {
              transactions(where: { version: { _eq: $version } }, limit: 1) {
                version
              }
            }
          `;
          
          const result = await executeQueryWithRetry(versionQuery, { version: num });
          if (result.transactions && result.transactions.length > 0) {
            exists = true;
            url = `/explorer/tx/version/${trimmedQuery}`;
          }
        }
        
        // Для меньших чисел пробуем как блок
        if (!exists && (searchType === 'block' || num <= 1000000)) {
          // Моковая проверка для блока (в реальности нужен запрос к блокам)
          exists = true; // Предполагаем, что блок существует
          url = `/explorer/block/${trimmedQuery}`;
        }
      }
      
      // 3. Иначе пробуем как адрес
      else if (searchType === 'address') {
        const addressQuery = `
          query AccountTransactions($address: String!, $limit: Int!) {
            transactions(where: { sender: { _eq: $address } }, limit: 1) {
              sender
            }
          }
        `;
        
        const result = await executeQueryWithRetry(addressQuery, { 
          address: trimmedQuery, 
          limit: 1 
        });
        if (result.transactions && result.transactions.length > 0) {
          exists = true;
          url = `/explorer/account/${trimmedQuery}`;
        }
      }

      return {
        type: searchType,
        value: trimmedQuery,
        url,
        exists
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        type: searchType,
        value: trimmedQuery,
        url: '',
        exists: false
      };
    }
  }, []);

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
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              getSearchIcon(searchType)
            )}
          </div>
          
          <Input
            type="text"
            placeholder={getPlaceholder(searchType)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 pr-20 ${
              searchResult?.exists 
                ? 'border-green-500 focus:border-green-500' 
                : searchResult && !searchResult.exists 
                ? 'border-red-500 focus:border-red-500'
                : ''
            }`}
          />
          
          <Button
            type="submit"
            size="sm"
            disabled={!isValidInput || isSearching}
            onClick={handleSearchClick}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </form>

      {/* Индикатор статуса поиска */}
      {searchResult && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-background border rounded-md shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSearchIcon(searchResult.type)}
              <span className="text-sm">
                {searchResult.type === 'transaction' && 'Transaction'}
                {searchResult.type === 'address' && 'Account'}
                {searchResult.type === 'version' && 'Version'}
                {searchResult.type === 'block' && 'Block'}
                {searchResult.type === 'unknown' && 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {searchResult.value}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {searchResult.exists ? (
                <span className="text-xs text-green-600">Found</span>
              ) : (
                <span className="text-xs text-red-600">Not found</span>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-1 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
