/**
 * Utility function to map technical function names to user-friendly action names
 * Used in transaction history and other places where function names are displayed
 */

export const FUNCTION_NAME_MAPPING: { [key: string]: string } = {
  // Amnis Finance
  'router::deposit_and_stake_entry': 'Stake',
  'router::stake_entry': 'Stake',
  'stake::stake': 'Stake',
  'stake::unstake': 'Unstake',
  'stake::claim_rewards': 'Claim Rewards',

  // Echelon
  'scripts::supply_fa': 'Supply',
  'scripts::withdraw_fa': 'Withdraw',
  'scripts::claim_rewards': 'Claim Rewards',

  // Panora
  'panora_swap::router_entry': 'Swap',
  'router_v3::swap_batch': 'Swap',
  'swap::swap': 'Swap',

  // Voting/Governance
  'qf::weighted_batch_vote': 'Vote',
  'governance::vote': 'Vote',
  'voting::submit_vote': 'Vote',

  // Common DeFi actions
  'coin::transfer': 'Transfer',
  'coin::transfer_with_metadata': 'Transfer',
  'liquidity::add_liquidity': 'Add Liquidity',
  'liquidity::remove_liquidity': 'Remove Liquidity',
  'router_adapter::create_liquidity_entry': 'Add Liquidity',
  'router_adapter::remove_liquidity_entry': 'Remove Liquidity',
  'lending::deposit': 'Deposit',
  'lending::withdraw': 'Withdraw',
  'lending::borrow': 'Borrow',
  'lending::repay': 'Repay',
  'yield::claim': 'Claim',
  'rewards::claim': 'Claim Rewards',

  // Staking
  'staking::stake': 'Stake',
  'staking::unstake': 'Unstake',
  'delegation::delegate': 'Delegate',
  'delegation::undelegate': 'Undelegate',

  // DEX operations
  'exchange::swap': 'Swap',
  'dex::swap': 'Swap',
  'amm::swap': 'Swap',
  'pool::swap': 'Swap',

  // Farming
  'farming::deposit': 'Farm',
  'farming::withdraw': 'Unfarm',
  'yield_farming::stake': 'Farm',
  'yield_farming::unstake': 'Unfarm',

  // NFT operations
  'nft::mint': 'Mint NFT',
  'nft::transfer': 'Transfer NFT',
  'nft::list': 'List NFT',
  'nft::buy': 'Buy NFT',

  // Other common patterns
  'claim::claim': 'Claim',
  'withdraw::withdraw': 'Withdraw',
  'deposit::deposit': 'Deposit',
  'mint::mint': 'Mint',
  'burn::burn': 'Burn',
  'approve::approve': 'Approve',
  'revoke::revoke': 'Revoke',

  // Loops Protocol
  'loops::open_loop_aggregate': 'Open Position',
  'loops::close_loop_aggregate': 'Close Position',
};

/**
 * Formats a technical function name to a user-friendly action name
 * @param functionName - The technical function name (e.g., "router::deposit_and_stake_entry")
 * @param showFullPath - Whether to show the full function path if no mapping is found
 * @returns User-friendly action name (e.g., "Stake")
 */
