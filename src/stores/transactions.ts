import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TransactionFilters {
  address: string;
  status: 'all' | 'success' | 'failed';
  fromDate: string;
  toDate: string;
  limit: number;
  offset: number;
}

export interface Transaction {
  version: string;
  sender: string;
  timestamp: string;
  events?: Array<{
    type: string;
    data: string;
    sequence_number: string;
  }>;
  state_changes?: Array<{
    type: string;
    address: string;
    resource: string;
    data: string;
  }>;
}

interface TransactionsState {
  // Данные
  transactions: Transaction[];
  totalCount: number;
  
  // Фильтры
  filters: TransactionFilters;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  
  // Состояние загрузки
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Ошибки
  error: string | null;
  setError: (error: string | null) => void;
  
  // Поллинг
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  pollingInterval: number | null;
  setPollingInterval: (interval: number | null) => void;
  
  // Новые транзакции
  newTransactionsCount: number;
  setNewTransactionsCount: (count: number) => void;
  resetNewTransactionsCount: () => void;
  lastKnownVersion: string | null;
  setLastKnownVersion: (version: string) => void;
  
  // Кэш
  cache: Record<string, any>;
  setCache: (key: string, value: any) => void;
  getCache: (key: string) => any;
  clearCache: () => void;
  
  // Действия
  addTransactions: (transactions: Transaction[]) => void;
  updateTransactions: (transactions: Transaction[]) => void;
  clearTransactions: () => void;
  prependNewTransactions: (transactions: Transaction[]) => void;
}

const defaultFilters: TransactionFilters = {
  address: '',
  status: 'all',
  fromDate: '',
  toDate: '',
  limit: 50,
  offset: 0,
};

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      // Данные
      transactions: [],
      totalCount: 0,
      
      // Фильтры
      filters: defaultFilters,
      setFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters, offset: 0 } // Сбрасываем пагинацию при изменении фильтров
        })),
      resetFilters: () => set({ filters: defaultFilters }),
      
      // Состояние загрузки
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Ошибки
      error: null,
      setError: (error) => set({ error }),
      
      // Поллинг
      isLive: false,
      setIsLive: (live) => set({ isLive: live }),
      pollingInterval: null,
      setPollingInterval: (interval) => set({ pollingInterval: interval }),
      
      // Новые транзакции
      newTransactionsCount: 0,
      setNewTransactionsCount: (count) => set({ newTransactionsCount: count }),
      resetNewTransactionsCount: () => set({ newTransactionsCount: 0 }),
      lastKnownVersion: null,
      setLastKnownVersion: (version) => set({ lastKnownVersion: version }),
      
      // Кэш
      cache: {},
      setCache: (key, value) => 
        set((state) => ({
          cache: { ...state.cache, [key]: { value, timestamp: Date.now() } }
        })),
      getCache: (key) => {
        const cached = get().cache[key];
        if (!cached) return null;
        
        // Кэш действителен 2 минуты для транзакций
        if (Date.now() - cached.timestamp > 2 * 60 * 1000) {
          set((state) => {
            const newCache = { ...state.cache };
            delete newCache[key];
            return { cache: newCache };
          });
          return null;
        }
        
        return cached.value;
      },
      clearCache: () => set({ cache: {} }),
      
      // Действия
      addTransactions: (newTransactions) => 
        set((state) => ({
          transactions: [...newTransactions, ...state.transactions],
          totalCount: state.totalCount + newTransactions.length
        })),
      updateTransactions: (transactions) => 
        set((state) => ({
          transactions, 
          totalCount: transactions.length,
          lastKnownVersion: transactions.length > 0 ? transactions[0].version : state.lastKnownVersion
        })),
      clearTransactions: () => set({ transactions: [], totalCount: 0 }),
             prependNewTransactions: (newTransactions) => 
         set((state) => {
           // Фильтруем только действительно новые транзакции
           const existingVersions = new Set(state.transactions.map(tx => tx.version));
           const trulyNewTransactions = newTransactions.filter(tx => !existingVersions.has(tx.version));
           
           if (trulyNewTransactions.length === 0) {
             return state;
           }
           
           return {
             transactions: [...trulyNewTransactions, ...state.transactions],
             totalCount: state.totalCount + trulyNewTransactions.length,
             newTransactionsCount: state.newTransactionsCount + trulyNewTransactions.length,
             lastKnownVersion: trulyNewTransactions[0].version
           };
         }),
    }),
    {
      name: 'transactions-storage',
      partialize: (state) => ({
        filters: state.filters,
        isLive: state.isLive,
      }),
    }
  )
);

// Селекторы для оптимизации
export const useTransactionsFilters = () => useTransactionsStore((state) => state.filters);
export const useTransactionsData = () => useTransactionsStore((state) => ({
  transactions: state.transactions,
  totalCount: state.totalCount,
}));
export const useTransactionsLoading = () => useTransactionsStore((state) => state.isLoading);
export const useTransactionsError = () => useTransactionsStore((state) => state.error);
export const useTransactionsLive = () => useTransactionsStore((state) => state.isLive);
