"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import { 
  Hash, 
  Clock, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { BlockTransactions } from '@/components/explorer/BlockTransactions';

interface BlockPageProps {
  params: {
    height: string;
  };
}

interface BlockData {
  height: string;
  version: string;
  timestamp: string;
  transactionCount: number;
  transactions: any[];
}

export default function BlockPage({ params }: BlockPageProps) {
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { height } = params;

  useEffect(() => {
    loadBlockData();
  }, [height]);

  const loadBlockData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Моковые данные для демонстрации
      const mockData: BlockData = {
        height,
        version: (parseInt(height) * 1000).toString(),
        timestamp: new Date().toISOString(),
        transactionCount: Math.floor(Math.random() * 50) + 10,
        transactions: Array.from({ length: 10 }, (_, i) => ({
          version: (parseInt(height) * 1000 + i).toString(),
          hash: `0x${Math.random().toString(16).slice(2, 66)}`,
          sender: `0x${Math.random().toString(16).slice(2, 42)}`,
          success: Math.random() > 0.1,
          gas_used: (Math.random() * 2000 + 500).toString(),
          timestamp: new Date(Date.now() - Math.random() * 60000).toISOString()
        }))
      };

      setBlockData(mockData);
    } catch (error) {
      console.error('Failed to load block data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load block data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPreviousBlock = () => {
    const prevHeight = parseInt(height) - 1;
    return prevHeight >= 0 ? prevHeight.toString() : null;
  };

  const getNextBlock = () => {
    const nextHeight = parseInt(height) + 1;
    return nextHeight.toString();
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
        <Button onClick={loadBlockData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!blockData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Block not found</p>
      </div>
    );
  }

  const prevBlock = getPreviousBlock();
  const nextBlock = getNextBlock();

  return (
    <div className="space-y-6">
      {/* Заголовок блока */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Block #{blockData.height}</h1>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                Version: {blockData.version}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(blockData.version)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {blockData.transactionCount} transactions
          </Badge>
        </div>
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={!prevBlock}
          asChild={!!prevBlock}
        >
          {prevBlock ? (
            <Link href={`/explorer/block/${prevBlock}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Block
            </Link>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Block
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Block</span>
          <span className="font-mono font-medium">{blockData.height}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={`/explorer/block/${nextBlock}`}>
            Next Block
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Метрики блока */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timestamp</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatTimestamp(blockData.timestamp)}</div>
            <p className="text-xs text-muted-foreground">
              Block creation time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Version</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono font-medium">{blockData.version}</div>
            <p className="text-xs text-muted-foreground">
              Starting version
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockData.transactionCount}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Таблица транзакций */}
      <BlockTransactions 
        blockHeight={blockData.height}
        initialTransactions={blockData.transactions}
      />
    </div>
  );
}
