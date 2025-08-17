'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import { makeAptos, type AptosNetwork } from '@/lib/aptos';
import {
  Copy,
  ExternalLink,
  TrendingUp,
  Coins,
  ArrowUpRight,
  FileText,
  Package,
  Database,
  Activity,
  Search,
  Moon,
  Sun,
  Monitor,
  Wallet,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';

interface AccountPageProps {
  params: {
    address: string;
  };
}

// Используем тип из lib/aptos.ts
type Theme = 'light' | 'dark' | 'system';

export default function AccountPage({ params }: AccountPageProps) {
  const [accountData, setAccountData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<AptosNetwork>('mainnet');
  const [theme, setTheme] = useState<Theme>('system');
  const [searchQuery, setSearchQuery] = useState('');

  const { address } = params;

  useEffect(() => {
    loadAccountData();
  }, [address, network]);

  // Создаем клиент Aptos для текущей сети
  const aptosClient = makeAptos(network);

  const loadAccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const accountQuery = `
        query AccountData($address: String!) {
          user_transactions(where: { sender: { _eq: $address } }, limit: 20, order_by: { timestamp: desc }) {
            version
            sender
            timestamp
          }
          current_coin_balances(where: { owner_address: { _eq: $address } }) {
            amount
            coin_type
            coin_info {
              name
              symbol
              decimals
            }
          }
        }
      `;

      const result = await executeQueryWithRetry(accountQuery, { address });

      const transactions = result.user_transactions || [];
      const balances = result.current_coin_balances || [];

      console.log('Account data result:', result);

      const totalTransactions = transactions.length;
      const aptBalance = balances.find(
        (b: any) => b.coin_type === '0x1::aptos_coin::AptosCoin'
      );
      const aptAmount = aptBalance
        ? parseFloat(aptBalance.amount) /
          Math.pow(10, aptBalance.coin_info?.decimals || 8)
        : 0;

      const accountData = {
        address,
        metrics: {
          totalTransactions,
          aptBalance: aptAmount,
          totalTokens: balances.length,
          lastActivity:
            transactions.length > 0 ? transactions[0]?.timestamp : null,
        },
        transactions,
        balances,
        resources: [],
        modules: [],
      };

      setAccountData(accountData);
    } catch (error) {
      console.error('Failed to load account data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load account data'
      );
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

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className='h-4 w-4' />;
      case 'dark':
        return <Moon className='h-4 w-4' />;
      default:
        return <Monitor className='h-4 w-4' />;
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-10 w-32' />
                <Skeleton className='h-10 w-64' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-10 w-24' />
                <Skeleton className='h-10 w-10' />
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-1'>
              <Skeleton className='h-96 w-full' />
            </div>
            <div className='lg:col-span-2'>
              <Skeleton className='h-96 w-full' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center py-8'>
            <p className='text-red-600 dark:text-red-400'>Error: {error}</p>
            <Button onClick={loadAccountData} className='mt-4'>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='text-center py-8'>
            <p className='text-gray-500 dark:text-gray-400'>
              No account data found
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Top Panel */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Select
                value={network}
                onValueChange={(value: AptosNetwork) => setNetwork(value)}
              >
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='mainnet'>
                    <div className='flex items-center gap-2'>
                      <Globe className='h-4 w-4' />
                      Mainnet
                    </div>
                  </SelectItem>
                  <SelectItem value='testnet'>
                    <div className='flex items-center gap-2'>
                      <Globe className='h-4 w-4' />
                      Testnet
                    </div>
                  </SelectItem>
                  <SelectItem value='devnet'>
                    <div className='flex items-center gap-2'>
                      <Globe className='h-4 w-4' />
                      Devnet
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search address or ANS...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10 w-64'
                />
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <Select
                value={theme}
                onValueChange={(value: Theme) => setTheme(value)}
              >
                <SelectTrigger className='w-24'>{getThemeIcon()}</SelectTrigger>
                <SelectContent>
                  <SelectItem value='light'>
                    <div className='flex items-center gap-2'>
                      <Sun className='h-4 w-4' />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value='dark'>
                    <div className='flex items-center gap-2'>
                      <Moon className='h-4 w-4' />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value='system'>
                    <div className='flex items-center gap-2'>
                      <Monitor className='h-4 w-4' />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Account Overview */}
          <div className='lg:col-span-1'>
            <Card className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
                  <Wallet className='h-5 w-5' />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <h3 className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-2'>
                    Address
                  </h3>
                  <div className='flex items-center gap-2'>
                    <code className='text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md text-gray-800 dark:text-gray-200 flex-1'>
                      {accountData.address}
                    </code>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => copyToClipboard(accountData.address)}
                      className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <Button variant='ghost' size='sm' asChild>
                      <a
                        href={`https://explorer.aptoslabs.com/account/${accountData.address}?network=${network}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      >
                        <ExternalLink className='h-4 w-4' />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Coins className='h-5 w-5 text-blue-600' />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        APT Balance
                      </span>
                    </div>
                    <span className='text-lg font-bold text-gray-900 dark:text-white'>
                      {accountData.metrics.aptBalance.toFixed(2)} APT
                    </span>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <TrendingUp className='h-5 w-5 text-green-600' />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Transactions
                      </span>
                    </div>
                    <span className='text-lg font-bold text-gray-900 dark:text-white'>
                      {accountData.metrics.totalTransactions.toLocaleString()}
                    </span>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Package className='h-5 w-5 text-purple-600' />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Tokens
                      </span>
                    </div>
                    <span className='text-lg font-bold text-gray-900 dark:text-white'>
                      {accountData.metrics.totalTokens}
                    </span>
                  </div>

                  <div className='flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Activity className='h-5 w-5 text-orange-600' />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Last Activity
                      </span>
                    </div>
                    <span className='text-sm font-medium text-gray-900 dark:text-white'>
                      {formatDate(accountData.metrics.lastActivity)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className='lg:col-span-2'>
            <Card className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'>
              <CardContent className='p-0'>
                <Tabs defaultValue='transactions' className='w-full'>
                  <TabsList className='grid w-full grid-cols-5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 rounded-none'>
                    <TabsTrigger
                      value='transactions'
                      className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400'
                    >
                      <FileText className='h-4 w-4 mr-2' />
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger
                      value='resources'
                      className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400'
                    >
                      <Database className='h-4 w-4 mr-2' />
                      Resources
                    </TabsTrigger>
                    <TabsTrigger
                      value='modules'
                      className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400'
                    >
                      <Package className='h-4 w-4 mr-2' />
                      Modules
                    </TabsTrigger>
                    <TabsTrigger
                      value='tokens'
                      className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400'
                    >
                      <Coins className='h-4 w-4 mr-2' />
                      Tokens
                    </TabsTrigger>
                    <TabsTrigger
                      value='nfts'
                      className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400'
                    >
                      <ImageIcon className='h-4 w-4 mr-2' />
                      NFTs
                    </TabsTrigger>
                  </TabsList>

                  <div className='p-6'>
                    <TabsContent value='transactions' className='mt-0'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                          All Transactions
                        </h3>
                        {accountData.transactions.length > 0 ? (
                          <div className='space-y-3'>
                            {accountData.transactions.map(
                              (tx: any, index: number) => (
                                <div
                                  key={index}
                                  className='flex items-center justify-between p-4 border border-gray-100 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors'
                                  onClick={() =>
                                    window.open(
                                      `/explorer/tx/version/${tx.version}`,
                                      '_blank'
                                    )
                                  }
                                >
                                  <div className='flex items-center gap-3'>
                                    <div className='h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center'>
                                      <ArrowUpRight className='h-4 w-4 text-green-600' />
                                    </div>
                                    <div>
                                      <p className='font-medium text-gray-900 dark:text-white'>
                                        Version {tx.version}
                                      </p>
                                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                                        {formatDate(tx.timestamp)}
                                      </p>
                                      <p className='text-xs text-gray-400 dark:text-gray-500 font-mono'>
                                        {tx.sender.slice(0, 6)}...
                                        {tx.sender.slice(-4)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='default'
                                      className='text-xs'
                                    >
                                      Success
                                    </Badge>
                                    <ExternalLink className='h-3 w-3 text-gray-400' />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className='text-center py-8'>
                            <p className='text-gray-500 dark:text-gray-400'>
                              No transactions found
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value='resources' className='mt-0'>
                      <div className='text-center py-8'>
                        <Database className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                          Resources
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 mb-4'>
                          Account resources will be displayed here
                        </p>
                        <p className='text-sm text-gray-400 dark:text-gray-500'>
                          Resources functionality coming soon
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value='modules' className='mt-0'>
                      <div className='text-center py-8'>
                        <Package className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                          Modules
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 mb-4'>
                          Account modules will be displayed here
                        </p>
                        <p className='text-sm text-gray-400 dark:text-gray-500'>
                          Modules functionality coming soon
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value='tokens' className='mt-0'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                          Token Balances
                        </h3>
                        {accountData.balances.length > 0 ? (
                          <div className='space-y-3'>
                            {accountData.balances.map(
                              (balance: any, index: number) => (
                                <div
                                  key={index}
                                  className='flex items-center justify-between p-4 border border-gray-100 dark:border-gray-600 rounded-lg'
                                >
                                  <div className='flex items-center gap-3'>
                                    <div className='h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                                      <Coins className='h-4 w-4 text-blue-600' />
                                    </div>
                                    <div>
                                      <p className='font-medium text-gray-900 dark:text-white'>
                                        {balance.coin_info?.name ||
                                          'Unknown Token'}
                                      </p>
                                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                                        {balance.coin_info?.symbol ||
                                          balance.coin_type
                                            ?.split('::')
                                            .pop() ||
                                          'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className='text-right'>
                                    <p className='text-lg font-bold text-gray-900 dark:text-white'>
                                      {formatAmount(
                                        balance.amount,
                                        balance.coin_info?.decimals || 8
                                      )}
                                    </p>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                      {balance.coin_info?.symbol ||
                                        balance.coin_type?.split('::').pop() ||
                                        'N/A'}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className='text-center py-8'>
                            <p className='text-gray-500 dark:text-gray-400'>
                              No token balances found
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value='nfts' className='mt-0'>
                      <div className='text-center py-8'>
                        <ImageIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                          NFTs
                        </h3>
                        <p className='text-gray-500 dark:text-gray-400 mb-4'>
                          Account NFTs will be displayed here
                        </p>
                        <p className='text-sm text-gray-400 dark:text-gray-500'>
                          NFT functionality coming soon
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Debug Block */}
      {process.env.NODE_ENV === 'development' && (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md'>
            <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-2'>
              Отладка страницы аккаунта
            </h4>
            <div className='text-xs text-blue-700 dark:text-blue-300 space-y-1'>
              <div>
                <strong>Address:</strong> {address}
              </div>
              <div>
                <strong>Network:</strong> {network}
              </div>
              <div>
                <strong>Theme:</strong> {theme}
              </div>
              <div>
                <strong>Transactions count:</strong>{' '}
                {accountData.transactions.length}
              </div>
              <div>
                <strong>Balances count:</strong> {accountData.balances.length}
              </div>
              <div>
                <strong>APT Balance:</strong> {accountData.metrics.aptBalance}{' '}
                APT
              </div>
              <div>
                <strong>Available fields:</strong> version, sender, timestamp
              </div>
              <div>
                <strong>Missing fields:</strong> success, hash, gas_used (not in
                GraphQL schema)
              </div>
              {accountData.transactions.length > 0 && (
                <div>
                  <strong>Latest transaction:</strong> Version{' '}
                  {accountData.transactions[0].version}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
