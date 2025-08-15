"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExplorerStore } from "@/stores/explorer";
import { Clock, Hash, User, GasPump } from "lucide-react";

export function TransactionsTab() {
  const { network, filters } = useExplorerStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Latest Transactions</h2>
        <Badge variant="outline">{network}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Transaction List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Transaction data will be loaded here</p>
            <p className="text-sm">Search query: {filters.searchQuery || 'None'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
