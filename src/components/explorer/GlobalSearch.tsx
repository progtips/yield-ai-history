"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExplorerStore } from "@/stores/explorer";
import { Search, Hash, User, Coins, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export function GlobalSearch() {
  const { filters, setFilters } = useExplorerStore();
  const [localQuery, setLocalQuery] = useState(filters.searchQuery);
  
  // Дебаунс для поиска
  const debouncedSearch = useDebounce(localQuery, 500);

  const handleSearch = useCallback((query: string) => {
    setFilters({ 
      searchQuery: query,
      offset: 0 // Сбрасываем пагинацию при новом поиске
    });
  }, [setFilters]);

  const clearSearch = () => {
    setLocalQuery('');
    handleSearch('');
  };

  // Обновляем поиск при изменении дебаунсированного значения
  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch, handleSearch]);

  const getSearchIcon = () => {
    const query = localQuery.toLowerCase();
    if (query.startsWith('0x') && query.length === 66) return <Hash className="h-4 w-4" />;
    if (query.startsWith('0x') && query.length === 64) return <Hash className="h-4 w-4" />;
    if (query.includes('::')) return <Coins className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  const getPlaceholder = () => {
    const query = localQuery.toLowerCase();
    if (query.startsWith('0x') && query.length === 66) return 'Transaction hash detected...';
    if (query.startsWith('0x') && query.length === 64) return 'Account address detected...';
    if (query.includes('::')) return 'Token address detected...';
    return 'Search transactions, accounts, or tokens...';
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {getSearchIcon()}
        </div>
        
        <Input
          type="text"
          placeholder={getPlaceholder()}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Подсказки по поиску */}
      {!localQuery && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Transaction hash (0x...)
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Account address (0x...)
            </span>
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              Token (module::name)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
