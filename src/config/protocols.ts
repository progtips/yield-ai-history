// Типы протоколов и операций
export type ProtocolType =
  | 'amnis'
  | 'auro'
  | 'echelon'
  | 'hyperion'
  | 'joule'
  | 'tapp'
  | 'aries'
  | 'meso'
  | 'panora'
  | 'aptos'
  | 'unknown';

export type OperationType =
  | 'deposit'
  | 'withdraw'
  | 'swap'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'borrow'
  | 'repay'
  | 'liquidate'
  | 'transfer'
  | 'mint'
  | 'burn'
  | 'create_pool'
  | 'add_liquidity'
  | 'remove_liquidity'
  | 'vote'
  | 'propose'
  | 'execute'
  | 'unknown';

// Интерфейс для протокола
export interface Protocol {
  name: string;
  type: ProtocolType;
  address: string;
  modules: string[];
  displayName: string;
  color: string;
  description?: string;
}

// Интерфейс для операции
export interface Operation {
  type: OperationType;
  displayName: string;
  description?: string;
  color: string;
}

// Маппинг протоколов
export const PROTOCOLS: Record<ProtocolType, Protocol> = {
  amnis: {
    name: 'amnis',
    type: 'amnis',
    address:
      '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::amnis',
      '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::stake',
      '0x111ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::rewards',
    ],
    displayName: 'Amnis',
    color: 'bg-blue-500',
    description: 'Liquid staking protocol',
  },
  auro: {
    name: 'auro',
    type: 'auro',
    address:
      '0x222ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x222ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::auro',
      '0x222ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::staking',
      '0x222ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::rewards',
    ],
    displayName: 'Auro',
    color: 'bg-purple-500',
    description: 'Staking and rewards protocol',
  },
  echelon: {
    name: 'echelon',
    type: 'echelon',
    address:
      '0x333ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x333ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::echelon',
      '0x333ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::lending',
      '0x333ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::borrowing',
      '0x333ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::rewards',
    ],
    displayName: 'Echelon',
    color: 'bg-green-500',
    description: 'Lending and borrowing protocol',
  },
  hyperion: {
    name: 'hyperion',
    type: 'hyperion',
    address:
      '0x444ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x444ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::hyperion',
      '0x444ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::swap',
      '0x444ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::liquidity',
    ],
    displayName: 'Hyperion',
    color: 'bg-orange-500',
    description: 'DEX and liquidity protocol',
  },
  joule: {
    name: 'joule',
    type: 'joule',
    address:
      '0x555ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x555ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::joule',
      '0x555ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::energy',
      '0x555ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::rewards',
    ],
    displayName: 'Joule',
    color: 'bg-yellow-500',
    description: 'Energy and rewards protocol',
  },
  tapp: {
    name: 'tapp',
    type: 'tapp',
    address:
      '0x666ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x666ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::tapp',
      '0x666ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::staking',
      '0x666ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::governance',
    ],
    displayName: 'Tapp',
    color: 'bg-red-500',
    description: 'Staking and governance protocol',
  },
  aries: {
    name: 'aries',
    type: 'aries',
    address:
      '0x777ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x777ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::aries',
      '0x777ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::lending',
    ],
    displayName: 'Aries',
    color: 'bg-indigo-500',
    description: 'Lending protocol',
  },
  meso: {
    name: 'meso',
    type: 'meso',
    address:
      '0x888ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x888ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::meso',
      '0x888ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::swap',
    ],
    displayName: 'Meso',
    color: 'bg-pink-500',
    description: 'Swap protocol',
  },
  panora: {
    name: 'panora',
    type: 'panora',
    address:
      '0x999ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b',
    modules: [
      '0x999ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::panora',
      '0x999ae3e5bc36a301611d2b0109d4e6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b::swap',
    ],
    displayName: 'Panora',
    color: 'bg-teal-500',
    description: 'Cross-chain swap protocol',
  },
  aptos: {
    name: 'aptos',
    type: 'aptos',
    address: '0x1',
    modules: [
      '0x1::coin',
      '0x1::account',
      '0x1::timestamp',
      '0x1::block',
      '0x1::transaction',
      '0x1::signer',
      '0x1::vector',
      '0x1::option',
      '0x1::event',
    ],
    displayName: 'Aptos',
    color: 'bg-gray-500',
    description: 'Aptos core modules',
  },
  unknown: {
    name: 'unknown',
    type: 'unknown',
    address: '',
    modules: [],
    displayName: 'Unknown',
    color: 'bg-gray-400',
    description: 'Unknown protocol',
  },
};

