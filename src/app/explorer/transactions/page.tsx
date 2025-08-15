import { Suspense } from 'react';
import { TransactionsTable } from '@/components/explorer/TransactionsTable';
import { TransactionsFilters } from '@/components/explorer/TransactionsFilters';
import { LiveTransactionsDemo } from '@/components/explorer/LiveTransactionsDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';

// Серверный лоадер для начальных данных
async function loadInitialTransactions() {
  try {
         const query = `
       query LatestTransactions($limit: Int!, $offset: Int!) {
         user_transactions(
           limit: $limit
           offset: $offset
           order_by: { version: desc }
         ) {
           version
           sender
           timestamp
         }
       }
     `;

    const result = await executeQueryWithRetry(query, {
      limit: 50,
      offset: 0
    });

         return result.user_transactions || [];
  } catch (error) {
    console.error('Failed to load initial transactions:', error);
    return [];
  }
}

function TransactionsTableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export default async function TransactionsPage() {
  const initialTransactions = await loadInitialTransactions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Explore Aptos blockchain transactions in real-time
          </p>
        </div>
      </div>

      <TransactionsFilters />
      
      <LiveTransactionsDemo />

      <Card>
        <CardHeader>
          <CardTitle>Latest Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TransactionsTableSkeleton />}>
            <TransactionsTable initialData={initialTransactions} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
