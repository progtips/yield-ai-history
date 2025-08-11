import tokenList from '@/lib/data/tokenList.json';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'claim' | 'yield' | 'swap' | 'transfer' | 'other';
  protocol: string;
  timestamp: string | number;
  amount: string;
  status: 'completed' | 'failed';
  hash: string;
  from: string;
  to: string;
  function: string;
  _rawData?: any;
}

export interface ProfitCalculation {
  totalDeposits: number;
  totalWithdrawals: number;
  totalClaims: number;
  totalSwaps: number;
  totalTransfers: number;
  profit: number;
  profitPercentage: number;
  transactionCount: number;
  averageTransactionValue: number;
  firstTransactionDate: string;
  lastTransactionDate: string;
  activeDays: number;
  roi: number; // Return on Investment
  apy: number; // Annual Percentage Yield (calculated)
}

export interface ProtocolProfitSummary {
  protocolName: string;
  profitData: ProfitCalculation;
  transactions: Transaction[];
  isPositive: boolean;
  isProfitable: boolean;
}

/**
 * Улучшенная функция расчета прибыли/убытка по протоколу
 */
export function calculateProtocolProfit(
  protocolName: string, 
  transactions: Transaction[]
): ProfitCalculation | null {
  if (!protocolName || protocolName === "all" || !transactions || transactions.length === 0) {
    return null;
  }

  // Фильтруем транзакции по протоколу
  const protocolTransactions = transactions.filter(tx => {
    const txProtocol = getProtocolNameByFunction(tx.function, tx.to);
    return txProtocol === protocolName;
  });

  if (protocolTransactions.length === 0) {
    return null;
  }

  // Сортируем транзакции по времени
  const sortedTransactions = protocolTransactions.sort((a, b) => {
    const timeA = typeof a.timestamp === 'string' ? parseFloat(a.timestamp) : a.timestamp;
    const timeB = typeof b.timestamp === 'string' ? parseFloat(b.timestamp) : b.timestamp;
    return timeA - timeB;
  });

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalClaims = 0;
  let totalSwaps = 0;
  let totalTransfers = 0;

  // Обрабатываем каждую транзакцию
  sortedTransactions.forEach(tx => {
    if (tx.status !== 'completed') return; // Пропускаем неуспешные транзакции

    // Используем улучшенную логику извлечения суммы
    const { amount, token } = extractTransactionAmount(tx._rawData || tx, tx.from);
    
    switch (tx.type) {
      case 'deposit':
      case 'stake':
        totalDeposits += amount;
        break;
      case 'withdraw':
      case 'unstake':
        totalWithdrawals += amount;
        break;
      case 'claim':
      case 'yield':
        totalClaims += amount;
        break;
      case 'swap':
        totalSwaps += amount;
        break;
      case 'transfer':
        totalTransfers += amount;
        break;
    }
  });

  // Рассчитываем прибыль
  const profit = totalWithdrawals + totalClaims + totalSwaps + totalTransfers - totalDeposits;
  
  // Рассчитываем процент прибыли
  const profitPercentage = totalDeposits > 0 ? (profit / totalDeposits) * 100 : 0;
  
  // Рассчитываем среднее значение транзакции
  const averageTransactionValue = protocolTransactions.length > 0 
    ? (totalDeposits + totalWithdrawals + totalClaims + totalSwaps + totalTransfers) / protocolTransactions.length 
    : 0;

  // Рассчитываем временные метрики
  const firstTransaction = sortedTransactions[0];
  const lastTransaction = sortedTransactions[sortedTransactions.length - 1];
  
  const firstTransactionDate = new Date(
    typeof firstTransaction.timestamp === 'string' 
      ? parseFloat(firstTransaction.timestamp) 
      : firstTransaction.timestamp
  ).toISOString();
  
  const lastTransactionDate = new Date(
    typeof lastTransaction.timestamp === 'string' 
      ? parseFloat(lastTransaction.timestamp) 
      : lastTransaction.timestamp
  ).toISOString();

  const activeDays = Math.ceil(
    (new Date(lastTransactionDate).getTime() - new Date(firstTransactionDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Рассчитываем ROI (Return on Investment)
  const roi = totalDeposits > 0 ? (profit / totalDeposits) * 100 : 0;

  // Рассчитываем APY (Annual Percentage Yield)
  const apy = activeDays > 0 ? (roi / activeDays) * 365 : 0;

  return {
    totalDeposits,
    totalWithdrawals,
    totalClaims,
    totalSwaps,
    totalTransfers,
    profit,
    profitPercentage,
    transactionCount: protocolTransactions.length,
    averageTransactionValue,
    firstTransactionDate,
    lastTransactionDate,
    activeDays,
    roi,
    apy
  };
}

/**
 * Получает название протокола по функции и адресу получателя
 */
function getProtocolNameByFunction(functionPath: string, recipientAddress: string): string {
  if (!functionPath || functionPath === 'Unknown') {
    return recipientAddress || 'Unknown';
  }
  
  // Извлекаем первую часть пути функции (до первого ::)
  const parts = functionPath.split('::');
  if (parts.length < 2) {
    return recipientAddress || functionPath;
  }
  
  const contractAddress = parts[0];
  
  // Нормализуем адрес (убираем префикс 0x если есть, приводим к нижнему регистру)
  const normalizedAddress = contractAddress.toLowerCase().replace(/^0x/, '');
  
  // Маппинг известных адресов протоколов
  const protocolAddresses: { [key: string]: string } = {
    'c0c240c870606a5cb3150795e2d0dfff9f1f7456': 'Hyperion',
    '2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6': 'Joule',
    'c6bc659f1649553c1a3fa05d9727433dc03843baac29473c817d06d39e7621ba': 'Echelon',
    '111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a': 'Amnis',
    '50a340a19e6ada1be07192c042786ca6a9651d5c845acc8727e8c6416a56a32c': 'Auro',
    'd039ef33e378c10544491855a2ef99cd77bf1a610fd52cc43117cd96e1c73465': 'Auro',
    '1': 'Aptos' // Нативные транзакции Aptos
  };
  
  const protocol = protocolAddresses[normalizedAddress];
  if (protocol) {
    return protocol;
  }
  
  // Если точного совпадения не найдено, возвращаем логику по адресу получателя
  if (!recipientAddress || recipientAddress === 'Unknown' || 
      recipientAddress.startsWith('Pool/Validator ID:') || 
      recipientAddress.startsWith('DEX/Pool ID:') || 
      recipientAddress.startsWith('ID:')) {
    return recipientAddress;
  }
  
  return recipientAddress;
}

/**
 * Улучшенная функция извлечения суммы транзакции с учетом специфики протоколов
 */
export function extractTransactionAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  const protocol = getProtocolNameByFunction(tx.payload?.function || '', tx.to || '');
  
  // Специальная обработка для Echelon
  if (protocol === 'Echelon') {
    return extractEchelonAmount(tx, userAddress);
  }
  
  // Специальная обработка для других протоколов
  if (protocol === 'Joule') {
    return extractJouleAmount(tx, userAddress);
  }
  
  if (protocol === 'Hyperion') {
    return extractHyperionAmount(tx, userAddress);
  }
  
  // Общая обработка для остальных протоколов
  return extractGenericAmount(tx, userAddress);
}

/**
 * Извлечение суммы для протокола Echelon согласно инструкции
 */
function extractEchelonAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  let amount = 0;
  let token = 'APT';
  let decimals = 8;
  
  if (!tx.events || !Array.isArray(tx.events)) {
    return { amount, token, decimals };
  }
  
  // Шаг 1: Ищем события Deposit и Withdraw
  const depositEvents = tx.events.filter((event: any) => 
    event.type === '0x1::fungible_asset::Deposit' ||
    event.type.includes('fungible_asset::Deposit')
  );
  
  const withdrawEvents = tx.events.filter((event: any) => 
    event.type === '0x1::fungible_asset::Withdraw' ||
    event.type.includes('fungible_asset::Withdraw')
  );
  
  // Шаг 2: Определяем тип операции и сумму
  const functionName = tx.payload?.function || '';
  
  // Ищем токен из изменений состояния (changes) - более надежный способ для Echelon
  if (tx.changes) {
    const marketChange = tx.changes.find((change: any) => 
      change.data?.type?.includes('lending::Market')
    );
    if (marketChange?.data?.data?.asset_name) {
      const assetName = marketChange.data.data.asset_name;
      const tokenInfo = getTokenInfoByCoinName(assetName);
      if (tokenInfo) {
        token = tokenInfo.symbol;
        decimals = tokenInfo.decimals;
      }
    }
    
    // Для claim транзакций ищем токен в CoinStore изменениях
    if (token === 'APT' && functionName.includes('claim')) {
      const coinStoreChange = tx.changes.find((change: any) => 
        change.data?.type?.includes('CoinStore') &&
        change.address === userAddress
      );
      
      if (coinStoreChange?.data?.data?.coin?.type) {
        const coinType = coinStoreChange.data.data.coin.type;
        console.log(`[DEBUG] Найден тип токена в CoinStore: ${coinType}`);
        
        // Определяем токен по типу
        if (coinType.includes('usde::USDe')) {
          token = 'USDe';
          decimals = 6;
        } else if (coinType.includes('staked_usde::StakedUSDe')) {
          token = 'sUSDe';
          decimals = 6;
        } else if (coinType.includes('aptos_coin::AptosCoin')) {
          token = 'APT';
          decimals = 8;
        }
      }
    }
  }
  
  // Если не нашли в changes, ищем PriceEvent для определения токена
  if (token === 'APT') {
    const priceEvent = tx.events.find((event: any) => 
      event.type.includes('tiered_oracle::PriceEvent') ||
      event.type.includes('PriceEvent')
    );
    
    if (priceEvent && priceEvent.data && priceEvent.data.coin_name) {
      const tokenInfo = getTokenInfoByCoinName(priceEvent.data.coin_name);
      if (tokenInfo) {
        token = tokenInfo.symbol;
        decimals = tokenInfo.decimals;
      }
    }
  }
  
  // Для claim транзакций ищем токен в событиях Deposit/Withdraw
  if (token === 'APT' && functionName.includes('claim')) {
    const depositEvent = depositEvents.find((event: any) => 
      event.data?.store?.includes(userAddress)
    );
    
    if (depositEvent?.type) {
      // Извлекаем тип токена из события
      const typeMatch = depositEvent.type.match(/<([^>]+)>/);
      if (typeMatch) {
        const coinType = typeMatch[1];
        console.log(`[DEBUG] Найден тип токена в событии: ${coinType}`);
        
        if (coinType.includes('usde::USDe')) {
          token = 'USDe';
          decimals = 6;
        } else if (coinType.includes('staked_usde::StakedUSDe')) {
          token = 'sUSDe';
          decimals = 6;
        } else if (coinType.includes('aptos_coin::AptosCoin')) {
          token = 'APT';
          decimals = 8;
        }
      }
    }
  }
  
  // Шаг 3: Анализируем изменения в FungibleStore
  const fungibleStoreChanges = tx.changes?.filter((change: any) => 
    change.type?.includes('fungible_asset::FungibleStore') ||
    change.type?.includes('coin::CoinStore')
  ) || [];
  
  // Шаг 4: Определяем тип операции и сумму
  
  if (functionName.includes('supply') || functionName.includes('deposit')) {
    // Операция депозита
    if (withdrawEvents.length > 0) {
      // Берем сумму из события Withdraw (токены списаны с кошелька)
      const withdrawEvent = withdrawEvents.find((event: any) => 
        event.data?.store?.includes(userAddress) || 
        event.data?.store === userAddress
      );
      
      if (withdrawEvent?.data?.amount) {
        amount = parseFloat(withdrawEvent.data.amount);
        amount = amount / Math.pow(10, decimals);
      }
    }
  } else if (functionName.includes('withdraw') || functionName.includes('redeem')) {
    // Операция вывода
    if (depositEvents.length > 0) {
      // Берем сумму из события Deposit (токены зачислены на кошелек)
      const depositEvent = depositEvents.find((event: any) => 
        event.data?.store?.includes(userAddress) || 
        event.data?.store === userAddress
      );
      
      if (depositEvent?.data?.amount) {
        amount = parseFloat(depositEvent.data.amount);
        amount = amount / Math.pow(10, decimals);
      }
    }
  } else if (functionName.includes('claim') || functionName.includes('reward') || functionName.includes('scripts::claim_reward')) {
    // Операция получения наград
    console.log(`[DEBUG] Обрабатываем claim операцию: ${functionName}`);
    console.log(`[DEBUG] Deposit events:`, depositEvents);
  } else if (functionName.includes('liquidate') || functionName.includes('flash_loan') || functionName.includes('fee')) {
    // Операции с комиссиями
    console.log(`[DEBUG] Обрабатываем операцию с комиссиями: ${functionName}`);
    
    // Ищем комиссии в событиях
    if (tx.events) {
      const feeEvents = tx.events.filter((event: any) => 
        event.type?.includes('Fee') ||
        event.type?.includes('Commission') ||
        event.type?.includes('Charge')
      );
      
      console.log(`[DEBUG] Найдено ${feeEvents.length} событий с комиссиями:`, feeEvents);
      
      for (const event of feeEvents) {
        if (event.data?.amount || event.data?.fee || event.data?.commission) {
          const feeAmount = event.data.amount || event.data.fee || event.data.commission;
          amount = parseFloat(feeAmount) / Math.pow(10, decimals);
          console.log(`[DEBUG] Извлеченная комиссия из события: ${amount} ${token}`);
          break;
        }
      }
    }
    
    // Если не нашли в событиях, ищем в изменениях состояния
    if (amount === 0 && tx.changes) {
      const feeChanges = tx.changes.filter((change: any) => 
        change.data?.type?.includes('Fee') ||
        change.data?.type?.includes('Commission')
      );
      
      for (const change of feeChanges) {
        if (change.data?.data?.amount || change.data?.data?.fee) {
          const feeAmount = change.data.data.amount || change.data.data.fee;
          amount = parseFloat(feeAmount) / Math.pow(10, decimals);
          console.log(`[DEBUG] Извлеченная комиссия из изменений состояния: ${amount} ${token}`);
          break;
        }
      }
    }
    
    // Сначала пробуем найти deposit events
    if (depositEvents.length > 0) {
      const depositEvent = depositEvents.find((event: any) => 
        event.data?.store?.includes(userAddress) || 
        event.data?.store === userAddress
      );
      
      console.log(`[DEBUG] Найденный deposit event:`, depositEvent);
      
      if (depositEvent?.data?.amount) {
        amount = parseFloat(depositEvent.data.amount);
        amount = amount / Math.pow(10, decimals);
        console.log(`[DEBUG] Извлеченная сумма для claim из deposit event: ${amount} ${token}`);
      }
    }
    
    // Если не нашли в deposit events, ищем в других событиях
    if (amount === 0 && tx.events) {
      console.log(`[DEBUG] Ищем награды в других событиях...`);
      
      // Ищем события с наградами
      const rewardEvents = tx.events.filter((event: any) => 
        event.type?.includes('Reward') ||
        event.type?.includes('Claim') ||
        event.type?.includes('Distribute') ||
        event.type?.includes('Mint') ||
        event.type?.includes('Deposit') // Добавляем поиск Deposit событий
      );
      
      console.log(`[DEBUG] Найдено ${rewardEvents.length} событий с наградами:`, rewardEvents);
      
      for (const event of rewardEvents) {
        if (event.data?.amount || event.data?.value || event.data?.reward_amount) {
          const rewardAmount = event.data.amount || event.data.value || event.data.reward_amount;
          amount = parseFloat(rewardAmount) / Math.pow(10, decimals);
          console.log(`[DEBUG] Извлеченная сумма для claim из reward event: ${amount} ${token}`);
          break;
        }
      }
      
      // Если все еще не нашли, ищем в изменениях состояния
      if (amount === 0 && tx.changes) {
        console.log(`[DEBUG] Ищем награды в изменениях состояния...`);
        
        // Ищем изменения в CoinStore для пользователя
        const coinStoreChanges = tx.changes.filter((change: any) => 
          change.data?.type?.includes('CoinStore') &&
          change.data?.data?.coin?.value &&
          change.address === userAddress
        );
        
        console.log(`[DEBUG] Найдено ${coinStoreChanges.length} изменений CoinStore:`, coinStoreChanges);
        
        for (const change of coinStoreChanges) {
          if (change.data?.data?.coin?.value) {
            const coinValue = parseFloat(change.data.data.coin.value);
            if (coinValue > 0) {
              amount = coinValue / Math.pow(10, decimals);
              console.log(`[DEBUG] Извлеченная сумма для claim из CoinStore change: ${amount} ${token}`);
              break;
            }
          }
        }
        
        // Если не нашли в CoinStore, ищем в FungibleStore
        if (amount === 0) {
          const fungibleStoreChanges = tx.changes.filter((change: any) => 
            change.data?.type?.includes('FungibleStore') &&
            change.data?.data?.balance &&
            change.address === userAddress
          );
          
          console.log(`[DEBUG] Найдено ${fungibleStoreChanges.length} изменений FungibleStore:`, fungibleStoreChanges);
          
          for (const change of fungibleStoreChanges) {
            if (change.data?.data?.balance) {
              const balanceValue = parseFloat(change.data.data.balance);
              if (balanceValue > 0) {
                amount = balanceValue / Math.pow(10, decimals);
                console.log(`[DEBUG] Извлеченная сумма для claim из FungibleStore change: ${amount} ${token}`);
                break;
              }
            }
          }
        }
      }
      
      // Если все еще не нашли, ищем в аргументах транзакции
      if (amount === 0 && tx.payload?.arguments) {
        console.log(`[DEBUG] Ищем награды в аргументах транзакции...`);
        
        for (const arg of tx.payload.arguments) {
          if (typeof arg === 'string' && !isNaN(parseFloat(arg)) && parseFloat(arg) > 0) {
            amount = parseFloat(arg) / Math.pow(10, decimals);
            console.log(`[DEBUG] Извлеченная сумма для claim из аргумента: ${amount} ${token}`);
            break;
          }
        }
      }
    }
    
    if (amount === 0) {
      console.log(`[DEBUG] Не удалось извлечь сумму наград из claim операции`);
      console.log(`[DEBUG] Полная структура транзакции:`, JSON.stringify(tx, null, 2));
    }
  }
  
  return { amount, token, decimals };
}

/**
 * Извлечение суммы для протокола Joule
 */
function extractJouleAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  let amount = 0;
  let token = 'APT';
  let decimals = 8;
  
  if (!tx.events || !Array.isArray(tx.events)) {
    return { amount, token, decimals };
  }
  
  const functionName = tx.payload?.function || '';
  
  // Ищем события, специфичные для Joule
  const coinEvents = tx.events.filter((event: any) => 
    event.type?.includes('coin::') ||
    event.type?.includes('CoinStore')
  );
  
  if (functionName.includes('deposit') || functionName.includes('supply')) {
    // Депозит в Joule
    const withdrawEvent = coinEvents.find((event: any) => 
      event.type?.includes('Withdraw') && 
      event.data?.store?.includes(userAddress)
    );
    
    if (withdrawEvent?.data?.amount) {
      amount = parseFloat(withdrawEvent.data.amount);
      token = determineTokenFromEvent(withdrawEvent, tx.payload?.type_arguments);
      decimals = getTokenDecimals(token);
      amount = amount / Math.pow(10, decimals);
    }
  } else if (functionName.includes('withdraw') || functionName.includes('redeem')) {
    // Вывод из Joule
    const depositEvent = coinEvents.find((event: any) => 
      event.type?.includes('Deposit') && 
      event.data?.store?.includes(userAddress)
    );
    
    if (depositEvent?.data?.amount) {
      amount = parseFloat(depositEvent.data.amount);
      token = determineTokenFromEvent(depositEvent, tx.payload?.type_arguments);
      decimals = getTokenDecimals(token);
      amount = amount / Math.pow(10, decimals);
    }
  }
  
  return { amount, token, decimals };
}

