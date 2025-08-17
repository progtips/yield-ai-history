'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalSearch } from '@/components/explorer/GlobalSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Coins,
  Hash,
  Activity,
  ArrowUpRight,
  Clock,
  Zap,
} from 'lucide-react';

import { useExplorerStore } from '@/stores/explorer';
import { TransactionsTab } from '@/components/explorer/TransactionsTab';
import { AccountsTab } from '@/components/explorer/AccountsTab';
import { TokensTab } from '@/components/explorer/TokensTab';
import { BlocksTab } from '@/components/explorer/BlocksTab';

export default function ExplorerPage() {
  const { filters, setFilters } = useExplorerStore();

  const handleTabChange = (value: string) => {
    setFilters({ selectedTab: value as any });
  };

  // Моковые данные для статистики сети
  const networkStats = {
    totalTransactions: '2.5B+',
    activeAccounts: '1.2M+',
    totalTokens: '50K+',
    avgBlockTime: '0.5s',
  };

  return (
    <div className='space-y-8'>
      {/* Приветственный блок */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white'>
        <div className='max-w-4xl'>
          <h1 className='text-3xl font-bold mb-4'>Welcome to Aptos Explorer</h1>
          <p className='text-blue-100 text-lg mb-6'>
            Explore transactions, accounts, tokens, and blocks on the Aptos
            blockchain with real-time data and analytics.
          </p>
          <div className='flex flex-wrap gap-4'>
            <div className='flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full'>
              <Activity className='h-4 w-4' />
              <span className='text-sm font-medium'>Live Data</span>
            </div>
            <div className='flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full'>
              <Zap className='h-4 w-4' />
              <span className='text-sm font-medium'>Fast Search</span>
            </div>
            <div className='flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full'>
              <TrendingUp className='h-4 w-4' />
              <span className='text-sm font-medium'>Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика сети */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card className='bg-white border border-gray-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Transactions
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {networkStats.totalTransactions}
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border border-gray-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Active Accounts
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {networkStats.activeAccounts}
                </p>
              </div>
              <Users className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border border-gray-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Tokens
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {networkStats.totalTokens}
                </p>
              </div>
              <Coins className='h-8 w-8 text-yellow-600' />
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border border-gray-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Avg Block Time
                </p>
                <p className='text-2xl font-bold text-gray-900 mt-1'>
                  {networkStats.avgBlockTime}
                </p>
              </div>
              <Clock className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Поиск */}
      <Card className='bg-white border border-gray-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ArrowUpRight className='h-5 w-5' />
            Search Aptos Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GlobalSearch />
        </CardContent>
      </Card>

      {/* Основные табы */}
      <Card className='bg-white border border-gray-200'>
        <CardContent className='p-0'>
          <Tabs
            value={filters.selectedTab}
            onValueChange={handleTabChange}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-4 bg-gray-50 border-b border-gray-200 rounded-none'>
              <TabsTrigger
                value='transactions'
                className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700'
              >
                <Hash className='h-4 w-4 mr-2' />
                Transactions
              </TabsTrigger>
              <TabsTrigger
                value='accounts'
                className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700'
              >
                <Users className='h-4 w-4 mr-2' />
                Accounts
              </TabsTrigger>
              <TabsTrigger
                value='tokens'
                className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700'
              >
                <Coins className='h-4 w-4 mr-2' />
                Tokens
              </TabsTrigger>
              <TabsTrigger
                value='blocks'
                className='data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700'
              >
                <Hash className='h-4 w-4 mr-2' />
                Blocks
              </TabsTrigger>
            </TabsList>

            <div className='p-6'>
              <TabsContent value='transactions' className='mt-0'>
                <TransactionsTab />
              </TabsContent>

              <TabsContent value='accounts' className='mt-0'>
                <AccountsTab />
              </TabsContent>

              <TabsContent value='tokens' className='mt-0'>
                <TokensTab />
              </TabsContent>

              <TabsContent value='blocks' className='mt-0'>
                <BlocksTab />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