export function formatFunctionName(
  functionName: string,
  showFullPath?: boolean
): string {
  const shouldShowFullPath = showFullPath ?? false;

  if (!functionName || functionName === 'N/A') {
    return 'N/A';
  }

  // Check for exact match first
  if (FUNCTION_NAME_MAPPING[functionName]) {
    return FUNCTION_NAME_MAPPING[functionName];
  }

  // Check for partial matches based on function name patterns
  const functionNameLower = functionName.toLowerCase();

  if (
    functionNameLower.includes('deposit') &&
    functionNameLower.includes('stake')
  ) {
    return 'Stake';
  } else if (functionNameLower.includes('stake')) {
    return 'Stake';
  } else if (functionNameLower.includes('unstake')) {
    return 'Unstake';
  } else if (
    functionNameLower.includes('swap') ||
    functionNameLower.includes('exchange')
  ) {
    return 'Swap';
  } else if (functionNameLower.includes('transfer')) {
    return 'Transfer';
  } else if (functionNameLower.includes('deposit')) {
    return 'Deposit';
  } else if (functionNameLower.includes('withdraw')) {
    return 'Withdraw';
  } else if (
    functionNameLower.includes('claim') ||
    functionNameLower.includes('reward')
  ) {
    return 'Claim';
  } else if (functionNameLower.includes('vote')) {
    return 'Vote';
  } else if (functionNameLower.includes('mint')) {
    return 'Mint';
  } else if (functionNameLower.includes('burn')) {
    return 'Burn';
  } else if (functionNameLower.includes('approve')) {
    return 'Approve';
  } else if (functionNameLower.includes('borrow')) {
    return 'Borrow';
  } else if (functionNameLower.includes('repay')) {
    return 'Repay';
  } else if (functionNameLower.includes('farm')) {
    return 'Farm';
  } else if (functionNameLower.includes('delegate')) {
    return 'Delegate';
  } else if (functionNameLower.includes('undelegate')) {
    return 'Undelegate';
  } else if (
    functionNameLower.includes('create_liquidity') ||
    functionNameLower.includes('add_liquidity')
  ) {
    return 'Add Liquidity';
  } else if (functionNameLower.includes('remove_liquidity')) {
    return 'Remove Liquidity';
  } else if (functionNameLower.includes('supply')) {
    return 'Supply';
  } else if (
    functionNameLower.includes('open_loop') ||
    functionNameLower.includes('open_position')
  ) {
    return 'Open Position';
  } else if (
    functionNameLower.includes('close_loop') ||
    functionNameLower.includes('close_position')
  ) {
    return 'Close Position';
  } else if (
    functionNameLower.includes('loop') ||
    functionNameLower.includes('position')
  ) {
    return 'Position';
  }

  // If no match found, show simplified path like Aptos Explorer
  if (shouldShowFullPath) {
    const parts = functionName.split('::');
    if (parts.length >= 3) {
      const address = parts[0];
      const module = parts[1];
      const funcName = parts[2];

      if (address.startsWith('0x') && address.length > 20) {
        const truncatedAddress = `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
        return `${truncatedAddress}::${module}::${funcName}`;
      }
      return functionName;
    }
  } else {
    const parts = functionName.split('::');
    if (parts.length >= 3) {
      const module = parts[1];
      const funcName = parts[2];
      return `${module}::${funcName}`;
    }
  }

  return functionName;
}

/**
 * Gets the action type from a function name for categorization
 * @param functionName - The technical function name
 * @returns Action type category
 */
export function getActionType(functionName: string): string {
  if (!functionName) return 'other';

  const functionNameLower = functionName.toLowerCase();

  if (
    functionNameLower.includes('stake') ||
    functionNameLower.includes('delegate')
  ) {
    return 'stake';
  } else if (
    functionNameLower.includes('swap') ||
    functionNameLower.includes('exchange')
  ) {
    return 'swap';
  } else if (functionNameLower.includes('transfer')) {
    return 'transfer';
  } else if (functionNameLower.includes('deposit')) {
    return 'deposit';
  } else if (functionNameLower.includes('withdraw')) {
    return 'withdraw';
  } else if (
    functionNameLower.includes('claim') ||
    functionNameLower.includes('reward')
  ) {
    return 'claim';
  } else if (functionNameLower.includes('vote')) {
    return 'vote';
  } else if (functionNameLower.includes('mint')) {
    return 'mint';
  } else if (functionNameLower.includes('farm')) {
    return 'farm';
  } else if (functionNameLower.includes('borrow')) {
    return 'borrow';
  } else if (functionNameLower.includes('repay')) {
    return 'repay';
  } else if (functionNameLower.includes('liquidity')) {
    return 'liquidity';
  } else if (functionNameLower.includes('supply')) {
    return 'supply';
  } else if (
    functionNameLower.includes('loop') ||
    functionNameLower.includes('position')
  ) {
    return 'position';
  }

  return 'other';
}

/**
 * Gets the protocol name from a function name
 * @param functionName - The technical function name
 * @returns Protocol name
 */
export function getProtocolFromFunction(functionName: string): string {
  if (!functionName) return 'Unknown';

  const parts = functionName.split('::');
  if (parts.length >= 2) {
    const module = parts[1];

    // Map common module names to protocol names
    const protocolMapping: { [key: string]: string } = {
      router: 'Amnis',
      router_adapter: 'DEX',
      stake: 'Amnis',
      scripts: 'Echelon',
      panora_swap: 'Panora',
      router_v3: 'Panora',
      swap: 'DEX',
      qf: 'Governance',
      governance: 'Governance',
      voting: 'Governance',
      coin: 'Aptos',
      liquidity: 'DEX',
      lending: 'Lending',
      yield: 'Yield',
      rewards: 'Rewards',
      staking: 'Staking',
      delegation: 'Staking',
      exchange: 'DEX',
      dex: 'DEX',
      amm: 'DEX',
      pool: 'DEX',
      farming: 'Farming',
      yield_farming: 'Farming',
      nft: 'NFT',
      loops: 'Loops',
      claim: 'Rewards',
      withdraw: 'Protocol',
      deposit: 'Protocol',
      mint: 'Protocol',
      burn: 'Protocol',
      approve: 'Protocol',
      revoke: 'Protocol',
    };

    return protocolMapping[module] || module;
  }

  return 'Unknown';
}
