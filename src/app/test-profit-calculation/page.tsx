'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@/components/WalletSelector';
import {
  calculateProtocolProfit,
  calculateTotalProfit,
  Transaction as TransactionType,
  formatProfitValue,
  formatPercentage,
  extractTransactionAmount,
} from '@/lib/utils/profitCalculation';
import { ProtocolProfitCard } from '@/components/portfolio/ProtocolProfitCard';
import { ProfitSummaryCard } from '@/components/portfolio/ProfitSummaryCard';

export default function TestProfitCalculationPage() {
  const { account, connected } = useWallet();
  const defaultWalletAddress = account?.address?.toString();

  // Add client-side check to prevent hydration errors
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [transactions, setTransactions] = React.useState<TransactionType[]>([]);
  const [walletAddress, setWalletAddress] = React.useState(
    defaultWalletAddress || ''
  );
  const [profitData, setProfitData] = React.useState<any>(null);

  // Обновляем useEffect для расчета прибыли при изменении транзакций
  React.useEffect(() => {
    if (transactions.length > 0) {
      const totalProfitData = calculateTotalProfit(transactions);
      setProfitData(totalProfitData);
    } else {
      setProfitData(null);
    }
  }, [transactions]);

  const handleRefreshHistory = () => {
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage('Пожалуйста, введите адрес кошелька');
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    console.log('=== Starting profit calculation test ===');
    console.log('walletAddress:', walletAddress);

    // Fetch real transactions from Aptos blockchain
    const fetchRealTransactions = async (address: string) => {
      try {
        // Function to fetch all transactions with pagination
        const fetchAllTransactions = async (address: string) => {
          let allTransactions: any[] = [];
          let start = 0;
          const limit = 1000;
          let hasMore = true;
          let pageCount = 0;

          while (hasMore) {
            pageCount++;

            const response = await fetch(
              `https://indexer.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?start=${start}&limit=${limit}&include_events=true&include_payload=true&order=desc`
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            allTransactions = allTransactions.concat(data);

            // If we got less than the limit, we've reached the end
            if (data.length < limit) {
              hasMore = false;
            } else {
              start += limit;
            }
          }

          return allTransactions;
        };

        // Fetch ALL transactions from Aptos Indexer API with pagination
        const data = await fetchAllTransactions(address);

        console.log(
          `Fetched ${data.length} transactions for profit calculation`
        );

        // Transform API data to our format
        const transformedTransactions = data.map((tx: any, index: number) => {
          // Determine transaction type based on payload and events
          let type: TransactionType['type'] = 'transfer';
          let protocol = 'Aptos';
          let amount = '0 APT';

          // Check if it's a coin transfer
          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            const moduleName =
              tx.payload.function.split('::')[0] +
              '::' +
              tx.payload.function.split('::')[1];

            // Check for specific function patterns
            if (
              functionName.includes('coin::transfer') ||
              functionName.includes('coin::transfer_with_metadata')
            ) {
              type = 'transfer';
              protocol = 'Aptos';
            } else if (
              functionName.includes('swap') ||
              functionName.includes('exchange')
            ) {
              type = 'swap';
              protocol = 'DEX';
            } else if (
              functionName.includes('stake') ||
              functionName.includes('delegation')
            ) {
              type = 'stake';
              protocol = 'Staking';
            } else if (
              functionName.includes('yield') ||
              functionName.includes('farming')
            ) {
              type = 'yield';
              protocol = 'Yield';
            } else if (functionName.includes('deposit')) {
              type = 'deposit';
              protocol = 'Protocol';
            } else if (functionName.includes('withdraw')) {
              type = 'withdraw';
              protocol = 'Protocol';
            } else if (
              functionName.includes('claim') ||
              functionName.includes('reward')
            ) {
              type = 'claim';
              protocol = 'Rewards';
            } else {
              // For other functions, use the module name as protocol
              type = 'other';
              protocol = moduleName.split('::')[1] || 'Aptos';
            }
          } else if (tx.payload?.type === 'script_payload') {
            type = 'other';
            protocol = 'Aptos';
          } else if (tx.payload?.type === 'module_bundle_payload') {
            type = 'other';
            protocol = 'Aptos';
          }

          // Try to extract amount from events more accurately
          if (tx.events && tx.events.length > 0) {
            const coinEvent = tx.events.find(
              (event: any) =>
                event.type.includes('CoinStore') ||
                event.type.includes('Transfer') ||
                event.type.includes('DepositEvent') ||
                event.type.includes('WithdrawEvent')
            );
            if (coinEvent && coinEvent.data) {
              const amountData =
                coinEvent.data.amount ||
                coinEvent.data.value ||
                coinEvent.data.coin_amount;
              if (amountData) {
                const aptAmount = parseFloat(amountData) / Math.pow(10, 8);
                amount = `${aptAmount.toFixed(2)} APT`;
              }
            }
          }

          // Используем улучшенную логику извлечения суммы
          const { amount: extractedAmount, token: extractedToken } =
            extractTransactionAmount(tx, String(tx.sender || 'Unknown'));
          amount = `${extractedAmount.toFixed(4)} ${extractedToken}`;

          // Improved recipient address extraction
          let recipientAddress = 'Unknown';

          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            const args = tx.payload.arguments || [];

            // Extract recipient based on function type
            if (
              functionName.includes('coin::transfer') ||
              functionName.includes('coin::transfer_with_metadata')
            ) {
              // For coin transfers, first argument is usually the recipient
              recipientAddress = String(args[0] || 'Unknown');
            } else if (
              functionName.includes('stake') ||
              functionName.includes('delegation')
            ) {
              // For staking, look for validator address or pool address
              const stakeEvent = tx.events?.find(
                (event: any) =>
                  event.type.includes('Stake') ||
                  event.type.includes('Delegation') ||
                  event.type.includes('Validator')
              );

              if (stakeEvent?.data?.validator_address) {
                recipientAddress = String(stakeEvent.data.validator_address);
              } else if (stakeEvent?.data?.pool_address) {
                recipientAddress = String(stakeEvent.data.pool_address);
              } else if (stakeEvent?.data?.to) {
                recipientAddress = String(stakeEvent.data.to);
              } else if (args.length > 0) {
                // Check if first argument looks like an address
                if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  'inner' in args[0]
                ) {
                  const innerValue = String(args[0].inner || '');
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `Pool/Validator ID: ${innerValue}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `Pool/Validator ID: ${firstArg}`;
                  }
                }
              }
            } else if (functionName.includes('deposit')) {
              // For deposits, look for pool address
              const depositEvent = tx.events?.find(
                (event: any) =>
                  event.type.includes('Deposit') ||
                  event.type.includes('Pool') ||
                  event.type.includes('Liquidity')
              );

              if (depositEvent?.data?.pool_address) {
                recipientAddress = String(depositEvent.data.pool_address);
              } else if (depositEvent?.data?.to) {
                recipientAddress = String(depositEvent.data.to);
              } else if (args.length > 0) {
                // Check if first argument looks like an address
                if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  'inner' in args[0]
                ) {
                  const innerValue = String(args[0].inner || '');
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `Pool ID: ${innerValue}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `Pool ID: ${firstArg}`;
                  }
                }
              }
            } else if (
              functionName.includes('swap') ||
              functionName.includes('exchange')
            ) {
              // For swaps, look for DEX address or pool address
              const swapEvent = tx.events?.find(
                (event: any) =>
                  event.type.includes('Swap') ||
                  event.type.includes('Exchange') ||
                  event.type.includes('Trade')
              );

              if (swapEvent?.data?.dex_address) {
                recipientAddress = String(swapEvent.data.dex_address);
              } else if (swapEvent?.data?.pool_address) {
                recipientAddress = String(swapEvent.data.pool_address);
              } else if (swapEvent?.data?.to) {
                recipientAddress = String(swapEvent.data.to);
              } else if (args.length > 0) {
                // Check if first argument looks like an address
                if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  'inner' in args[0]
                ) {
                  const innerValue = String(args[0].inner || '');
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${innerValue}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${firstArg}`;
                  }
                }
              }
            } else {
              // For other functions, try to find recipient from events
              const transferEvent = tx.events?.find(
                (event: any) =>
                  event.type.includes('Transfer') ||
                  event.type.includes('CoinStore') ||
                  event.type.includes('Deposit') ||
                  event.type.includes('Withdraw')
              );

              if (transferEvent?.data?.to) {
                recipientAddress = String(transferEvent.data.to);
              } else if (transferEvent?.data?.recipient) {
                recipientAddress = String(transferEvent.data.recipient);
              } else if (args.length > 0) {
                // Fallback to first argument
                if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  'inner' in args[0]
                ) {
                  const innerValue = String(args[0].inner || '');
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `ID: ${innerValue}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `ID: ${firstArg}`;
                  }
                }
              }
            }
          }

          return {
            id: tx.version || index.toString(),
            type,
            protocol,
            timestamp: tx.timestamp,
            amount,
            status: tx.success ? ('completed' as const) : ('failed' as const),
            hash:
              tx.hash ||
              `0x${(index * 12345).toString(16).padStart(16, '0')}...`,
            from: String(tx.sender || 'Unknown'),
            to: recipientAddress,
            function: tx.payload?.function || 'N/A',
            _rawData: tx, // Store raw API data for debugging
          };
        });

        console.log(
          `Transformed ${transformedTransactions.length} transactions for profit calculation`
        );

        // Sort transactions by timestamp in descending order (newest first)
        const sortedTransactions = transformedTransactions.sort(
          (a: any, b: any) => {
            // Safe timestamp comparison
            const getTimestamp = (timestamp: any) => {
              if (!timestamp) return 0;

              let numTimestamp: number;
              if (typeof timestamp === 'string') {
                numTimestamp = parseFloat(timestamp);
                if (isNaN(numTimestamp)) return 0;
              } else {
                numTimestamp = timestamp;
              }

              // Check if it's microseconds (very large number)
              if (numTimestamp > 1000000000000000) {
                // Microseconds - convert to milliseconds
                return numTimestamp / 1000;
              } else if (numTimestamp > 1000000000000) {
                // Likely milliseconds
                return numTimestamp;
              } else {
                // Likely seconds, convert to milliseconds
                return numTimestamp * 1000;
              }
            };

            const dateA = getTimestamp(a.timestamp);
            const dateB = getTimestamp(b.timestamp);

            // If timestamps are equal, sort by version (higher version = newer)
            if (dateA === dateB) {
              const versionA = parseInt(a.id) || 0;
              const versionB = parseInt(b.id) || 0;
              return versionB - versionA; // Higher version first
            }

            return dateB - dateA; // Descending order by timestamp
          }
        );

        console.log('Sorted transactions by date (newest first)');
        return sortedTransactions;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    };

    // Fetch transactions and calculate profit
    fetchRealTransactions(walletAddress)
      .then(realTransactions => {
        console.log(
          `Fetched ${realTransactions.length} real transactions for profit calculation`
        );
        setTransactions(realTransactions);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch transactions:', error);
        setHasError(true);
        setErrorMessage(`Ошибка при получении транзакций: ${error.message}`);
        setIsLoading(false);
      });
  };

  // Safe address truncation function
  const safeTruncateAddress = (address: any) => {
    if (!address || typeof address !== 'string') {
      return 'Unknown';
    }
    if (address.length <= 10) {
      return address;
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {!isClient ? (
        <div className='text-center py-8'>
          <div className='text-muted-foreground'>Загрузка...</div>
        </div>
      ) : (
        <>
          {/* Connected Wallet Display */}
          <Card>
            <CardHeader>
              <CardTitle>Подключенный кошелек</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <span className='text-sm font-medium'>Статус:</span>
                    <Badge variant={connected ? 'default' : 'destructive'}>
                      {connected ? 'Подключен' : 'Не подключен'}
                    </Badge>
                  </div>
                  <WalletSelector />
                </div>
                {connected && account?.address && (
                  <div className='flex items-center gap-4'>
                    <span className='text-sm font-medium'>Адрес:</span>
                    <code className='bg-gray-100 px-3 py-1 rounded text-sm'>
                      {account.ansName ||
                        safeTruncateAddress(account.address.toString())}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debug Section */}
          <Card>
            <CardHeader>
              <CardTitle>Отладка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setWalletAddress(
                        '0x56ff2fc971deecd286314fe99b8ffd6a5e72e62eacdc46ae9b234c5282985f97'
                      )
                    }
                  >
                    Кошелек Садкова
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setWalletAddress(
                        '0x03f422163a5a64b50c9cae35afe64a78e7cc0dc9b0f47c5104cfd96847ba0e2b'
                      )
                    }
                  >
                    Кошелек Рыбакова
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setWalletAddress(
                        '0xb427414a10936c52807ff270be4d3eb0520f0fb427f22e4a7924849369fe948e'
                      )
                    }
                  >
                    Кошелек Солкина
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Тест расчета прибыли по протоколам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <span>Адрес кошелька:</span>
                  <input
                    type='text'
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                    placeholder='Введите адрес кошелька'
                    className='flex-1 px-3 py-1 border rounded bg-white'
                  />
                </div>

                <div className='flex items-center gap-4'>
                  <span>Статус загрузки:</span>
                  <Badge variant={isLoading ? 'destructive' : 'default'}>
                    {isLoading ? 'Загрузка...' : 'Готов'}
                  </Badge>
                </div>

                {hasError && (
                  <div className='text-sm text-red-600'>
                    Ошибка: {errorMessage}
                  </div>
                )}

                <div className='flex flex-wrap gap-2'>
                  <Button onClick={handleRefreshHistory} disabled={isLoading}>
                    Рассчитать прибыль
                  </Button>

                  {/* Button to open in Aptos Explorer */}
                  <Button
                    variant='outline'
                    onClick={() => {
                      const explorerUrl = `https://explorer.aptoslabs.com/account/${walletAddress}?network=mainnet`;
                      window.open(explorerUrl, '_blank');
                    }}
                    disabled={!walletAddress.trim()}
                  >
                    Открыть в Aptos Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit Calculation Results */}
          {profitData && !isLoading && (
            <div className='space-y-6'>
              {/* Общая сводка по прибыли */}
              <ProfitSummaryCard
                protocolBreakdown={profitData.protocolBreakdown}
                totalProfit={profitData.totalProfit}
                overallStats={profitData.overallStats}
              />

              {/* Детальная информация по каждому протоколу */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {profitData.protocolBreakdown.map((protocol: any) => (
                  <ProtocolProfitCard
                    key={protocol.protocolName}
                    protocolName={protocol.protocolName}
                    profitData={protocol.profitData}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика транзакций</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Всего</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'transfer').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Переводы</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'swap').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Свопы</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'stake').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Стейкинг</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'deposit').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Депозиты</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'withdraw').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Выводы</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'claim').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Награды</div>
                </div>

                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {transactions.filter(tx => tx.type === 'yield').length}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Доходность
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
