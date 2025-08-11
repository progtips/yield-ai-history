"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@/components/WalletSelector";
import { 
  extractTransactionAmount,
  calculateProtocolProfit,
  calculateTotalProfit,
  Transaction as TransactionType,
  formatProfitValue,
  formatPercentage,
  getTokenInfoByCoinName
} from "@/lib/utils/profitCalculation";
import { ProtocolProfitCard } from "@/components/portfolio/ProtocolProfitCard";
import { ProfitSummaryCard } from "@/components/portfolio/ProfitSummaryCard";

export default function TestEchelonProfitPage() {
  const { account, connected } = useWallet();
  const defaultWalletAddress = account?.address?.toString();
  
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Тестовая функция для проверки определения токена
  React.useEffect(() => {
    console.log('=== Тест определения токена ===');
    const testToken = getTokenInfoByCoinName('Staked USDe');
    console.log('Тест для "Staked USDe":', testToken);
    
    const testToken2 = getTokenInfoByCoinName('sUSDe');
    console.log('Тест для "sUSDe":', testToken2);
    
    const testToken3 = getTokenInfoByCoinName('0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69');
    console.log('Тест для FA адреса:', testToken3);
    console.log('=== Конец теста ===');
  }, []);

  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [transactions, setTransactions] = React.useState<TransactionType[]>([]);
  // Инициализируем адрес кошелька из URL параметров или подключенного кошелька
  const getInitialWalletAddress = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const walletFromUrl = urlParams.get('wallet');
      if (walletFromUrl) {
        return walletFromUrl;
      }
    }
    return defaultWalletAddress || "";
  };

  const [walletAddress, setWalletAddress] = React.useState(getInitialWalletAddress());
  const [profitData, setProfitData] = React.useState<any>(null);
  const [echelonTransactions, setEchelonTransactions] = React.useState<any[]>([]);
  const [echelonProfitResults, setEchelonProfitResults] = React.useState<any[]>([]);
  const [hasStartedAnalysis, setHasStartedAnalysis] = React.useState(false);

  // Функция для добавления отладочной информации (отключена)
  const addDebugInfo = (message: string) => {
    // Отладочная информация отключена
  };

  // Читаем адрес кошелька из URL параметров и автоматически запускаем анализ
  React.useEffect(() => {
    addDebugInfo('useEffect для чтения URL параметров');
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const walletFromUrl = urlParams.get('wallet');
      addDebugInfo(`walletFromUrl из URL: ${walletFromUrl}`);
      addDebugInfo(`текущий walletAddress: ${walletAddress}`);
      if (walletFromUrl && walletFromUrl !== walletAddress) {
        addDebugInfo(`Устанавливаем новый walletAddress из URL: ${walletFromUrl}`);
        setWalletAddress(walletFromUrl);
        setHasStartedAnalysis(false); // Сбрасываем флаг при изменении адреса
      }
    }
  }, []);

  // Автоматически запускаем анализ истории при изменении адреса кошелька
  React.useEffect(() => {
    // Предотвращаем зацикливание - проверяем, что это не первый рендер и анализ еще не запускался
    if (walletAddress && walletAddress.trim() && !isLoading && !hasStartedAnalysis && echelonProfitResults.length === 0) {
      addDebugInfo(`useEffect для автоматического запуска: walletAddress = ${walletAddress}, isLoading = ${isLoading}`);
      addDebugInfo('Запускаем handleRefreshHistory автоматически');
      setHasStartedAnalysis(true);
      handleRefreshHistory();
    } else if (echelonProfitResults.length > 0) {
      addDebugInfo(`Результаты уже есть (${echelonProfitResults.length}), анализ не запускается`);
    }
  }, [walletAddress, isLoading, hasStartedAnalysis, echelonProfitResults.length]);

  // Обновляем useEffect для расчета прибыли при изменении транзакций
  React.useEffect(() => {
    addDebugInfo(`useEffect для обновления echelonTransactions: transactions.length = ${transactions.length}`);
    if (transactions.length > 0) {
      const totalProfitData = calculateTotalProfit(transactions);
      setProfitData(totalProfitData);
      
      // Фильтруем только Echelon транзакции для детального анализа
      const echelonOnly = transactions.filter(tx => {
        const protocol = getProtocolNameByFunction(tx.function, tx.to);
        return protocol === 'Echelon';
      });
      
      addDebugInfo('=== Фильтрация Echelon транзакций ===');
      addDebugInfo(`Всего транзакций: ${transactions.length}`);
      addDebugInfo(`Найдено Echelon транзакций: ${echelonOnly.length}`);
      
      // Логируем первые несколько транзакций для отладки
      transactions.slice(0, 3).forEach((tx, index) => {
        const protocol = getProtocolNameByFunction(tx.function, tx.to);
        addDebugInfo(`Транзакция ${index + 1}: function=${tx.function}, to=${tx.to}, protocol=${protocol}, type=${tx.type}`);
      });
      
      setEchelonTransactions(echelonOnly);
    } else {
      setProfitData(null);
      setEchelonTransactions([]);
    }
  }, [transactions]);

  // Функция для получения названия протокола
  function getProtocolNameByFunction(functionPath: string, recipientAddress: string): string {
    if (!functionPath || functionPath === 'Unknown') {
      return recipientAddress || 'Unknown';
    }
    
    const parts = functionPath.split('::');
    if (parts.length < 2) {
      return recipientAddress || functionPath;
    }
    
    const contractAddress = parts[0];
    const normalizedAddress = contractAddress.toLowerCase().replace(/^0x/, '');
    
    // Известные адреса контрактов Echelon
    const protocolAddresses: { [key: string]: string } = {
      'c6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba': 'Echelon',
    };
    
    // Проверяем по адресу контракта
    if (protocolAddresses[normalizedAddress]) {
      return protocolAddresses[normalizedAddress];
    }
    
    // Проверяем по названию функции (более гибкий подход)
    const functionName = functionPath.toLowerCase();
    if (functionName.includes('echelon') || 
        functionName.includes('supply_fa') || 
        functionName.includes('withdraw_fa') ||
        functionName.includes('flash_loan') ||
        functionName.includes('liquidate')) {
      return 'Echelon';
    }
    
    return 'Unknown';
  }

  const handleRefreshHistory = () => {
    addDebugInfo('=== ФУНКЦИЯ handleRefreshHistory ВЫЗВАНА ===');
    addDebugInfo(`walletAddress в handleRefreshHistory: ${walletAddress}`);
    
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage("Пожалуйста, введите адрес кошелька");
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    
    addDebugInfo('=== Starting Echelon profit calculation test ===');
    addDebugInfo(`walletAddress: ${walletAddress}`);
    
    // Fetch real transactions from Aptos blockchain
    const fetchRealTransactions = async (address: string) => {
      try {
        // Function to fetch all transactions with pagination
        const fetchAllTransactions = async (address: string) => {
          let allTransactions: any[] = [];
          let start = 0;
          const limit = 1000;
          let hasMore = true;
          
          while (hasMore) {
            const response = await fetch(`https://indexer.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?start=${start}&limit=${limit}&include_events=true&include_payload=true&order=desc`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            allTransactions = allTransactions.concat(data);
            
            if (data.length < limit) {
              hasMore = false;
            } else {
              start += limit;
              // Добавляем задержку между запросами, чтобы избежать ошибки 429
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          return allTransactions;
        };
        
        const data = await fetchAllTransactions(address);
        addDebugInfo(`Fetched ${data.length} transactions for Echelon analysis`);
        
        // Transform API data to our format
        const transformedTransactions = data.map((tx: any, index: number) => {
          // Determine transaction type based on payload and events
          let type: TransactionType['type'] = 'transfer';
          let protocol = 'Aptos';
          
          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            
            if (functionName.includes('supply') || functionName.includes('deposit')) {
              type = 'deposit';
            } else if (functionName.includes('withdraw') || functionName.includes('redeem')) {
              type = 'withdraw';
            } else if (functionName.includes('claim') || functionName.includes('reward') || functionName.includes('scripts::claim_reward')) {
              type = 'claim';
              addDebugInfo(`Определена транзакция claim: ${functionName}`);
            } else if (functionName.includes('swap') || functionName.includes('exchange')) {
              type = 'swap';
            } else if (functionName.includes('coin::transfer')) {
              type = 'transfer';
            } else {
              type = 'other';
            }
          }
          
          // Используем улучшенную логику извлечения суммы для Echelon
          const { amount: extractedAmount, token: extractedToken } = extractTransactionAmount(tx, address);
          const amount = `${extractedAmount.toFixed(4)} ${extractedToken}`;
          
          // Improved recipient address extraction
          let recipientAddress = 'Unknown';
          
          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            const args = tx.payload.arguments || [];
            
            if (functionName.includes('coin::transfer') || functionName.includes('coin::transfer_with_metadata')) {
              recipientAddress = String(args[0] || 'Unknown');
            } else if (args.length > 0) {
              if (typeof args[0] === 'object' && args[0] !== null && 'inner' in args[0]) {
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
          }
          
          return {
            id: tx.version || index.toString(),
            type,
            protocol,
            timestamp: tx.timestamp,
            amount,
            status: tx.success ? 'completed' as const : 'failed' as const,
            hash: tx.hash || `0x${(index * 12345).toString(16).padStart(16, '0')}...`,
            from: String(tx.sender || 'Unknown'),
            to: recipientAddress,
            function: tx.payload?.function || 'N/A',
            _rawData: tx // Store raw API data for debugging
          };
        });
        
        addDebugInfo(`Transformed ${transformedTransactions.length} transactions for Echelon analysis`);
        
        // Sort transactions by timestamp in descending order (newest first)
        const sortedTransactions = transformedTransactions.sort((a: any, b: any) => {
          const getTimestamp = (timestamp: any) => {
            if (!timestamp) return 0;
            
            let numTimestamp: number;
            if (typeof timestamp === 'string') {
              numTimestamp = parseFloat(timestamp);
              if (isNaN(numTimestamp)) return 0;
            } else {
              numTimestamp = timestamp;
            }
            
            if (numTimestamp > 1000000000000000) {
              return numTimestamp / 1000;
            } else if (numTimestamp > 1000000000000) {
              return numTimestamp;
            } else {
              return numTimestamp * 1000;
            }
          };
          
          const dateA = getTimestamp(a.timestamp);
          const dateB = getTimestamp(b.timestamp);
          
          if (dateA === dateB) {
            const versionA = parseInt(a.id) || 0;
            const versionB = parseInt(b.id) || 0;
            return versionB - versionA;
          }
          
          return dateB - dateA;
        });
        
        return sortedTransactions;
        
      } catch (error) {
        addDebugInfo(`Error fetching transactions: ${error}`);
        throw error;
      }
    };
    
    // Fetch transactions and calculate profit
    fetchRealTransactions(walletAddress)
      .then((realTransactions) => {
        addDebugInfo(`Fetched ${realTransactions.length} real transactions for Echelon analysis`);
        setTransactions(realTransactions);
        setIsLoading(false);
        
        // Автоматически рассчитываем прибыль Echelon после загрузки
        setTimeout(() => {
          addDebugInfo('=== Автоматический расчет прибыли Echelon ===');
          addDebugInfo(`Передаем ${realTransactions.length} транзакций в расчет прибыли`);
          
          // Передаем транзакции напрямую в функцию расчета
          calculateEchelonProfitWithData(realTransactions);
        }, 1000); // Небольшая задержка для завершения рендеринга
      })
      .catch((error) => {
        addDebugInfo(`Failed to fetch transactions: ${error}`);
        setHasError(true);
        setErrorMessage(`Ошибка при получении транзакций: ${error.message}`);
        setIsLoading(false);
        
        // Если ошибка 429 (Too Many Requests), не запускаем повторный анализ
        if (error.message.includes('429')) {
          addDebugInfo('Ошибка 429 - превышен лимит запросов. Анализ остановлен.');
          setHasStartedAnalysis(true); // Предотвращаем повторные попытки
        }
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

  // Функция для подсчета прибыли по протоколу Echelon с передачей данных
  const calculateEchelonProfitWithData = (transactionsData: any[]) => {
    addDebugInfo('=== ФУНКЦИЯ calculateEchelonProfitWithData ВЫЗВАНА ===');
    
    // Параметры, которые пользователь может скорректировать
    const params = {
      remainingPosition: 0,   // текущая стоимость активов, которые остались в пуле (в той же валюте)
      rewards: 0,             // начисленные награды (в той же валюте), если UI их не показывает отдельной транзакцией
      feesPaid: 0             // суммарные комиссии (в той же валюте), если известны отдельно
    };

    addDebugInfo('=== Начинаем расчет прибыли Echelon ===');
    addDebugInfo(`Переданные транзакции: ${transactionsData.length}`);
    
    // Фильтруем только Echelon транзакции
    const echelonOnly = transactionsData.filter(tx => {
      const protocol = getProtocolNameByFunction(tx.function, tx.to);
      return protocol === 'Echelon';
    });
    
    addDebugInfo(`Найдено Echelon транзакций: ${echelonOnly.length}`);
    
    // Логируем первые несколько Echelon транзакций для отладки
    echelonOnly.slice(0, 3).forEach((tx, index) => {
      addDebugInfo(`Echelon транзакция ${index + 1}: function=${tx.function}, type=${tx.type}`);
    });
    
    // Используем данные из состояния React
    let transactionsToAnalyze = echelonOnly;
    
    // Если Echelon транзакции не найдены, используем все транзакции
    if (echelonOnly.length === 0 && transactionsData.length > 0) {
      addDebugInfo('Echelon транзакции не найдены, анализируем все транзакции');
      transactionsToAnalyze = transactionsData;
    }
    
    const filteredTransactions = transactionsToAnalyze.filter(tx => 
      tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'claim'
    );

    addDebugInfo(`Отфильтрованные транзакции deposit/withdraw/claim: ${filteredTransactions.length}`);
    
    // Логируем типы транзакций для отладки
    const typeCounts = transactionsToAnalyze.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as any);
    addDebugInfo(`Распределение типов транзакций: ${JSON.stringify(typeCounts)}`);

    // Группируем транзакции по валютам
    const transactionsByCurrency: { [currency: string]: any[] } = {};

    addDebugInfo('Начинаем обработку транзакций...');
    
    try {
      filteredTransactions.forEach((tx, index) => {
        try {
          addDebugInfo(`Обрабатываем транзакцию ${index + 1}: ${tx.function} ${tx.type}`);
          // Извлекаем сумму и валюту из транзакции
          const { amount: extractedAmount, token: extractedToken } = extractTransactionAmount(tx._rawData, tx.from);
          
          // Дополнительная отладка для claim транзакций
          if (tx.type === 'claim') {
            addDebugInfo(`Claim транзакция: extractedAmount=${extractedAmount}, extractedToken=${extractedToken}`);
          }
      
      // Ищем события для определения точной суммы
      let actualAmount = extractedAmount;
      let actualToken = extractedToken;
      
      if (tx._rawData?.events) {
        const supplyEvent = tx._rawData.events.find((event: any) => 
          event.type.includes('SupplyEvent')
        );
        const withdrawEvent = tx._rawData.events.find((event: any) => 
          event.type.includes('WithdrawEvent')
        );
        
        // Определяем токен из изменений состояния (changes)
        let tokenDecimals = 6; // По умолчанию для FA токенов
        if (tx._rawData?.changes) {
          const marketChange = tx._rawData.changes.find((change: any) => 
            change.data?.type?.includes('lending::Market')
          );
          if (marketChange?.data?.data?.asset_name) {
            const assetName = marketChange.data.data.asset_name;
            console.log('Found asset name in market change:', assetName);
            // Ищем токен в списке по названию
            const tokenInfo = getTokenInfoByCoinName(assetName);
            console.log('Token info found:', tokenInfo);
            if (tokenInfo) {
              actualToken = tokenInfo.symbol;
              tokenDecimals = tokenInfo.decimals;
              console.log('Using token:', actualToken, 'with decimals:', tokenDecimals);
            }
          }
        }
        
        if (supplyEvent && supplyEvent.data) {
          actualAmount = parseFloat(supplyEvent.data.amount) / Math.pow(10, tokenDecimals);
        } else if (withdrawEvent && withdrawEvent.data) {
          actualAmount = parseFloat(withdrawEvent.data.amount) / Math.pow(10, tokenDecimals);
        }
      }

      // Определяем тип операции
      let operationType = 'other';
      let signedAmount = actualAmount;
      
      if (tx.type === 'deposit') {
        operationType = 'supply';
        signedAmount = -Math.abs(actualAmount);
      } else if (tx.type === 'withdraw') {
        operationType = 'withdraw';
        signedAmount = Math.abs(actualAmount);
      } else if (tx.type === 'claim') {
        operationType = 'claim';
        signedAmount = Math.abs(actualAmount); // Награды всегда положительные
        addDebugInfo(`Обрабатываем claim: amount=${actualAmount}, signedAmount=${signedAmount}, token=${actualToken}`);
      }
      
      // Рассчитываем плату за газ
      let gasFee = 0;
      if (tx._rawData?.gas_used && tx._rawData?.gas_unit_price) {
        const gasUsed = parseInt(tx._rawData.gas_used);
        const gasUnitPrice = parseInt(tx._rawData.gas_unit_price);
        gasFee = (gasUsed * gasUnitPrice) / 100000000; // Конвертируем в APT
      }

      const transaction = {
        date: new Date(parseInt(tx.timestamp) / 1000).toLocaleString('ru-RU'),
        type: operationType,
        amount: Math.abs(actualAmount),
        signedAmount,
        currency: actualToken,
        tx: tx.hash,
        gasFee
      };

      if (!transactionsByCurrency[actualToken]) {
        transactionsByCurrency[actualToken] = [];
      }
      transactionsByCurrency[actualToken].push(transaction);
        } catch (error) {
          addDebugInfo(`Ошибка при обработке транзакции ${index + 1}: ${error}`);
          addDebugInfo(`Данные транзакции: ${JSON.stringify(tx)}`);
        }
      });
    } catch (error) {
      addDebugInfo(`Критическая ошибка в цикле обработки транзакций: ${error}`);
    }

    // Рассчитываем прибыль для каждой валюты
    let results: any[] = [];
    try {
      addDebugInfo(`Начинаем расчет прибыли для ${Object.keys(transactionsByCurrency).length} валют`);
      addDebugInfo(`Валюты: ${Object.keys(transactionsByCurrency).join(', ')}`);
      results = Object.entries(transactionsByCurrency).map(([currency, transactions]) => {
        addDebugInfo(`Обрабатываем валюту ${currency}: ${transactions.length} транзакций`);
        
        const totalSupply = transactions
          .filter(tx => tx.type === 'supply')
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        const totalWithdraw = transactions
          .filter(tx => tx.type === 'withdraw')
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        const claimTransactions = transactions.filter(tx => tx.type === 'claim');
        addDebugInfo(`Найдено ${claimTransactions.length} транзакций типа claim для ${currency}`);
        claimTransactions.forEach((tx, index) => {
          addDebugInfo(`Claim транзакция ${index + 1}: amount=${tx.amount}, signedAmount=${tx.signedAmount}, function=${tx.function}`);
          
          // Дополнительная отладка для claim транзакций
          if (tx._rawData) {
            addDebugInfo(`Claim ${index + 1} - Events count: ${tx._rawData.events?.length || 0}`);
            addDebugInfo(`Claim ${index + 1} - Changes count: ${tx._rawData.changes?.length || 0}`);
            
            // Логируем события для claim
            if (tx._rawData.events) {
              tx._rawData.events.forEach((event: any, eventIndex: number) => {
                addDebugInfo(`Claim ${index + 1} Event ${eventIndex}: type=${event.type}, data=${JSON.stringify(event.data)}`);
              });
            }
            
            // Логируем изменения состояния для claim
            if (tx._rawData.changes) {
              tx._rawData.changes.forEach((change: any, changeIndex: number) => {
                addDebugInfo(`Claim ${index + 1} Change ${changeIndex}: type=${change.data?.type}, address=${change.address}`);
              });
            }
          }
        });
        
        const totalClaims = claimTransactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.amount.toString().replace(/[^\d.-]/g, '')) || 0;
          addDebugInfo(`Добавляем к totalClaims: ${amount} из транзакции ${tx.tx || tx.hash || 'unknown'}`);
          addDebugInfo(`Исходное значение tx.amount: ${tx.amount}, тип: ${typeof tx.amount}`);
          return sum + amount;
        }, 0);
        
        // Рассчитываем общую плату за газ
        const totalGasFees = transactions.reduce((sum, tx) => sum + (tx.gasFee || 0), 0);
        
        const netPnL = totalWithdraw + totalClaims - totalSupply;
        const realizedPnL = netPnL;
        const totalPnL = netPnL + params.remainingPosition + totalClaims - params.feesPaid - totalGasFees;

        addDebugInfo(`Результаты для ${currency}: supply=${totalSupply}, withdraw=${totalWithdraw}, rewards=${totalClaims}, netPnL=${netPnL}, totalPnL=${totalPnL}`);

        return {
          currency,
          totalSupply,
          totalWithdraw,
          totalClaims,
          netPnL,
          remainingPosition: params.remainingPosition,
          rewards: totalClaims, // Используем totalClaims вместо params.rewards
          feesPaid: params.feesPaid,
          totalGasFees,
          totalPnL,
          transactions
        };
      });
    } catch (error) {
      addDebugInfo(`Ошибка при расчете прибыли: ${error}`);
      results = [];
    }

    // Сохраняем результаты в состояние
    addDebugInfo(`Результаты расчета: ${JSON.stringify(results)}`);
    addDebugInfo(`Количество результатов: ${results.length}`);
    
    try {
      if (results.length === 0) {
        addDebugInfo('Не найдено транзакций для расчета прибыли');
        setEchelonProfitResults([]);
        return;
      }

      addDebugInfo('Сохраняем результаты в состояние...');
      addDebugInfo(`Результаты для сохранения: ${JSON.stringify(results)}`);
      
      // Принудительно обновляем состояние для корректного рендеринга
      setEchelonProfitResults([]); // Сначала очищаем
      setTimeout(() => {
        setEchelonProfitResults(results); // Затем устанавливаем новые результаты
        addDebugInfo(`Состояние обновлено. Новое значение echelonProfitResults: ${JSON.stringify(results)}`);
        addDebugInfo('Расчет прибыли завершен успешно!');
      }, 100);
      return results;
    } catch (error) {
      addDebugInfo(`Ошибка при сохранении результатов: ${error}`);
      setEchelonProfitResults([]);
    }
  };

  // Функция для подсчета прибыли по протоколу Echelon (для обратной совместимости)
  const calculateEchelonProfit = () => {
    addDebugInfo('=== ФУНКЦИЯ calculateEchelonProfit ВЫЗВАНА ===');
    calculateEchelonProfitWithData(transactions);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {!isClient ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <>


          <Card>
            <CardHeader>
              <CardTitle>Тест расчета прибыли Echelon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span>Адрес кошелька:</span>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => {
                      setWalletAddress(e.target.value);
                      setHasStartedAnalysis(false); // Сбрасываем флаг при изменении адреса
                    }}
                    placeholder="Введите адрес кошелька"
                    className="flex-1 px-3 py-1 border rounded bg-white"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <span>Статус загрузки:</span>
                  <Badge variant={isLoading ? "destructive" : "default"}>
                    {isLoading ? "Загрузка..." : "Готов"}
                  </Badge>
                </div>
                

                
                {hasError && (
                  <div className="text-sm text-red-600">
                    Ошибка: {errorMessage}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const explorerUrl = `https://explorer.aptoslabs.com/account/${walletAddress}?network=mainnet`;
                      window.open(explorerUrl, '_blank');
                    }}
                    disabled={!walletAddress.trim()}
                  >
                    Открыть в Aptos Explorer
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setHasStartedAnalysis(false);
                      setEchelonProfitResults([]);
                      setTransactions([]);
                      setEchelonTransactions([]);
                      setHasError(false);
                      setErrorMessage("");
                    }}
                    disabled={!walletAddress.trim()}
                  >
                    Сбросить и повторить
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (transactions.length > 0) {
                        calculateEchelonProfitWithData(transactions);
                      }
                    }}
                    disabled={transactions.length === 0}
                  >
                    Пересчитать прибыль
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Блок отладки */}
          <Card>
            <CardHeader>
              <CardTitle>Отладка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Всего транзакций: {transactions.length}
                </div>
                <div className="text-sm text-gray-600">
                  Echelon транзакций: {echelonTransactions.length}
                </div>
                <div className="text-sm text-gray-600">
                  Claim транзакций: {echelonTransactions.filter(tx => tx.type === 'claim').length}
                </div>
                <div className="text-sm text-gray-600">
                  Deposit транзакций: {echelonTransactions.filter(tx => tx.type === 'deposit').length}
                </div>
                <div className="text-sm text-gray-600">
                  Withdraw транзакций: {echelonTransactions.filter(tx => tx.type === 'withdraw').length}
                </div>
                
                {/* Показываем первые несколько транзакций для отладки */}
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Первые 3 транзакции:</div>
                  <div className="space-y-2 text-xs">
                    {echelonTransactions.slice(0, 3).map((tx, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <div>Тип: {tx.type}</div>
                        <div>Функция: {tx.function}</div>
                        <div>Сумма: {tx.amount}</div>
                        <div>Hash: {tx.hash.substring(0, 10)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Echelon Asset Flow History */}
          {echelonTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>История ввода/вывода активов Echelon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Найдено {echelonTransactions.length} транзакций Echelon
                  </div>
                  
                  <div className="space-y-3">
                    {echelonTransactions
                      .filter(tx => tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'claim')
                      .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)) // Сортировка по времени (ранние сверху)
                      .map((tx, index) => {
                        const { amount: extractedAmount, token: extractedToken } = extractTransactionAmount(tx._rawData, tx.from);
                        const isDeposit = tx.type === 'deposit';
                        const isWithdraw = tx.type === 'withdraw';
                        const isClaim = tx.type === 'claim';
                        
                        // Отладочная информация для claim транзакций
                        if (isClaim) {
                          addDebugInfo(`Отображаем claim транзакцию: ${tx.function}, amount=${tx.amount}, extractedAmount=${extractedAmount}`);
                        }
                        
                        // Ищем события для определения точной суммы
                        let actualAmount = extractedAmount;
                        let actualToken = extractedToken;
                        
                        if (tx._rawData?.events) {
                          const supplyEvent = tx._rawData.events.find((event: any) => 
                            event.type.includes('SupplyEvent')
                          );
                          const withdrawEvent = tx._rawData.events.find((event: any) => 
                            event.type.includes('WithdrawEvent')
                          );
                          
                          // Определяем токен из изменений состояния (changes)
                          let tokenDecimals = 6; // По умолчанию для FA токенов
                          if (tx._rawData?.changes) {
                            const marketChange = tx._rawData.changes.find((change: any) => 
                              change.data?.type?.includes('lending::Market')
                            );
                            if (marketChange?.data?.data?.asset_name) {
                              const assetName = marketChange.data.data.asset_name;
                              console.log('Found asset name in market change:', assetName);
                              // Ищем токен в списке по названию
                              const tokenInfo = getTokenInfoByCoinName(assetName);
                              console.log('Token info found:', tokenInfo);
                              if (tokenInfo) {
                                actualToken = tokenInfo.symbol;
                                tokenDecimals = tokenInfo.decimals;
                                console.log('Using token:', actualToken, 'with decimals:', tokenDecimals);
                              }
                            }
                          }
                          
                          if (supplyEvent && supplyEvent.data) {
                            actualAmount = parseFloat(supplyEvent.data.amount) / Math.pow(10, tokenDecimals);
                          } else if (withdrawEvent && withdrawEvent.data) {
                            actualAmount = parseFloat(withdrawEvent.data.amount) / Math.pow(10, tokenDecimals);
                          } else if (isClaim) {
                            // Для операций claim ищем события Deposit
                            const depositEvent = tx._rawData.events.find((event: any) => 
                              event.type.includes('Deposit') && event.data?.store?.includes(tx.from)
                            );
                            if (depositEvent && depositEvent.data) {
                              actualAmount = parseFloat(depositEvent.data.amount) / Math.pow(10, tokenDecimals);
                            }
                          }
                        }
                        
                        // Функция для получения описания транзакции
                        const getTransactionDescription = (tx: any) => {
                          const functionName = tx.function.toLowerCase();
                          
                          if (functionName.includes('supply_fa')) {
                            return 'Внесение средств в пул ликвидности';
                          } else if (functionName.includes('withdraw_fa')) {
                            return 'Вывод средств из пула ликвидности';
                          } else if (functionName.includes('scripts::claim_reward')) {
                            return 'Получение наград (claim_reward)';
                          } else if (functionName.includes('claim') || functionName.includes('reward')) {
                            return 'Получение наград';
                          } else if (functionName.includes('swap')) {
                            return 'Обмен токенов';
                          } else if (functionName.includes('transfer')) {
                            return 'Перевод токенов';
                          } else {
                            return 'Операция с активами';
                          }
                        };

                        return (
                          <div key={tx.id} className={`p-4 border rounded-lg ${
                            isDeposit ? 'bg-red-50 border-red-200' : 
                            isWithdraw ? 'bg-green-50 border-green-200' : 
                            isClaim ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-center">
                              {/* Первый столбец: Дата/Время */}
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isDeposit ? 'bg-red-500' : 
                                  isWithdraw ? 'bg-green-500' : 
                                  isClaim ? 'bg-purple-500' : 'bg-gray-500'
                                }`}></div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {new Date(parseInt(tx.timestamp) / 1000).toLocaleString('ru-RU')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {isDeposit ? 'Списание' : isWithdraw ? 'Зачисление' : isClaim ? 'Награды' : 'Операция'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Второй столбец: Описание транзакции */}
                              <div className="flex-1 text-center mx-4">
                                <div className="text-sm font-medium text-gray-700">
                                  {getTransactionDescription(tx)}
                                </div>
                              </div>
                              
                              {/* Третий столбец: Сумма и детали */}
                              <div className="text-right">
                                <div className={`font-bold text-lg ${
                                  isDeposit ? 'text-red-600' : 
                                  isWithdraw ? 'text-green-600' : 
                                  isClaim ? 'text-purple-600' : 'text-gray-600'
                                }`}>
                                  {isDeposit ? '-' : isWithdraw || isClaim ? '+' : ''}{actualAmount.toFixed(6)} {actualToken}
                                </div>
                                <div className="text-xs text-gray-500">
                                  TX: <a 
                                    href={`https://explorer.aptoslabs.com/txn/${tx.hash}?network=mainnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                  >
                                    {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                                  </a>
                                </div>
                                {/* Плата за газ */}
                                {tx._rawData?.gas_used && (
                                  <div className="text-xs text-orange-600">
                                    Газ: {parseInt(tx._rawData.gas_used) * (parseInt(tx._rawData.gas_unit_price || '100') / 100000000)} APT
                                  </div>
                                )}
                              </div>
                            </div>
                            

                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
                    )}

          {/* Echelon Profit Results */}
          {echelonProfitResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Результаты расчета прибыли Echelon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {echelonProfitResults.map((result, index) => (
                    <div key={index} className="space-y-4">
                      <div className="text-lg font-semibold text-blue-600">
                        Результаты для {result.currency}
                      </div>
                      
                      {/* Основные показатели */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Остаток в пуле</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {result.remainingPosition.toFixed(6)} {result.currency}
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Награды</div>
                          <div className="text-lg font-bold text-purple-600">
                            {result.rewards.toFixed(6)} {result.currency}
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Комиссии</div>
                          <div className="text-lg font-bold text-red-600">
                            {result.feesPaid.toFixed(6)} {result.currency}
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Плата за газ</div>
                          <div className="text-lg font-bold text-orange-600">
                            {result.totalGasFees.toFixed(6)} APT
                          </div>
                        </div>
                      </div>

                      {/* Дополнительные параметры */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Общий ввод</div>
                          <div className="font-medium text-red-600">{result.totalSupply.toFixed(6)} {result.currency}</div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Общий вывод</div>
                          <div className="font-medium text-green-600">{result.totalWithdraw.toFixed(6)} {result.currency}</div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Net PnL</div>
                          <div className={`font-medium ${result.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.netPnL >= 0 ? '+' : ''}{result.netPnL.toFixed(6)} {result.currency}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Total PnL</div>
                          <div className={`font-medium ${result.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.totalPnL >= 0 ? '+' : ''}{result.totalPnL.toFixed(6)} {result.currency}
                          </div>
                        </div>
                      </div>

                      {/* Блок отладки для claim транзакций */}
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700 mb-3">
                          Отладка claim транзакций 
                          <span className="ml-2 text-purple-600">
                            (Всего: {result.transactions.filter((tx: any) => tx.type === 'claim').length} транзакций)
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          {/* Сводка по наградам */}
                          <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400 mb-3">
                            <div className="font-medium text-purple-800">Сводка по наградам:</div>
                            <div className="text-sm text-purple-700">
                              Общая сумма наград: {result.rewards.toFixed(6)} {result.currency}
                            </div>
                            <div className="text-sm text-purple-700">
                              Количество claim транзакций: {result.transactions.filter((tx: any) => tx.type === 'claim').length}
                            </div>
                          </div>
                          
                          {result.transactions
                            .filter((tx: any) => tx.type === 'claim')
                            .map((tx: any, txIndex: number) => (
                              <div key={txIndex} className="bg-white p-2 rounded border">
                                <div className="font-medium">Claim транзакция {txIndex + 1}:</div>
                                <div>Функция: {tx.function || tx._rawData?.payload?.function || 'N/A'}</div>
                                <div>Сумма: {tx.amount} {tx.currency}</div>
                                <div>Signed Amount: {tx.signedAmount}</div>
                                <div>Hash: {tx.tx || tx.hash}</div>
                                <div>Тип операции: {tx.type}</div>
                                
                                {/* Детальная информация о событиях */}
                                {tx._rawData?.events && (
                                  <div className="mt-2">
                                    <div className="font-medium text-purple-600">События ({tx._rawData.events.length}):</div>
                                    {tx._rawData.events.map((event: any, eventIndex: number) => (
                                      <div key={eventIndex} className="ml-2 text-gray-600">
                                        {eventIndex + 1}. {event.type}
                                        {event.data && (
                                          <div className="ml-2 text-gray-500">
                                            Данные: {JSON.stringify(event.data)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Детальная информация об изменениях состояния */}
                                {tx._rawData?.changes && (
                                  <div className="mt-2">
                                    <div className="font-medium text-blue-600">Изменения состояния ({tx._rawData.changes.length}):</div>
                                    {tx._rawData.changes.map((change: any, changeIndex: number) => (
                                      <div key={changeIndex} className="ml-2 text-gray-600">
                                        {changeIndex + 1}. {change.data?.type || 'Unknown'}
                                        {change.data?.data && (
                                          <div className="ml-2 text-gray-500">
                                            Данные: {JSON.stringify(change.data.data)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

 
          </>
        )}
    </div>
  );
} 