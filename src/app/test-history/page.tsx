'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Separator } from '@/components/ui/separator';
import { truncateAddress } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@/components/WalletSelector';
import protocolsList from '@/lib/data/protocolsList.json';
import { formatFunctionName } from '@/lib/utils/functionMapping';
import { formatTransactionDescription } from '@/lib/utils/transactionDescription';
import {
  calculateProtocolProfit,
  calculateTotalProfit,
  Transaction as TransactionType,
  formatProfitValue,
  formatPercentage,
} from '@/lib/utils/profitCalculation';

import { ProfitSummaryCard } from '@/components/portfolio/ProfitSummaryCard';

export default function TestHistoryPage() {
  const { account, connected } = useWallet();
  const defaultWalletAddress = account?.address?.toString();

  // Add client-side check to prevent hydration errors
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  React.useEffect(() => {
    if (!isClient) return; // Only run on client side
  }, [connected, account, defaultWalletAddress, isClient]);

  // Listen for wallet connection events
  React.useEffect(() => {
    const handleWalletChange = () => {
      // Wallet connection event handling removed
    };

    // Log initial state
    handleWalletChange();

    // This will run whenever connected or account changes
    return () => {
      // Wallet state change handling removed
    };
  }, [connected, account]);

  // Mock data for history testing
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [allTransactions, setAllTransactions] = React.useState<any[]>([]); // Все транзакции без фильтрации
  const [transactions, setTransactions] = React.useState<any[]>([]); // Отфильтрованные транзакции
  const [walletAddress, setWalletAddress] = React.useState(
    defaultWalletAddress || ''
  );
  const [filters, setFilters] = React.useState({
    type: 'all',
    dateRange: 'all', // "All time" - показывать все транзакции
    protocol: 'all',
  });
  const [applyFilters, setApplyFilters] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 20;

  const [detailedAnalysis, setDetailedAnalysis] = React.useState<any>(null);
  const [profitData, setProfitData] = React.useState<any>(null);

  // Обновляем useEffect для расчета прибыли при изменении транзакций
  React.useEffect(() => {
    if (transactions.length > 0) {
      const totalProfitData = calculateTotalProfit(
        transactions as TransactionType[]
      );
      setProfitData(totalProfitData);
    } else {
      setProfitData(null);
    }
  }, [transactions]);

  // Function to get protocol name by function path
  const getProtocolNameByFunction = (
    functionPath: string,
    recipientAddress: string
  ): string => {
    // Debug logging for protocol detection
    if (Math.random() < 0.05) {
      // Log 5% of calls to avoid spam
      console.log('getProtocolNameByFunction called:', {
        functionPath,
        recipientAddress,
      });
    }

    if (!functionPath || functionPath === 'Unknown') {
      return recipientAddress || 'Unknown';
    }

    // Extract the first part of the function path (before the first ::)
    const parts = functionPath.split('::');
    if (parts.length < 2) {
      return recipientAddress || functionPath;
    }

    const contractAddress = parts[0];

    // Normalize address (remove 0x prefix if present, ensure lowercase)
    const normalizedAddress = contractAddress.toLowerCase().replace(/^0x/, '');

    // Find protocol by contract address
    const protocol = protocolsList.find(p => {
      const protocolWithContract = p as any;
      const hasContract =
        protocolWithContract.contract &&
        typeof protocolWithContract.contract === 'string';

      if (!hasContract) {
        return false;
      }

      // Normalize contract address
      const normalizedContract = protocolWithContract.contract
        .toLowerCase()
        .replace(/^0x/, '');
      const matches = normalizedContract === normalizedAddress;

      return matches;
    });

    if (protocol) {
      if (Math.random() < 0.05) {
        console.log(
          'getProtocolNameByFunction result (by contract):',
          protocol.name
        );
      }
      return protocol.name;
    }

    // If no exact match found, return the original recipient address logic
    if (!recipientAddress || recipientAddress === 'Unknown') {
      return 'Unknown';
    }

    // Проверяем, что recipientAddress является строкой перед использованием startsWith
    const recipientStr = String(recipientAddress);
    if (
      recipientStr.startsWith('Pool/Validator ID:') ||
      recipientStr.startsWith('DEX/Pool ID:') ||
      recipientStr.startsWith('ID:')
    ) {
      return recipientStr;
    }

    // Try to find protocol by recipient address (old logic)
    const normalizedRecipientAddress = recipientAddress
      .toLowerCase()
      .replace(/^0x/, '');

    const protocolByAddress = protocolsList.find(p => {
      const protocolWithContract = p as any;
      const hasContract =
        protocolWithContract.contract &&
        typeof protocolWithContract.contract === 'string';

      if (!hasContract) {
        return false;
      }

      // Normalize contract address
      const normalizedContract = protocolWithContract.contract
        .toLowerCase()
        .replace(/^0x/, '');
      const matches = normalizedContract === normalizedRecipientAddress;

      return matches;
    });

    if (protocolByAddress) {
      const result = `${protocolByAddress.name} (${safeTruncateAddress(recipientAddress)})`;
      if (Math.random() < 0.05) {
        console.log('getProtocolNameByFunction result (by address):', result);
      }
      return result;
    }

    // If no match found at all, return the original recipient address
    if (Math.random() < 0.05) {
      console.log(
        'getProtocolNameByFunction result (fallback):',
        recipientAddress
      );
    }
    return recipientAddress;
  };

  // Log when transactions state changes
  React.useEffect(() => {
    // Transactions state change logging removed
  }, [transactions]);

  // Update wallet address when default changes
  React.useEffect(() => {
    if (defaultWalletAddress && !walletAddress) {
      setWalletAddress(defaultWalletAddress);
    }
  }, [defaultWalletAddress, walletAddress]);

  // Reset page to 1 when wallet address changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [walletAddress]);

  // Apply filters to existing data when filters change
  React.useEffect(() => {
    console.log('Filter useEffect triggered:', {
      allTransactionsLength: allTransactions.length,
      applyFilters,
      filters,
      isLoading,
    });

    // Не применяем фильтры, если данные еще загружаются
    if (isLoading) {
      console.log('Data is still loading, skipping filter application');
      return;
    }

    if (allTransactions.length > 0) {
      let filteredTransactions = [...allTransactions];

      if (applyFilters) {
        console.log('Applying filters...');

        // Filter by transaction type
        if (filters.type !== 'all') {
          const beforeTypeFilter = filteredTransactions.length;
          filteredTransactions = filteredTransactions.filter(
            tx => tx.type === filters.type
          );
          console.log(
            `Type filter (${filters.type}): ${beforeTypeFilter} -> ${filteredTransactions.length}`
          );
        }

        // Filter by protocol
        if (filters.protocol !== 'all') {
          const beforeProtocolFilter = filteredTransactions.length;
          filteredTransactions = filteredTransactions.filter(tx => {
            const protocolName = getProtocolNameByFunction(tx.function, tx.to);
            const matches = protocolName === filters.protocol;
            if (Math.random() < 0.1) {
              // Log 10% of comparisons
              console.log(
                `Protocol comparison: "${protocolName}" === "${filters.protocol}" = ${matches}`
              );
            }
            return matches;
          });
          console.log(
            `Protocol filter (${filters.protocol}): ${beforeProtocolFilter} -> ${filteredTransactions.length}`
          );
        }

        // Filter by date range
        const now = Date.now();
        const dateRanges = {
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          '90d': 90 * 24 * 60 * 60 * 1000,
          '1y': 365 * 24 * 60 * 60 * 1000,
        };

        if (filters.dateRange !== 'all') {
          const beforeDateFilter = filteredTransactions.length;
          const rangeMs =
            dateRanges[filters.dateRange as keyof typeof dateRanges];
          const cutoffTime = now - rangeMs;

          // Debug: показать временные метки транзакций
          filteredTransactions.forEach((tx, index) => {
            if (index < 3) {
              // Показать первые 3 транзакции
              try {
                let txTime: number;

                if (typeof tx.timestamp === 'string') {
                  const numTimestamp = parseFloat(tx.timestamp);
                  if (isNaN(numTimestamp)) {
                    console.log(`Transaction ${index + 1}: Invalid timestamp`, {
                      timestamp: tx.timestamp,
                      type: typeof tx.timestamp,
                    });
                    return;
                  }

                  // Check if it's nanoseconds (very very large number)
                  if (numTimestamp > 1000000000000000000) {
                    // Nanoseconds - convert to milliseconds
                    txTime = numTimestamp / 1000000;
                  } else if (numTimestamp > 1000000000000000) {
                    // Microseconds - convert to milliseconds
                    txTime = numTimestamp / 1000;
                  } else if (numTimestamp > 1000000000000) {
                    // Likely milliseconds
                    txTime = numTimestamp;
                  } else {
                    // Likely seconds, convert to milliseconds
                    txTime = numTimestamp * 1000;
                  }
                } else if (typeof tx.timestamp === 'number') {
                  // Check if it's nanoseconds (very very large number)
                  if (tx.timestamp > 1000000000000000000) {
                    // Nanoseconds - convert to milliseconds
                    txTime = tx.timestamp / 1000000;
                  } else if (tx.timestamp > 1000000000000000) {
                    // Microseconds - convert to milliseconds
                    txTime = tx.timestamp / 1000;
                  } else if (tx.timestamp > 1000000000000) {
                    // Likely milliseconds
                    txTime = tx.timestamp;
                  } else {
                    // Likely seconds, convert to milliseconds
                    txTime = tx.timestamp * 1000;
                  }
                } else {
                  console.log(
                    `Transaction ${index + 1}: Invalid timestamp type`,
                    {
                      timestamp: tx.timestamp,
                      type: typeof tx.timestamp,
                    }
                  );
                  return;
                }

                const isRecent = txTime > cutoffTime;
                const date = new Date(txTime);

                console.log(`Transaction ${index + 1}:`, {
                  timestamp: tx.timestamp,
                  date: date.toISOString(),
                  txTime,
                  cutoffTime,
                  isRecent,
                  ageInDays: Math.floor((now - txTime) / (24 * 60 * 60 * 1000)),
                });
              } catch (error) {
                console.log(
                  `Transaction ${index + 1}: Error processing timestamp`,
                  {
                    timestamp: tx.timestamp,
                    error:
                      error instanceof Error ? error.message : String(error),
                  }
                );
              }
            }
          });

          filteredTransactions = filteredTransactions.filter(tx => {
            try {
              let txTime: number;

              if (typeof tx.timestamp === 'string') {
                const numTimestamp = parseFloat(tx.timestamp);
                if (isNaN(numTimestamp)) {
                  return false;
                }

                // Check if it's nanoseconds (very very large number)
                if (numTimestamp > 1000000000000000000) {
                  // Nanoseconds - convert to milliseconds
                  txTime = numTimestamp / 1000000;
                } else if (numTimestamp > 1000000000000000) {
                  // Microseconds - convert to milliseconds
                  txTime = numTimestamp / 1000;
                } else if (numTimestamp > 1000000000000) {
                  // Likely milliseconds
                  txTime = numTimestamp;
                } else {
                  // Likely seconds, convert to milliseconds
                  txTime = numTimestamp * 1000;
                }
              } else if (typeof tx.timestamp === 'number') {
                // Check if it's nanoseconds (very very large number)
                if (tx.timestamp > 1000000000000000000) {
                  // Nanoseconds - convert to milliseconds
                  txTime = tx.timestamp / 1000000;
                } else if (tx.timestamp > 1000000000000000) {
                  // Microseconds - convert to milliseconds
                  txTime = tx.timestamp / 1000;
                } else if (tx.timestamp > 1000000000000) {
                  // Likely milliseconds
                  txTime = tx.timestamp;
                } else {
                  // Likely seconds, convert to milliseconds
                  txTime = tx.timestamp * 1000;
                }
              } else {
                return false;
              }

              return !isNaN(txTime) && txTime > cutoffTime;
            } catch (error) {
              console.log('Error filtering transaction by date:', {
                timestamp: tx.timestamp,
                error: error instanceof Error ? error.message : String(error),
              });
              return false; // Исключаем транзакции с невалидными временными метками
            }
          });
          console.log(
            `Date filter (${filters.dateRange}): ${beforeDateFilter} -> ${filteredTransactions.length}`
          );
        }
      } else {
        console.log('No filters applied, showing all transactions');
      }

      console.log(
        `Final filtered transactions: ${filteredTransactions.length}`
      );
      setTransactions(filteredTransactions);
      setCurrentPage(1); // Reset to first page when filters change
    } else {
      console.log('No transactions available for filtering');
    }
  }, [filters, applyFilters, allTransactions, isLoading]);

  // Auto-load data when filters change and no data is available
  React.useEffect(() => {
    if (
      walletAddress &&
      isClient &&
      allTransactions.length === 0 &&
      !isLoading &&
      applyFilters
    ) {
      console.log('Auto-loading data due to filter change');
      handleRefreshHistory();
    }
  }, [
    filters,
    applyFilters,
    walletAddress,
    isClient,
    allTransactions.length,
    isLoading,
  ]);

  const handleRefreshHistory = () => {
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage('Please enter a wallet address');
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    console.log('=== Starting handleRefreshHistory ===');
    console.log('walletAddress:', walletAddress);
    console.log('applyFilters:', applyFilters);
    console.log('filters:', filters);

    // Fetch real transactions from Aptos blockchain
    const fetchRealTransactions = async (address: string) => {
      try {
        // Function to fetch all transactions with pagination
        const fetchAllTransactions = async (address: string) => {
          let allTransactions: any[] = [];
          let start = 0;
          const limit = 100; // Уменьшаем лимит до 100, так как API ограничивает
          let hasMore = true;
          let pageCount = 0;
          let totalFetched = 0;

          console.log(`Starting to fetch transactions for address: ${address}`);

          while (hasMore) {
            pageCount++;
            console.log(
              `Fetching page ${pageCount}, start=${start}, limit=${limit}`
            );

            try {
              const response = await fetch(
                `https://indexer.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?start=${start}&limit=${limit}&include_events=true&include_payload=true&order=desc`
              );

              if (!response.ok) {
                console.error(
                  `HTTP error on page ${pageCount}: ${response.status} ${response.statusText}`
                );
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              console.log(
                `Page ${pageCount}: received ${data.length} transactions`
              );

              allTransactions = allTransactions.concat(data);
              totalFetched += data.length;

              console.log(`Total fetched so far: ${totalFetched} transactions`);

              // If we got less than the limit, we've reached the end
              if (data.length < limit) {
                console.log(
                  `Reached end of transactions. Got ${data.length} < ${limit}`
                );
                hasMore = false;
              } else {
                start += limit;
                console.log(`Moving to next page, new start=${start}`);

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
              }

              // Safety check to prevent infinite loops - увеличиваем лимит для получения всех 500 транзакций
              if (pageCount > 20) {
                console.warn(
                  `Reached maximum page count (20), stopping to prevent infinite loop`
                );
                hasMore = false;
              }
            } catch (error) {
              console.error(`Error fetching page ${pageCount}:`, error);
              throw error;
            }
          }

          console.log(
            `Finished fetching. Total pages: ${pageCount}, Total transactions: ${allTransactions.length}`
          );
          return allTransactions;
        };

        // Also try alternative API endpoint for comparison
        const fetchAlternativeTransactions = async (address: string) => {
          try {
            console.log(`Trying alternative API endpoint for comparison...`);
            const response = await fetch(
              `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?start=0&limit=100`
            );

            if (!response.ok) {
              console.log(`Alternative API failed: ${response.status}`);
              return null;
            }

            const data = await response.json();
            console.log(
              `Alternative API returned: ${data.length} transactions`
            );
            return data;
          } catch (error) {
            console.log(`Alternative API error:`, error);
            return null;
          }
        };

        // Fetch ALL transactions from Aptos Indexer API with pagination
        const data = await fetchAllTransactions(address);

        // Try alternative API for comparison
        const alternativeData = await fetchAlternativeTransactions(address);
        if (alternativeData) {
          console.log(
            `Alternative API comparison: Indexer=${data.length}, Fullnode=${alternativeData.length}`
          );
        }

        console.log('Raw API response:', data);
        console.log(`Total transactions received: ${data.length}`);
        console.log(
          'Note: If this count differs from Explorer, it may be due to different data sources or API limitations'
        );

        // Information about checking in Aptos Explorer
        console.log('=== Comparison with Aptos Explorer ===');
        console.log(`To verify in Aptos Explorer, visit:`);
        console.log(
          `https://explorer.aptoslabs.com/account/${address}?network=mainnet`
        );
        console.log(`Actual: ${data.length} transactions`);
        console.log(`Expected: ~500 transactions (based on Explorer)`);
        console.log(`Difference: ${500 - data.length} transactions missing`);

        // Additional debug: Log transaction types to understand what we're getting
        const transactionTypes = data.reduce((acc: any, tx: any) => {
          const type = tx.payload?.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        console.log('Transaction types breakdown:', transactionTypes);

        // Log all transaction versions for comparison with Explorer
        console.log('=== Transaction Versions for Comparison ===');
        console.log(
          'All transaction versions:',
          data
            .map((tx: any) => tx.version)
            .sort((a: any, b: any) => parseInt(b) - parseInt(a))
        );
        console.log('Version range:', {
          lowest: Math.min(...data.map((tx: any) => parseInt(tx.version))),
          highest: Math.max(...data.map((tx: any) => parseInt(tx.version))),
          count: data.length,
        });

        // Check if we're missing any transactions by looking at version gaps
        if (data.length > 1) {
          const versions = data
            .map((tx: any) => parseInt(tx.version))
            .sort((a: any, b: any) => b - a);
          console.log('Sorted versions (descending):', versions);

          // Check for large gaps in versions
          for (let i = 0; i < versions.length - 1; i++) {
            const gap = versions[i] - versions[i + 1];
            if (gap > 1) {
              console.log(
                `⚠️ Large version gap detected: ${versions[i]} -> ${versions[i + 1]} (gap: ${gap})`
              );
            }
          }
        }

        // Debug timestamp format
        if (data.length > 0) {
          console.log('Sample timestamp data:', {
            raw: data[0].timestamp,
            type: typeof data[0].timestamp,
            parsed: new Date(data[0].timestamp),
            isValid: !isNaN(new Date(data[0].timestamp).getTime()),
          });

          // Debug version information
          console.log('Sample version data:', {
            firstVersion: data[0]?.version,
            lastVersion: data[data.length - 1]?.version,
            versionType: typeof data[0]?.version,
            versionRange: `${data[data.length - 1]?.version} - ${data[0]?.version}`,
          });

          // Also log a few more samples
          console.log(
            'First 3 timestamps:',
            data.slice(0, 3).map((tx: any) => ({
              version: tx.version,
              timestamp: tx.timestamp,
              type: typeof tx.timestamp,
              parsed: new Date(tx.timestamp),
              isValid: !isNaN(new Date(tx.timestamp).getTime()),
            }))
          );
        }

        // Transform API data to our format
        const transformedTransactions = data.map((tx: any, index: number) => {
          // Determine transaction type based on payload and events
          let type = 'transfer';
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
            type = 'script';
            protocol = 'Aptos';
          } else if (tx.payload?.type === 'module_bundle_payload') {
            type = 'module';
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

          // Improved recipient address extraction
          let recipientAddress = 'Unknown';

          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            const args = tx.payload.arguments || [];

            // DEBUG: Log the raw arguments array
            console.log(
              `🔍 DEBUG: Raw arguments for tx ${tx.version} - args:`,
              args,
              'args[0] type:',
              typeof args[0],
              'args[0] value:',
              args[0]
            );

            // Check if args[0] is an object with 'inner' property first
            if (
              args.length > 0 &&
              typeof args[0] === 'object' &&
              args[0] !== null &&
              'inner' in args[0]
            ) {
              console.log(
                `🔍 DEBUG: args[0] is object with 'inner' property:`,
                args[0]
              );
              const innerValue = String(args[0].inner || '');
              console.log(`🔍 DEBUG: Extracted inner value:`, innerValue);
              if (innerValue.startsWith('0x') && innerValue.length > 40) {
                recipientAddress = innerValue;
              } else {
                recipientAddress = `Pool/Validator ID: ${innerValue}`;
              }
            }
            // Extract recipient based on function type
            else if (
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
              // First try to find from events (more accurate)
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
                // If no event data, check if first argument looks like an address
                // Check if args[0] is an object with 'inner' property
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
                } else if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  !('inner' in args[0]) &&
                  args.length > 1
                ) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(
                    `🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`,
                    args[1]
                  );
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `Pool/Validator ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    // It's likely a pool ID or validator ID, not an address
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
                // Check if args[0] is an object with 'inner' property
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
                } else if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  !('inner' in args[0]) &&
                  args.length > 1
                ) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(
                    `🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`,
                    args[1]
                  );
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `Pool ID: ${secondArg}`;
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
                // DEBUG: Log the raw args[0] before conversion
                console.log(
                  `🔍 DEBUG: Raw args[0] for DEX/Pool ID - type:`,
                  typeof args[0],
                  'value:',
                  args[0],
                  'is object:',
                  typeof args[0] === 'object'
                );
                // Check if args[0] is an object with 'inner' property
                if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  'inner' in args[0]
                ) {
                  const innerValue = String(args[0].inner || '');
                  console.log(
                    `🔍 DEBUG: Extracted inner value for DEX/Pool ID:`,
                    innerValue
                  );
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${innerValue}`;
                  }
                } else if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  !('inner' in args[0]) &&
                  args.length > 1
                ) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(
                    `🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`,
                    args[1]
                  );
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  console.log(
                    `🔍 DEBUG: Converted firstArg for DEX/Pool ID - type:`,
                    typeof firstArg,
                    'value:',
                    firstArg
                  );
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
                // DEBUG: Log the raw args[0] before conversion
                console.log(
                  `🔍 DEBUG: Raw args[0] for ID - type:`,
                  typeof args[0],
                  'value:',
                  args[0],
                  'is object:',
                  typeof args[0] === 'object'
                );
                // Check if args[0] is an object with 'inner' property
                if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  'inner' in args[0]
                ) {
                  const innerValue = String(args[0].inner || '');
                  console.log(
                    `🔍 DEBUG: Extracted inner value for ID:`,
                    innerValue
                  );
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `ID: ${innerValue}`;
                  }
                } else if (
                  typeof args[0] === 'object' &&
                  args[0] !== null &&
                  !('inner' in args[0]) &&
                  args.length > 1
                ) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(
                    `🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`,
                    args[1]
                  );
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  console.log(
                    `🔍 DEBUG: Converted firstArg for ID - type:`,
                    typeof firstArg,
                    'value:',
                    firstArg
                  );
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `ID: ${firstArg}`;
                  }
                }
              }
            }
          }

          // Additional debug logging for recipient extraction
          if (Math.random() < 0.1) {
            // Log 10% of transactions
            console.log('Recipient extraction debug:', {
              version: tx.version,
              function: tx.payload?.function,
              args: tx.payload?.arguments,
              recipientAddress,
              events: tx.events?.map((e: any) => e.type).slice(0, 3),
              eventData: tx.events?.slice(0, 2).map((e: any) => ({
                type: e.type,
                data: e.data,
              })),
            });
          }

          // Debug: Log all recipient addresses for protocol matching
          const recipientStr = String(recipientAddress);
          if (
            recipientStr !== 'Unknown' &&
            !recipientStr.startsWith('Pool/Validator ID:') &&
            !recipientStr.startsWith('DEX/Pool ID:') &&
            !recipientStr.startsWith('ID:')
          ) {
            console.log(
              `📋 Transaction ${tx.version}: recipient address = ${recipientStr}`
            );
          }

          // Debug: log recipientAddress before creating transaction object
          console.log(
            `🔍 DEBUG: Creating transaction object - recipientAddress type:`,
            typeof recipientAddress,
            'value:',
            recipientAddress
          );

          // Additional debug: Check if recipientAddress contains [object Object]
          if (recipientStr.includes('[object Object]')) {
            console.log(
              '⚠️ WARNING: recipientAddress contains [object Object] - this should not happen after the fix'
            );
          }

          return {
            id: tx.version || index.toString(),
            type,
            protocol,
            timestamp: tx.timestamp,
            amount,
            status: tx.success ? 'completed' : 'failed',
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
          `Transformed ${transformedTransactions.length} transactions`
        );
        console.log('Sample transaction data types:', {
          from: typeof transformedTransactions[0]?.from,
          to: typeof transformedTransactions[0]?.to,
          fromValue: transformedTransactions[0]?.from,
          toValue: transformedTransactions[0]?.to,
        });

        // Additional debug: check all transactions for non-string addresses
        const nonStringAddresses = transformedTransactions.filter(
          (tx: any) =>
            (tx.from && typeof tx.from !== 'string') ||
            (tx.to && typeof tx.to !== 'string')
        );
        if (nonStringAddresses.length > 0) {
          console.warn(
            'Found transactions with non-string addresses:',
            nonStringAddresses.slice(0, 3)
          );
        }

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

        // Filter transactions to include both outgoing (sender) and incoming (recipient) transactions
        const walletAddressLower = address.toLowerCase();
        const filteredTransactions = sortedTransactions.filter(tx => {
          const isOutgoing = tx.from.toLowerCase() === walletAddressLower;
          const isIncoming = tx.to.toLowerCase() === walletAddressLower;

          // Include transactions where wallet is either sender or recipient
          return isOutgoing || isIncoming;
        });

        console.log(
          `Filtered transactions: ${filteredTransactions.length} out of ${sortedTransactions.length} total`
        );
        console.log(
          `Outgoing transactions: ${filteredTransactions.filter(tx => tx.from.toLowerCase() === walletAddressLower).length}`
        );
        console.log(
          `Incoming transactions: ${filteredTransactions.filter(tx => tx.to.toLowerCase() === walletAddressLower).length}`
        );

        console.log('Sorted transactions by date (newest first)');
        return filteredTransactions;
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    };

    // Fetch transactions and apply filters
    fetchRealTransactions(walletAddress)
      .then(realTransactions => {
        console.log(`Fetched ${realTransactions.length} real transactions`);

        // Apply filters if enabled
        let filteredTransactions = [...realTransactions];

        if (applyFilters) {
          // Filter by transaction type
          if (filters.type !== 'all') {
            filteredTransactions = filteredTransactions.filter(
              tx => tx.type === filters.type
            );
          }

          // Filter by protocol
          if (filters.protocol !== 'all') {
            filteredTransactions = filteredTransactions.filter(
              tx => tx.protocol === filters.protocol
            );
          }

          // Filter by date range
          const now = Date.now();
          const dateRanges = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000,
          };

          if (filters.dateRange !== 'all') {
            const rangeMs =
              dateRanges[filters.dateRange as keyof typeof dateRanges];
            const cutoffTime = now - rangeMs;
            filteredTransactions = filteredTransactions.filter(
              tx => new Date(tx.timestamp).getTime() > cutoffTime
            );
          }
        }

        console.log(
          'Setting all transactions:',
          realTransactions.length,
          'items'
        );
        console.log(
          'Setting filtered transactions:',
          filteredTransactions.length,
          'items'
        );
        console.log('First transaction sample:', filteredTransactions[0]);

        setAllTransactions(realTransactions);
        setTransactions(filteredTransactions);
        setIsLoading(false);

        console.log(
          `Fetched ${realTransactions.length} real transactions for wallet: ${walletAddress}`
        );
        console.log(
          `Found ${filteredTransactions.length} transactions ${applyFilters ? 'after filtering' : '(no filters applied)'}`
        );
      })
      .catch(error => {
        console.error('Failed to fetch transactions:', error);
        setHasError(true);
        setErrorMessage(`Failed to fetch transactions: ${error.message}`);
        setIsLoading(false);
      });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    console.log('handleFilterChange called:', { filterType, value });

    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value,
      };
      console.log('New filters:', newFilters);
      return newFilters;
    });

    // Если выбран протокол (не "all"), автоматически включаем фильтры
    if (filterType === 'protocol' && value !== 'all') {
      console.log('Auto-enabling filters for protocol:', value);
      setApplyFilters(true);

      // Если данных нет, загружаем их
      if (allTransactions.length === 0 && walletAddress && !isLoading) {
        console.log('No data available, triggering data load');
        setTimeout(() => handleRefreshHistory(), 100); // Небольшая задержка для обновления состояния
      }
    }
  };

  const getFilteredTransactions = () => {
    return transactions;
  };

  const getPaginatedTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredTransactions = getFilteredTransactions();
    return Math.ceil(filteredTransactions.length / transactionsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Function to get detailed transaction info
  const getDetailedTransactionInfo = (tx: any) => {
    console.log('=== Detailed Transaction Analysis ===');
    console.log('Transaction Version:', tx.id);
    console.log('Function:', tx.payload?.function);
    console.log('Arguments:', tx.payload?.arguments);
    console.log(
      'Events:',
      tx.events?.map((e: any) => ({
        type: e.type,
        data: e.data,
      }))
    );
    console.log('Current recipient:', tx.to);
    console.log('Sender:', tx.from);
    console.log('Amount:', tx.amount);
    console.log('Type:', tx.type);
    console.log('Protocol:', tx.protocol);

    // If we have raw data, show it
    if (tx._rawData) {
      console.log('=== Raw API Data ===');
      console.log('Raw transaction:', tx._rawData);
      console.log('Raw payload:', tx._rawData.payload);
      console.log('Raw arguments:', tx._rawData.payload?.arguments);
      console.log('Raw events:', tx._rawData.events);
    }
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

  // Safe timestamp formatting function
  const safeFormatTimestamp = (timestamp: any) => {
    if (!timestamp) {
      return 'Unknown';
    }

    // Debug logging for first few calls
    if (Math.random() < 0.1) {
      // Log 10% of calls to avoid spam
      console.log('safeFormatTimestamp input:', {
        timestamp,
        type: typeof timestamp,
        isString: typeof timestamp === 'string',
        isNumber: typeof timestamp === 'number',
      });
    }

    // Try different timestamp formats
    let date: Date;

    if (typeof timestamp === 'string') {
      // Convert string to number first
      const numTimestamp = parseFloat(timestamp);
      if (isNaN(numTimestamp)) {
        return 'Invalid Date';
      }

      // Check if it's nanoseconds (very very large number)
      if (numTimestamp > 1000000000000000000) {
        // Nanoseconds - convert to milliseconds
        date = new Date(numTimestamp / 1000000);
      } else if (numTimestamp > 1000000000000000) {
        // Microseconds - convert to milliseconds
        date = new Date(numTimestamp / 1000);
      } else if (numTimestamp > 1000000000000) {
        // Likely milliseconds
        date = new Date(numTimestamp);
      } else {
        // Likely seconds, convert to milliseconds
        date = new Date(numTimestamp * 1000);
      }
    } else if (typeof timestamp === 'number') {
      // Check if it's nanoseconds (very very large number)
      if (timestamp > 1000000000000000000) {
        // Nanoseconds - convert to milliseconds
        date = new Date(timestamp / 1000000);
      } else if (timestamp > 1000000000000000) {
        // Microseconds - convert to milliseconds
        date = new Date(timestamp / 1000);
      } else if (timestamp > 1000000000000) {
        // Likely milliseconds
        date = new Date(timestamp);
      } else {
        // Likely seconds, convert to milliseconds
        date = new Date(timestamp * 1000);
      }
    } else {
      return 'Invalid Date';
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleString();
  };

  React.useEffect(() => {
    handleRefreshHistory();
  }, []);

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {!isClient ? (
        <div className='text-center py-8'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      ) : (
        <>
          {/* Connected Wallet Display */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <span className='text-sm font-medium'>Status:</span>
                    <Badge variant={connected ? 'default' : 'destructive'}>
                      {connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  <WalletSelector />
                </div>
                {connected && account?.address && (
                  <div className='flex items-center gap-4'>
                    <span className='text-sm font-medium'>Address:</span>
                    <code className='bg-gray-100 px-3 py-1 rounded text-sm'>
                      {account.ansName ||
                        truncateAddress(account.address.toString())}
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
                    onClick={() => {
                      setWalletAddress(
                        '0x0a579b20dee8811721a730c5f16a0650183aa2931099cfcd62b20d22326e3d6d'
                      );
                    }}
                  >
                    Мой кошелек
                  </Button>

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
              <CardTitle>
                History Test - Transaction History Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <span>Wallet Address:</span>
                  <input
                    type='text'
                    value={walletAddress}
                    onChange={e => setWalletAddress(e.target.value)}
                    placeholder='Enter wallet address'
                    className='flex-1 px-3 py-1 border rounded bg-white'
                  />
                </div>

                <div className='flex items-center gap-4'>
                  <span>Loading State:</span>
                  <Badge variant={isLoading ? 'destructive' : 'default'}>
                    {isLoading ? 'Loading...' : 'Ready'}
                  </Badge>
                </div>

                {hasError && (
                  <div className='text-sm text-red-600'>
                    Error: {errorMessage}
                  </div>
                )}

                <div className='flex flex-wrap gap-2'>
                  <Button onClick={handleRefreshHistory} disabled={isLoading}>
                    Refresh History
                  </Button>

                  <Button
                    variant='outline'
                    onClick={handleRefreshHistory}
                    disabled={isLoading}
                    title='Принудительно получить все транзакции с подробной отладкой'
                  >
                    Получить все транзакции
                  </Button>

                  <Button
                    variant='outline'
                    onClick={handleRefreshHistory}
                    disabled={isLoading}
                    title='Попытаться получить максимальное количество транзакций (до 20 страниц)'
                  >
                    Получить максимум транзакций
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
                    Open in Aptos Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='applyFilters'
                    checked={applyFilters}
                    onChange={e => setApplyFilters(e.target.checked)}
                    className='rounded border-gray-300'
                  />
                  <label htmlFor='applyFilters' className='text-sm font-medium'>
                    Apply Filters
                  </label>
                </div>

                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!applyFilters ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div>
                    <label className='text-sm font-medium'>
                      Transaction Type
                    </label>
                    <select
                      className='w-full mt-1 p-2 border rounded'
                      value={filters.type}
                      onChange={e => handleFilterChange('type', e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value='all'>All Types</option>
                      <option value='transfer'>Transfer</option>
                      <option value='swap'>Swap</option>
                      <option value='stake'>Stake</option>
                      <option value='yield'>Yield</option>
                      <option value='deposit'>Deposit</option>
                      <option value='withdraw'>Withdraw</option>
                      <option value='claim'>Claim</option>
                    </select>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Date Range</label>
                    <select
                      className='w-full mt-1 p-2 border rounded'
                      value={filters.dateRange}
                      onChange={e =>
                        handleFilterChange('dateRange', e.target.value)
                      }
                      disabled={!applyFilters}
                    >
                      <option value='all'>All time</option>
                      <option value='7d'>Last 7 days</option>
                      <option value='30d'>Last 30 days</option>
                      <option value='90d'>Last 90 days</option>
                      <option value='1y'>Last year</option>
                    </select>
                  </div>

                  <div>
                    <label className='text-sm font-medium'>Protocol</label>
                    <select
                      className='w-full mt-1 p-2 border rounded'
                      value={filters.protocol}
                      onChange={e =>
                        handleFilterChange('protocol', e.target.value)
                      }
                      disabled={!applyFilters}
                    >
                      <option value='all'>All Protocols</option>
                      {protocolsList.map(protocol => (
                        <option key={protocol.name} value={protocol.name}>
                          {protocol.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-muted-foreground'>
                    Total Transactions: {getFilteredTransactions().length}{' '}
                    (Showing {getPaginatedTransactions().length} on page{' '}
                    {currentPage} of {getTotalPages()})
                  </div>
                  {isLoading && (
                    <div className='text-sm text-blue-600'>
                      Loading transactions for: {walletAddress}
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className='text-center py-8'>
                    <div className='text-muted-foreground'>
                      Loading transactions...
                    </div>
                  </div>
                ) : (
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse border border-gray-200'>
                      <thead>
                        <tr className='bg-gray-50'>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Version
                          </th>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Type
                          </th>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Timestamp
                          </th>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Sender
                          </th>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Send to
                          </th>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Protocol
                          </th>
                          <th className='border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700'>
                            Function
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedTransactions().map(tx => (
                          <tr
                            key={`${tx.id}-${walletAddress}`}
                            className='hover:bg-gray-50'
                          >
                            <td className='border border-gray-200 px-4 py-2 text-sm font-mono'>
                              <a
                                href={`/test-transaction/${tx.id}`}
                                className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                              >
                                {tx.id}
                              </a>
                            </td>
                            <td className='border border-gray-200 px-4 py-2 text-sm'>
                              <Badge variant='outline' className='capitalize'>
                                {tx.type}
                              </Badge>
                            </td>
                            <td className='border border-gray-200 px-4 py-2 text-sm'>
                              {safeFormatTimestamp(tx.timestamp)}
                            </td>
                            <td className='border border-gray-200 px-4 py-2 text-sm font-mono'>
                              {safeTruncateAddress(tx.from)}
                            </td>
                            <td className='border border-gray-200 px-4 py-2 text-sm font-mono'>
                              {safeTruncateAddress(tx.to)}
                            </td>
                            <td className='border border-gray-200 px-4 py-2 text-sm font-mono'>
                              {(() => {
                                const protocolName = getProtocolNameByFunction(
                                  tx.function,
                                  tx.to
                                );
                                if (protocolName === 'Echelon') {
                                  return (
                                    <a
                                      href={`/test-echelon-profit?wallet=${encodeURIComponent(walletAddress)}`}
                                      className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                                    >
                                      {protocolName}
                                    </a>
                                  );
                                }
                                if (protocolName === 'Hyperion') {
                                  return (
                                    <a
                                      href={`/test-hyperion-profit?wallet=${encodeURIComponent(walletAddress)}`}
                                      className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                                    >
                                      {protocolName}
                                    </a>
                                  );
                                }
                                return protocolName;
                              })()}
                            </td>
                            <td className='border border-gray-200 px-4 py-2 text-sm font-mono'>
                              {formatFunctionName(tx.function)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {getPaginatedTransactions().length === 0 && (
                      <div className='text-center py-8 text-muted-foreground'>
                        No transactions found
                      </div>
                    )}
                  </div>
                )}

                {/* Protocol Profit/Loss Summary - Карточки протоколов удалены */}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Card>
            <CardHeader>
              <CardTitle>Pagination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {getTotalPages()}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                >
                  Next{' '}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
