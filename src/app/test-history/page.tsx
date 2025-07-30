"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Separator } from "@/components/ui/separator";
import { truncateAddress } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@/components/WalletSelector";

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
    
    console.log('=== Wallet Debug Info ===');
    console.log('connected:', connected);
    console.log('account:', account);
    console.log('defaultWalletAddress:', defaultWalletAddress);
    console.log('window.aptos:', typeof window !== 'undefined' ? !!window.aptos : 'SSR');
  }, [connected, account, defaultWalletAddress, isClient]);

  // Listen for wallet connection events
  React.useEffect(() => {
    const handleWalletChange = () => {
      console.log('=== Wallet Connection Event ===');
      console.log('New connected state:', connected);
      console.log('New account:', account);
    };

    // Log initial state
    handleWalletChange();

    // This will run whenever connected or account changes
    return () => {
      console.log('Wallet state changed');
    };
  }, [connected, account]);
  
  // Mock data for history testing
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [walletAddress, setWalletAddress] = React.useState(defaultWalletAddress || "");
  const [filters, setFilters] = React.useState({
    type: "all",
    dateRange: "7d",
    protocol: "all"
  });
  const [applyFilters, setApplyFilters] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 20;

  // Log when transactions state changes
  React.useEffect(() => {
    console.log('=== Transactions state changed ===');
    console.log('New transactions count:', transactions.length);
    if (transactions.length > 0) {
      console.log('First transaction:', transactions[0]);
      console.log('Sample amounts:', JSON.stringify(transactions.slice(0, 3).map(tx => tx.amount)));
    }
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

  const handleRefreshHistory = () => {
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage("Please enter a wallet address");
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    
    console.log('=== Starting handleRefreshHistory ===');
    console.log('walletAddress:', walletAddress);
    console.log('applyFilters:', applyFilters);
    console.log('filters:', filters);
    
    // Fetch real transactions from Aptos blockchain
    const fetchRealTransactions = async (address: string) => {
      try {
        console.log(`Fetching real transactions for wallet: ${address}`);
        
        // Fetch transactions from Aptos Indexer API with better parameters
        // Note: Explorer might show more transactions because it uses different pagination
        // Try to get the most recent transactions by not specifying start
        const response = await fetch(`https://indexer.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?limit=100&include_events=true&include_payload=true`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API response:', data);
        console.log(`Total transactions received: ${data.length}`);
        console.log('Note: Explorer might show more transactions due to different data sources or pagination');
        
        // Debug timestamp format
        if (data.length > 0) {
          console.log('Sample timestamp data:', {
            raw: data[0].timestamp,
            type: typeof data[0].timestamp,
            parsed: new Date(data[0].timestamp),
            isValid: !isNaN(new Date(data[0].timestamp).getTime())
          });
          
          // Debug version information
          console.log('Sample version data:', {
            firstVersion: data[0]?.version,
            lastVersion: data[data.length - 1]?.version,
            versionType: typeof data[0]?.version,
            versionRange: `${data[data.length - 1]?.version} - ${data[0]?.version}`
          });
          
          // Also log a few more samples
          console.log('First 3 timestamps:', data.slice(0, 3).map((tx: any) => ({
            version: tx.version,
            timestamp: tx.timestamp,
            type: typeof tx.timestamp,
            parsed: new Date(tx.timestamp),
            isValid: !isNaN(new Date(tx.timestamp).getTime())
          })));
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
            const moduleName = tx.payload.function.split('::')[0] + '::' + tx.payload.function.split('::')[1];
            
            // Check for specific function patterns
            if (functionName.includes('coin::transfer') || functionName.includes('coin::transfer_with_metadata')) {
              type = 'transfer';
              protocol = 'Aptos';
            } else if (functionName.includes('swap') || functionName.includes('exchange')) {
              type = 'swap';
              protocol = 'DEX';
            } else if (functionName.includes('stake') || functionName.includes('delegation')) {
              type = 'stake';
              protocol = 'Staking';
            } else if (functionName.includes('yield') || functionName.includes('farming')) {
              type = 'yield';
              protocol = 'Yield';
            } else if (functionName.includes('deposit')) {
              type = 'deposit';
              protocol = 'Protocol';
            } else if (functionName.includes('withdraw')) {
              type = 'withdraw';
              protocol = 'Protocol';
            } else if (functionName.includes('claim') || functionName.includes('reward')) {
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
            const coinEvent = tx.events.find((event: any) => 
              event.type.includes('CoinStore') || 
              event.type.includes('Transfer') ||
              event.type.includes('DepositEvent') ||
              event.type.includes('WithdrawEvent')
            );
            if (coinEvent && coinEvent.data) {
              const amountData = coinEvent.data.amount || coinEvent.data.value || coinEvent.data.coin_amount;
              if (amountData) {
                const aptAmount = parseFloat(amountData) / Math.pow(10, 8);
                amount = `${aptAmount.toFixed(2)} APT`;
              }
            }
          }
          
          return {
            id: tx.version || index.toString(),
            type,
            protocol,
            timestamp: tx.timestamp,
            amount,
            status: tx.success ? 'completed' : 'failed',
            hash: tx.hash || `0x${(index * 12345).toString(16).padStart(16, '0')}...`,
            from: String(tx.sender || 'Unknown'),
            to: tx.payload?.arguments?.[0] ? String(tx.payload.arguments[0]) : 'Unknown',
            function: tx.payload?.function || 'N/A'
          };
        });
        
        console.log(`Transformed ${transformedTransactions.length} transactions`);
        console.log('Sample transaction data types:', {
          from: typeof transformedTransactions[0]?.from,
          to: typeof transformedTransactions[0]?.to,
          fromValue: transformedTransactions[0]?.from,
          toValue: transformedTransactions[0]?.to
        });
        
        // Additional debug: check all transactions for non-string addresses
        const nonStringAddresses = transformedTransactions.filter((tx: any) => 
          (tx.from && typeof tx.from !== 'string') || 
          (tx.to && typeof tx.to !== 'string')
        );
        if (nonStringAddresses.length > 0) {
          console.warn('Found transactions with non-string addresses:', nonStringAddresses.slice(0, 3));
        }
        
        // Sort transactions by timestamp in descending order (newest first)
        const sortedTransactions = transformedTransactions.sort((a: any, b: any) => {
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
        });
        
        console.log('Sorted transactions by date (newest first)');
        return sortedTransactions;
        
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    };
    
    // Fetch transactions and apply filters
    fetchRealTransactions(walletAddress)
      .then((realTransactions) => {
        console.log(`Fetched ${realTransactions.length} real transactions`);
        
        // Apply filters if enabled
        let filteredTransactions = [...realTransactions];
        
        if (applyFilters) {
          // Filter by transaction type
          if (filters.type !== "all") {
            filteredTransactions = filteredTransactions.filter(tx => tx.type === filters.type);
          }
          
          // Filter by protocol
          if (filters.protocol !== "all") {
            filteredTransactions = filteredTransactions.filter(tx => tx.protocol === filters.protocol);
          }
          
          // Filter by date range
          const now = Date.now();
          const dateRanges = {
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
            "90d": 90 * 24 * 60 * 60 * 1000,
            "1y": 365 * 24 * 60 * 60 * 1000
          };
          
          if (filters.dateRange !== "all") {
            const rangeMs = dateRanges[filters.dateRange as keyof typeof dateRanges];
            const cutoffTime = now - rangeMs;
            filteredTransactions = filteredTransactions.filter(tx => 
              new Date(tx.timestamp).getTime() > cutoffTime
            );
          }
        }
        
        console.log('Setting transactions:', filteredTransactions.length, 'items');
        console.log('First transaction sample:', filteredTransactions[0]);
        
        setTransactions(filteredTransactions);
        setIsLoading(false);
        
        console.log(`Fetched ${realTransactions.length} real transactions for wallet: ${walletAddress}`);
        console.log(`Found ${filteredTransactions.length} transactions ${applyFilters ? 'after filtering' : '(no filters applied)'}`);
      })
      .catch((error) => {
        console.error('Failed to fetch transactions:', error);
        setHasError(true);
        setErrorMessage(`Failed to fetch transactions: ${error.message}`);
        setIsLoading(false);
      });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getFilteredTransactions = () => {
    // Filters are now applied when loading data, so just return the current transactions
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
    if (Math.random() < 0.1) { // Log 10% of calls to avoid spam
      console.log('safeFormatTimestamp input:', {
        timestamp,
        type: typeof timestamp,
        isString: typeof timestamp === 'string',
        isNumber: typeof timestamp === 'number'
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
      
      // Check if it's microseconds (very large number)
      if (numTimestamp > 1000000000000000) {
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
      // Check if it's microseconds (very large number)
      if (timestamp > 1000000000000000) {
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
    <div className="container mx-auto p-6 space-y-6">
      {!isClient ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          {/* Connected Wallet Display */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={connected ? "default" : "destructive"}>
                      {connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  <WalletSelector />
                </div>
                {connected && account?.address && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Address:</span>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {account.ansName || truncateAddress(account.address.toString())}
                    </code>
                  </div>
                )}
                
                {/* Debug Information */}
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  <div className="font-medium mb-2">Debug Info:</div>
                  <div>connected: {String(connected)}</div>
                  <div>account exists: {account ? 'yes' : 'no'}</div>
                  <div>account address: {account?.address?.toString() || 'null'}</div>
                  <div>defaultWalletAddress: {defaultWalletAddress || 'null'}</div>
                  
                  <div className="mt-3 space-y-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        console.log('=== Manual Refresh ===');
                        console.log('Current state:', { connected, account });
                        window.location.reload();
                      }}
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History Test - Transaction History Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span>Wallet Address:</span>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter wallet address"
                    className="flex-1 px-3 py-1 border rounded bg-white"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <span>Loading State:</span>
                  <Badge variant={isLoading ? "destructive" : "default"}>
                    {isLoading ? "Loading..." : "Ready"}
                  </Badge>
                </div>
                
                {hasError && (
                  <div className="text-sm text-red-600">
                    Error: {errorMessage}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleRefreshHistory} disabled={isLoading}>
                    Refresh History
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyFilters"
                    checked={applyFilters}
                    onChange={(e) => setApplyFilters(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="applyFilters" className="text-sm font-medium">
                    Apply Filters
                  </label>
                </div>
                
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!applyFilters ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <label className="text-sm font-medium">Transaction Type</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={filters.type}
                      onChange={(e) => handleFilterChange("type", e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value="all">All Types</option>
                      <option value="transfer">Transfer</option>
                      <option value="swap">Swap</option>
                      <option value="stake">Stake</option>
                      <option value="yield">Yield</option>
                      <option value="deposit">Deposit</option>
                      <option value="withdraw">Withdraw</option>
                      <option value="claim">Claim</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="1y">Last year</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Protocol</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={filters.protocol}
                      onChange={(e) => handleFilterChange("protocol", e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value="all">All Protocols</option>
                      <option value="Aptos">Aptos</option>
                      <option value="DEX">DEX</option>
                      <option value="Staking">Staking</option>
                      <option value="Yield">Yield</option>
                      <option value="Protocol">Protocol</option>
                      <option value="Rewards">Rewards</option>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Total Transactions: {getFilteredTransactions().length} (Showing {getPaginatedTransactions().length} on page {currentPage} of {getTotalPages()})
                  </div>
                  {isLoading && (
                    <div className="text-sm text-blue-600">
                      Loading transactions for: {walletAddress}
                    </div>
                  )}
                </div>
                
                {/* Info about data source */}
                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                  <strong>Note:</strong> Data is fetched from Aptos Indexer API. Results may differ from Aptos Explorer due to different data sources, pagination, indexing delays, or transaction ordering. Version numbers and transaction order might not match exactly.
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading transactions...</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Version</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Timestamp</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Sender</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Sent To</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Function</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedTransactions().map((tx) => (
                          <tr key={`${tx.id}-${walletAddress}`} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {tx.id}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              <Badge variant="outline" className="capitalize">
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              {safeFormatTimestamp(tx.timestamp)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {safeTruncateAddress(tx.from)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {tx.to !== 'Unknown' ? safeTruncateAddress(tx.to) : '-'}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {tx.function || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {getPaginatedTransactions().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Card>
            <CardHeader>
              <CardTitle>Pagination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                <span>Page {currentPage} of {getTotalPages()}</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === getTotalPages()}>Next</Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{transactions.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "transfer").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Transfers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "swap").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Swaps</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "stake").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Stakes</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "deposit").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Deposits</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "withdraw").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Withdrawals</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "claim").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Claims</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "yield").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Yield</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    console.log('=== History Test Debug Info ===');
                    console.log('Transactions:', transactions);
                    console.log('Filters:', filters);
                    console.log('Filtered Transactions:', getFilteredTransactions());
                    console.log('Loading State:', isLoading);
                    console.log('Error State:', { hasError, errorMessage });
                  }}
                  variant="outline"
                >
                  Log Debug Info to Console
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 