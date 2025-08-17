'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useTransactionsStore,
  type TransactionFilters,
} from '@/stores/transactions';
import { Search, Filter, RotateCcw, Wifi, WifiOff } from 'lucide-react';

const filterSchema = z.object({
  address: z.string().optional(),
  status: z.enum(['all', 'success', 'failed']),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export function TransactionsFilters() {
  const { filters, setFilters, resetFilters, isLive, setIsLive } =
    useTransactionsStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      address: filters.address,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    },
  });

  const onSubmit = (data: FilterFormData) => {
    setFilters(data);
  };

  const handleReset = () => {
    form.reset();
    resetFilters();
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  // Синхронизируем форму с store
  useEffect(() => {
    form.reset({
      address: filters.address,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
  }, [filters, form]);

  return (
    <Card>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button
              variant={isLive ? 'default' : 'outline'}
              size='sm'
              onClick={toggleLive}
              className={`flex items-center gap-2 ${isLive ? 'animate-pulse' : ''}`}
            >
              {isLive ? (
                <Wifi className='h-4 w-4' />
              ) : (
                <WifiOff className='h-4 w-4' />
              )}
              {isLive ? 'Live' : 'Live'}
            </Button>
            <Badge
              variant={isLive ? 'default' : 'secondary'}
              className='text-xs'
            >
              {isLive ? 'Polling every 4s' : 'Static'}
            </Badge>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {/* Адрес */}
              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='0x...'
                        {...field}
                        className='font-mono text-sm'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Статус */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='success'>Success</SelectItem>
                        <SelectItem value='failed'>Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Дата от */}
              <FormField
                control={form.control}
                name='fromDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Date</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Дата до */}
              <FormField
                control={form.control}
                name='toDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Date</FormLabel>
                    <FormControl>
                      <Input type='datetime-local' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Расширенные фильтры */}
            {isExpanded && (
              <div className='pt-4 border-t'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Active Filters
                    </label>
                    <div className='flex flex-wrap gap-2'>
                      {filters.address && (
                        <Badge variant='secondary' className='text-xs'>
                          Address: {filters.address.slice(0, 8)}...
                        </Badge>
                      )}
                      {filters.status !== 'all' && (
                        <Badge variant='secondary' className='text-xs'>
                          Status: {filters.status}
                        </Badge>
                      )}
                      {filters.fromDate && (
                        <Badge variant='secondary' className='text-xs'>
                          From:{' '}
                          {new Date(filters.fromDate).toLocaleDateString()}
                        </Badge>
                      )}
                      {filters.toDate && (
                        <Badge variant='secondary' className='text-xs'>
                          To: {new Date(filters.toDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className='flex items-center justify-between pt-4'>
              <div className='flex items-center gap-2'>
                <Button type='submit' size='sm'>
                  <Search className='h-4 w-4 mr-2' />
                  Apply Filters
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleReset}
                >
                  <RotateCcw className='h-4 w-4 mr-2' />
                  Reset
                </Button>
              </div>

              {isLive && (
                <Badge variant='destructive' className='animate-pulse'>
                  Live Mode Active
                </Badge>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
