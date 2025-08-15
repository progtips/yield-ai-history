import { unstable_cache } from 'next/cache';
import { executeQueryWithRetry } from './indexerClient';

// Типы для аналитики
export interface TpsData {
  tps: number;
  timestamp: string;
}

export interface SuccessRateData {
  successRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  period: string;
}

export interface GasStatsData {
  averageGasUsed: number;
  medianGasUsed: number;
  maxGasUsed: number;
  minGasUsed: number;
  totalGasUsed: number;
  period: string;
}

export interface TopModuleData {
  module: string;
  transactionCount: number;
  percentage: number;
}

export interface AnalyticsData {
  tps: TpsData[];
  successRate: SuccessRateData;
  gasStats: GasStatsData;
  topModules: TopModuleData[];
}

// Кэшированный fetch для GraphQL запросов
const cachedQuery = unstable_cache(
  async (query: string, variables: any) => {
    return await executeQueryWithRetry(query, variables);
  },
  ['aptos-analytics-query'],
  {
    tags: ['aptos-analytics'],
    revalidate: 60, // 1 минута
  }
);

// Получение TPS за последние N минут
export const getTps = async (lastNMinutes: number = 60): Promise<TpsData[]> => {
  const query = `
    query GetTPS($minutes: Int!) {
      transactions(
        where: { 
          timestamp: { _gte: "now() - interval '${lastNMinutes} minutes'" } 
        }
        order_by: { timestamp: asc }
      ) {
        timestamp
      }
    }
  `;

  try {
    const result = await cachedQuery(query, { minutes: lastNMinutes });
    
    if (!result.transactions) {
      return [];
    }

    // Группируем транзакции по минутам и вычисляем TPS
    const transactionsByMinute = new Map<string, number>();
    
    result.transactions.forEach((tx: any) => {
      const minute = new Date(tx.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      transactionsByMinute.set(minute, (transactionsByMinute.get(minute) || 0) + 1);
    });

    // Создаем массив TPS данных
    const tpsData: TpsData[] = [];
    const now = new Date();
    
    for (let i = lastNMinutes - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      const minuteKey = timestamp.toISOString().slice(0, 16);
      const transactionCount = transactionsByMinute.get(minuteKey) || 0;
      
      tpsData.push({
        tps: transactionCount,
        timestamp: timestamp.toISOString()
      });
    }

    return tpsData;
  } catch (error) {
    console.error('Error fetching TPS data:', error);
    return [];
  }
};

// Получение статистики успешности транзакций
export const getSuccessRate = async (range: string = '24h'): Promise<SuccessRateData> => {
  const timeIntervals: Record<string, string> = {
    '1h': "now() - interval '1 hour'",
    '6h': "now() - interval '6 hours'",
    '24h': "now() - interval '24 hours'",
    '7d': "now() - interval '7 days'",
    '30d': "now() - interval '30 days'"
  };

  const interval = timeIntervals[range] || timeIntervals['24h'];

  const query = `
    query GetSuccessRate($interval: String!) {
      successful: transactions_aggregate(
        where: { 
          success: { _eq: true },
          timestamp: { _gte: $interval }
        }
      ) {
        aggregate {
          count
        }
      }
      failed: transactions_aggregate(
        where: { 
          success: { _eq: false },
          timestamp: { _gte: $interval }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `;

  try {
    const result = await cachedQuery(query, { interval });
    
    const successfulCount = result.successful?.aggregate?.count || 0;
    const failedCount = result.failed?.aggregate?.count || 0;
    const totalCount = successfulCount + failedCount;
    
    const successRate = totalCount > 0 ? (successfulCount / totalCount) * 100 : 0;

    return {
      successRate: Math.round(successRate * 100) / 100, // Округляем до 2 знаков
      totalTransactions: totalCount,
      successfulTransactions: successfulCount,
      failedTransactions: failedCount,
      period: range
    };
  } catch (error) {
    console.error('Error fetching success rate data:', error);
    return {
      successRate: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      period: range
    };
  }
};

// Получение статистики газа
export const getGasStats = async (range: string = '24h'): Promise<GasStatsData> => {
  const timeIntervals: Record<string, string> = {
    '1h': "now() - interval '1 hour'",
    '6h': "now() - interval '6 hours'",
    '24h': "now() - interval '24 hours'",
    '7d': "now() - interval '7 days'",
    '30d': "now() - interval '30 days'"
  };

  const interval = timeIntervals[range] || timeIntervals['24h'];

  const query = `
    query GetGasStats($interval: String!) {
      gas_stats: transactions_aggregate(
        where: { 
          timestamp: { _gte: $interval }
        }
      ) {
        aggregate {
          avg {
            gas_used
          }
          sum {
            gas_used
          }
        }
      }
      gas_distribution: transactions(
        where: { 
          timestamp: { _gte: $interval }
        }
        order_by: { gas_used: asc }
      ) {
        gas_used
      }
    }
  `;

  try {
    const result = await cachedQuery(query, { interval });
    
    const gasValues = result.gas_distribution?.map((tx: any) => parseInt(tx.gas_used)) || [];
    const averageGas = result.gas_stats?.aggregate?.avg?.gas_used || 0;
    const totalGas = result.gas_stats?.aggregate?.sum?.gas_used || 0;
    
    // Вычисляем медиану
    const sortedGas = gasValues.sort((a: number, b: number) => a - b);
    const medianGas = sortedGas.length > 0 
      ? sortedGas.length % 2 === 0
        ? (sortedGas[sortedGas.length / 2 - 1] + sortedGas[sortedGas.length / 2]) / 2
        : sortedGas[Math.floor(sortedGas.length / 2)]
      : 0;

    return {
      averageGasUsed: Math.round(averageGas),
      medianGasUsed: Math.round(medianGas),
      maxGasUsed: sortedGas.length > 0 ? sortedGas[sortedGas.length - 1] : 0,
      minGasUsed: sortedGas.length > 0 ? sortedGas[0] : 0,
      totalGasUsed: totalGas,
      period: range
    };
  } catch (error) {
    console.error('Error fetching gas stats:', error);
    return {
      averageGasUsed: 0,
      medianGasUsed: 0,
      maxGasUsed: 0,
      minGasUsed: 0,
      totalGasUsed: 0,
      period: range
    };
  }
};

// Получение топ модулей
export const getTopModules = async (range: string = '24h', limit: number = 10): Promise<TopModuleData[]> => {
  const timeIntervals: Record<string, string> = {
    '1h': "now() - interval '1 hour'",
    '6h': "now() - interval '6 hours'",
    '24h': "now() - interval '24 hours'",
    '7d': "now() - interval '7 days'",
    '30d': "now() - interval '30 days'"
  };

  const interval = timeIntervals[range] || timeIntervals['24h'];

  const query = `
    query GetTopModules($interval: String!, $limit: Int!) {
      total_transactions: transactions_aggregate(
        where: { 
          timestamp: { _gte: $interval }
        }
      ) {
        aggregate {
          count
        }
      }
      module_stats: transactions(
        where: { 
          timestamp: { _gte: $interval }
        }
      ) {
        payload
      }
    }
  `;

  try {
    const result = await cachedQuery(query, { interval, limit });
    
    const totalTransactions = result.total_transactions?.aggregate?.count || 0;
    const transactions = result.module_stats || [];
    
    // Группируем по модулям
    const moduleCounts = new Map<string, number>();
    
    transactions.forEach((tx: any) => {
      if (tx.payload && tx.payload.function) {
        const module = tx.payload.function.split('::')[0] + '::' + tx.payload.function.split('::')[1];
        moduleCounts.set(module, (moduleCounts.get(module) || 0) + 1);
      }
    });
    
    // Сортируем и берем топ
    const sortedModules = Array.from(moduleCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([module, count]) => ({
        module,
        transactionCount: count,
        percentage: totalTransactions > 0 ? (count / totalTransactions) * 100 : 0
      }));

    return sortedModules;
  } catch (error) {
    console.error('Error fetching top modules:', error);
    return [];
  }
};

// Получение всех данных аналитики
export const getAnalyticsData = async (range: string = '24h'): Promise<AnalyticsData> => {
  try {
    const [tps, successRate, gasStats, topModules] = await Promise.all([
      getTps(range === '1h' ? 60 : range === '6h' ? 360 : range === '24h' ? 1440 : 10080),
      getSuccessRate(range),
      getGasStats(range),
      getTopModules(range)
    ]);

    return {
      tps,
      successRate,
      gasStats,
      topModules
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

// Функция для инвалидации кэша
export const invalidateAnalyticsCache = () => {
  // В Next.js 15 можно использовать revalidateTag
  // Это будет вызвано при необходимости обновления данных
  console.log('Invalidating analytics cache...');
};
