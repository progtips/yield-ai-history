import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Zap,
  CheckCircle,
  Clock,
  RefreshCw,
  BarChart3,
  Activity,
  PieChart,
} from 'lucide-react';
import { getAnalyticsData } from '@/lib/aptos/analytics';
import { AnalyticsCharts } from '@/components/explorer/AnalyticsCharts';
import { AnalyticsKPICards } from '@/components/explorer/AnalyticsKPICards';

interface AnalyticsPageProps {
  searchParams: {
    range?: string;
  };
}

// Компонент для загрузки данных аналитики
async function AnalyticsDataLoader({ range }: { range: string }) {
  try {
    const data = await getAnalyticsData(range);
    return (
      <>
        <AnalyticsKPICards data={data} />
        <AnalyticsCharts data={data} />
      </>
    );
  } catch (error) {
    console.error('Failed to load analytics data:', error);
    return (
      <div className='text-center py-8'>
        <p className='text-destructive'>Failed to load analytics data</p>
        <Button onClick={() => window.location.reload()} className='mt-4'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Retry
        </Button>
      </div>
    );
  }
}

// Компонент для скелетона загрузки
function AnalyticsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* KPI Cards Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16 mb-2' />
              <Skeleton className='h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              <Skeleton className='h-5 w-32' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className='h-64 w-full' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PieChart className='h-5 w-5' />
              <Skeleton className='h-5 w-32' />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className='h-64 w-full' />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const range = searchParams.range || '24h';

  const timeRanges = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  return (
    <div className='space-y-6'>
      {/* Заголовок страницы */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Analytics Dashboard</h1>
          <p className='text-muted-foreground'>
            Real-time insights into Aptos network activity
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='flex items-center gap-1'>
            <BarChart3 className='h-3 w-3' />
            Analytics
          </Badge>
        </div>
      </div>

      {/* Переключатель временных диапазонов */}
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>Time Range:</span>
        <div className='flex gap-1'>
          {timeRanges.map(timeRange => (
            <Button
              key={timeRange.value}
              variant={range === timeRange.value ? 'default' : 'outline'}
              size='sm'
              asChild
            >
              <a href={`/explorer/analytics?range=${timeRange.value}`}>
                {timeRange.label}
              </a>
            </Button>
          ))}
        </div>
      </div>

      {/* Основной контент */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDataLoader range={range} />
      </Suspense>

      {/* Информация о данных */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>About Analytics Data</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <h4 className='font-medium mb-2'>Data Sources</h4>
              <ul className='space-y-1 text-muted-foreground'>
                <li>• Aptos Indexer GraphQL API</li>
                <li>• Real-time transaction data</li>
                <li>• Cached for performance</li>
                <li>• Updated every 60 seconds</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium mb-2'>Metrics Explained</h4>
              <ul className='space-y-1 text-muted-foreground'>
                <li>• TPS: Transactions per second</li>
                <li>• Success Rate: % of successful transactions</li>
                <li>• Gas Stats: Average, median, min/max gas usage</li>
                <li>• Top Modules: Most active smart contract modules</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
