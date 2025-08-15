"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';

// Известные тестовые хеши (замените на реальные из mainnet)
const TEST_HASHES = [
  {
    name: 'Recent Mainnet TX',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    description: 'Тестовый хеш (замените на реальный)'
  },
  {
    name: 'Testnet TX',
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    description: 'Тестовый хеш testnet'
  }
];

export function SearchDebug() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const testHash = async (hash: string) => {
    setIsLoading(prev => ({ ...prev, [hash]: true }));
    
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

             const result = await executeQueryWithRetry(query, { hash });
      setResults(prev => ({ ...prev, [hash]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [hash]: { error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [hash]: false }));
    }
  };

     const testLatestTransactions = async () => {
     const key = 'latest';
     setIsLoading(prev => ({ ...prev, [key]: true }));
     
     try {
       console.log('Starting LatestTransactions query...');
               const query = `
          query LatestTransactions($limit: Int!) {
            user_transactions(limit: $limit) {
              version
              sender
              timestamp
            }
          }
        `;

       console.log('Query:', query);
       console.log('Variables:', { limit: 1 });
       
       const result = await executeQueryWithRetry(query, { limit: 1 });
       console.log('Query result:', result);
       setResults(prev => ({ ...prev, [key]: result }));
     } catch (error) {
       console.error('Query error:', error);
       setResults(prev => ({ 
         ...prev, 
         [key]: { error: error instanceof Error ? error.message : 'Unknown error' }
       }));
     } finally {
       setIsLoading(prev => ({ ...prev, [key]: false }));
     }
      };

   const testSimpleQuery = async () => {
     const key = 'simple';
     setIsLoading(prev => ({ ...prev, [key]: true }));
     
     try {
       console.log('Starting simple query test...');
       const query = `
         query SimpleTest {
           __schema {
             types {
               name
             }
           }
         }
       `;

       console.log('Simple query:', query);
       
       const result = await executeQueryWithRetry(query);
       console.log('Simple query result:', result);
       setResults(prev => ({ ...prev, [key]: result }));
     } catch (error) {
       console.error('Simple query error:', error);
       setResults(prev => ({ 
         ...prev, 
         [key]: { error: error instanceof Error ? error.message : 'Unknown error' }
       }));
     } finally {
       setIsLoading(prev => ({ ...prev, [key]: false }));
     }
   };

   const testMinimalQuery = async () => {
     const key = 'minimal';
     setIsLoading(prev => ({ ...prev, [key]: true }));
     
     try {
       console.log('Starting minimal query test...');
       const query = `
         query MinimalTest {
           user_transactions(limit: 1) {
             version
           }
         }
       `;

       console.log('Minimal query:', query);
       
       const result = await executeQueryWithRetry(query);
       console.log('Minimal query result:', result);
       setResults(prev => ({ ...prev, [key]: result }));
     } catch (error) {
       console.error('Minimal query error:', error);
       setResults(prev => ({ 
         ...prev, 
         [key]: { error: error instanceof Error ? error.message : 'Unknown error' }
       }));
     } finally {
       setIsLoading(prev => ({ ...prev, [key]: false }));
     }
   };

   return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Search Debug
          <Badge variant="outline" className="text-xs">
            mainnet
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {TEST_HASHES.map(({ name, hash, description }) => (
            <Button
              key={hash}
              variant="outline"
              size="sm"
              onClick={() => testHash(hash)}
              disabled={isLoading[hash]}
            >
              {isLoading[hash] ? 'Testing...' : name}
            </Button>
          ))}
                     <Button
             variant="outline"
             size="sm"
             onClick={testLatestTransactions}
             disabled={isLoading['latest']}
           >
             {isLoading['latest'] ? 'Loading...' : 'Latest TXs'}
           </Button>
           <Button
             variant="outline"
             size="sm"
             onClick={testSimpleQuery}
             disabled={isLoading['simple']}
           >
             {isLoading['simple'] ? 'Testing...' : 'Test Simple'}
           </Button>
           <Button
             variant="outline"
             size="sm"
             onClick={testMinimalQuery}
             disabled={isLoading['minimal']}
           >
             {isLoading['minimal'] ? 'Testing...' : 'Test Minimal'}
           </Button>
        </div>

        {Object.entries(results).map(([key, result]) => (
          <div key={key} className="border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={result.error ? "destructive" : "default"}>
                {result.error ? 'Error' : 'Success'}
              </Badge>
              <span className="text-sm font-mono">{key}</span>
            </div>
            
                         {result.error ? (
               <pre className="text-xs text-red-600 bg-red-50 p-2 rounded whitespace-pre-wrap break-words">
                 {result.error}
               </pre>
             ) : (
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