/**
 * Извлечение суммы для протокола Hyperion
 */
function extractHyperionAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  let amount = 0;
  let token = 'APT';
  let decimals = 8;
  
  if (!tx.events || !Array.isArray(tx.events)) {
    return { amount, token, decimals };
  }
  
  const functionName = tx.payload?.function || '';
  
  // Ищем события, специфичные для Hyperion
  const swapEvents = tx.events.filter((event: any) => 
    event.type?.includes('Swap') ||
    event.type?.includes('Trade')
  );
  
  if (swapEvents.length > 0) {
    const swapEvent = swapEvents[0];
    if (swapEvent.data?.amount_in) {
      amount = parseFloat(swapEvent.data.amount_in);
      token = determineTokenFromEvent(swapEvent, tx.payload?.type_arguments);
      decimals = getTokenDecimals(token);
      amount = amount / Math.pow(10, decimals);
    }
  }
  
  return { amount, token, decimals };
}

/**
 * Общая обработка для остальных протоколов
 */
function extractGenericAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  let amount = 0;
  let token = 'APT';
  let decimals = 8;
  
  if (!tx.events || !Array.isArray(tx.events)) {
    return { amount, token, decimals };
  }
  
  // Ищем любые события с amount
  const amountEvents = tx.events.filter((event: any) => 
    event.data?.amount || 
    event.data?.value || 
    event.data?.coin_amount
  );
  
  if (amountEvents.length > 0) {
    const event = amountEvents[0];
    const amountData = event.data.amount || event.data.value || event.data.coin_amount;
    if (amountData) {
      amount = parseFloat(amountData);
      token = determineTokenFromEvent(event, tx.payload?.type_arguments);
      decimals = getTokenDecimals(token);
      amount = amount / Math.pow(10, decimals);
    }
  }
  
  return { amount, token, decimals };
}

