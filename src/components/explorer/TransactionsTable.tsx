"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactionsStore, type Transaction } from '@/stores/transactions';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import { Hash, User, Clock, Zap, CheckCircle, XCircle, Copy, ExternalLink, Bell } from 'lucide-react';
import Link from 'next/link';
import { CompactProtocolBadge, CompactOperationBadge } from './ProtocolBadges';
import { useToast } from '@/components/ui/use-toast';

interface TransactionsTableProps {
  initialData: Transaction[];
}

export function TransactionsTable({ initialData }: TransactionsTableProps) {
  const {
    transactions,
    filters,
    isLoading,
    setIsLoading,
    setError,
    updateTransactions,
    addTransactions,
    prependNewTransactions,
    isLive,
    setPollingInterval,
    newTransactionsCount,
    resetNewTransactionsCount,
    lastKnownVersion,
  } = useTransactionsStore();
  
  const { toast } = useToast();

  // Инициализируем данные
  useEffect(() => {
    if (initialData.length > 0 && transactions.length === 0) {
      updateTransactions(initialData);
    }
  }, [initialData, transactions.length, updateTransactions]);

  // Функция загрузки транзакций
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const query = `
        query LatestTransactions($limit: Int!, $offset: Int!) {
          transactions(
            limit: $limit
            offset: $offset
            order_by: { timestamp: desc }
          ) {
            version
            hash
            sender
            success
            gas_used
            timestamp
            payload {
              type
              function
              type_arguments
              arguments
            }
          }
        }
      `;

      const result = await executeQueryWithRetry(query, {
        limit: filters.limit,
        offset: filters.offset,
      });

      if (isLive) {
        addTransactions(result.transactions || []);
      } else {
        updateTransactions(result.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLive, setIsLoading, setError, addTransactions, updateTransactions]);

  // Функция для загрузки новых транзакций (для live режима)
  const loadNewTransactions = useCallback(async () => {
    try {
      const query = `
        query NewTransactions($limit: Int!) {
          transactions(
            limit: $limit
            order_by: { timestamp: desc }
          ) {
            version
            hash
            sender
            success
            gas_used
            timestamp
            payload {
              type
              function
              type_arguments
              arguments
            }
          }
        }
      `;

      const result = await executeQueryWithRetry(query, {
        limit: 20, // Получаем последние 20 транзакций
      });

      const newTransactions = result.transactions || [];
      
      if (newTransactions.length > 0) {
        // Проверяем, есть ли новые транзакции
        const latestVersion = newTransactions[0].version;
        
        if (lastKnownVersion && parseInt(latestVersion) > parseInt(lastKnownVersion)) {
          // Есть новые транзакции
          prependNewTransactions(newTransactions);
          
          // Показываем тост с количеством новых транзакций
          const newCount = newTransactions.filter((tx: Transaction) => 
            parseInt(tx.version) > parseInt(lastKnownVersion)
          ).length;
          
          if (newCount > 0) {
            toast({
              title: `+${newCount} new transactions`,
              description: `Latest version: ${latestVersion}`,
              action: (
                <button 
                  onClick={() => resetNewTransactionsCount()}
                  className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              ),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load new transactions:', error);
    }
  }, [lastKnownVersion, prependNewTransactions, resetNewTransactionsCount, toast]);

  // Поллинг для live режима
  useEffect(() => {
    if (isLive) {
      // Загружаем новые транзакции каждые 4 секунды
      const interval = setInterval(loadNewTransactions, 4000);
      setPollingInterval(interval as any);
      
      return () => {
        clearInterval(interval);
        setPollingInterval(null);
      };
    }
  }, [isLive, loadNewTransactions, setPollingInterval]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatGasUsed = (gasUsed: string) => {
    const gas = parseInt(gasUsed);
    if (gas > 1000000) {
      return `${(gas / 1000000).toFixed(2)}M`;
    } else if (gas > 1000) {
      return `${(gas / 1000).toFixed(2)}K`;
    }
    return gas.toString();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Showing {transactions.length} transactions</span>
          {newTransactionsCount > 0 && (
            <Badge 
              variant="default" 
              className="flex items-center gap-1 cursor-pointer hover:bg-primary/90"
              onClick={resetNewTransactionsCount}
              title="Click to dismiss"
            >
              <Bell className="h-3 w-3" />
              +{newTransactionsCount} new
            </Badge>
          )}
        </div>
        {isLive && (
          <Badge variant="destructive" className="animate-pulse">
            Live Mode
          </Badge>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Operation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gas Used</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.hash} className="hover:bg-muted/50">
                <TableCell className="font-mono text-sm">
                  {tx.version}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {formatHash(tx.hash)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tx.hash)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {formatAddress(tx.sender)}
                  </div>
                </TableCell>
                <TableCell>
                  <CompactProtocolBadge 
                    moduleId={tx.payload?.function} 
                    address={tx.sender}
                  />
                </TableCell>
                <TableCell>
                  <CompactOperationBadge 
                    payload={tx.payload}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={tx.success ? "default" : "destructive"}>
                    {tx.success ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {tx.success ? 'Success' : 'Failed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    {formatGasUsed(tx.gas_used)}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatTimestamp(tx.timestamp)}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/explorer/tx/${tx.hash}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
