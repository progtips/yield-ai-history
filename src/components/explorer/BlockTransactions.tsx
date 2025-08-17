'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import {
  Hash,
  User,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { CompactProtocolBadge, CompactOperationBadge } from './ProtocolBadges';

interface BlockTransactionsProps {
  blockHeight: string;
  initialTransactions: any[];
}

export function BlockTransactions({
  blockHeight,
  initialTransactions,
}: BlockTransactionsProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isLoading, setIsLoading] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Block Transactions</span>
          <Badge variant='outline'>{transactions.length} transactions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='border rounded-lg overflow-hidden'>
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
              {transactions.map(tx => (
                <TableRow key={tx.hash} className='hover:bg-muted/50'>
                  <TableCell className='font-mono text-sm'>
                    {tx.version}
                  </TableCell>
                  <TableCell className='font-mono text-sm'>
                    <div className='flex items-center gap-2'>
                      <Hash className='h-4 w-4 text-muted-foreground' />
                      {formatHash(tx.hash)}
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => copyToClipboard(tx.hash)}
                      >
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className='font-mono text-sm'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-muted-foreground' />
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
                    <CompactOperationBadge payload={tx.payload} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.success ? 'default' : 'destructive'}>
                      {tx.success ? (
                        <CheckCircle className='h-3 w-3 mr-1' />
                      ) : (
                        <XCircle className='h-3 w-3 mr-1' />
                      )}
                      {tx.success ? 'Success' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm'>
                    <div className='flex items-center gap-1'>
                      <Zap className='h-4 w-4 text-muted-foreground' />
                      {formatGasUsed(tx.gas_used)}
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/explorer/tx/${tx.hash}`}>
                        <ExternalLink className='h-3 w-3 mr-1' />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
