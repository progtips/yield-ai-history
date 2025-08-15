"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkSwitch } from "@/components/explorer/NetworkSwitch";
import { GlobalSearch } from "@/components/explorer/GlobalSearch";
import { useExplorerStore } from "@/stores/explorer";
import { TransactionsTab } from "@/components/explorer/TransactionsTab";
import { AccountsTab } from "@/components/explorer/AccountsTab";
import { TokensTab } from "@/components/explorer/TokensTab";
import { BlocksTab } from "@/components/explorer/BlocksTab";

export default function ExplorerPage() {
  const { filters, setFilters } = useExplorerStore();

  const handleTabChange = (value: string) => {
    setFilters({ selectedTab: value as any });
  };

  return (
    <div className="space-y-6">
      {/* Верхняя панель с поиском и сетью */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <GlobalSearch />
        <NetworkSwitch />
      </div>

      {/* Основные табы */}
      <Tabs value={filters.selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsTab />
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <AccountsTab />
        </TabsContent>

        <TabsContent value="tokens" className="mt-6">
          <TokensTab />
        </TabsContent>

        <TabsContent value="blocks" className="mt-6">
          <BlocksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
