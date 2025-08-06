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

  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [transactions, setTransactions] = React.useState<TransactionType[]>([]);
  const [walletAddress, setWalletAddress] = React.useState(defaultWalletAddress || "");
  const [profitData, setProfitData] = React.useState<any>(null);
  const [echelonTransactions, setEchelonTransactions] = React.useState<any[]>([]);

  // Обновляем useEffect для расчета прибыли при изменении транзакций
  React.useEffect(() => {
    if (transactions.length > 0) {
      const totalProfitData = calculateTotalProfit(transactions);
      setProfitData(totalProfitData);
      
      // Фильтруем только Echelon транзакции для детального анализа
      const echelonOnly = transactions.filter(tx => {
        const protocol = getProtocolNameByFunction(tx.function, tx.to);
        return protocol === 'Echelon';
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
    
    const protocolAddresses: { [key: string]: string } = {
      'c6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba': 'Echelon',
    };
    
    return protocolAddresses[normalizedAddress] || 'Unknown';
  }

  const handleRefreshHistory = () => {
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage("Пожалуйста, введите адрес кошелька");
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    
    console.log('=== Starting Echelon profit calculation test ===');
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
        console.log(`Fetched ${data.length} transactions for Echelon analysis`);
        
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
        
        console.log(`Transformed ${transformedTransactions.length} transactions for Echelon analysis`);
        
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
        console.error('Error fetching transactions:', error);
        throw error;
      }
    };
    
    // Fetch transactions and calculate profit
    fetchRealTransactions(walletAddress)
      .then((realTransactions) => {
        console.log(`Fetched ${realTransactions.length} real transactions for Echelon analysis`);
        setTransactions(realTransactions);
        setIsLoading(false);
      })
      .catch((error) => {
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
    <div className="container mx-auto p-6 space-y-6">
      {!isClient ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      ) : (
        <>
          {/* Connected Wallet Display */}
          <Card>
            <CardHeader>
              <CardTitle>Подключенный кошелек</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Статус:</span>
                    <Badge variant={connected ? "default" : "destructive"}>
                      {connected ? "Подключен" : "Не подключен"}
                    </Badge>
                  </div>
                  <WalletSelector />
                </div>
                {connected && account?.address && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Адрес:</span>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {account.ansName || safeTruncateAddress(account.address.toString())}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                    onChange={(e) => setWalletAddress(e.target.value)}
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
                  <Button onClick={handleRefreshHistory} disabled={isLoading}>
                    Анализировать историю активов
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
                      .filter(tx => tx.type === 'deposit' || tx.type === 'withdraw')
                      .map((tx, index) => {
                        const { amount: extractedAmount, token: extractedToken } = extractTransactionAmount(tx._rawData, tx.from);
                        const isDeposit = tx.type === 'deposit';
                        const isWithdraw = tx.type === 'withdraw';
                        
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
                          
                          if (supplyEvent && supplyEvent.data) {
                            actualAmount = parseFloat(supplyEvent.data.amount) / Math.pow(10, 6); // USDt has 6 decimals
                            actualToken = 'USDt';
                          } else if (withdrawEvent && withdrawEvent.data) {
                            actualAmount = parseFloat(withdrawEvent.data.amount) / Math.pow(10, 6);
                            actualToken = 'USDt';
                          }
                        }
                        
                        return (
                          <div key={tx.id} className={`p-4 border rounded-lg ${
                            isDeposit ? 'bg-red-50 border-red-200' : 
                            isWithdraw ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isDeposit ? 'bg-red-500' : 
                                  isWithdraw ? 'bg-green-500' : 'bg-gray-500'
                                }`}></div>
                                <div>
                                  <div className="font-medium">
                                    {isDeposit ? 'Списание с кошелька' : 
                                     isWithdraw ? 'Зачисление на кошелек' : 'Другая операция'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {new Date(parseInt(tx.timestamp) / 1000).toLocaleString('ru-RU')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    TX: {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold text-lg ${
                                  isDeposit ? 'text-red-600' : 
                                  isWithdraw ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {isDeposit ? '-' : isWithdraw ? '+' : ''}{actualAmount.toFixed(6)} {actualToken}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {tx.function.includes('supply_fa') ? 'Supply' : 
                                   tx.function.includes('withdraw_fa') ? 'Withdraw' : 'Other'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Дополнительная информация о shares */}
                            {tx._rawData?.events && (
                              <div className="mt-2 text-xs text-gray-600">
                                {tx._rawData.events.map((event: any, eventIndex: number) => {
                                  if (event.type.includes('SupplyEvent') && event.data) {
                                    return (
                                      <div key={eventIndex} className="bg-white p-2 rounded border mt-1">
                                        <div>Shares получено: {parseFloat(event.data.shares)}</div>
                                        <div>Total shares: {parseFloat(event.data.total_shares)}</div>
                                      </div>
                                    );
                                  } else if (event.type.includes('WithdrawEvent') && event.data) {
                                    return (
                                      <div key={eventIndex} className="bg-white p-2 rounded border mt-1">
                                        <div>Shares выведено: {parseFloat(event.data.shares)}</div>
                                        <div>Остаток shares: {parseFloat(event.data.user_shares)}</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 