// Маппинг операций
export const OPERATIONS: Record<OperationType, Operation> = {
  deposit: {
    type: 'deposit',
    displayName: 'Deposit',
    description: 'Deposit assets',
    color: 'bg-green-500',
  },
  withdraw: {
    type: 'withdraw',
    displayName: 'Withdraw',
    description: 'Withdraw assets',
    color: 'bg-red-500',
  },
  swap: {
    type: 'swap',
    displayName: 'Swap',
    description: 'Token swap',
    color: 'bg-blue-500',
  },
  stake: {
    type: 'stake',
    displayName: 'Stake',
    description: 'Stake tokens',
    color: 'bg-purple-500',
  },
  unstake: {
    type: 'unstake',
    displayName: 'Unstake',
    description: 'Unstake tokens',
    color: 'bg-orange-500',
  },
  claim: {
    type: 'claim',
    displayName: 'Claim',
    description: 'Claim rewards',
    color: 'bg-yellow-500',
  },
  borrow: {
    type: 'borrow',
    displayName: 'Borrow',
    description: 'Borrow assets',
    color: 'bg-indigo-500',
  },
  repay: {
    type: 'repay',
    displayName: 'Repay',
    description: 'Repay borrowed assets',
    color: 'bg-pink-500',
  },
  liquidate: {
    type: 'liquidate',
    displayName: 'Liquidate',
    description: 'Liquidate position',
    color: 'bg-red-600',
  },
  transfer: {
    type: 'transfer',
    displayName: 'Transfer',
    description: 'Transfer tokens',
    color: 'bg-gray-500',
  },
  mint: {
    type: 'mint',
    displayName: 'Mint',
    description: 'Mint tokens',
    color: 'bg-green-600',
  },
  burn: {
    type: 'burn',
    displayName: 'Burn',
    description: 'Burn tokens',
    color: 'bg-red-700',
  },
  create_pool: {
    type: 'create_pool',
    displayName: 'Create Pool',
    description: 'Create liquidity pool',
    color: 'bg-blue-600',
  },
  add_liquidity: {
    type: 'add_liquidity',
    displayName: 'Add Liquidity',
    description: 'Add liquidity to pool',
    color: 'bg-green-700',
  },
  remove_liquidity: {
    type: 'remove_liquidity',
    displayName: 'Remove Liquidity',
    description: 'Remove liquidity from pool',
    color: 'bg-red-800',
  },
  vote: {
    type: 'vote',
    displayName: 'Vote',
    description: 'Governance vote',
    color: 'bg-purple-600',
  },
  propose: {
    type: 'propose',
    displayName: 'Propose',
    description: 'Governance proposal',
    color: 'bg-indigo-600',
  },
  execute: {
    type: 'execute',
    displayName: 'Execute',
    description: 'Execute transaction',
    color: 'bg-teal-600',
  },
  unknown: {
    type: 'unknown',
    displayName: 'Unknown',
    description: 'Unknown operation',
    color: 'bg-gray-400',
  },
};

// Функции-детекторы

// Определение протокола по модулю
export const detectProtocolByModule = (moduleId: string): ProtocolType => {
  const normalizedModule = moduleId.toLowerCase();

  for (const [protocolType, protocol] of Object.entries(PROTOCOLS)) {
    if (
      protocol.modules.some(module =>
        normalizedModule.includes(module.toLowerCase().replace('0x', ''))
      )
    ) {
      return protocolType as ProtocolType;
    }
  }

  return 'unknown';
};

// Определение протокола по адресу
export const detectProtocolByAddress = (address: string): ProtocolType => {
  const normalizedAddress = address.toLowerCase();

  for (const [protocolType, protocol] of Object.entries(PROTOCOLS)) {
    if (normalizedAddress === protocol.address.toLowerCase()) {
      return protocolType as ProtocolType;
    }
  }

  return 'unknown';
};

