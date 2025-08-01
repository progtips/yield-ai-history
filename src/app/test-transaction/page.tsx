'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TestTransactionPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Эта страница для тестирования функциональности просмотра деталей транзакций.
            </p>
            
            <div className="space-y-2">
              <h3 className="font-medium">Тестовые транзакции:</h3>
              <div className="space-x-2">
                <Link href="/test-transaction/3149841220">
                  <Button variant="outline">Transaction 3149841220</Button>
                </Link>
                <Link href="/test-transaction/3103279127">
                  <Button variant="outline">Transaction 3103279127</Button>
                </Link>
                <Link href="/test-transaction/3103288998">
                  <Button variant="outline">Transaction 3103288998</Button>
                </Link>
              </div>
            </div>
            
            <div className="pt-4">
              <Link href="/test-history">
                <Button>Вернуться к истории транзакций</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 