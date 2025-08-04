"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Separator } from "@/components/ui/separator";
import { truncateAddress } from "@aptos-labs/wallet-adapter-react";
import { WalletSelector } from "@/components/WalletSelector";
import protocolsList from "@/lib/data/protocolsList.json";
import { formatFunctionName } from "@/lib/utils/functionMapping";

export default function TestHistoryPage() {
  const { account, connected } = useWallet();
  const defaultWalletAddress = account?.address?.toString();
  
  // Add client-side check to prevent hydration errors
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Debug logging
  React.useEffect(() => {
    if (!isClient) return; // Only run on client side
  }, [connected, account, defaultWalletAddress, isClient]);

  // Listen for wallet connection events
  React.useEffect(() => {
    const handleWalletChange = () => {
      // Wallet connection event handling removed
    };

    // Log initial state
    handleWalletChange();

    // This will run whenever connected or account changes
    return () => {
      // Wallet state change handling removed
    };
  }, [connected, account]);
  
  // Mock data for history testing
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [walletAddress, setWalletAddress] = React.useState(defaultWalletAddress || "");
  const [filters, setFilters] = React.useState({
    type: "all",
    dateRange: "7d",
    protocol: "all"
  });
  const [applyFilters, setApplyFilters] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const transactionsPerPage = 20;
  const [showFullFunctionPath, setShowFullFunctionPath] = React.useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = React.useState<any>(null);

  // Function to get protocol name by function path
  const getProtocolNameByFunction = (functionPath: string, recipientAddress: string): string => {
    if (!functionPath || functionPath === 'Unknown') {
      return recipientAddress || 'Unknown';
    }
    
    // Extract the first part of the function path (before the first ::)
    const parts = functionPath.split('::');
    if (parts.length < 2) {
      return recipientAddress || functionPath;
    }
    
    const contractAddress = parts[0];
    
    // Normalize address (remove 0x prefix if present, ensure lowercase)
    const normalizedAddress = contractAddress.toLowerCase().replace(/^0x/, '');
    
    // Find protocol by contract address
    const protocol = protocolsList.find(p => {
      const protocolWithContract = p as any;
      const hasContract = protocolWithContract.contract && typeof protocolWithContract.contract === 'string';
      
      if (!hasContract) {
        return false;
      }
      
      // Normalize contract address
      const normalizedContract = protocolWithContract.contract.toLowerCase().replace(/^0x/, '');
      const matches = normalizedContract === normalizedAddress;
      
      return matches;
    });
    
    if (protocol) {
      return protocol.name;
    }
    
    // If no exact match found, return the original recipient address logic
    if (!recipientAddress || recipientAddress === 'Unknown' || recipientAddress.startsWith('Pool/Validator ID:') || recipientAddress.startsWith('DEX/Pool ID:') || recipientAddress.startsWith('ID:')) {
      return recipientAddress;
    }
    
    // Try to find protocol by recipient address (old logic)
    const normalizedRecipientAddress = recipientAddress.toLowerCase().replace(/^0x/, '');
    
    const protocolByAddress = protocolsList.find(p => {
      const protocolWithContract = p as any;
      const hasContract = protocolWithContract.contract && typeof protocolWithContract.contract === 'string';
      
      if (!hasContract) {
        return false;
      }
      
      // Normalize contract address
      const normalizedContract = protocolWithContract.contract.toLowerCase().replace(/^0x/, '');
      const matches = normalizedContract === normalizedRecipientAddress;
      
      return matches;
    });
    
    if (protocolByAddress) {
      return `${protocolByAddress.name} (${safeTruncateAddress(recipientAddress)})`;
    }
    
    // If no match found at all, return the original recipient address
    return recipientAddress;
  };

  // Log when transactions state changes
  React.useEffect(() => {
    // Transactions state change logging removed
  }, [transactions]);

  // Update wallet address when default changes
  React.useEffect(() => {
    if (defaultWalletAddress && !walletAddress) {
      setWalletAddress(defaultWalletAddress);
    }
  }, [defaultWalletAddress, walletAddress]);

  // Reset page to 1 when wallet address changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [walletAddress]);

  const handleRefreshHistory = () => {
    if (!walletAddress.trim()) {
      setHasError(true);
      setErrorMessage("Please enter a wallet address");
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    
    console.log('=== Starting handleRefreshHistory ===');
    console.log('walletAddress:', walletAddress);
    console.log('applyFilters:', applyFilters);
    console.log('filters:', filters);
    
    // Fetch real transactions from Aptos blockchain
    const fetchRealTransactions = async (address: string) => {
      try {
        // Function to fetch all transactions with pagination
        const fetchAllTransactions = async (address: string) => {
          let allTransactions: any[] = [];
          let start = 0;
          const limit = 1000;
          let hasMore = true;
          let pageCount = 0;
          
          while (hasMore) {
            pageCount++;
            
            const response = await fetch(`https://indexer.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?start=${start}&limit=${limit}&include_events=true&include_payload=true&order=desc`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            allTransactions = allTransactions.concat(data);
            
            // If we got less than the limit, we've reached the end
            if (data.length < limit) {
              hasMore = false;
            } else {
              start += limit;
            }
          }
          
          return allTransactions;
        };
        
        // Also try alternative API endpoint for comparison
        const fetchAlternativeTransactions = async (address: string) => {
          try {
            console.log(`Trying alternative API endpoint for comparison...`);
            const response = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${address}/transactions?start=0&limit=100`);
            
            if (!response.ok) {
              console.log(`Alternative API failed: ${response.status}`);
              return null;
            }
            
            const data = await response.json();
            console.log(`Alternative API returned: ${data.length} transactions`);
            return data;
          } catch (error) {
            console.log(`Alternative API error:`, error);
            return null;
          }
        };
        
        // Fetch ALL transactions from Aptos Indexer API with pagination
        const data = await fetchAllTransactions(address);
        
        // Try alternative API for comparison
        const alternativeData = await fetchAlternativeTransactions(address);
        if (alternativeData) {
          console.log(`Alternative API comparison: Indexer=${data.length}, Fullnode=${alternativeData.length}`);
        }
        
        console.log('Raw API response:', data);
        console.log(`Total transactions received: ${data.length}`);
        console.log('Note: If this count differs from Explorer, it may be due to different data sources or API limitations');
        
        // Information about checking in Aptos Explorer
        console.log('=== Comparison with Aptos Explorer ===');
        console.log(`To verify in Aptos Explorer, visit:`);
        console.log(`https://explorer.aptoslabs.com/account/${address}?network=mainnet`);
        console.log(`Expected: 7 transactions, Actual: ${data.length} transactions`);
        console.log(`Difference: ${7 - data.length} transactions missing`);
        
        // Additional debug: Log transaction types to understand what we're getting
        const transactionTypes = data.reduce((acc: any, tx: any) => {
          const type = tx.payload?.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        console.log('Transaction types breakdown:', transactionTypes);
        
        // Log all transaction versions for comparison with Explorer
        console.log('=== Transaction Versions for Comparison ===');
        console.log('All transaction versions:', data.map((tx: any) => tx.version).sort((a: any, b: any) => parseInt(b) - parseInt(a)));
        console.log('Version range:', {
          lowest: Math.min(...data.map((tx: any) => parseInt(tx.version))),
          highest: Math.max(...data.map((tx: any) => parseInt(tx.version))),
          count: data.length
        });
        
        // Check if we're missing any transactions by looking at version gaps
        if (data.length > 1) {
          const versions = data.map((tx: any) => parseInt(tx.version)).sort((a: any, b: any) => b - a);
          console.log('Sorted versions (descending):', versions);
          
          // Check for large gaps in versions
          for (let i = 0; i < versions.length - 1; i++) {
            const gap = versions[i] - versions[i + 1];
            if (gap > 1) {
              console.log(`⚠️ Large version gap detected: ${versions[i]} -> ${versions[i + 1]} (gap: ${gap})`);
            }
          }
        }
        
        // Debug timestamp format
        if (data.length > 0) {
          console.log('Sample timestamp data:', {
            raw: data[0].timestamp,
            type: typeof data[0].timestamp,
            parsed: new Date(data[0].timestamp),
            isValid: !isNaN(new Date(data[0].timestamp).getTime())
          });
          
          // Debug version information
          console.log('Sample version data:', {
            firstVersion: data[0]?.version,
            lastVersion: data[data.length - 1]?.version,
            versionType: typeof data[0]?.version,
            versionRange: `${data[data.length - 1]?.version} - ${data[0]?.version}`
          });
          
          // Also log a few more samples
          console.log('First 3 timestamps:', data.slice(0, 3).map((tx: any) => ({
            version: tx.version,
            timestamp: tx.timestamp,
            type: typeof tx.timestamp,
            parsed: new Date(tx.timestamp),
            isValid: !isNaN(new Date(tx.timestamp).getTime())
          })));
        }
        
        // Transform API data to our format
        const transformedTransactions = data.map((tx: any, index: number) => {
          // Determine transaction type based on payload and events
          let type = 'transfer';
          let protocol = 'Aptos';
          let amount = '0 APT';
          
          // Check if it's a coin transfer
          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            const moduleName = tx.payload.function.split('::')[0] + '::' + tx.payload.function.split('::')[1];
            
            // Check for specific function patterns
            if (functionName.includes('coin::transfer') || functionName.includes('coin::transfer_with_metadata')) {
              type = 'transfer';
              protocol = 'Aptos';
            } else if (functionName.includes('swap') || functionName.includes('exchange')) {
              type = 'swap';
              protocol = 'DEX';
            } else if (functionName.includes('stake') || functionName.includes('delegation')) {
              type = 'stake';
              protocol = 'Staking';
            } else if (functionName.includes('yield') || functionName.includes('farming')) {
              type = 'yield';
              protocol = 'Yield';
            } else if (functionName.includes('deposit')) {
              type = 'deposit';
              protocol = 'Protocol';
            } else if (functionName.includes('withdraw')) {
              type = 'withdraw';
              protocol = 'Protocol';
            } else if (functionName.includes('claim') || functionName.includes('reward')) {
              type = 'claim';
              protocol = 'Rewards';
            } else {
              // For other functions, use the module name as protocol
              type = 'other';
              protocol = moduleName.split('::')[1] || 'Aptos';
            }
          } else if (tx.payload?.type === 'script_payload') {
            type = 'script';
            protocol = 'Aptos';
          } else if (tx.payload?.type === 'module_bundle_payload') {
            type = 'module';
            protocol = 'Aptos';
          }
          
          // Try to extract amount from events more accurately
          if (tx.events && tx.events.length > 0) {
            const coinEvent = tx.events.find((event: any) => 
              event.type.includes('CoinStore') || 
              event.type.includes('Transfer') ||
              event.type.includes('DepositEvent') ||
              event.type.includes('WithdrawEvent')
            );
            if (coinEvent && coinEvent.data) {
              const amountData = coinEvent.data.amount || coinEvent.data.value || coinEvent.data.coin_amount;
              if (amountData) {
                const aptAmount = parseFloat(amountData) / Math.pow(10, 8);
                amount = `${aptAmount.toFixed(2)} APT`;
              }
            }
          }
          
          // Improved recipient address extraction
          let recipientAddress = 'Unknown';
          
          if (tx.payload?.type === 'entry_function_payload') {
            const functionName = tx.payload.function;
            const args = tx.payload.arguments || [];
            
            // DEBUG: Log the raw arguments array
            console.log(`🔍 DEBUG: Raw arguments for tx ${tx.version} - args:`, args, 'args[0] type:', typeof args[0], 'args[0] value:', args[0]);
            
            // Check if args[0] is an object with 'inner' property first
            if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null && 'inner' in args[0]) {
              console.log(`🔍 DEBUG: args[0] is object with 'inner' property:`, args[0]);
              const innerValue = String(args[0].inner || '');
              console.log(`🔍 DEBUG: Extracted inner value:`, innerValue);
              if (innerValue.startsWith('0x') && innerValue.length > 40) {
                recipientAddress = innerValue;
              } else {
                recipientAddress = `Pool/Validator ID: ${innerValue}`;
              }
            }
            // Extract recipient based on function type
            else if (functionName.includes('coin::transfer') || functionName.includes('coin::transfer_with_metadata')) {
              // For coin transfers, first argument is usually the recipient
              recipientAddress = String(args[0] || 'Unknown');
            } else if (functionName.includes('stake') || functionName.includes('delegation')) {
              // For staking, look for validator address or pool address
              // First try to find from events (more accurate)
              const stakeEvent = tx.events?.find((event: any) => 
                event.type.includes('Stake') || 
                event.type.includes('Delegation') ||
                event.type.includes('Validator')
              );
              
              if (stakeEvent?.data?.validator_address) {
                recipientAddress = String(stakeEvent.data.validator_address);
              } else if (stakeEvent?.data?.pool_address) {
                recipientAddress = String(stakeEvent.data.pool_address);
              } else if (stakeEvent?.data?.to) {
                recipientAddress = String(stakeEvent.data.to);
              } else if (args.length > 0) {
                // If no event data, check if first argument looks like an address
                // Check if args[0] is an object with 'inner' property
                if (typeof args[0] === 'object' && args[0] !== null && 'inner' in args[0]) {
                  const innerValue = String(args[0].inner || '');
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `Pool/Validator ID: ${innerValue}`;
                  }
                } else if (typeof args[0] === 'object' && args[0] !== null && !('inner' in args[0]) && args.length > 1) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(`🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`, args[1]);
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `Pool/Validator ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    // It's likely a pool ID or validator ID, not an address
                    recipientAddress = `Pool/Validator ID: ${firstArg}`;
                  }
                }
              }
            } else if (functionName.includes('deposit')) {
              // For deposits, look for pool address
              const depositEvent = tx.events?.find((event: any) => 
                event.type.includes('Deposit') || 
                event.type.includes('Pool') ||
                event.type.includes('Liquidity')
              );
              
              if (depositEvent?.data?.pool_address) {
                recipientAddress = String(depositEvent.data.pool_address);
              } else if (depositEvent?.data?.to) {
                recipientAddress = String(depositEvent.data.to);
              } else if (args.length > 0) {
                // Check if first argument looks like an address
                // Check if args[0] is an object with 'inner' property
                if (typeof args[0] === 'object' && args[0] !== null && 'inner' in args[0]) {
                  const innerValue = String(args[0].inner || '');
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `Pool ID: ${innerValue}`;
                  }
                } else if (typeof args[0] === 'object' && args[0] !== null && !('inner' in args[0]) && args.length > 1) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(`🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`, args[1]);
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `Pool ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `Pool ID: ${firstArg}`;
                  }
                }
              }
            } else if (functionName.includes('swap') || functionName.includes('exchange')) {
              // For swaps, look for DEX address or pool address
              const swapEvent = tx.events?.find((event: any) => 
                event.type.includes('Swap') || 
                event.type.includes('Exchange') ||
                event.type.includes('Trade')
              );
              
              if (swapEvent?.data?.dex_address) {
                recipientAddress = String(swapEvent.data.dex_address);
              } else if (swapEvent?.data?.pool_address) {
                recipientAddress = String(swapEvent.data.pool_address);
              } else if (swapEvent?.data?.to) {
                recipientAddress = String(swapEvent.data.to);
              } else if (args.length > 0) {
                // DEBUG: Log the raw args[0] before conversion
                console.log(`🔍 DEBUG: Raw args[0] for DEX/Pool ID - type:`, typeof args[0], 'value:', args[0], 'is object:', typeof args[0] === 'object');
                // Check if args[0] is an object with 'inner' property
                if (typeof args[0] === 'object' && args[0] !== null && 'inner' in args[0]) {
                  const innerValue = String(args[0].inner || '');
                  console.log(`🔍 DEBUG: Extracted inner value for DEX/Pool ID:`, innerValue);
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${innerValue}`;
                  }
                } else if (typeof args[0] === 'object' && args[0] !== null && !('inner' in args[0]) && args.length > 1) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(`🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`, args[1]);
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  console.log(`🔍 DEBUG: Converted firstArg for DEX/Pool ID - type:`, typeof firstArg, 'value:', firstArg);
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `DEX/Pool ID: ${firstArg}`;
                  }
                }
              }
            } else {
              // For other functions, try to find recipient from events
              const transferEvent = tx.events?.find((event: any) => 
                event.type.includes('Transfer') || 
                event.type.includes('CoinStore') ||
                event.type.includes('Deposit') ||
                event.type.includes('Withdraw')
              );
              
              if (transferEvent?.data?.to) {
                recipientAddress = String(transferEvent.data.to);
              } else if (transferEvent?.data?.recipient) {
                recipientAddress = String(transferEvent.data.recipient);
              } else if (args.length > 0) {
                // Fallback to first argument
                // DEBUG: Log the raw args[0] before conversion
                console.log(`🔍 DEBUG: Raw args[0] for ID - type:`, typeof args[0], 'value:', args[0], 'is object:', typeof args[0] === 'object');
                // Check if args[0] is an object with 'inner' property
                if (typeof args[0] === 'object' && args[0] !== null && 'inner' in args[0]) {
                  const innerValue = String(args[0].inner || '');
                  console.log(`🔍 DEBUG: Extracted inner value for ID:`, innerValue);
                  if (innerValue.startsWith('0x') && innerValue.length > 40) {
                    recipientAddress = innerValue;
                  } else {
                    recipientAddress = `ID: ${innerValue}`;
                  }
                } else if (typeof args[0] === 'object' && args[0] !== null && !('inner' in args[0]) && args.length > 1) {
                  // Handle case where args[0] is an object without 'inner' property (like { "vec": [] })
                  // and check if args[1] contains the address
                  console.log(`🔍 DEBUG: args[0] is object without 'inner' property, checking args[1]:`, args[1]);
                  const secondArg = String(args[1] || '');
                  if (secondArg.startsWith('0x') && secondArg.length > 40) {
                    recipientAddress = secondArg;
                  } else {
                    recipientAddress = `ID: ${secondArg}`;
                  }
                } else {
                  const firstArg = String(args[0] || '');
                  console.log(`🔍 DEBUG: Converted firstArg for ID - type:`, typeof firstArg, 'value:', firstArg);
                  if (firstArg.startsWith('0x') && firstArg.length > 40) {
                    recipientAddress = firstArg;
                  } else {
                    recipientAddress = `ID: ${firstArg}`;
                  }
                }
              }
            }
          }
          
          // Additional debug logging for recipient extraction
          if (Math.random() < 0.1) { // Log 10% of transactions
            console.log('Recipient extraction debug:', {
              version: tx.version,
              function: tx.payload?.function,
              args: tx.payload?.arguments,
              recipientAddress,
              events: tx.events?.map((e: any) => e.type).slice(0, 3),
              eventData: tx.events?.slice(0, 2).map((e: any) => ({
                type: e.type,
                data: e.data
              }))
            });
          }
          
          // Debug: Log all recipient addresses for protocol matching
          if (recipientAddress !== 'Unknown' && !recipientAddress.startsWith('Pool/Validator ID:') && !recipientAddress.startsWith('DEX/Pool ID:') && !recipientAddress.startsWith('ID:')) {
            console.log(`📋 Transaction ${tx.version}: recipient address = ${recipientAddress}`);
          }
          
          // Debug: log recipientAddress before creating transaction object
          console.log(`🔍 DEBUG: Creating transaction object - recipientAddress type:`, typeof recipientAddress, 'value:', recipientAddress);
          
          // Additional debug: Check if recipientAddress contains [object Object]
          if (recipientAddress.includes('[object Object]')) {
            console.log('⚠️ WARNING: recipientAddress contains [object Object] - this should not happen after the fix');
          }
          
          return {
            id: tx.version || index.toString(),
            type,
            protocol,
            timestamp: tx.timestamp,
            amount,
            status: tx.success ? 'completed' : 'failed',
            hash: tx.hash || `0x${(index * 12345).toString(16).padStart(16, '0')}...`,
            from: String(tx.sender || 'Unknown'),
            to: recipientAddress,
            function: tx.payload?.function || 'N/A',
            _rawData: tx // Store raw API data for debugging
          };
        });
        
        console.log(`Transformed ${transformedTransactions.length} transactions`);
        console.log('Sample transaction data types:', {
          from: typeof transformedTransactions[0]?.from,
          to: typeof transformedTransactions[0]?.to,
          fromValue: transformedTransactions[0]?.from,
          toValue: transformedTransactions[0]?.to
        });
        
        // Additional debug: check all transactions for non-string addresses
        const nonStringAddresses = transformedTransactions.filter((tx: any) => 
          (tx.from && typeof tx.from !== 'string') || 
          (tx.to && typeof tx.to !== 'string')
        );
        if (nonStringAddresses.length > 0) {
          console.warn('Found transactions with non-string addresses:', nonStringAddresses.slice(0, 3));
        }
        
        // Sort transactions by timestamp in descending order (newest first)
        const sortedTransactions = transformedTransactions.sort((a: any, b: any) => {
          // Safe timestamp comparison
          const getTimestamp = (timestamp: any) => {
            if (!timestamp) return 0;
            
            let numTimestamp: number;
            if (typeof timestamp === 'string') {
              numTimestamp = parseFloat(timestamp);
              if (isNaN(numTimestamp)) return 0;
            } else {
              numTimestamp = timestamp;
            }
            
            // Check if it's microseconds (very large number)
            if (numTimestamp > 1000000000000000) {
              // Microseconds - convert to milliseconds
              return numTimestamp / 1000;
            } else if (numTimestamp > 1000000000000) {
              // Likely milliseconds
              return numTimestamp;
            } else {
              // Likely seconds, convert to milliseconds
              return numTimestamp * 1000;
            }
          };
          
          const dateA = getTimestamp(a.timestamp);
          const dateB = getTimestamp(b.timestamp);
          
          // If timestamps are equal, sort by version (higher version = newer)
          if (dateA === dateB) {
            const versionA = parseInt(a.id) || 0;
            const versionB = parseInt(b.id) || 0;
            return versionB - versionA; // Higher version first
          }
          
          return dateB - dateA; // Descending order by timestamp
        });
        
        console.log('Sorted transactions by date (newest first)');
        return sortedTransactions;
        
      } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
    };
    
    // Fetch transactions and apply filters
    fetchRealTransactions(walletAddress)
      .then((realTransactions) => {
        console.log(`Fetched ${realTransactions.length} real transactions`);
        
        // Apply filters if enabled
        let filteredTransactions = [...realTransactions];
        
        if (applyFilters) {
          // Filter by transaction type
          if (filters.type !== "all") {
            filteredTransactions = filteredTransactions.filter(tx => tx.type === filters.type);
          }
          
          // Filter by protocol
          if (filters.protocol !== "all") {
            filteredTransactions = filteredTransactions.filter(tx => tx.protocol === filters.protocol);
          }
          
          // Filter by date range
          const now = Date.now();
          const dateRanges = {
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
            "90d": 90 * 24 * 60 * 60 * 1000,
            "1y": 365 * 24 * 60 * 60 * 1000
          };
          
          if (filters.dateRange !== "all") {
            const rangeMs = dateRanges[filters.dateRange as keyof typeof dateRanges];
            const cutoffTime = now - rangeMs;
            filteredTransactions = filteredTransactions.filter(tx => 
              new Date(tx.timestamp).getTime() > cutoffTime
            );
          }
        }
        
        console.log('Setting transactions:', filteredTransactions.length, 'items');
        console.log('First transaction sample:', filteredTransactions[0]);
        
        setTransactions(filteredTransactions);
        setIsLoading(false);
        
        console.log(`Fetched ${realTransactions.length} real transactions for wallet: ${walletAddress}`);
        console.log(`Found ${filteredTransactions.length} transactions ${applyFilters ? 'after filtering' : '(no filters applied)'}`);
      })
      .catch((error) => {
        console.error('Failed to fetch transactions:', error);
        setHasError(true);
        setErrorMessage(`Failed to fetch transactions: ${error.message}`);
        setIsLoading(false);
      });
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getFilteredTransactions = () => {
    // Filters are now applied when loading data, so just return the current transactions
    return transactions;
  };

  const getPaginatedTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredTransactions = getFilteredTransactions();
    return Math.ceil(filteredTransactions.length / transactionsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Function to get detailed transaction info
  const getDetailedTransactionInfo = (tx: any) => {
    console.log('=== Detailed Transaction Analysis ===');
    console.log('Transaction Version:', tx.id);
    console.log('Function:', tx.payload?.function);
    console.log('Arguments:', tx.payload?.arguments);
    console.log('Events:', tx.events?.map((e: any) => ({
      type: e.type,
      data: e.data
    })));
    console.log('Current recipient:', tx.to);
    console.log('Sender:', tx.from);
    console.log('Amount:', tx.amount);
    console.log('Type:', tx.type);
    console.log('Protocol:', tx.protocol);
    
    // If we have raw data, show it
    if (tx._rawData) {
      console.log('=== Raw API Data ===');
      console.log('Raw transaction:', tx._rawData);
      console.log('Raw payload:', tx._rawData.payload);
      console.log('Raw arguments:', tx._rawData.payload?.arguments);
      console.log('Raw events:', tx._rawData.events);
    }
  };



  // Safe address truncation function
  const safeTruncateAddress = (address: any) => {
    if (!address || typeof address !== 'string') {
      return 'Unknown';
    }
    if (address.length <= 10) {
      return address;
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Safe timestamp formatting function
  const safeFormatTimestamp = (timestamp: any) => {
    if (!timestamp) {
      return 'Unknown';
    }
    
    // Debug logging for first few calls
    if (Math.random() < 0.1) { // Log 10% of calls to avoid spam
      console.log('safeFormatTimestamp input:', {
        timestamp,
        type: typeof timestamp,
        isString: typeof timestamp === 'string',
        isNumber: typeof timestamp === 'number'
      });
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
    
    return date.toLocaleString();
  };

  React.useEffect(() => {
    handleRefreshHistory();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {!isClient ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <>
          {/* Connected Wallet Display */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={connected ? "default" : "destructive"}>
                      {connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  <WalletSelector />
                </div>
                {connected && account?.address && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Address:</span>
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                      {account.ansName || truncateAddress(account.address.toString())}
                    </code>
                  </div>
                )}
                

              </div>
            </CardContent>
          </Card>

          {/* Debug Section */}
          <Card>
            <CardHeader>
              <CardTitle>Отладка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setWalletAddress("0x56ff2fc971deecd286314fe99b8ffd6a5e72e62eacdc46ae9b234c5282985f97")}
                  >
                    Кошелек Садкова
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setWalletAddress("0x03f422163a5a64b50c9cae35afe64a78e7cc0dc9b0f47c5104cfd96847ba0e2b")}
                  >
                    Кошелек Рыбакова
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History Test - Transaction History Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span>Wallet Address:</span>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter wallet address"
                    className="flex-1 px-3 py-1 border rounded bg-white"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <span>Loading State:</span>
                  <Badge variant={isLoading ? "destructive" : "default"}>
                    {isLoading ? "Loading..." : "Ready"}
                  </Badge>
                </div>
                
                {hasError && (
                  <div className="text-sm text-red-600">
                    Error: {errorMessage}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleRefreshHistory} disabled={isLoading}>
                    Refresh History
                  </Button>
                  
                  {/* Button to open in Aptos Explorer */}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const explorerUrl = `https://explorer.aptoslabs.com/account/${walletAddress}?network=mainnet`;
                      window.open(explorerUrl, '_blank');
                    }}
                    disabled={!walletAddress.trim()}
                  >
                    Open in Aptos Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyFilters"
                    checked={applyFilters}
                    onChange={(e) => setApplyFilters(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="applyFilters" className="text-sm font-medium">
                    Apply Filters
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showFullFunctionPath"
                    checked={showFullFunctionPath}
                    onChange={(e) => setShowFullFunctionPath(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="showFullFunctionPath" className="text-sm font-medium">
                    Show Full Function Path
                  </label>
                </div>
                
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!applyFilters ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <label className="text-sm font-medium">Transaction Type</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={filters.type}
                      onChange={(e) => handleFilterChange("type", e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value="all">All Types</option>
                      <option value="transfer">Transfer</option>
                      <option value="swap">Swap</option>
                      <option value="stake">Stake</option>
                      <option value="yield">Yield</option>
                      <option value="deposit">Deposit</option>
                      <option value="withdraw">Withdraw</option>
                      <option value="claim">Claim</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="1y">Last year</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Protocol</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={filters.protocol}
                      onChange={(e) => handleFilterChange("protocol", e.target.value)}
                      disabled={!applyFilters}
                    >
                      <option value="all">All Protocols</option>
                      <option value="Aptos">Aptos</option>
                      <option value="DEX">DEX</option>
                      <option value="Staking">Staking</option>
                      <option value="Yield">Yield</option>
                      <option value="Protocol">Protocol</option>
                      <option value="Rewards">Rewards</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Total Transactions: {getFilteredTransactions().length} (Showing {getPaginatedTransactions().length} on page {currentPage} of {getTotalPages()})
                  </div>
                  {isLoading && (
                    <div className="text-sm text-blue-600">
                      Loading transactions for: {walletAddress}
                    </div>
                  )}
                </div>
                

                
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">Loading transactions...</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Version</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Timestamp</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Sender</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Protocol</th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">Function</th>

                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedTransactions().map((tx) => (
                          <tr key={`${tx.id}-${walletAddress}`} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              <a
                                href={`/test-transaction/${tx.id}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                {tx.id}
                              </a>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              <Badge variant="outline" className="capitalize">
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              {safeFormatTimestamp(tx.timestamp)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {tx.amount}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {safeTruncateAddress(tx.from)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {getProtocolNameByFunction(tx.function, tx.to)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                              {formatFunctionName(tx.function, showFullFunctionPath)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {getPaginatedTransactions().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <Card>
            <CardHeader>
              <CardTitle>Pagination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
                <span>Page {currentPage} of {getTotalPages()}</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === getTotalPages()}>Next                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{transactions.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "transfer").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Transfers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "swap").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Swaps</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "stake").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Stakes</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "deposit").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Deposits</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "withdraw").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Withdrawals</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "claim").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Claims</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {transactions.filter(tx => tx.type === "yield").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Yield</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    console.log('=== History Test Debug Info ===');
                    console.log('Transactions:', transactions);
                    console.log('Filters:', filters);
                    console.log('Filtered Transactions:', getFilteredTransactions());
                    console.log('Loading State:', isLoading);
                    console.log('Error State:', { hasError, errorMessage });
                  }}
                  variant="outline"
                >
                  Log Debug Info to Console
                </Button>
                
                <Button 
                  onClick={() => {
                    console.log('=== Protocol Mapping Test ===');
                    console.log('Protocols List:', protocolsList);
                    
                    // Log all protocol addresses
                    console.log('=== All Protocol Addresses ===');
                    protocolsList.forEach((protocol: any) => {
                      if (protocol.contract) {
                        console.log(`${protocol.name}: ${protocol.contract}`);
                      } else {
                        console.log(`${protocol.name}: NO CONTRACT ADDRESS`);
                      }
                    });
                    
                    // Test some known addresses
                    const testAddresses = [
                      '0xc0c240c870606a5cb3150795e2d0dfff9f1f7456', // Hyperion
                      '0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6', // Joule
                      '0xc6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba', // Echelon
                      '0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a', // Unknown
                      'Pool/Validator ID: 74090850', // Pool ID
                    ];
                    
                    console.log('=== Testing Addresses ===');
                    testAddresses.forEach(address => {
                      const result = getProtocolNameByFunction(address, address);
                      console.log(`${address} -> ${result}`);
                    });
                  }}
                  variant="outline"
                >
                  Test Protocol Mapping
                </Button>
                
                <Button 
                  onClick={() => {
                    console.log('=== Analyzing Transactions with [object Object] ===');
                    const problematicTxs = transactions.filter(tx => 
                      tx.to && tx.to.includes('[object Object]')
                    );
                    
                    console.log(`Found ${problematicTxs.length} transactions with [object Object]:`, problematicTxs);
                    
                    if (problematicTxs.length > 0) {
                      console.log('=== Detailed Analysis of First Problematic Transaction ===');
                      getDetailedTransactionInfo(problematicTxs[0]);
                    }
                  }}
                  variant="outline"
                >
                  Analyze [object Object] Transactions
                </Button>
                
                <Button 
                  onClick={() => {
                    console.log('=== Raw API Data Analysis ===');
                    console.log('Current transactions state:', transactions);
                    
                    // Find transactions that might have raw API data
                    const txsWithRawData = transactions.filter(tx => 
                      tx._rawData || tx.originalData
                    );
                    
                    console.log(`Found ${txsWithRawData.length} transactions with raw data:`, txsWithRawData);
                    
                    if (txsWithRawData.length > 0) {
                      console.log('=== Raw API Data for First Transaction ===');
                      console.log('Raw data:', txsWithRawData[0]._rawData || txsWithRawData[0].originalData);
                    }
                  }}
                  variant="outline"
                >
                  Analyze Raw API Data
                </Button>
                
                <Button 
                  onClick={() => {
                    // Find the first transaction with [object Object] and analyze it
                    const problematicTx = transactions.find(tx => 
                      tx.to && tx.to.includes('[object Object]')
                    );
                    
                    if (problematicTx) {
                      console.log('=== Analyzing Specific Problematic Transaction ===');
                      console.log('Transaction ID:', problematicTx.id);
                      console.log('Current "to" value:', problematicTx.to);
                      getDetailedTransactionInfo(problematicTx);
                    } else {
                      console.log('No transactions with [object Object] found');
                    }
                  }}
                  variant="outline"
                >
                  Analyze First [object Object] Transaction
                </Button>
                
                <Button 
                  onClick={() => {
                    console.clear();
                    console.log('=== Console cleared ===');
                    console.log('Ready for new debugging session');
                  }}
                  variant="outline"
                >
                  Clear Console
                </Button>
                
                <Button 
                  onClick={() => {
                    console.log('=== Testing Specific Addresses from Logs ===');
                    
                    // Test the specific addresses we saw in the logs
                    const testAddresses = [
                      '0xd3894aca06d5f42b27c89e6f448114b3ed6a1ba07f992a58b2126c71dd83c127',
                      'Pool/Validator ID: 74090850',
                      'ID: 8',
                      'DEX/Pool ID: [object Object]',
                      'ID: [object Object]'
                    ];
                    
                    testAddresses.forEach(address => {
                      const result = getProtocolNameByFunction(address, address);
                      console.log(`Testing: "${address}" -> "${result}"`);
                    });
                  }}
                  variant="outline"
                >
                  Test Addresses from Logs
                </Button>
                
                <Button 
                  onClick={() => {
                    // Find the first problematic transaction
                    const problematicTx = transactions.find(tx => 
                      tx.to && tx.to.includes('[object Object]')
                    );
                    
                    if (problematicTx && problematicTx._rawData) {
                      console.log('=== Detailed Raw Data Analysis ===');
                      
                      const rawData = problematicTx._rawData;
                      const analysis = {
                        transactionId: problematicTx.id,
                        currentToValue: problematicTx.to,
                        rawPayload: rawData.payload,
                        rawArguments: rawData.payload?.arguments,
                        rawEvents: rawData.events,
                        argumentsAnalysis: {
                          length: rawData.payload?.arguments?.length || 0,
                          types: rawData.payload?.arguments?.map((arg: any, index: number) => ({
                            index,
                            type: typeof arg,
                            value: arg,
                            isObject: typeof arg === 'object',
                            stringified: String(arg)
                          })) || []
                        },
                        eventsAnalysis: {
                          length: rawData.events?.length || 0,
                          types: rawData.events?.map((event: any, index: number) => ({
                            index,
                            type: event.type,
                            data: event.data
                          })) || []
                        }
                      };
                      
                      console.log('Detailed Analysis:', analysis);
                      setDetailedAnalysis(analysis);
                    } else {
                      console.log('No problematic transaction with raw data found');
                      setDetailedAnalysis(null);
                    }
                  }}
                  variant="outline"
                >
                  Expand Raw Arguments & Events
                </Button>
              </div>
              
              {/* Detailed Analysis Results */}
              {detailedAnalysis && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Детальный анализ сырых данных</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Информация о транзакции</h4>
                      <p className="text-sm text-gray-600">ID: {detailedAnalysis.transactionId}</p>
                      <p className="text-sm text-gray-600">Текущее значение "to": {detailedAnalysis.currentToValue}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">Анализ аргументов ({detailedAnalysis.argumentsAnalysis.length})</h4>
                      <div className="space-y-2">
                        {detailedAnalysis.argumentsAnalysis.types.map((arg: any, index: number) => (
                          <div key={index} className="p-2 bg-white rounded border">
                            <p className="text-sm font-medium">Аргумент {arg.index}:</p>
                            <p className="text-xs text-gray-600">Тип: {arg.type}</p>
                            <p className="text-xs text-gray-600">Значение: {JSON.stringify(arg.value, null, 2)}</p>
                            <p className="text-xs text-gray-600">Строковое представление: "{arg.stringified}"</p>
                            {arg.isObject && (
                              <p className="text-xs text-red-600 font-medium">⚠️ Это объект!</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">Анализ событий ({detailedAnalysis.eventsAnalysis.length})</h4>
                      <div className="space-y-2">
                        {detailedAnalysis.eventsAnalysis.types.map((event: any, index: number) => (
                          <div key={index} className="p-2 bg-white rounded border">
                            <p className="text-sm font-medium">Событие {event.index}:</p>
                            <p className="text-xs text-gray-600">Тип: {event.type}</p>
                            <p className="text-xs text-gray-600">Данные: {JSON.stringify(event.data, null, 2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">Полные сырые данные</h4>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          Развернуть полные данные
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify({
                            payload: detailedAnalysis.rawPayload,
                            arguments: detailedAnalysis.rawArguments,
                            events: detailedAnalysis.rawEvents
                          }, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 