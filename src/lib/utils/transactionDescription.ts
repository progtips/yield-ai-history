/**
 * Utility functions for creating human-readable transaction descriptions
 * Similar to how Aptos Explorer displays transaction information
 */

export interface TokenInfo {
  symbol: string;
  amount: string;
  decimals: number;
}

export interface TransactionDescription {
  action: string;
  description: string;
  tokens?: TokenInfo[];
  protocol?: string;
}

/**
 * Extracts token information from transaction arguments and events
 */
function extractTokenInfo(tx: any): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  
  // Try to extract from events first (most reliable)
  if (tx.events && tx.events.length > 0) {
    for (const event of tx.events) {
      if (event.type.includes('CoinStore') || event.type.includes('Transfer')) {
        const amount = event.data?.amount || event.data?.value || event.data?.coin_amount;
        if (amount) {
          // Try to determine token symbol from event type
          let symbol = 'APT';
          if (event.type.includes('USDT')) symbol = 'USDT';
          else if (event.type.includes('USDC')) symbol = 'USDC';
          else if (event.type.includes('BTC')) symbol = 'BTC';
          else if (event.type.includes('ETH')) symbol = 'ETH';
          
          // Default to 8 decimals for APT, 6 for stablecoins
          const decimals = symbol === 'USDT' || symbol === 'USDC' ? 6 : 8;
          const amountValue = parseFloat(amount) / Math.pow(10, decimals);
          
          tokens.push({
            symbol,
            amount: amountValue.toFixed(2),
            decimals
          });
        }
      }
    }
  }
  
  // If no tokens found in events, try arguments
  if (tokens.length === 0 && tx.payload?.arguments) {
    const args = tx.payload.arguments;
    // Look for amount arguments (usually second or third argument)
    for (let i = 1; i < Math.min(args.length, 4); i++) {
      const arg = args[i];
      if (typeof arg === 'string' && !isNaN(parseFloat(arg)) && parseFloat(arg) > 0) {
        // Try to determine token from function name
        let symbol = 'APT';
        const functionName = tx.payload.function.toLowerCase();
        if (functionName.includes('usdt')) symbol = 'USDT';
        else if (functionName.includes('usdc')) symbol = 'USDC';
        else if (functionName.includes('btc')) symbol = 'BTC';
        else if (functionName.includes('eth')) symbol = 'ETH';
        
        const decimals = symbol === 'USDT' || symbol === 'USDC' ? 6 : 8;
        const amountValue = parseFloat(arg) / Math.pow(10, decimals);
        
        tokens.push({
          symbol,
          amount: amountValue.toFixed(2),
          decimals
        });
      }
    }
  }
  
  return tokens;
}

/**
 * Determines the protocol name from transaction data
 */
function getProtocolFromTransaction(tx: any): string {
  const functionName = tx.payload?.function || '';
  
  // Protocol-specific patterns
  if (functionName.includes('hyperion') || functionName.includes('router_v3')) {
    return 'Hyperion';
  } else if (functionName.includes('echelon') || functionName.includes('scripts::supply')) {
    return 'Echelon';
  } else if (functionName.includes('amnis') || functionName.includes('router::deposit_and_stake')) {
    return 'Amnis';
  } else if (functionName.includes('joule') || functionName.includes('joule::')) {
    return 'Joule';
  } else if (functionName.includes('aries') || functionName.includes('aries::')) {
    return 'Aries';
  } else if (functionName.includes('tapp') || functionName.includes('tapp::')) {
    return 'Tapp';
  } else if (functionName.includes('panora') || functionName.includes('panora_swap')) {
    return 'Panora';
  } else if (functionName.includes('coin::transfer')) {
    return 'Aptos';
  }
  
  // Try to extract from module name
  const parts = functionName.split('::');
  if (parts.length >= 2) {
    const module = parts[1];
    if (module === 'router') return 'DEX';
    if (module === 'stake') return 'Staking';
    if (module === 'liquidity') return 'DEX';
    if (module === 'swap') return 'DEX';
  }
  
  return 'Protocol';
}

