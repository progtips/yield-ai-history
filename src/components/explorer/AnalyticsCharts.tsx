'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Activity, PieChart as PieChartIcon } from 'lucide-react';
import { AnalyticsData } from '@/lib/aptos/analytics';

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

// Цвета для графиков
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // Подготовка данных для TPS графика
  const tpsChartData = data.tps.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    tps: point.tps,
    timestamp: point.timestamp,
  }));

  // Подготовка данных для топ модулей
  const modulesChartData = data.topModules.slice(0, 8).map((module, index) => ({
    name: module.module.split('::')[1] || module.module,
    value: module.transactionCount,
    percentage: module.percentage,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Подготовка данных для статистики газа
  const gasStatsData = [
    { name: 'Average', value: data.gasStats.averageGasUsed, color: '#3b82f6' },
    { name: 'Median', value: data.gasStats.medianGasUsed, color: '#8b5cf6' },
    { name: 'Min', value: data.gasStats.minGasUsed, color: '#10b981' },
    { name: 'Max', value: data.gasStats.maxGasUsed, color: '#f59e0b' },
  ];

  // Кастомный tooltip для TPS графика
  const TpsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-background border rounded-lg p-3 shadow-lg'>
          <p className='font-medium'>{label}</p>
          <p className='text-sm text-muted-foreground'>
            TPS: <span className='font-medium'>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Кастомный tooltip для модулей
  const ModulesTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='bg-background border rounded-lg p-3 shadow-lg'>
          <p className='font-medium'>{data.name}</p>
          <p className='text-sm text-muted-foreground'>
            Transactions:{' '}
            <span className='font-medium'>{data.value.toLocaleString()}</span>
          </p>
          <p className='text-sm text-muted-foreground'>
            Percentage:{' '}
            <span className='font-medium'>{data.percentage.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* TPS Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            TPS Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tpsChartData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={tpsChartData}>
                <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
                <XAxis
                  dataKey='time'
                  tick={{ fontSize: 12 }}
                  interval='preserveStartEnd'
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={value => value.toFixed(0)}
                />
                <Tooltip content={<TpsTooltip />} />
                <Line
                  type='monotone'
                  dataKey='tps'
                  stroke='#3b82f6'
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-64 flex items-center justify-center text-muted-foreground'>
              No TPS data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Modules Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <PieChartIcon className='h-5 w-5' />
            Top Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {modulesChartData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <PieChart>
                <Pie
                  data={modulesChartData}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name} (${percentage.toFixed(1)}%)`
                  }
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'
                >
                  {modulesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ModulesTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-64 flex items-center justify-center text-muted-foreground'>
              No module data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gas Statistics Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Gas Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={gasStatsData}>
              <CartesianGrid strokeDasharray='3 3' className='opacity-30' />
              <XAxis dataKey='name' tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={value => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(),
                  'Gas Used',
                ]}
                labelFormatter={label => `${label} Gas`}
              />
              <Bar dataKey='value' fill='#3b82f6' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Success Rate vs Failed Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <PieChartIcon className='h-5 w-5' />
            Transaction Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: 'Successful',
                    value: data.successRate.successfulTransactions,
                    color: '#10b981',
                  },
                  {
                    name: 'Failed',
                    value: data.successRate.failedTransactions,
                    color: '#ef4444',
                  },
                ]}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ name, value, percent }) =>
                  `${name}: ${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
              >
                <Cell fill='#10b981' />
                <Cell fill='#ef4444' />
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(),
                  'Transactions',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
