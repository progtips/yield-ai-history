import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ProfitCalculation, 
  formatProfitValue, 
  formatPercentage 
} from '@/lib/utils/profitCalculation';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Activity } from 'lucide-react';

interface ProtocolProfitCardProps {
  protocolName: string;
  profitData: ProfitCalculation;
  className?: string;
}

export function ProtocolProfitCard({ 
  protocolName, 
  profitData, 
  className = '' 
}: ProtocolProfitCardProps) {
  const isPositive = profitData.profit > 0;
  const isProfitable = profitData.roi > 0;

  return (
    <Card className={`${className} ${isPositive ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {protocolName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isPositive ? "default" : "destructive"}
              className="capitalize"
            >
              {isPositive ? 'Прибыль' : 'Убыток'}
            </Badge>
            {isProfitable && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                ROI: {formatPercentage(profitData.roi)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Основная прибыль */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatProfitValue(profitData.profit)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {formatPercentage(profitData.profitPercentage)} от депозитов
          </div>
        </div>

        {/* Детальная разбивка */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Депозиты:</span>
              <span className="font-medium">{formatProfitValue(profitData.totalDeposits)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">Выводы:</span>
              <span className="font-medium">{formatProfitValue(profitData.totalWithdrawals)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600">Награды:</span>
              <span className="font-medium">{formatProfitValue(profitData.totalClaims)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600">Свопы:</span>
              <span className="font-medium">{formatProfitValue(profitData.totalSwaps)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Транзакций:</span>
              <span className="font-medium">{profitData.transactionCount}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span className="text-gray-600">APY:</span>
              <span className="font-medium">{formatPercentage(profitData.apy)}</span>
            </div>
          </div>
        </div>

        {/* Временные метрики */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <div className="font-medium">Первый депозит:</div>
              <div>{new Date(profitData.firstTransactionDate).toLocaleDateString('ru-RU')}</div>
            </div>
            <div>
              <div className="font-medium">Последняя активность:</div>
              <div>{new Date(profitData.lastTransactionDate).toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">Активных дней:</span> {profitData.activeDays}
          </div>
        </div>

        {/* Средние значения */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Средняя транзакция:</span> {formatProfitValue(profitData.averageTransactionValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 