"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  Clock,
  Activity,
  BarChart3,
  TrendingDown,
  Minus
} from 'lucide-react';
import { AnalyticsData } from '@/lib/aptos/analytics';

interface AnalyticsKPICardsProps {
  data: AnalyticsData;
}

export function AnalyticsKPICards({ data }: AnalyticsKPICardsProps) {
  // Вычисляем средний TPS
  const averageTps = data.tps.length > 0 
    ? data.tps.reduce((sum, point) => sum + point.tps, 0) / data.tps.length 
    : 0;

  // Вычисляем изменение TPS (сравниваем первую и последнюю точку)
  const tpsChange = data.tps.length >= 2 
    ? ((data.tps[data.tps.length - 1].tps - data.tps[0].tps) / data.tps[0].tps) * 100 
    : 0;

  // Форматирование чисел
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const formatGas = (gas: number) => {
    if (gas >= 1000000) {
      return `${(gas / 1000000).toFixed(2)}M`;
    } else if (gas >= 1000) {
      return `${(gas / 1000).toFixed(2)}K`;
    }
    return gas.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Получение иконки для изменения значения
  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  // Получение цвета для изменения значения
  const getChangeColor = (change: number) => {
    if (change > 0) {
      return 'text-green-600';
    } else if (change < 0) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* TPS Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average TPS</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(averageTps)}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getChangeIcon(tpsChange)}
            <span className={getChangeColor(tpsChange)}>
              {tpsChange > 0 ? '+' : ''}{formatPercentage(tpsChange)}
            </span>
            <span>from start</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Transactions per second
          </p>
        </CardContent>
      </Card>

      {/* Success Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(data.successRate.successRate)}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatNumber(data.successRate.successfulTransactions)} successful</span>
            <span>•</span>
            <span>{formatNumber(data.successRate.failedTransactions)} failed</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(data.successRate.totalTransactions)} total transactions
          </p>
        </CardContent>
      </Card>

      {/* Average Gas Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Gas</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatGas(data.gasStats.averageGasUsed)}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Median: {formatGas(data.gasStats.medianGasUsed)}</span>
            <span>•</span>
            <span>Max: {formatGas(data.gasStats.maxGasUsed)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatGas(data.gasStats.totalGasUsed)} total gas used
          </p>
        </CardContent>
      </Card>

      {/* Top Module Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Module</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {data.topModules.length > 0 ? (
            <>
              <div className="text-lg font-bold truncate" title={data.topModules[0].module}>
                {data.topModules[0].module.split('::')[1] || data.topModules[0].module}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatNumber(data.topModules[0].transactionCount)} transactions</span>
                <span>•</span>
                <span>{formatPercentage(data.topModules[0].percentage)} of total</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.topModules.length} modules tracked
              </p>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-muted-foreground">No data</div>
              <p className="text-xs text-muted-foreground mt-1">
                No module activity detected
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
