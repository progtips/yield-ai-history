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
import protocolsList from "@/lib/data/protocolsList.json";

export default function TestHyperionProfitPage() {
  const { account, connected } = useWallet();
  const defaultWalletAddress = account?.address?.toString();
  
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [transactions, setTransactions] = React.useState<TransactionType[]>([]);
  const [walletAddress, setWalletAddress] = React.useState("");
  const [profitData, setProfitData] = React.useState<any>(null);
  const [hyperionTransactions, setHyperionTransactions] = React.useState<any[]>([]);
  const [hyperionProfitResults, setHyperionProfitResults] = React.useState<any[]>([]);
  const [hasStartedAnalysis, setHasStartedAnalysis] = React.useState(false);
  const [debugMessages, setDebugMessages] = React.useState<string[]>([]);

  // Функция для добавления отладочной информации
  const addDebugInfo = React.useCallback((message: string) => {
    if (isClient) {
      const timestamp = new Date().toLocaleTimeString('ru-RU');
      const debugMessage = `[${timestamp}] ${message}`;
      setDebugMessages(prev => [...prev, debugMessage]);
    }
  }, [isClient]);

  // Инициализация адреса кошелька после монтирования компонента
  React.useEffect(() => {
    if (isClient) {
      // Получаем адрес из URL параметров
      const urlParams = new URLSearchParams(window.location.search);
      const walletFromUrl = urlParams.get('wallet');
      
      if (walletFromUrl) {
        setWalletAddress(walletFromUrl);
        addDebugInfo(`Установлен адрес из URL: ${walletFromUrl}`);
      } else if (defaultWalletAddress) {
        setWalletAddress(defaultWalletAddress);
        addDebugInfo(`Установлен адрес из кошелька: ${defaultWalletAddress}`);
      }
    }
  }, [isClient, defaultWalletAddress, addDebugInfo]);

  // Тестовая функция для проверки определения токена
  React.useEffect(() => {
    if (isClient) {
      addDebugInfo('=== Тест определения токена ===');
      const testToken = getTokenInfoByCoinName('Staked USDe');
      addDebugInfo(`Тест для "Staked USDe": ${JSON.stringify(testToken)}`);
      
      const testToken2 = getTokenInfoByCoinName('sUSDe');
      addDebugInfo(`Тест для "sUSDe": ${JSON.stringify(testToken2)}`);
      
      const testToken3 = getTokenInfoByCoinName('0xb30a694a344edee467d9f82330bbe7c3b89f440a1ecd2da1f3bca266560fce69');
      addDebugInfo(`Тест для FA адреса: ${JSON.stringify(testToken3)}`);
      
      // Тестируем stAPT
      const testStAPT = getTokenInfoByCoinName('0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627');
      addDebugInfo(`Тест для stAPT FA адреса: ${JSON.stringify(testStAPT)}`);
      
      const testStAPT2 = getTokenInfoByCoinName('stAPT');
      addDebugInfo(`Тест для "stAPT": ${JSON.stringify(testStAPT2)}`);
      
      const testStAPT3 = getTokenInfoByCoinName('Staked Aptos Coin');
      addDebugInfo(`Тест для "Staked Aptos Coin": ${JSON.stringify(testStAPT3)}`);
      
      addDebugInfo('=== Конец теста ===');
    }
  }, [isClient, addDebugInfo]);

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
    
    // Find protocol by contract address using protocolsList.json
    const protocol = protocolsList.find(p => {
      const protocolWithContract = p as any;
      const hasContract = protocolWithContract.contract && typeof protocolWithContract.contract === 'string';
      
      if (!hasContract) {
        return false;
      }
      
      // Normalize contract address
      const normalizedContract = protocolWithContract.contract.toLowerCase().replace(/^0x/, '');
      const matches = normalizedContract === normalizedAddress;
      
      return matches;
    });
    
    if (protocol) {
      return protocol.name;
    }
    
    // Fallback: проверяем по названию функции
    const functionName = functionPath.toLowerCase();
    if (functionName.includes('hyperion') || 
        functionName.includes('swap') || 
        functionName.includes('add_liquidity') ||
        functionName.includes('remove_liquidity') ||
        functionName.includes('claim')) {
      return 'Hyperion';
    }
    
    return 'Unknown';
  }

  // Функция для подсчета прибыли по протоколу Hyperion с передачей данных
  const calculateHyperionProfitWithData = React.useCallback((transactionsData: any[]) => {
    if (!isClient) return;
    
    addDebugInfo('=== ФУНКЦИЯ calculateHyperionProfitWithData ВЫЗВАНА ===');
    
    // Параметры, которые пользователь может скорректировать
    const params = {
      remainingPosition: 0,   // текущая стоимость активов, которые остались в пуле (в той же валюте)
      rewards: 0,             // начисленные награды (в той же валюте), если UI их не показывает отдельной транзакцией
      feesPaid: 0             // суммарные комиссии (в той же валюте), если известны отдельно
    };

    addDebugInfo('=== Начинаем расчет прибыли Hyperion ===');
    addDebugInfo(`Переданные транзакции: ${transactionsData.length}`);
    
    // Фильтруем только Hyperion транзакции
    const hyperionOnly = transactionsData.filter(tx => {
      const protocol = getProtocolNameByFunction(tx.function, tx.to);
      return protocol === 'Hyperion';
    });
    
    addDebugInfo(`Найдено Hyperion транзакций: ${hyperionOnly.length}`);
    
    // Логируем первые несколько Hyperion транзакций для отладки
    hyperionOnly.slice(0, 3).forEach((tx, index) => {
      addDebugInfo(`Hyperion транзакция ${index + 1}: function=${tx.function}, type=${tx.type}`);
    });
    
    // Используем данные из состояния React
    let transactionsToAnalyze = hyperionOnly;
    
    // Если Hyperion транзакции не найдены, используем все транзакции
    if (hyperionOnly.length === 0 && transactionsData.length > 0) {
      addDebugInfo('Hyperion транзакции не найдены, анализируем все транзакции');
      transactionsToAnalyze = transactionsData;
    }
    
    const filteredTransactions = transactionsToAnalyze.filter(tx => 
      tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'claim' || tx.type === 'swap' || tx.type === 'fee'
    );

    addDebugInfo(`Отфильтрованные транзакции deposit/withdraw/claim/swap: ${filteredTransactions.length}`);
    
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
          
          // Дополнительная отладка для всех транзакций
          addDebugInfo(`Транзакция ${index + 1}: extractedAmount=${extractedAmount}, extractedToken=${extractedToken}`);
          
          // Специальная отладка для конкретной транзакции
          if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
            addDebugInfo('[DEBUG] === СПЕЦИАЛЬНАЯ ОТЛАДКА ДЛЯ КОНКРЕТНОЙ ТРАНЗАКЦИИ ===');
            addDebugInfo(`[DEBUG] Hash: ${tx.hash}`);
            addDebugInfo(`[DEBUG] Function: ${tx.function}`);
            addDebugInfo(`[DEBUG] Type: ${tx.type}`);
            addDebugInfo(`[DEBUG] Extracted Amount: ${extractedAmount}`);
            addDebugInfo(`[DEBUG] Extracted Token: ${extractedToken}`);
            addDebugInfo(`[DEBUG] Raw Data Events: ${JSON.stringify(tx._rawData?.events)}`);
            addDebugInfo(`[DEBUG] Raw Data Changes: ${JSON.stringify(tx._rawData?.changes)}`);
            addDebugInfo(`[DEBUG] Raw Data Payload: ${JSON.stringify(tx._rawData?.payload)}`);
            addDebugInfo('[DEBUG] === КОНЕЦ СПЕЦИАЛЬНОЙ ОТЛАДКИ ===');
          }
          
          // Логируем для детальной отладки
          addDebugInfo(`[DEBUG] Транзакция ${index + 1}: function=${tx.function}, type=${tx.type}, extractedAmount=${extractedAmount}, extractedToken=${extractedToken}`);
          
          // Дополнительная отладка для claim транзакций
          if (tx.type === 'claim') {
            addDebugInfo(`[DEBUG] Claim транзакция ${index + 1} - Events: ${JSON.stringify(tx._rawData?.events)}`);
            addDebugInfo(`[DEBUG] Claim транзакция ${index + 1} - Changes: ${JSON.stringify(tx._rawData?.changes)}`);
            addDebugInfo(`[DEBUG] Claim транзакция ${index + 1} - Payload: ${JSON.stringify(tx._rawData?.payload)}`);
          }
      
      // Ищем события для определения точной суммы
      let actualAmount = extractedAmount;
      let actualToken = extractedToken;
      
      if (tx._rawData?.events) {
        const swapEvent = tx._rawData.events.find((event: any) => 
          event.type.includes('SwapEvent')
        );
        const swapEventV3 = tx._rawData.events.find((event: any) => 
          event.type.includes('SwapEventV3')
        );
        const liquidityEvent = tx._rawData.events.find((event: any) => 
          event.type.includes('LiquidityEvent')
        );
        
        // Определяем токен из изменений состояния (changes)
        let tokenDecimals = 8; // По умолчанию для APT токенов
        if (tx._rawData?.changes) {
          const poolChange = tx._rawData.changes.find((change: any) => 
            change.data?.type?.includes('Pool')
          );
          if (poolChange?.data?.data?.asset_name) {
            const assetName = poolChange.data.data.asset_name;
            addDebugInfo(`Found asset name in pool change: ${assetName}`);
            // Ищем токен в списке по названию
            const tokenInfo = getTokenInfoByCoinName(assetName);
            addDebugInfo(`Token info found: ${JSON.stringify(tokenInfo)}`);
            if (tokenInfo) {
              actualToken = tokenInfo.symbol;
              tokenDecimals = tokenInfo.decimals;
              addDebugInfo(`Using token: ${actualToken}, with decimals: ${tokenDecimals}`);
            }
          }
        }
        
        if (swapEventV3 && swapEventV3.data) {
          // Для Hyperion SwapEventV3 используем amount_in
          actualAmount = parseFloat(swapEventV3.data.amount_in) / Math.pow(10, 6); // USDC has 6 decimals
          actualToken = 'USDC'; // Из события видно, что это USDC -> USDt swap
          addDebugInfo(`SwapEventV3 found: amount_in=${swapEventV3.data.amount_in}, calculated=${actualAmount}`);
        } else if (swapEvent && swapEvent.data) {
          actualAmount = parseFloat(swapEvent.data.amount) / Math.pow(10, tokenDecimals);
        } else if (liquidityEvent && liquidityEvent.data) {
          actualAmount = parseFloat(liquidityEvent.data.amount) / Math.pow(10, tokenDecimals);
        }
      }

      // Определяем тип операции
      let operationType = 'other';
      let signedAmount = actualAmount;
      
      if (tx.type === 'deposit') {
        operationType = 'add_liquidity';
        signedAmount = -Math.abs(actualAmount);
      } else if (tx.type === 'withdraw') {
        operationType = 'remove_liquidity';
        signedAmount = Math.abs(actualAmount);
      } else if (tx.type === 'claim') {
        operationType = 'claim';
        signedAmount = Math.abs(actualAmount); // Награды всегда положительные
        addDebugInfo(`Обрабатываем claim: amount=${actualAmount}, signedAmount=${signedAmount}, token=${actualToken}`);
      } else if (tx.type === 'swap') {
        operationType = 'swap';
        // Для swap определяем направление по событиям
        if (tx._rawData?.events) {
          const swapEventV3 = tx._rawData.events.find((event: any) => 
            event.type.includes('SwapEventV3')
          );
          if (swapEventV3 && swapEventV3.data) {
            // Определяем направление swap
            const fromToken = swapEventV3.data.from_token?.inner;
            const toToken = swapEventV3.data.to_token?.inner;
            
            // Если from_token совпадает с адресом кошелька, это вывод (отрицательно)
            // Если to_token совпадает с адресом кошелька, это ввод (положительно)
            if (fromToken && toToken) {
              const amountIn = parseFloat(swapEventV3.data.amount_in) / Math.pow(10, 6);
              const amountOut = parseFloat(swapEventV3.data.amount_out) / Math.pow(10, 6);
              
              // Для упрощения считаем это как обмен, где пользователь тратит amount_in
              signedAmount = -Math.abs(amountIn); // Отрицательно, так как тратит
              actualAmount = amountIn;
              actualToken = 'USDC';
              
              addDebugInfo(`Swap direction: ${amountIn} USDC -> ${amountOut} USDt, signedAmount=${signedAmount}`);
            }
          } else {
            signedAmount = actualAmount; // Свопы оставляем как есть
          }
        } else {
          signedAmount = actualAmount; // Свопы оставляем как есть
        }
        addDebugInfo(`Обрабатываем swap: amount=${actualAmount}, signedAmount=${signedAmount}, token=${actualToken}`);
      } else if (tx.type === 'fee') {
        operationType = 'fee';
        signedAmount = -Math.abs(actualAmount); // Комиссии всегда отрицательные (расход)
        addDebugInfo(`Обрабатываем fee: amount=${actualAmount}, signedAmount=${signedAmount}, token=${actualToken}`);
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
          .filter(tx => tx.type === 'add_liquidity')
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        const totalWithdraw = transactions
          .filter(tx => tx.type === 'remove_liquidity')
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        const claimTransactions = transactions.filter(tx => tx.type === 'claim');
        const swapTransactions = transactions.filter(tx => tx.type === 'swap');
        const feeTransactions = transactions.filter(tx => tx.type === 'fee');
        addDebugInfo(`Найдено ${claimTransactions.length} транзакций типа claim для ${currency}`);
        addDebugInfo(`Найдено ${swapTransactions.length} транзакций типа swap для ${currency}`);
        addDebugInfo(`Найдено ${feeTransactions.length} транзакций типа fee для ${currency}`);
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
        
        const totalSwaps = swapTransactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.amount.toString().replace(/[^\d.-]/g, '')) || 0;
          addDebugInfo(`Добавляем к totalSwaps: ${amount} из транзакции ${tx.tx || tx.hash || 'unknown'}`);
          return sum + amount;
        }, 0);
        
        const totalFees = feeTransactions.reduce((sum, tx) => {
          const amount = parseFloat(tx.amount.toString().replace(/[^\d.-]/g, '')) || 0;
          addDebugInfo(`Добавляем к totalFees: ${amount} из транзакции ${tx.tx || tx.hash || 'unknown'}`);
          return sum + amount;
        }, 0);
        
        // Рассчитываем общую плату за газ
        const totalGasFees = transactions.reduce((sum, tx) => sum + (tx.gasFee || 0), 0);
        
        const netPnL = totalWithdraw + totalClaims + totalSwaps - totalSupply;
        const realizedPnL = netPnL;
        const totalPnL = netPnL + params.remainingPosition + totalClaims - totalFees - totalGasFees;

        addDebugInfo(`Результаты для ${currency}: supply=${totalSupply}, withdraw=${totalWithdraw}, rewards=${totalClaims}, swaps=${totalSwaps}, fees=${totalFees}, netPnL=${netPnL}, totalPnL=${totalPnL}`);

        return {
          currency,
          totalSupply,
          totalWithdraw,
          totalClaims,
          totalSwaps,
          netPnL,
          remainingPosition: params.remainingPosition,
          rewards: totalClaims, // Используем totalClaims вместо params.rewards
          feesPaid: totalFees,
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
        setHyperionProfitResults([]);
        return;
      }

      addDebugInfo('Сохраняем результаты в состояние...');
      addDebugInfo(`Результаты для сохранения: ${JSON.stringify(results)}`);
      
      // Принудительно обновляем состояние для корректного рендеринга
      setHyperionProfitResults([]); // Сначала очищаем
      setTimeout(() => {
        setHyperionProfitResults(results); // Затем устанавливаем новые результаты
        addDebugInfo(`Состояние обновлено. Новое значение hyperionProfitResults: ${JSON.stringify(results)}`);
        addDebugInfo('Расчет прибыли завершен успешно!');
      }, 100);
      return results;
    } catch (error) {
      addDebugInfo(`Ошибка при сохранении результатов: ${error}`);
      setHyperionProfitResults([]);
    }
  }, [isClient, addDebugInfo]);

  // Функция для подсчета прибыли по протоколу Hyperion (для обратной совместимости)
  const calculateHyperionProfit = React.useCallback(() => {
    if (!isClient) return;
    
    addDebugInfo('=== ФУНКЦИЯ calculateHyperionProfit ВЫЗВАНА ===');
    calculateHyperionProfitWithData(transactions);
  }, [isClient, addDebugInfo, calculateHyperionProfitWithData, transactions]);

  const handleRefreshHistory = () => {
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage("Пожалуйста, введите адрес кошелька");
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setHasStartedAnalysis(true);
    
    addDebugInfo('=== Starting Hyperion profit calculation test ===');
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
            }
          }
          
          return allTransactions;
        };
        
        const data = await fetchAllTransactions(address);
        addDebugInfo(`Fetched ${data.length} transactions for Hyperion analysis`);
        
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
            } else if (functionName.includes('claim') || functionName.includes('reward')) {
              type = 'claim';
            } else if (functionName.includes('swap') || functionName.includes('exchange')) {
              type = 'swap';
            } else if (functionName.includes('coin::transfer')) {
              type = 'transfer';
            } else {
              type = 'other';
            }
          }
          
          // Используем улучшенную логику извлечения суммы для Hyperion
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
        
        addDebugInfo(`Transformed ${transformedTransactions.length} transactions for Hyperion analysis`);
        
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
        addDebugInfo(`Fetched ${realTransactions.length} real transactions for Hyperion analysis`);
        setTransactions(realTransactions);
        
        // Фильтруем только Hyperion транзакции для детального анализа
        const hyperionOnly = realTransactions.filter(tx => {
          const protocol = getProtocolNameByFunction(tx.function, tx.to);
          addDebugInfo(`Transaction ${tx.hash}: function=${tx.function}, protocol=${protocol}`);
          return protocol === 'Hyperion';
        });
        
        addDebugInfo(`Found ${hyperionOnly.length} Hyperion transactions`);
        setHyperionTransactions(hyperionOnly);
        
        // Автоматически запускаем расчет прибыли
        if (hyperionOnly.length > 0) {
          calculateHyperionProfitWithData(realTransactions);
        }
        
        setIsLoading(false);
      })
      .catch((error) => {
        addDebugInfo(`Failed to fetch transactions: ${error}`);
        setHasError(true);
        setErrorMessage(`Ошибка при получении транзакций: ${error.message}`);
        setIsLoading(false);
      });
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
              <CardTitle>Тест расчета прибыли Hyperion</CardTitle>
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
                    onClick={handleRefreshHistory} 
                    disabled={isLoading}
                  >
                    Анализировать Hyperion
                  </Button>
                  
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
                      setHyperionProfitResults([]);
                      setTransactions([]);
                      setHyperionTransactions([]);
                      setHasError(false);
                      setErrorMessage("");
                      setDebugMessages([]); // Очищаем отладочную информацию
                    }}
                    disabled={!walletAddress.trim()}
                  >
                    Сбросить и повторить
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (transactions.length > 0) {
                        calculateHyperionProfitWithData(transactions);
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
                  Hyperion транзакций: {hyperionTransactions.length}
                </div>
                <div className="text-sm text-gray-600">
                  Claim транзакций: {hyperionTransactions.filter(tx => tx.type === 'claim').length}
                </div>
                <div className="text-sm text-gray-600">
                  Deposit транзакций: {hyperionTransactions.filter(tx => tx.type === 'deposit').length}
                </div>
                <div className="text-sm text-gray-600">
                  Withdraw транзакций: {hyperionTransactions.filter(tx => tx.type === 'withdraw').length}
                </div>
                <div className="text-sm text-gray-600">
                  Swap транзакций: {hyperionTransactions.filter(tx => tx.type === 'swap').length}
                </div>
                
                {/* Тестовая секция для проверки обработки токенов */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-700 mb-2">Тест обработки токенов:</div>
                  <div className="space-y-2 text-xs">
                    <div>APT: {getTokenInfoByCoinName('0xa')?.symbol || 'Не найден'}</div>
                    <div>stAPT: {getTokenInfoByCoinName('0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627')?.symbol || 'Не найден'}</div>
                    <div>USDC: {getTokenInfoByCoinName('0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b')?.symbol || 'Не найден'}</div>
                    <div>USDt: {getTokenInfoByCoinName('0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b')?.symbol || 'Не найден'}</div>
                  </div>
                </div>
                
                {/* Показываем первые несколько транзакций для отладки */}
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Первые 3 транзакции:</div>
                  <div className="space-y-2 text-xs">
                    {hyperionTransactions.slice(0, 3).map((tx, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        <div>Тип: {tx.type}</div>
                        <div>Функция: {tx.function}</div>
                        <div>Сумма: {tx.amount}</div>
                        <div>Hash: {tx.hash.substring(0, 10)}...</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Отладочные сообщения */}
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Отладочные сообщения:</div>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-48 overflow-y-auto">
                    {debugMessages.length === 0 ? (
                      <div className="text-gray-500">Отладочная информация появится здесь при выполнении операций</div>
                    ) : (
                      <div className="space-y-1">
                        {debugMessages.slice(-20).map((message, index) => (
                          <div key={index} className="break-all">
                            {message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Блок отладки */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Отладка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-96 overflow-y-auto">
                <div className="font-bold mb-2">Отладочная информация:</div>
                {debugMessages.length === 0 ? (
                  <div className="text-gray-500">Отладочная информация появится здесь при выполнении операций</div>
                ) : (
                  <div className="space-y-1">
                    {debugMessages.map((message, index) => (
                      <div key={index} className="text-xs break-all">
                        {message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDebugMessages([])}
                >
                  Очистить отладку
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const text = debugMessages.join('\n');
                    navigator.clipboard.writeText(text);
                  }}
                >
                  Копировать в буфер
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* История транзакций Hyperion */}
          {(hyperionTransactions.length > 0 || hyperionProfitResults.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>История транзакций Hyperion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    // Создаем массив всех транзакций
                    const allTransactions: any[] = [];
                    
                    // Добавляем транзакции из hyperionTransactions
                    hyperionTransactions.forEach(tx => {
                      allTransactions.push({
                        ...tx,
                        source: 'hyperionTransactions',
                        displayDate: new Date(parseInt(tx.timestamp) / 1000).toLocaleString('ru-RU'),
                        timestamp: parseInt(tx.timestamp)
                      });
                    });
                    
                    // Добавляем транзакции из hyperionProfitResults
                    hyperionProfitResults.forEach(result => {
                      result.transactions.forEach((tx: any) => {
                        allTransactions.push({
                          ...tx,
                          source: 'hyperionProfitResults',
                          displayDate: tx.date,
                          timestamp: new Date(tx.date).getTime()
                        });
                      });
                    });
                    
                    // Сортируем по дате: ранние операции сначала
                    return allTransactions
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((tx, index) => {
                        // Определяем тип операции
                        const isDeposit = tx.type === 'deposit' || tx.type === 'add_liquidity';
                        const isWithdraw = tx.type === 'withdraw' || tx.type === 'remove_liquidity';
                        const isClaim = tx.type === 'claim';
                        const isSwap = tx.type === 'swap';
                        
                        // Получаем сумму и токен
                        let actualAmount = 0;
                        let actualToken = 'Unknown';
                        
                        if (tx.source === 'hyperionTransactions') {
                          const { amount: extractedAmount, token: extractedToken } = extractTransactionAmount(tx._rawData, tx.from);
                          actualAmount = Math.abs(extractedAmount);
                          actualToken = extractedToken;
                        } else {
                          // Для транзакций из hyperionProfitResults
                          const amount = tx.signedAmount !== null && tx.signedAmount !== undefined ? tx.signedAmount : tx.amount || 0;
                          actualAmount = Math.abs(amount);
                          actualToken = tx.currency || 'Unknown';
                        }
                        
                        // Функция для получения описания транзакции
                        const getTransactionDescription = (tx: any) => {
                          if (tx.source === 'hyperionTransactions') {
                            const functionName = tx.function.toLowerCase();
                            if (functionName.includes('supply') || functionName.includes('deposit')) {
                              return 'Ввод активов';
                            } else if (functionName.includes('withdraw') || functionName.includes('redeem')) {
                              return 'Вывод активов';
                            } else if (functionName.includes('claim') || functionName.includes('reward')) {
                              return 'Получение наград';
                            } else if (functionName.includes('swap') || functionName.includes('exchange')) {
                              return 'Обмен токенов';
                            } else if (functionName.includes('transfer')) {
                              return 'Перевод токенов';
                            } else {
                              return 'Операция с активами';
                            }
                          } else {
                            // Для транзакций из hyperionProfitResults
                            switch (tx.type) {
                              case 'add_liquidity': return 'Ввод активов';
                              case 'remove_liquidity': return 'Вывод активов';
                              case 'claim': return 'Получение наград';
                              case 'swap': return 'Обмен токенов';
                              case 'fee': return 'Комиссия';
                              default: return 'Операция с активами';
                            }
                          }
                        };

                        return (
                          <div key={`${tx.source}-${index}`} className={`p-4 border rounded-lg ${
                            isDeposit ? 'bg-red-50 border-red-200' : 
                            isWithdraw ? 'bg-green-50 border-green-200' : 
                            isClaim ? 'bg-purple-50 border-purple-200' : 
                            isSwap ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-center">
                              {/* Первый столбец: Дата/Время */}
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isDeposit ? 'bg-red-500' : 
                                  isWithdraw ? 'bg-green-500' : 
                                  isClaim ? 'bg-purple-500' : 
                                  isSwap ? 'bg-blue-500' : 'bg-gray-500'
                                }`}></div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {tx.displayDate}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {isDeposit ? 'Списание' : 
                                     isWithdraw ? 'Зачисление' : 
                                     isClaim ? 'Награды' : 
                                     isSwap ? 'Обмен' : 'Операция'}
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
                                  isClaim ? 'text-purple-600' : 
                                  isSwap ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                  {isDeposit ? '-' : isWithdraw || isClaim ? '+' : ''}{actualAmount.toFixed(6)} {actualToken}
                                </div>
                                <div className="text-xs text-gray-500">
                                  TX: <a 
                                    href={`https://explorer.aptoslabs.com/txn/${tx.hash || tx.tx}?network=mainnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                  >
                                    {(tx.hash || tx.tx).substring(0, 8)}...{(tx.hash || tx.tx).substring((tx.hash || tx.tx).length - 6)}
                                  </a>
                                </div>
                                {/* Плата за газ */}
                                {(tx._rawData?.gas_used || tx.gasFee > 0) && (
                                  <div className="text-xs text-orange-600">
                                    Газ: {tx.gasFee > 0 ? tx.gasFee.toFixed(6) : 
                                          parseInt(tx._rawData.gas_used) * (parseInt(tx._rawData.gas_unit_price || '100') / 100000000)} APT
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Результаты расчета прибыли Hyperion */}
          {hyperionProfitResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Результаты расчета прибыли Hyperion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {hyperionProfitResults.map((result, index) => (
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
                            {result.totalClaims.toFixed(6)} {result.currency}
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
                          <div className="text-sm text-gray-600">Обмены</div>
                          <div className="font-medium text-blue-600">{result.totalSwaps.toFixed(6)} {result.currency}</div>
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
