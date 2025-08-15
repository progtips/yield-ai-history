"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactionsStore } from '@/stores/transactions';
import { useToast } from '@/components/ui/use-toast';
import { Wifi, WifiOff, Bell, Play, Pause } from 'lucide-react';

export function LiveTransactionsDemo() {
  const { 
    isLive, 
    setIsLive, 
    newTransactionsCount, 
    resetNewTransactionsCount,
    prependNewTransactions 
  } = useTransactionsStore();
  
  const { toast } = useToast();
  const [demoCounter, setDemoCounter] = useState(0);

  // Демо функция для добавления новых транзакций
  const addDemoTransaction = () => {
    const newTx = {
      version: (Date.now() + demoCounter).toString(),
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      sender: `0x${Math.random().toString(16).slice(2, 42)}`,
      success: Math.random() > 0.1,
      gas_used: (Math.random() * 2000 + 500).toString(),
      timestamp: new Date().toISOString(),
      payload: {
        type: 'entry_function_payload',
        function: '0x1::coin::transfer',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: ['0x123...', '1000000']
      }
    };

    prependNewTransactions([newTx]);
    setDemoCounter(prev => prev + 1);

    // Показываем тост
    toast({
      title: `+1 new transaction`,
      description: `Version: ${newTx.version}`,
      action: (
        <button 
          onClick={() => resetNewTransactionsCount()}
          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
        >
          Dismiss
        </button>
      ),
    });
  };

  // Автоматическое добавление транзакций в live режиме
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(addDemoTransaction, 3000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Live Transactions Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-2"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLive ? 'Stop Demo' : 'Start Demo'}
          </Button>
          
          <Badge variant={isLive ? "default" : "secondary"}>
            {isLive ? 'Auto-adding every 3s' : 'Manual mode'}
          </Badge>
          
          {newTransactionsCount > 0 && (
            <Badge 
              variant="default" 
              className="flex items-center gap-1 cursor-pointer hover:bg-primary/90"
              onClick={resetNewTransactionsCount}
            >
              <Bell className="h-3 w-3" />
              +{newTransactionsCount} new
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>• Включите "Live" режим для автоматического добавления транзакций</p>
          <p>• Нажмите "Add Demo TX" для ручного добавления</p>
          <p>• Кликните на бейдж "+N new" для сброса счетчика</p>
        </div>
        
        <Button
          variant="outline"
          onClick={addDemoTransaction}
          disabled={isLive}
        >
          Add Demo TX
        </Button>
      </CardContent>
    </Card>
  );
}
