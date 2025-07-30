"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Separator } from "@/components/ui/separator";

export default function TestHistoryPage() {
  const { account } = useWallet();
  const defaultWalletAddress = account?.address?.toString();
  
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

  // Update wallet address when default changes
  React.useEffect(() => {
    if (defaultWalletAddress && !walletAddress) {
      setWalletAddress(defaultWalletAddress);
    }
  }, [defaultWalletAddress, walletAddress]);

  const mockTransactions = [
    {
      id: "1",
      type: "swap",
      protocol: "Hyperion",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      amount: "100 APT",
      status: "completed",
      hash: "0x1234567890abcdef..."
    },
    {
      id: "2", 
      type: "stake",
      protocol: "Auro",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      amount: "50 APT",
      status: "completed",
      hash: "0xabcdef1234567890..."
    },
    {
      id: "3",
      type: "yield",
      protocol: "Echelon", 
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      amount: "2.5 APT",
      status: "completed",
      hash: "0x7890abcdef123456..."
    }
  ];

  const handleRefreshHistory = () => {
    setIsLoading(true);
    setHasError(false);
    
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 1000);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    if (filters.type !== "all") {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }
    
    if (filters.protocol !== "all") {
      filtered = filtered.filter(tx => tx.protocol === filters.protocol);
    }
    
    return filtered;
  };

  React.useEffect(() => {
    handleRefreshHistory();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Transaction Type</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="swap">Swap</option>
                <option value="stake">Stake</option>
                <option value="yield">Yield</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <select 
                className="w-full mt-1 p-2 border rounded"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange("dateRange", e.target.value)}
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
              >
                <option value="all">All Protocols</option>
                <option value="Hyperion">Hyperion</option>
                <option value="Auro">Auro</option>
                <option value="Echelon">Echelon</option>
              </select>
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
            <div className="text-sm text-muted-foreground">
              Total Transactions: {getFilteredTransactions().length}
            </div>
            
            {getFilteredTransactions().map((tx) => (
              <div key={tx.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {tx.type}
                    </Badge>
                    <Badge variant="secondary">
                      {tx.protocol}
                    </Badge>
                  </div>
                  <Badge variant={tx.status === "completed" ? "default" : "destructive"}>
                    {tx.status}
                  </Badge>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium">{tx.amount}</div>
                  <div className="text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                  {tx.hash}
                </div>
              </div>
            ))}
            
            {getFilteredTransactions().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{transactions.length}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
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
    </div>
  );
} 