'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';

export default function TestGraphQLPage() {
  const [testHash, setTestHash] = useState(
    '0x0a579b20dee8811721a730c5f16a0650183aa2931099cfcd62b20d22326e3d6d'
  );
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testTransactionSearch = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const query = `
         query TransactionByHash($hash: String!) {
           user_transactions(where: { hash: { _eq: $hash } }, limit: 1) {
             version
             sender
             timestamp
           }
         }
       `;

      const response = await executeQueryWithRetry(query, { hash: testHash });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testLatestTransactions = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const query = `
         query LatestTransactions($limit: Int!) {
           user_transactions(limit: $limit, order_by: { version: desc }) {
             version
             sender
             timestamp
           }
         }
       `;

      const response = await executeQueryWithRetry(query, { limit: 1 });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <h1 className='text-3xl font-bold'>GraphQL Test Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test Transaction Search</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input
              value={testHash}
              onChange={e => setTestHash(e.target.value)}
              placeholder='Enter transaction hash'
              className='flex-1'
            />
            <Button onClick={testTransactionSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search TX'}
            </Button>
          </div>

          <Button
            onClick={testLatestTransactions}
            disabled={isLoading}
            variant='outline'
          >
            {isLoading ? 'Loading...' : 'Get Latest TXs'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-red-800'>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className='text-sm text-red-700 whitespace-pre-wrap'>
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className='text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96'>
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Environment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2 text-sm'>
            <div>
              <strong>INDEXER_GQL_URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_INDEXER_GQL_URL ||
                'Not set (using default)'}
            </div>
            <div>
              <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
