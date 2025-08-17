'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Copy } from 'lucide-react';

interface Balance {
  amount: string;
  asset_type: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    icon_uri?: string;
  };
}

interface AccountBalancesProps {
  balances: Balance[];
}

export function AccountBalances({ balances }: AccountBalancesProps) {
  const formatAmount = (amount: string, decimals: number = 0) => {
    const num = parseFloat(amount);
    if (decimals > 0) {
      return (num / Math.pow(10, decimals)).toFixed(decimals);
    }
    return num.toLocaleString();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getTokenSymbol = (balance: Balance) => {
    if (balance.metadata?.symbol) {
      return balance.metadata.symbol;
    }
    // Извлекаем символ из asset_type
    const parts = balance.asset_type.split('::');
    return parts[parts.length - 1] || 'Unknown';
  };

  const getTokenName = (balance: Balance) => {
    if (balance.metadata?.name) {
      return balance.metadata.name;
    }
    // Извлекаем имя из asset_type
    const parts = balance.asset_type.split('::');
    return parts[parts.length - 1] || 'Unknown Token';
  };

  if (balances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Coins className='h-5 w-5' />
            Fungible Asset Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8 text-muted-foreground'>
            <Coins className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>No fungible assets found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Coins className='h-5 w-5' />
          Fungible Asset Balances ({balances.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {balances.map((balance, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50'
            >
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                  <Coins className='h-5 w-5 text-primary' />
                </div>
                <div>
                  <div className='font-medium'>{getTokenName(balance)}</div>
                  <div className='text-sm text-muted-foreground'>
                    {getTokenSymbol(balance)}
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='text-right'>
                  <div className='font-mono font-medium'>
                    {formatAmount(balance.amount, balance.metadata?.decimals)}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {getTokenSymbol(balance)}
                  </div>
                </div>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(balance.asset_type)}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
