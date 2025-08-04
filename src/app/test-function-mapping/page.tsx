"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFunctionName, getActionType, getProtocolFromFunction } from "@/lib/utils/functionMapping";

export default function TestFunctionMappingPage() {
  // Test cases for function name mapping
  const testCases = [
    // Amnis Finance
    "router::deposit_and_stake_entry",
    "router::stake_entry",
    "stake::stake",
    "stake::unstake",
    "stake::claim_rewards",
    
    // Echelon
    "scripts::supply_fa",
    "scripts::withdraw_fa",
    "scripts::claim_rewards",
    
    // Panora
    "panora_swap::router_entry",
    "router_v3::swap_batch",
    "swap::swap",
    
    // Voting/Governance
    "qf::weighted_batch_vote",
    "governance::vote",
    "voting::submit_vote",
    
    // Common DeFi actions
    "coin::transfer",
    "coin::transfer_with_metadata",
    "liquidity::add_liquidity",
    "liquidity::remove_liquidity",
    "lending::deposit",
    "lending::withdraw",
    "lending::borrow",
    "lending::repay",
    "yield::claim",
    "rewards::claim",
    
    // Staking
    "staking::stake",
    "staking::unstake",
    "delegation::delegate",
    "delegation::undelegate",
    
    // DEX operations
    "exchange::swap",
    "dex::swap",
    "amm::swap",
    "pool::swap",
    
    // Farming
    "farming::deposit",
    "farming::withdraw",
    "yield_farming::stake",
    "yield_farming::unstake",
    
    // NFT operations
    "nft::mint",
    "nft::transfer",
    "nft::list",
    "nft::buy",
    
    // Other common patterns
    "claim::claim",
    "withdraw::withdraw",
    "deposit::deposit",
    "mint::mint",
    "burn::burn",
    "approve::approve",
    "revoke::revoke",
    
    // Unknown functions (should fall back to pattern matching)
    "some_unknown::function_name",
    "custom::deposit_and_stake",
    "my_protocol::swap_tokens",
    "test::claim_rewards"
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Function Name Mapping Test</h1>
        <p className="text-muted-foreground">
          Testing the conversion of technical function names to user-friendly action names
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Function Name Mapping Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testCases.map((functionName, index) => {
              const formattedName = formatFunctionName(functionName);
              const actionType = getActionType(functionName);
              const protocol = getProtocolFromFunction(functionName);
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {functionName}
                    </span>
                    <span className="text-gray-400">→</span>
                    <Badge variant="outline" className="font-semibold">
                      {formattedName}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Type: {actionType}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Protocol: {protocol}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test with Full Path Display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testCases.slice(0, 5).map((functionName, index) => {
              const formattedName = formatFunctionName(functionName, true);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {functionName}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-mono">
                      {formattedName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{testCases.length}</div>
              <div className="text-sm text-muted-foreground">Total Test Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {testCases.filter(fn => formatFunctionName(fn) !== fn).length}
              </div>
              <div className="text-sm text-muted-foreground">Successfully Mapped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {testCases.filter(fn => formatFunctionName(fn) === fn).length}
              </div>
              <div className="text-sm text-muted-foreground">Fallback Cases</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 