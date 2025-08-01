'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TransactionDetails {
  id: string;
  version: string;
  timestamp: string;
  type: string;
  status: string;
  gas_used: string;
  gas_unit_price: string;
  max_gas_amount: string;
  expiration_timestamp_secs: string;
  sender: string;
  sequence_number: string;
  success: boolean;
  vm_status: string;
  payload: {
    type: string;
    function: string;
    type_arguments: string[];
    arguments: any[];
  };
  events: Array<{
    type: string;
    data: any;
  }>;
  changes: Array<{
    type: string;
    address: string;
    state_key_hash: string;
    data: any;
  }>;
}

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/aptos/transaction/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch transaction details');
        }
        const data = await response.json();
        setTransaction(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTransactionDetails();
    }
  }, [params.id]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) {
      return 'Unknown';
    }
    
    // Try different timestamp formats
    let date: Date;
    
    if (typeof timestamp === 'string') {
      // Convert string to number first
      const numTimestamp = parseFloat(timestamp);
      if (isNaN(numTimestamp)) {
        return 'Invalid Date';
      }
      
      // Check if it's microseconds (very large number)
      if (numTimestamp > 1000000000000000) {
        // Microseconds - convert to milliseconds
        date = new Date(numTimestamp / 1000);
      } else if (numTimestamp > 1000000000000) {
        // Likely milliseconds
        date = new Date(numTimestamp);
      } else {
        // Likely seconds, convert to milliseconds
        date = new Date(numTimestamp * 1000);
      }
    } else if (typeof timestamp === 'number') {
      // Check if it's microseconds (very large number)
      if (timestamp > 1000000000000000) {
        // Microseconds - convert to milliseconds
        date = new Date(timestamp / 1000);
      } else if (timestamp > 1000000000000) {
        // Likely milliseconds
        date = new Date(timestamp);
      } else {
        // Likely seconds, convert to milliseconds
        date = new Date(timestamp * 1000);
      }
    } else {
      return 'Invalid Date';
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    if (!amount) return '-';
    return (parseInt(amount) / 100000000).toFixed(8);
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Failed</Badge>
    );
  };

  const renderJsonData = (data: any, depth = 0): React.ReactNode => {
    if (depth > 3) return <span className="text-gray-500">...</span>;
    
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="ml-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="text-blue-600 font-mono text-sm">{key}:</span>{' '}
              {renderJsonData(value, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    return <span className="font-mono text-sm">{String(data)}</span>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading transaction details...</div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-red-600">Error: {error || 'Transaction not found'}</div>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transaction {transaction.version}</h1>
            <p className="text-muted-foreground">
              {formatTimestamp(transaction.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(transaction.success)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://explorer.aptoslabs.com/txn/${transaction.version}?network=mainnet`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      </div>

      <Separator />

      {/* Transaction Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Version:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{transaction.version}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.version, 'version')}
                  >
                    {copiedField === 'version' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                {getStatusBadge(transaction.success)}
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="text-sm">{transaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">VM Status:</span>
                <span className="text-sm font-mono">{transaction.vm_status}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Gas Used:</span>
                <span className="text-sm">{transaction.gas_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Gas Unit Price:</span>
                <span className="text-sm">{transaction.gas_unit_price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Max Gas Amount:</span>
                <span className="text-sm">{transaction.max_gas_amount}</span>
              </div>
                             <div className="flex justify-between">
                 <span className="text-sm font-medium text-gray-600">Sequence Number:</span>
                 <span className="text-sm">{transaction.sequence_number}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-sm font-medium text-gray-600">Timestamp:</span>
                 <span className="text-sm">{formatTimestamp(transaction.timestamp)}</span>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sender</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">{formatAddress(transaction.sender)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(transaction.sender, 'sender')}
              >
                {copiedField === 'sender' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <span className="text-sm text-gray-500">{transaction.sender}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payload */}
      <Card>
        <CardHeader>
          <CardTitle>Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Type: </span>
              <span className="text-sm">{transaction.payload.type}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Function: </span>
              <span className="text-sm font-mono">{transaction.payload.function}</span>
            </div>
            {transaction.payload.type_arguments && transaction.payload.type_arguments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Type Arguments: </span>
                <div className="mt-1">
                  {transaction.payload.type_arguments.map((arg, index) => (
                    <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                      {arg}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {transaction.payload.arguments && transaction.payload.arguments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Arguments: </span>
                <div className="mt-1">
                  {transaction.payload.arguments.map((arg, index) => (
                    <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                      {renderJsonData(arg)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      {transaction.events && transaction.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events ({transaction.events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.events.map((event, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-600">Event {index + 1}</span>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    {renderJsonData(event.data)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Changes */}
      {transaction.changes && transaction.changes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Changes ({transaction.changes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.changes.map((change, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-600">Change {index + 1}</span>
                    <Badge variant="outline">{change.type}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Address: </span>
                      <span className="text-sm font-mono">{formatAddress(change.address)}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">State Key Hash: </span>
                      <span className="text-sm font-mono">{change.state_key_hash}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Data: </span>
                      <div className="mt-1 bg-gray-50 p-3 rounded">
                        {renderJsonData(change.data)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 