import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ProtocolProfitSummary,
  formatProfitValue,
  formatPercentage,
} from '@/lib/utils/profitCalculation';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Activity,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

interface ProfitSummaryCardProps {
  protocolBreakdown: ProtocolProfitSummary[];
  totalProfit: number;
  overallStats: {
    totalTransactions: number;
    totalValue: number;
    averageROI: number;
    mostProfitableProtocol: string;
    leastProfitableProtocol: string;
  };
  className?: string;
}

export function ProfitSummaryCard({
  protocolBreakdown,
  totalProfit,
  overallStats,
  className = '',
}: ProfitSummaryCardProps) {
  const isPositive = totalProfit > 0;
  const profitableProtocols = protocolBreakdown.filter(p => p.isProfitable);
  const unprofitableProtocols = protocolBreakdown.filter(p => !p.isProfitable);

  return (
    <Card
      className={`${className} ${isPositive ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}
    >
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            Общая прибыль по всем протоколам
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge
              variant={isPositive ? 'default' : 'destructive'}
              className='capitalize'
            >
              {isPositive ? 'Прибыль' : 'Убыток'}
            </Badge>
            <Badge variant='outline' className='text-gray-600'>
              {protocolBreakdown.length} протоколов
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Основная прибыль */}
        <div className='text-center'>
          <div
            className={`text-4xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
          >
            {formatProfitValue(totalProfit)}
          </div>
          <div className='text-sm text-gray-600 mt-2'>
            Средний ROI: {formatPercentage(overallStats.averageROI)}
          </div>
        </div>

        {/* Статистика по протоколам */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {overallStats.totalTransactions}
            </div>
            <div className='text-xs text-gray-600'>Всего транзакций</div>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {profitableProtocols.length}
            </div>
            <div className='text-xs text-gray-600'>Прибыльных протоколов</div>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-red-600'>
              {unprofitableProtocols.length}
            </div>
            <div className='text-xs text-gray-600'>Убыточных протоколов</div>
          </div>

          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {formatProfitValue(overallStats.totalValue)}
            </div>
            <div className='text-xs text-gray-600'>Общий объем</div>
          </div>
        </div>

        {/* Лучшие и худшие протоколы */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {overallStats.mostProfitableProtocol && (
            <div className='p-3 bg-green-100 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2 mb-2'>
                <Trophy className='w-4 h-4 text-green-600' />
                <span className='font-medium text-green-800'>
                  Самый прибыльный
                </span>
              </div>
              <div className='text-sm text-green-700'>
                {overallStats.mostProfitableProtocol}
              </div>
            </div>
          )}

          {overallStats.leastProfitableProtocol && (
            <div className='p-3 bg-red-100 rounded-lg border border-red-200'>
              <div className='flex items-center gap-2 mb-2'>
                <AlertTriangle className='w-4 h-4 text-red-600' />
                <span className='font-medium text-red-800'>
                  Наименее прибыльный
                </span>
              </div>
              <div className='text-sm text-red-700'>
                {overallStats.leastProfitableProtocol}
              </div>
            </div>
          )}
        </div>

        {/* Детальная разбивка по протоколам */}
        <div className='space-y-3'>
          <h4 className='font-medium text-gray-800'>Разбивка по протоколам:</h4>
          <div className='space-y-2'>
            {protocolBreakdown.map(protocol => (
              <div
                key={protocol.protocolName}
                className='flex items-center justify-between p-2 bg-white rounded border'
              >
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${protocol.isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span className='font-medium text-sm'>
                    {protocol.protocolName}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-sm font-medium ${protocol.isPositive ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatProfitValue(protocol.profitData.profit)}
                  </span>
                  <Badge variant='outline' className='text-xs'>
                    {formatPercentage(protocol.profitData.roi)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Рекомендации */}
        <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
          <h4 className='font-medium text-blue-800 mb-2'>Рекомендации:</h4>
          <div className='text-sm text-blue-700 space-y-1'>
            {profitableProtocols.length > unprofitableProtocols.length ? (
              <div>
                ✅ Большинство протоколов приносят прибыль - отличная стратегия!
              </div>
            ) : (
              <div>
                ⚠️ Большинство протоколов убыточны - рассмотрите ребалансировку
                портфеля
              </div>
            )}

            {overallStats.averageROI > 10 && (
              <div>🎯 Высокий средний ROI - отличные результаты!</div>
            )}

            {overallStats.totalTransactions > 50 && (
              <div>📊 Активный трейдинг - рассмотрите оптимизацию комиссий</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