/**
 * Получает информацию о токене по coin_name или названию токена
 */
export function getTokenInfoByCoinName(coinName: string): { name: string; symbol: string; decimals: number } | null {
  if (!coinName) return null;
  
  // Убираем префикс @ если есть
  const normalizedCoinName = coinName.replace(/^@/, '');
  
  // Сначала ищем токен в списке по faAddress
  let token = tokenList.data.data.find((token: any) => {
    return token.faAddress === normalizedCoinName;
  });
  
  // Если не нашли по faAddress, ищем по названию токена
  if (!token) {
    token = tokenList.data.data.find((token: any) => {
      return token.name === normalizedCoinName || token.symbol === normalizedCoinName;
    });
  }
  
  // Если не нашли по названию, ищем по частичному совпадению
  if (!token) {
    token = tokenList.data.data.find((token: any) => {
      return token.name.toLowerCase().includes(normalizedCoinName.toLowerCase()) ||
             token.symbol.toLowerCase().includes(normalizedCoinName.toLowerCase());
    });
  }
  
  if (token) {
    return {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals
    };
  }
  
  return null;
}

/**
 * Определяет токен из события или аргументов
 */
function determineTokenFromEvent(event: any, typeArguments: string[]): string {
  // Пытаемся определить токен из типа события
  if (event.type) {
    const typeMatch = event.type.match(/<([^>]+)>/);
    if (typeMatch) {
      const tokenType = typeMatch[1];
      if (tokenType.includes('aptos_coin::AptosCoin')) return 'APT';
      if (tokenType.includes('usda::USDA')) return 'USDA';
      if (tokenType.includes('stapt::StakedAptos')) return 'stAPT';
      // Добавьте другие токены по необходимости
    }
  }
  
  // Пытаемся определить из type_arguments
  if (typeArguments && typeArguments.length > 0) {
    const tokenType = typeArguments[0];
    if (tokenType.includes('aptos_coin::AptosCoin')) return 'APT';
    if (tokenType.includes('usda::USDA')) return 'USDA';
    if (tokenType.includes('stapt::StakedAptos')) return 'stAPT';
  }
  
  return 'APT'; // По умолчанию
}

