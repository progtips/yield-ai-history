"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import { 
  User, 
  Hash, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Zap,
  CheckCircle,
  Clock,
  Coins,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { AccountMetrics } from '@/components/explorer/AccountMetrics';
import { AccountTransactions } from '@/components/explorer/AccountTransactions';
import { AccountBalances } from '@/components/explorer/AccountBalances';
import { AccountActivityChart } from '@/components/explorer/AccountActivityChart';

interface AccountPageProps {
  params: {
    address: string;
  };
}

export default function AccountPage({ params }: AccountPageProps) {
  const [accountData, setAccountData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { address } = params;

  useEffect(() => {
    loadAccountData();
  }, [address]);

  const loadAccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Моковые данные для демонстрации
      const mockData = {
        address,
        metrics: {
          totalTransactions: 1234,
          successRate: 98.5,
          totalGasUsed: "5678900",
          firstTxDate: "2024-01-15T10:30:00Z",
          lastTxDate: "2024-12-15T14:45:00Z",
        },
        transactions: [
          {
            version: "123456789",
            hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            sender: address,
            success: true,
            gas_used: "1500",
            timestamp: "2024-12-15T14:45:00Z"
          },
          {
            version: "123456788",
            hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            sender: address,
            success: false,
            gas_used: "800",
            timestamp: "2024-12-15T14:30:00Z"
          }
        ],
        balances: [
          {
            amount: "1000000000",
            asset_type: "0x1::aptos_coin::AptosCoin",
            metadata: {
              name: "Aptos Coin",
              symbol: "APT",
              decimals: 8
            }
          },
          {
            amount: "500000000000000000000",
            asset_type: "0x123::test_token::TestToken",
            metadata: {
              name: "Test Token",
              symbol: "TEST",
              decimals: 18
            }
          }
        ],
        nftCount: 15
      };

      setAccountData(mockData);
    } catch (error) {
      console.error('Failed to load account data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={loadAccountData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No account data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок аккаунта */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Account</h1>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {formatAddress(accountData.address)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(accountData.address)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {accountData.metrics.totalTransactions} transactions
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/explorer/transactions?address=${accountData.address}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View All
            </Link>
          </Button>
        </div>
      </div>

      {/* Метрики */}
      <AccountMetrics metrics={accountData.metrics} />

      {/* График активности */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccountActivityChart address={accountData.address} />
        </CardContent>
      </Card>

      {/* Табы с детальной информацией */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <AccountTransactions 
            address={accountData.address}
            initialTransactions={accountData.transactions}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <AccountBalances balances={accountData.balances} />
        </TabsContent>

        <TabsContent value="nfts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                NFTs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-3xl font-bold mb-2">{accountData.nftCount}</div>
                <p className="text-muted-foreground mb-4">NFT tokens owned</p>
                <Button asChild>
                  <Link href={`/explorer/account/${accountData.address}/nfts`}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    View All NFTs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
