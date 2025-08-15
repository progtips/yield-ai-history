import { GraphQLClient } from 'graphql-request';

/**
 * Создает GraphQL клиент для Aptos Indexer
 * @returns GraphQLClient настроенный для работы с Aptos Indexer
 */
export function getGraphQLClient(network: string = 'mainnet'): GraphQLClient {
  // Всегда используем mainnet для explorer
  let indexerUrl: string;
  
  if (process.env.NEXT_PUBLIC_INDEXER_GQL_URL) {
    indexerUrl = process.env.NEXT_PUBLIC_INDEXER_GQL_URL;
  } else if (process.env.INDEXER_GQL_URL) {
    indexerUrl = process.env.INDEXER_GQL_URL;
  } else {
    // URL по умолчанию - всегда mainnet
    // Попробуем альтернативный URL
    indexerUrl = 'https://indexer-v1.mainnet.aptoslabs.com/v1/graphql';
  }

  
  
             const client = new GraphQLClient(indexerUrl, {
             headers: {
               'Content-Type': 'application/json',
               'Accept': 'application/json',
               // Добавляем API ключ если есть
               ...(process.env.NEXT_PUBLIC_INDEXER_API_KEY && {
                 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_INDEXER_API_KEY}`
               })
             },
             timeout: 60000, // 60 секунд таймаут
             retries: 3, // Количество попыток
           });

  return client;
}

/**
 * Выполняет GraphQL запрос с обработкой ошибок
 * @param query GraphQL запрос
 * @param variables Переменные запроса
 * @returns Результат запроса
 */
export async function executeQuery<T = any>(
  query: string, 
  variables?: Record<string, any>,
  network: string = 'mainnet'
): Promise<T> {
  const client = getGraphQLClient('mainnet'); // Всегда используем mainnet
  
  try {
    const result = await client.request<T>(query, variables);
    return result;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    throw new Error(`GraphQL query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Выполняет GraphQL запрос с экспоненциальным ретраем
 * @param query GraphQL запрос
 * @param variables Переменные запроса
 * @param maxRetries Максимальное количество попыток
 * @returns Результат запроса
 */
export async function executeQueryWithRetry<T = any>(
  query: string,
  variables?: Record<string, any>,
  maxRetries: number = 3,
  network: string = 'mainnet'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeQuery<T>(query, variables, 'mainnet'); // Всегда используем mainnet
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Если это последняя попытка, выбрасываем ошибку
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Экспоненциальная задержка: 1s, 2s, 4s, 8s...
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`GraphQL query attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Экспортируем типы для удобства
export type { GraphQLClient };
