'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, CheckCircle, Clock } from 'lucide-react';

interface AccountMetricsProps {
  metrics: {
    totalTransactions: number;
    successRate: number;
    totalGasUsed: string;
    firstTxDate: string;
    lastTxDate: string;
  };
}

export function AccountMetrics({ metrics }: AccountMetricsProps) {
  const formatGasUsed = (gasUsed: string) => {
    const gas = parseInt(gasUsed);
    if (gas > 1000000) {
      return `${(gas / 1000000).toFixed(2)}M`;
    } else if (gas > 1000) {
      return `${(gas / 1000).toFixed(2)}K`;
    }
    return gas.toString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Total Transactions
          </CardTitle>
          <TrendingUp className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {metrics.totalTransactions.toLocaleString()}
          </div>
          <p className='text-xs text-muted-foreground'>All time transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
          <CheckCircle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{metrics.successRate}%</div>
          <p className='text-xs text-muted-foreground'>
            Successful transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Gas Used</CardTitle>
          <Zap className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatGasUsed(metrics.totalGasUsed)}
          </div>
          <p className='text-xs text-muted-foreground'>Gas units consumed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            First Transaction
          </CardTitle>
          <Clock className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-sm font-medium'>
            {formatDate(metrics.firstTxDate)}
          </div>
          <p className='text-xs text-muted-foreground'>Account creation date</p>
        </CardContent>
      </Card>
    </div>
  );
}
