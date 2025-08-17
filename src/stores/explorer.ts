import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Network = 'mainnet' | 'testnet' | 'devnet';

export interface ExplorerFilters {
  searchQuery: string;
  selectedTab: 'transactions' | 'accounts' | 'tokens' | 'blocks';
  limit: number;
  offset: number;
  sortBy: 'timestamp' | 'version' | 'gas_used';
  sortOrder: 'asc' | 'desc';
  showSuccessful: boolean;
  showFailed: boolean;
  minGasUsed?: number;
  maxGasUsed?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface ExplorerState {
  // Сетевая конфигурация
  network: Network;
  setNetwork: (network: Network) => void;

  // Фильтры
  filters: ExplorerFilters;
  setFilters: (filters: Partial<ExplorerFilters>) => void;
  resetFilters: () => void;

  // Состояние загрузки
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Ошибки
  error: string | null;
  setError: (error: string | null) => void;

  // Кэш
  cache: Record<string, any>;
  setCache: (key: string, value: any) => void;
  getCache: (key: string) => any;
  clearCache: () => void;
}

const defaultFilters: ExplorerFilters = {
  searchQuery: '',
  selectedTab: 'transactions',
  limit: 20,
  offset: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc',
  showSuccessful: true,
  showFailed: true,
};

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
      // Сетевая конфигурация
      network: 'mainnet',
      setNetwork: network => set({ network }),

      // Фильтры
      filters: defaultFilters,
      setFilters: newFilters =>
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Состояние загрузки
      isLoading: false,
      setIsLoading: loading => set({ isLoading: loading }),

      // Ошибки
      error: null,
      setError: error => set({ error }),

      // Кэш
      cache: {},
      setCache: (key, value) =>
        set(state => ({
          cache: { ...state.cache, [key]: { value, timestamp: Date.now() } },
        })),
      getCache: key => {
        const cached = get().cache[key];
        if (!cached) return null;

        // Кэш действителен 5 минут
        if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
          set(state => {
            const newCache = { ...state.cache };
            delete newCache[key];
            return { cache: newCache };
          });
          return null;
        }

        return cached.value;
      },
      clearCache: () => set({ cache: {} }),
    }),
    {
      name: 'explorer-storage',
      partialize: state => ({
        network: state.network,
        filters: state.filters,
      }),
    }
  )
);

// Селекторы для оптимизации
export const useExplorerNetwork = () =>
  useExplorerStore(state => state.network);
export const useExplorerFilters = () =>
  useExplorerStore(state => state.filters);
export const useExplorerLoading = () =>
  useExplorerStore(state => state.isLoading);
export const useExplorerError = () => useExplorerStore(state => state.error);