// Определение типа операции по payload
export const detectOperationByPayload = (payload: any): OperationType => {
  if (!payload || !payload.function) {
    return 'unknown';
  }

  const functionName = payload.function.toLowerCase();

  // Маппинг функций на операции
  const functionToOperation: Record<string, OperationType> = {
    deposit: 'deposit',
    withdraw: 'withdraw',
    swap: 'swap',
    stake: 'stake',
    unstake: 'unstake',
    claim: 'claim',
    borrow: 'borrow',
    repay: 'repay',
    liquidate: 'liquidate',
    transfer: 'transfer',
    mint: 'mint',
    burn: 'burn',
    create_pool: 'create_pool',
    add_liquidity: 'add_liquidity',
    remove_liquidity: 'remove_liquidity',
    vote: 'vote',
    propose: 'propose',
    execute: 'execute',
  };

  // Проверяем точные совпадения
  for (const [func, operation] of Object.entries(functionToOperation)) {
    if (functionName.includes(func)) {
      return operation;
    }
  }

  // Проверяем паттерны
  if (functionName.includes('stake') || functionName.includes('delegate')) {
    return 'stake';
  }

  if (functionName.includes('unstake') || functionName.includes('undelegate')) {
    return 'unstake';
  }

  if (functionName.includes('swap') || functionName.includes('exchange')) {
    return 'swap';
  }

  if (functionName.includes('deposit') || functionName.includes('supply')) {
    return 'deposit';
  }

  if (functionName.includes('withdraw') || functionName.includes('redeem')) {
    return 'withdraw';
  }

  if (functionName.includes('borrow') || functionName.includes('loan')) {
    return 'borrow';
  }

  if (functionName.includes('repay') || functionName.includes('payback')) {
    return 'repay';
  }

  if (functionName.includes('claim') || functionName.includes('reward')) {
    return 'claim';
  }

  if (
    functionName.includes('liquidate') ||
    functionName.includes('liquidation')
  ) {
    return 'liquidate';
  }

  if (functionName.includes('transfer') || functionName.includes('send')) {
    return 'transfer';
  }

  if (functionName.includes('mint') || functionName.includes('create')) {
    return 'mint';
  }

  if (functionName.includes('burn') || functionName.includes('destroy')) {
    return 'burn';
  }

  if (functionName.includes('vote') || functionName.includes('ballot')) {
    return 'vote';
  }

  if (functionName.includes('propose') || functionName.includes('proposal')) {
    return 'propose';
  }

  if (functionName.includes('execute') || functionName.includes('run')) {
    return 'execute';
  }

  return 'unknown';
};

// Получение протокола по модулю
export const getProtocolByModule = (moduleId: string): Protocol => {
  const protocolType = detectProtocolByModule(moduleId);
  return PROTOCOLS[protocolType];
};

// Получение протокола по адресу
export const getProtocolByAddress = (address: string): Protocol => {
  const protocolType = detectProtocolByAddress(address);
  return PROTOCOLS[protocolType];
};

// Получение операции по payload
export const getOperationByPayload = (payload: any): Operation => {
  const operationType = detectOperationByPayload(payload);
  return OPERATIONS[operationType];
};

// Получение всех протоколов
export const getAllProtocols = (): Protocol[] => {
  return Object.values(PROTOCOLS).filter(
    protocol => protocol.type !== 'unknown'
  );
};

// Получение всех операций
export const getAllOperations = (): Operation[] => {
  return Object.values(OPERATIONS).filter(
    operation => operation.type !== 'unknown'
  );
};

// Утилиты для работы с протоколами и операциями

// Проверка, является ли адрес протоколом
export const isProtocolAddress = (address: string): boolean => {
  return detectProtocolByAddress(address) !== 'unknown';
};

// Проверка, является ли модуль протоколом
export const isProtocolModule = (moduleId: string): boolean => {
  return detectProtocolByModule(moduleId) !== 'unknown';
};

// Получение цвета для протокола
export const getProtocolColor = (protocolType: ProtocolType): string => {
  return PROTOCOLS[protocolType]?.color || PROTOCOLS.unknown.color;
};

// Получение цвета для операции
export const getOperationColor = (operationType: OperationType): string => {
  return OPERATIONS[operationType]?.color || OPERATIONS.unknown.color;
};