/**
 * Получает количество десятичных знаков для токена
 */
function getTokenDecimals(token: string): number {
  const decimalsMap: { [key: string]: number } = {
    'APT': 8,
    'USDA': 6,
    'stAPT': 8,
    'amAPT': 8,
    // Добавьте другие токены по необходимости
  };
  
  return decimalsMap[token] || 8; // По умолчанию 8
}

/**
 * Рассчитывает общую прибыль по всем протоколам
 */
export function calculateTotalProfit(transactions: Transaction[]): {
  totalProfit: number;
  protocolBreakdown: ProtocolProfitSummary[];
  overallStats: {
    totalTransactions: number;
    totalValue: number;
    averageROI: number;
    mostProfitableProtocol: string;
    leastProfitableProtocol: string;
  };
} {
  if (!transactions || transactions.length === 0) {
    return {
      totalProfit: 0,
      protocolBreakdown: [],
      overallStats: {
        totalTransactions: 0,
        totalValue: 0,
        averageROI: 0,
        mostProfitableProtocol: '',
        leastProfitableProtocol: ''
      }
    };
  }

  // Получаем уникальные протоколы
  const protocols = new Set<string>();
  transactions.forEach(tx => {
    const protocol = getProtocolNameByFunction(tx.function, tx.to);
    if (protocol && protocol !== 'Unknown') {
      protocols.add(protocol);
    }
  });

  // Рассчитываем прибыль для каждого протокола
  const protocolBreakdown: ProtocolProfitSummary[] = [];
  let totalProfit = 0;

  protocols.forEach(protocolName => {
    const profitData = calculateProtocolProfit(protocolName, transactions);
    if (profitData) {
      const protocolTransactions = transactions.filter(tx => {
        const txProtocol = getProtocolNameByFunction(tx.function, tx.to);
        return txProtocol === protocolName;
      });

      protocolBreakdown.push({
        protocolName,
        profitData,
        transactions: protocolTransactions,
        isPositive: profitData.profit > 0,
        isProfitable: profitData.roi > 0
      });

      totalProfit += profitData.profit;
    }
  });

  // Сортируем по прибыльности
  protocolBreakdown.sort((a, b) => b.profitData.profit - a.profitData.profit);

  // Рассчитываем общую статистику
  const totalTransactions = transactions.length;
  const totalValue = transactions.reduce((sum, tx) => {
    const amount = parseFloat(tx.amount.replace(/[^\d.-]/g, '')) || 0;
    return sum + amount;
  }, 0);

  const averageROI = protocolBreakdown.length > 0 
    ? protocolBreakdown.reduce((sum, p) => sum + p.profitData.roi, 0) / protocolBreakdown.length 
    : 0;

  const mostProfitableProtocol = protocolBreakdown.length > 0 ? protocolBreakdown[0].protocolName : '';
  const leastProfitableProtocol = protocolBreakdown.length > 0 ? protocolBreakdown[protocolBreakdown.length - 1].protocolName : '';

  return {
    totalProfit,
    protocolBreakdown,
    overallStats: {
      totalTransactions,
      totalValue,
      averageROI,
      mostProfitableProtocol,
      leastProfitableProtocol
    }
  };
}

/**
 * Форматирует числовые значения для отображения
 */
export function formatProfitValue(value: number, currency: string = 'APT'): string {
  if (value === 0) return `0 ${currency}`;
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(2)}M ${currency}`;
  } else if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(2)}K ${currency}`;
  } else {
    return `${sign}${absValue.toFixed(4)} ${currency}`;
  }
}

/**
 * Форматирует процентные значения
 */
export function formatPercentage(value: number): string {
  if (value === 0) return '0%';
  
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
} 