/**
 * Creates a human-readable description of a transaction
 */
export function createTransactionDescription(tx: any): TransactionDescription {
  const functionName = tx.payload?.function || '';
  const tokens = extractTokenInfo(tx);
  const protocol = getProtocolFromTransaction(tx);
  
  // Determine action type
  let action = 'Transaction';
  if (functionName.includes('create_liquidity') || functionName.includes('add_liquidity')) {
    action = 'Add Liquidity';
  } else if (functionName.includes('remove_liquidity') || functionName.includes('withdraw_liquidity')) {
    action = 'Remove Liquidity';
  } else if (functionName.includes('swap') || functionName.includes('exchange')) {
    action = 'Swap';
  } else if (functionName.includes('stake') || functionName.includes('delegation')) {
    action = 'Stake';
  } else if (functionName.includes('unstake') || functionName.includes('undelegate')) {
    action = 'Unstake';
  } else if (functionName.includes('deposit')) {
    action = 'Deposit';
  } else if (functionName.includes('withdraw')) {
    action = 'Withdraw';
  } else if (functionName.includes('claim') || functionName.includes('reward')) {
    action = 'Claim';
  } else if (functionName.includes('vote')) {
    action = 'Vote';
  } else if (functionName.includes('transfer')) {
    action = 'Transfer';
  } else if (functionName.includes('mint')) {
    action = 'Mint';
  } else if (functionName.includes('burn')) {
    action = 'Burn';
  }
  
  // Build description
  let description = action;
  
  if (tokens.length === 1) {
    description += ` ${tokens[0].amount} ${tokens[0].symbol}`;
  } else if (tokens.length === 2) {
    description += ` ${tokens[0].amount} ${tokens[0].symbol} and ${tokens[1].amount} ${tokens[1].symbol}`;
  } else if (tokens.length > 2) {
    const tokenList = tokens.map(t => `${t.amount} ${t.symbol}`).join(', ');
    description += ` ${tokenList}`;
  }
  
  if (protocol && protocol !== 'Aptos') {
    description += ` on ${protocol}`;
  }
  
  return {
    action,
    description,
    tokens,
    protocol
  };
}

/**
 * Formats the transaction description for display in the table
 */
export function formatTransactionDescription(tx: any): string {
  try {
    const desc = createTransactionDescription(tx);
    return desc.description;
  } catch (error) {
    console.error('Error formatting transaction description:', error);
    // Fallback to simple function name formatting
    const functionName = tx.payload?.function || 'Unknown';
    return formatFunctionName(functionName);
  }
}

/**
 * Simple function name formatting (fallback)
 */
function formatFunctionName(functionName: string): string {
  if (!functionName) return 'Unknown';
  
  const functionNameLower = functionName.toLowerCase();
  
  if (functionNameLower.includes('create_liquidity') || functionNameLower.includes('add_liquidity')) {
    return 'Add Liquidity';
  } else if (functionNameLower.includes('remove_liquidity')) {
    return 'Remove Liquidity';
  } else if (functionNameLower.includes('swap')) {
    return 'Swap';
  } else if (functionNameLower.includes('stake')) {
    return 'Stake';
  } else if (functionNameLower.includes('deposit')) {
    return 'Deposit';
  } else if (functionNameLower.includes('withdraw')) {
    return 'Withdraw';
  } else if (functionNameLower.includes('claim')) {
    return 'Claim';
  } else if (functionNameLower.includes('vote')) {
    return 'Vote';
  } else if (functionNameLower.includes('transfer')) {
    return 'Transfer';
  }
  
  // Return simplified function name
  const parts = functionName.split('::');
  if (parts.length >= 3) {
    return `${parts[1]}::${parts[2]}`;
  }
  
  return functionName;
} 