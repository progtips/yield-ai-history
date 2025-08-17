'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { executeQueryWithRetry } from '@/lib/aptos/indexerClient';
import {
  Hash,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  User,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface VersionPageProps {
  params: {
    version: string;
  };
}

interface VersionData {
  version: string;
  hash: string;
  sender: string;
  success: boolean;
  gas_used: string;
  timestamp: string;
  payload?: {
    type: string;
    function?: string;
    type_arguments?: string[];
    arguments?: string[];
  };
}

export default function VersionPage({ params }: VersionPageProps) {
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { version } = params;

  useEffect(() => {
    loadVersionData();
  }, [version]);

  const loadVersionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Моковые данные для демонстрации
      const mockData: VersionData = {
        version,
        hash: `0x${Math.random().toString(16).slice(2, 66)}`,
        sender: `0x${Math.random().toString(16).slice(2, 42)}`,
        success: Math.random() > 0.1,
        gas_used: (Math.random() * 2000 + 500).toString(),
        timestamp: new Date().toISOString(),
        payload: {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
          arguments: ['0x123...', '1000000'],
        },
      };

      setVersionData(mockData);
    } catch (error) {
      console.error('Failed to load version data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load version data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatGasUsed = (gasUsed: string) => {
    const gas = parseInt(gasUsed);
    if (gas > 1000000) {
      return `${(gas / 1000000).toFixed(2)}M`;
    } else if (gas > 1000) {
      return `${(gas / 1000).toFixed(2)}K`;
    }
    return gas.toString();
  };

  const getPreviousVersion = () => {
    const prevVersion = parseInt(version) - 1;
    return prevVersion >= 0 ? prevVersion.toString() : null;
  };

  const getNextVersion = () => {
    const nextVersion = parseInt(version) + 1;
    return nextVersion.toString();
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-6 w-64' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-4 w-24' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-16' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-destructive'>Error: {error}</p>
        <Button onClick={loadVersionData} className='mt-4'>
          Retry
        </Button>
      </div>
    );
  }

  if (!versionData) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>Version not found</p>
      </div>
    );
  }

  const prevVersion = getPreviousVersion();
  const nextVersion = getNextVersion();

  return (
    <div className='space-y-6'>
      {/* Заголовок версии */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
            <Hash className='h-6 w-6 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold'>
              Version {versionData.version}
            </h1>
            <div className='flex items-center gap-2'>
              <code className='text-sm bg-muted px-2 py-1 rounded'>
                Hash: {formatHash(versionData.hash)}
              </code>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(versionData.hash)}
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge variant={versionData.success ? 'default' : 'destructive'}>
            {versionData.success ? (
              <CheckCircle className='h-3 w-3 mr-1' />
            ) : (
              <XCircle className='h-3 w-3 mr-1' />
            )}
            {versionData.success ? 'Success' : 'Failed'}
          </Badge>
        </div>
      </div>

      {/* Навигация */}
      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          size='sm'
          disabled={!prevVersion}
          asChild={!!prevVersion}
        >
          {prevVersion ? (
            <Link href={`/explorer/tx/version/${prevVersion}`}>
              <ChevronLeft className='h-4 w-4 mr-2' />
              Previous Version
            </Link>
          ) : (
            <>
              <ChevronLeft className='h-4 w-4 mr-2' />
              Previous Version
            </>
          )}
        </Button>

        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Version</span>
          <span className='font-mono font-medium'>{versionData.version}</span>
        </div>

        <Button variant='outline' size='sm' asChild>
          <Link href={`/explorer/tx/version/${nextVersion}`}>
            Next Version
            <ChevronRight className='h-4 w-4 ml-2' />
          </Link>
        </Button>
      </div>

      {/* Метрики версии */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Sender</CardTitle>
            <User className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-sm font-mono'>
              {formatAddress(versionData.sender)}
            </div>
            <p className='text-xs text-muted-foreground'>Transaction sender</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Gas Used</CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatGasUsed(versionData.gas_used)}
            </div>
            <p className='text-xs text-muted-foreground'>Gas units consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Timestamp</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-sm font-medium'>
              {formatTimestamp(versionData.timestamp)}
            </div>
            <p className='text-xs text-muted-foreground'>Transaction time</p>
          </CardContent>
        </Card>
      </div>

      {/* Детали транзакции */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Hash
                </label>
                <div className='font-mono text-sm mt-1 p-2 bg-muted rounded'>
                  {versionData.hash}
                </div>
              </div>
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Sender
                </label>
                <div className='font-mono text-sm mt-1 p-2 bg-muted rounded'>
                  {versionData.sender}
                </div>
              </div>
            </div>

            {versionData.payload && (
              <div>
                <label className='text-sm font-medium text-muted-foreground'>
                  Payload
                </label>
                <div className='mt-1 p-3 bg-muted rounded space-y-2'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <span className='text-xs text-muted-foreground'>
                        Type:
                      </span>
                      <div className='font-mono text-sm'>
                        {versionData.payload.type}
                      </div>
                    </div>
                    {versionData.payload.function && (
                      <div>
                        <span className='text-xs text-muted-foreground'>
                          Function:
                        </span>
                        <div className='font-mono text-sm'>
                          {versionData.payload.function}
                        </div>
                      </div>
                    )}
                  </div>
                  {versionData.payload.type_arguments &&
                    versionData.payload.type_arguments.length > 0 && (
                      <div>
                        <span className='text-xs text-muted-foreground'>
                          Type Arguments:
                        </span>
                        <div className='font-mono text-sm'>
                          {versionData.payload.type_arguments.join(', ')}
                        </div>
                      </div>
                    )}
                  {versionData.payload.arguments &&
                    versionData.payload.arguments.length > 0 && (
                      <div>
                        <span className='text-xs text-muted-foreground'>
                          Arguments:
                        </span>
                        <div className='font-mono text-sm'>
                          {versionData.payload.arguments.join(', ')}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
