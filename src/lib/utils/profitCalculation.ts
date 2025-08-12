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
  console.log('[DEBUG] getProtocolNameByFunction вызвана с:', { functionPath, recipientAddress });
  
  if (!functionPath || functionPath === 'Unknown') {
    console.log('[DEBUG] getProtocolNameByFunction возвращает recipientAddress:', recipientAddress || 'Unknown');
    return recipientAddress || 'Unknown';
  }
  
  // Извлекаем первую часть пути функции (до первого ::)
  const parts = functionPath.split('::');
  if (parts.length < 2) {
    console.log('[DEBUG] getProtocolNameByFunction возвращает recipientAddress или functionPath:', recipientAddress || functionPath);
    return recipientAddress || functionPath;
  }
  
  const contractAddress = parts[0];
  console.log('[DEBUG] Contract address:', contractAddress);
  
  // Нормализуем адрес (убираем префикс 0x если есть, приводим к нижнему регистру)
  const normalizedAddress = contractAddress.toLowerCase().replace(/^0x/, '');
  console.log('[DEBUG] Normalized address:', normalizedAddress);
  
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
    console.log('[DEBUG] getProtocolNameByFunction возвращает протокол:', protocol);
    return protocol;
  }
  
  // Если точного совпадения не найдено, возвращаем логику по адресу получателя
  if (!recipientAddress || recipientAddress === 'Unknown' || 
      recipientAddress.startsWith('Pool/Validator ID:') || 
      recipientAddress.startsWith('DEX/Pool ID:') || 
      recipientAddress.startsWith('ID:')) {
    console.log('[DEBUG] getProtocolNameByFunction возвращает recipientAddress (неизвестный протокол):', recipientAddress);
    return recipientAddress;
  }
  
  console.log('[DEBUG] getProtocolNameByFunction возвращает recipientAddress:', recipientAddress);
  return recipientAddress;
}

/**
 * Улучшенная функция извлечения суммы транзакции с учетом специфики протоколов
 */
export function extractTransactionAmount(tx: any, userAddress: string, debugCallback?: (message: string) => void): { amount: number; token: string; decimals: number } {
  const protocol = getProtocolNameByFunction(tx.payload?.function || '', tx.to || '');
  
  console.log('[DEBUG] extractTransactionAmount - функция:', tx.payload?.function);
  console.log('[DEBUG] extractTransactionAmount - протокол:', protocol);
  console.log('[DEBUG] extractTransactionAmount - payload type:', tx.payload?.type);
  
  // Специальная обработка для конкретной транзакции
  if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
    console.log('[DEBUG] === СПЕЦИАЛЬНАЯ ОБРАБОТКА В extractTransactionAmount ===');
    console.log('[DEBUG] Hash:', tx.hash);
    console.log('[DEBUG] Function:', tx.payload?.function);
    console.log('[DEBUG] Protocol:', protocol);
    console.log('[DEBUG] Events count:', tx.events?.length || 0);
    console.log('[DEBUG] Changes count:', tx.changes?.length || 0);
    console.log('[DEBUG] === КОНЕЦ СПЕЦИАЛЬНОЙ ОБРАБОТКИ ===');
  }
  
  // Специальная обработка для Echelon
  if (protocol === 'Echelon') {
    if (debugCallback) debugCallback('[DEBUG] Используем extractEchelonAmount');
    return extractEchelonAmount(tx, userAddress, debugCallback);
  }
  
  // Специальная обработка для других протоколов
  if (protocol === 'Joule') {
    console.log('[DEBUG] Используем extractJouleAmount');
    return extractJouleAmount(tx, userAddress);
  }
  
  if (protocol === 'Hyperion') {
    console.log('[DEBUG] Используем extractHyperionAmount');
    return extractHyperionAmount(tx, userAddress);
  }
  
  // Специальная обработка для транзакций с undefined функцией
  if (!tx.payload?.function && tx.payload?.type === 'entry_function_payload') {
    console.log('[DEBUG] Функция не определена, но это entry_function_payload, используем extractGenericAmount');
    return extractGenericAmount(tx, userAddress);
  }
  
  // Общая обработка для остальных протоколов
  console.log('[DEBUG] Используем extractGenericAmount');
  return extractGenericAmount(tx, userAddress);
}

/**
 * Извлечение суммы для протокола Echelon согласно инструкции
 */
function extractEchelonAmount(tx: any, userAddress: string, debugCallback?: (message: string) => void): { amount: number; token: string; decimals: number } {
  if (debugCallback) debugCallback('[DEBUG] extractEchelonAmount вызвана');
  if (debugCallback) debugCallback(`[DEBUG] Функция: ${tx.payload?.function}`);
  if (debugCallback) debugCallback(`[DEBUG] Events count: ${tx.events?.length || 0}`);
  
  let amount = 0;
  let token = 'APT';
  let decimals = getTokenDecimals('APT', debugCallback);
  
  if (!tx.events || !Array.isArray(tx.events)) {
    if (debugCallback) debugCallback('[DEBUG] extractEchelonAmount - нет событий, возвращаем значения по умолчанию');
    return { amount, token, decimals };
  }
  
  // Специальная обработка для конкретных транзакций
  if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f' || 
      tx.hash?.startsWith('0x044617')) {
    if (debugCallback) debugCallback('[DEBUG] === СПЕЦИАЛЬНАЯ ОБРАБОТКА В extractEchelonAmount ===');
    if (debugCallback) debugCallback(`[DEBUG] Hash: ${tx.hash}`);
    if (debugCallback) debugCallback(`[DEBUG] Function: ${tx.payload?.function}`);
    if (debugCallback) debugCallback(`[DEBUG] Все события: ${JSON.stringify(tx.events, null, 2)}`);
    if (debugCallback) debugCallback(`[DEBUG] Все изменения: ${JSON.stringify(tx.changes, null, 2)}`);
    if (debugCallback) debugCallback(`[DEBUG] Payload: ${JSON.stringify(tx.payload, null, 2)}`);
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
    if (debugCallback) debugCallback('[DEBUG] Анализируем changes для определения токена...');
    if (debugCallback) debugCallback(`[DEBUG] Все changes: ${JSON.stringify(tx.changes, null, 2)}`);
    
    const marketChange = tx.changes.find((change: any) => 
      change.data?.type?.includes('lending::Market')
    );
    if (marketChange?.data?.data?.asset_name) {
      const assetName = marketChange.data.data.asset_name;
      if (debugCallback) debugCallback(`[DEBUG] Найден asset_name в Market change: ${assetName}`);
      const tokenInfo = getTokenInfoByCoinName(assetName, debugCallback);
      if (tokenInfo) {
        token = tokenInfo.symbol;
        decimals = tokenInfo.decimals;
        if (debugCallback) debugCallback(`[DEBUG] Установлен токен из Market change: ${token}`);
      }
    }
    
    // Ищем токен в CoinStore изменениях для всех транзакций Echelon
    const coinStoreChanges = tx.changes.filter((change: any) => 
      change.data?.type?.includes('CoinStore') &&
      change.address === userAddress
    );
    
    if (debugCallback) debugCallback(`[DEBUG] Найдено CoinStore изменений: ${coinStoreChanges.length}`);
    
    for (const coinStoreChange of coinStoreChanges) {
      if (coinStoreChange?.data?.data?.coin?.type) {
        const coinType = coinStoreChange.data.data.coin.type;
        if (debugCallback) debugCallback(`[DEBUG] Найден тип токена в CoinStore: ${coinType}`);
        
        // Определяем токен по типу
        if (coinType.includes('usde::USDe')) {
          token = 'USDe';
          decimals = 6;
          if (debugCallback) debugCallback('[DEBUG] Установлен USDe из CoinStore');
          break;
        } else if (coinType.includes('staked_usde::StakedUSDe')) {
          token = 'sUSDe';
          decimals = 6;
          if (debugCallback) debugCallback('[DEBUG] Установлен sUSDe из CoinStore');
          break;
        } else if (coinType.includes('staking::ThalaAPT')) {
          token = 'thAPT';
          decimals = getTokenDecimals('thAPT', debugCallback);
          if (debugCallback) debugCallback('[DEBUG] Установлен thAPT из CoinStore');
          break;
        } else if (coinType.includes('staking::StakedThalaAPT')) {
          token = 'sthAPT';
          decimals = getTokenDecimals('sthAPT', debugCallback);
          if (debugCallback) debugCallback('[DEBUG] Установлен sthAPT из CoinStore');
          break;
        } else if (coinType.includes('aptos_coin::AptosCoin')) {
          token = 'APT';
          decimals = getTokenDecimals('APT', debugCallback);
          if (debugCallback) debugCallback('[DEBUG] Установлен APT из CoinStore');
          break;
        }
      }
    }
    
    // Если не нашли в CoinStore, ищем в FungibleStore
    const fungibleStoreChanges = tx.changes.filter((change: any) => 
      change.data?.type?.includes('FungibleStore') &&
      change.address === userAddress
    );
    
    if (debugCallback) debugCallback(`[DEBUG] Найдено FungibleStore изменений: ${fungibleStoreChanges.length}`);
    
    for (const fungibleStoreChange of fungibleStoreChanges) {
      if (fungibleStoreChange?.data?.data?.metadata?.inner) {
        const metadataInner = fungibleStoreChange.data.data.metadata.inner;
        if (debugCallback) debugCallback(`[DEBUG] Найден metadata.inner в FungibleStore: ${metadataInner}`);
        
        // Проверяем metadata.inner для определения токена
        if (metadataInner === '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b') {
          token = 'thAPT';
          decimals = getTokenDecimals('thAPT', debugCallback);
          if (debugCallback) debugCallback('[DEBUG] Установлен thAPT из FungibleStore metadata');
          break;
        } else if (metadataInner === '0x1::aptos_coin::AptosCoin') {
          token = 'APT';
          decimals = getTokenDecimals('APT', debugCallback);
          if (debugCallback) debugCallback('[DEBUG] Установлен APT из FungibleStore metadata');
          break;
        }
      }
    }
  }
  
  // Если не нашли в changes, ищем PriceEvent для определения токена
  if (token === 'APT') {
    if (debugCallback) debugCallback('[DEBUG] Ищем PriceEvent для определения токена...');
    const priceEvent = tx.events.find((event: any) => 
      event.type.includes('tiered_oracle::PriceEvent') ||
      event.type.includes('PriceEvent')
    );
    
    if (priceEvent && priceEvent.data && priceEvent.data.coin_name) {
      if (debugCallback) debugCallback(`[DEBUG] Найден PriceEvent с coin_name: ${priceEvent.data.coin_name}`);
      const tokenInfo = getTokenInfoByCoinName(priceEvent.data.coin_name, debugCallback);
      if (tokenInfo) {
        token = tokenInfo.symbol;
        decimals = tokenInfo.decimals;
        if (debugCallback) debugCallback(`[DEBUG] Установлен токен из PriceEvent: ${token}`);
      }
    }
  }
  
  // Дополнительная проверка всех событий для определения токена
  if (token === 'APT' && tx.events) {
    if (debugCallback) debugCallback('[DEBUG] Анализируем все события для определения токена...');
    if (debugCallback) debugCallback(`[DEBUG] Все события: ${JSON.stringify(tx.events, null, 2)}`);
    
    for (const event of tx.events) {
      if (event.type) {
        // Ищем токены Thala в типах событий
        if (event.type.includes('staking::ThalaAPT')) {
          token = 'thAPT';
          decimals = getTokenDecimals('thAPT', debugCallback);
          if (debugCallback) debugCallback(`[DEBUG] Установлен thAPT из типа события: ${event.type}`);
          break;
        } else if (event.type.includes('staking::StakedThalaAPT')) {
          token = 'sthAPT';
          decimals = getTokenDecimals('sthAPT', debugCallback);
          if (debugCallback) debugCallback(`[DEBUG] Установлен sthAPT из типа события: ${event.type}`);
          break;
        }
        
        // Ищем в generic типах событий
        const typeMatch = event.type.match(/<([^>]+)>/);
        if (typeMatch) {
          const coinType = typeMatch[1];
          if (debugCallback) debugCallback(`[DEBUG] Найден generic тип в событии: ${coinType}`);
          
          if (coinType.includes('staking::ThalaAPT')) {
            token = 'thAPT';
            decimals = 8;
            if (debugCallback) debugCallback('[DEBUG] Установлен thAPT из generic типа события');
            break;
          } else if (coinType.includes('staking::StakedThalaAPT')) {
            token = 'sthAPT';
            decimals = 8;
            if (debugCallback) debugCallback('[DEBUG] Установлен sthAPT из generic типа события');
            break;
          }
        }
        
        // Ищем токен в данных события
        if (event.data) {
          if (debugCallback) debugCallback(`[DEBUG] Анализируем данные события: ${JSON.stringify(event.data, null, 2)}`);
          
          // Ищем токен в различных полях данных события
          const possibleTokenFields = [
            event.data.token,
            event.data.coin_type,
            event.data.asset_type,
            event.data.token_type,
            event.data.coin_name,
            event.data.asset_name
          ];
          
          for (const tokenField of possibleTokenFields) {
            if (tokenField) {
              if (debugCallback) debugCallback(`[DEBUG] Найден токен в данных события: ${tokenField}`);
              
              if (typeof tokenField === 'string') {
                if (tokenField.includes('staking::ThalaAPT')) {
                  token = 'thAPT';
                  decimals = getTokenDecimals('thAPT', debugCallback);
                  if (debugCallback) debugCallback('[DEBUG] Установлен thAPT из данных события');
                  break;
                } else if (tokenField.includes('staking::StakedThalaAPT')) {
                  token = 'sthAPT';
                  decimals = getTokenDecimals('sthAPT', debugCallback);
                  if (debugCallback) debugCallback('[DEBUG] Установлен sthAPT из данных события');
                  break;
                }
              } else if (tokenField.inner) {
                const tokenInfo = getTokenInfoByCoinName(tokenField.inner, debugCallback);
                if (tokenInfo) {
                  token = tokenInfo.symbol;
                  decimals = tokenInfo.decimals;
                  if (debugCallback) debugCallback(`[DEBUG] Установлен токен из данных события: ${token}`);
                  break;
                }
              }
            }
          }
          
          if (token !== 'APT') break; // Если нашли токен, выходим из цикла
        }
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
        if (debugCallback) debugCallback(`[DEBUG] Найден тип токена в событии: ${coinType}`);
        
        if (coinType.includes('usde::USDe')) {
          token = 'USDe';
          decimals = 6;
        } else if (coinType.includes('staked_usde::StakedUSDe')) {
          token = 'sUSDe';
          decimals = 6;
        } else if (coinType.includes('aptos_coin::AptosCoin')) {
          token = 'APT';
          decimals = getTokenDecimals('APT', debugCallback);
        } else if (coinType.includes('staking::ThalaAPT')) {
          token = 'thAPT';
          decimals = getTokenDecimals('thAPT', debugCallback);
        } else if (coinType.includes('staking::StakedThalaAPT')) {
          token = 'sthAPT';
          decimals = getTokenDecimals('sthAPT', debugCallback);
        }
      }
    }
  }
  
  // Дополнительная проверка type_arguments в payload
  if (token === 'APT' && tx.payload?.type_arguments) {
    if (debugCallback) debugCallback(`[DEBUG] Анализируем type_arguments: ${JSON.stringify(tx.payload.type_arguments, null, 2)}`);
    
    for (const typeArg of tx.payload.type_arguments) {
      if (debugCallback) debugCallback(`[DEBUG] Проверяем type_argument: ${typeArg}`);
      
      if (typeArg.includes('staking::ThalaAPT')) {
        token = 'thAPT';
        decimals = getTokenDecimals('thAPT', debugCallback);
        if (debugCallback) debugCallback('[DEBUG] Установлен thAPT из type_arguments');
        break;
      } else if (typeArg.includes('staking::StakedThalaAPT')) {
        token = 'sthAPT';
        decimals = getTokenDecimals('sthAPT', debugCallback);
        if (debugCallback) debugCallback('[DEBUG] Установлен sthAPT из type_arguments');
        break;
      } else if (typeArg.includes('usde::USDe')) {
        token = 'USDe';
        decimals = 6;
        if (debugCallback) debugCallback('[DEBUG] Установлен USDe из type_arguments');
        break;
      } else if (typeArg.includes('staked_usde::StakedUSDe')) {
        token = 'sUSDe';
        decimals = 6;
        if (debugCallback) debugCallback('[DEBUG] Установлен sUSDe из type_arguments');
        break;
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
    if (debugCallback) debugCallback(`[DEBUG] Обрабатываем claim операцию: ${functionName}`);
    if (debugCallback) debugCallback(`[DEBUG] Deposit events: ${JSON.stringify(depositEvents, null, 2)}`);
    
    // Сначала пробуем найти deposit events
    if (depositEvents.length > 0) {
      const depositEvent = depositEvents.find((event: any) => 
        event.data?.store?.includes(userAddress) || 
        event.data?.store === userAddress
      );
      
      if (debugCallback) debugCallback(`[DEBUG] Найденный deposit event: ${JSON.stringify(depositEvent, null, 2)}`);
      
      if (depositEvent?.data?.amount) {
        amount = parseFloat(depositEvent.data.amount);
        amount = amount / Math.pow(10, decimals);
        if (debugCallback) debugCallback(`[DEBUG] Извлеченная сумма для claim из deposit event: ${amount} ${token}`);
      }
    }
    
    // Если не нашли в deposit events, ищем в других событиях
    if (amount === 0 && tx.events) {
      if (debugCallback) debugCallback(`[DEBUG] Ищем награды в других событиях...`);
      
      // Ищем события с наградами
      const rewardEvents = tx.events.filter((event: any) => 
        event.type?.includes('Reward') ||
        event.type?.includes('Claim') ||
        event.type?.includes('Distribute') ||
        event.type?.includes('Mint') ||
        event.type?.includes('Deposit') // Добавляем поиск Deposit событий
      );
      
      if (debugCallback) debugCallback(`[DEBUG] Найдено ${rewardEvents.length} событий с наградами: ${JSON.stringify(rewardEvents, null, 2)}`);
      
      for (const event of rewardEvents) {
        if (event.data?.amount || event.data?.value || event.data?.reward_amount) {
          const rewardAmount = event.data.amount || event.data.value || event.data.reward_amount;
          amount = parseFloat(rewardAmount) / Math.pow(10, decimals);
          if (debugCallback) debugCallback(`[DEBUG] Извлеченная сумма для claim из reward event: ${amount} ${token}`);
          break;
        }
      }
      
      // Если все еще не нашли, ищем в изменениях состояния
      if (amount === 0 && tx.changes) {
        if (debugCallback) debugCallback(`[DEBUG] Ищем награды в изменениях состояния...`);
        
        // Ищем изменения в CoinStore для пользователя
        const coinStoreChanges = tx.changes.filter((change: any) => 
          change.data?.type?.includes('CoinStore') &&
          change.data?.data?.coin?.value &&
          change.address === userAddress
        );
        
        if (debugCallback) debugCallback(`[DEBUG] Найдено ${coinStoreChanges.length} изменений CoinStore: ${JSON.stringify(coinStoreChanges, null, 2)}`);
        
        for (const change of coinStoreChanges) {
          if (change.data?.data?.coin?.value) {
            const coinValue = parseFloat(change.data.data.coin.value);
            if (coinValue > 0) {
              amount = coinValue / Math.pow(10, decimals);
              if (debugCallback) debugCallback(`[DEBUG] Извлеченная сумма для claim из CoinStore change: ${amount} ${token}`);
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
          
          if (debugCallback) debugCallback(`[DEBUG] Найдено ${fungibleStoreChanges.length} изменений FungibleStore: ${JSON.stringify(fungibleStoreChanges, null, 2)}`);
          
          for (const change of fungibleStoreChanges) {
            if (change.data?.data?.balance) {
              const balanceValue = parseFloat(change.data.data.balance);
              if (balanceValue > 0) {
                amount = balanceValue / Math.pow(10, decimals);
                if (debugCallback) debugCallback(`[DEBUG] Извлеченная сумма для claim из FungibleStore change: ${amount} ${token}`);
                break;
              }
            }
          }
        }
      }
      
      // Если все еще не нашли, ищем в аргументах транзакции
      if (amount === 0 && tx.payload?.arguments) {
        if (debugCallback) debugCallback(`[DEBUG] Ищем награды в аргументах транзакции...`);
        
        for (const arg of tx.payload.arguments) {
          if (typeof arg === 'string' && !isNaN(parseFloat(arg)) && parseFloat(arg) > 0) {
            amount = parseFloat(arg) / Math.pow(10, decimals);
            if (debugCallback) debugCallback(`[DEBUG] Извлеченная сумма для claim из аргумента: ${amount} ${token}`);
            break;
          }
        }
      }
    }
    
    if (amount === 0) {
      if (debugCallback) debugCallback(`[DEBUG] Не удалось извлечь сумму наград из claim операции`);
      if (debugCallback) debugCallback(`[DEBUG] Полная структура транзакции: ${JSON.stringify(tx, null, 2)}`);
    }
  } else if (functionName.includes('liquidate') || functionName.includes('flash_loan') || functionName.includes('fee')) {
    // Операции с комиссиями
    if (debugCallback) debugCallback(`[DEBUG] Обрабатываем операцию с комиссиями: ${functionName}`);
    
    // Ищем комиссии в событиях
    if (tx.events) {
      const feeEvents = tx.events.filter((event: any) => 
        event.type?.includes('Fee') ||
        event.type?.includes('Commission') ||
        event.type?.includes('Charge')
      );
      
      if (debugCallback) debugCallback(`[DEBUG] Найдено ${feeEvents.length} событий с комиссиями: ${JSON.stringify(feeEvents, null, 2)}`);
      
      for (const event of feeEvents) {
        if (event.data?.amount || event.data?.fee || event.data?.commission) {
          const feeAmount = event.data.amount || event.data.fee || event.data.commission;
          amount = parseFloat(feeAmount) / Math.pow(10, decimals);
          if (debugCallback) debugCallback(`[DEBUG] Извлеченная комиссия из события: ${amount} ${token}`);
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
          if (debugCallback) debugCallback(`[DEBUG] Извлеченная комиссия из изменений состояния: ${amount} ${token}`);
          break;
        }
      }
    }
  }
  
  if (debugCallback) debugCallback(`[DEBUG] extractEchelonAmount возвращает: ${amount} ${token} (decimals: ${decimals})`);
  if (debugCallback) debugCallback(`[DEBUG] Финальный токен: ${token}, сумма: ${amount}, decimals: ${decimals}`);
  if (debugCallback) debugCallback('[DEBUG] === КОНЕЦ extractEchelonAmount ===');
  return { amount, token, decimals };
}

/**
 * Извлечение суммы для протокола Joule
 */
function extractJouleAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  console.log('[DEBUG] extractJouleAmount вызвана');
  console.log('[DEBUG] Функция:', tx.payload?.function);
  console.log('[DEBUG] Events count:', tx.events?.length || 0);
  
  let amount = 0;
  let token = 'APT';
  let decimals = getTokenDecimals('APT');
  
  if (!tx.events || !Array.isArray(tx.events)) {
    console.log('[DEBUG] extractJouleAmount - нет событий, возвращаем значения по умолчанию');
    return { amount, token, decimals };
  }
  
  const functionName = tx.payload?.function || '';
  
  // Специальная обработка для конкретной транзакции
  if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
    console.log('[DEBUG] === СПЕЦИАЛЬНАЯ ОБРАБОТКА В extractJouleAmount ===');
    console.log('[DEBUG] Все события:', JSON.stringify(tx.events, null, 2));
    console.log('[DEBUG] Все изменения:', JSON.stringify(tx.changes, null, 2));
    console.log('[DEBUG] Payload:', JSON.stringify(tx.payload, null, 2));
  }
  
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
  
  console.log('[DEBUG] extractJouleAmount возвращает:', { amount, token, decimals });
  return { amount, token, decimals };
}

/**
 * Извлечение суммы для протокола Hyperion
 */
function extractHyperionAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  console.log('[DEBUG] extractHyperionAmount вызвана');
  console.log('[DEBUG] Функция:', tx.payload?.function);
  console.log('[DEBUG] Events count:', tx.events?.length || 0);
  console.log('[DEBUG] Changes count:', tx.changes?.length || 0);
  
  let amount = 0;
  let token = 'APT';
  let decimals = getTokenDecimals('APT');
  
  if (!tx.events || !Array.isArray(tx.events)) {
    console.log('[DEBUG] Нет событий, возвращаем значения по умолчанию');
    return { amount, token, decimals };
  }
  
  const functionName = tx.payload?.function || '';
  
  // Специальная обработка для конкретной транзакции - определяем токен из всех возможных источников
  if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
    console.log('[DEBUG] === ОПРЕДЕЛЕНИЕ ТОКЕНА ДЛЯ КОНКРЕТНОЙ ТРАНЗАКЦИИ ===');
    
    // Проверяем все возможные источники токена
    console.log('[DEBUG] 1. Проверяем payload function:', functionName);
    console.log('[DEBUG] 2. Проверяем payload type_arguments:', tx.payload?.type_arguments);
    console.log('[DEBUG] 3. Проверяем payload arguments:', tx.payload?.arguments);
    
    // Ищем stAPT в function name
    if (functionName.includes('stapt') || functionName.includes('StakedApt')) {
      token = 'stAPT';
      decimals = getTokenDecimals('stAPT');
      console.log('[DEBUG] Определен stAPT из function name');
    }
    
    // Ищем stAPT в type_arguments
    if (tx.payload?.type_arguments) {
      for (const typeArg of tx.payload.type_arguments) {
        if (typeArg.includes('stapt') || typeArg.includes('StakedApt')) {
          token = 'stAPT';
          decimals = getTokenDecimals('stAPT');
          console.log('[DEBUG] Определен stAPT из type_arguments');
          break;
        }
      }
    }
    
    console.log('[DEBUG] === КОНЕЦ ОПРЕДЕЛЕНИЯ ТОКЕНА ===');
  }
  
  // Специальная обработка для конкретной транзакции - извлекаем сумму из всех возможных источников
  if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
    console.log('[DEBUG] === ИЗВЛЕЧЕНИЕ СУММЫ ДЛЯ КОНКРЕТНОЙ ТРАНЗАКЦИИ ===');
    
    // Ищем сумму во всех событиях
    tx.events.forEach((event: any, index: number) => {
      if (event.data?.amount || event.data?.amount_in || event.data?.amount_out) {
        console.log(`[DEBUG] Событие ${index} с суммой:`, {
          type: event.type,
          amount: event.data.amount,
          amount_in: event.data.amount_in,
          amount_out: event.data.amount_out,
          data: event.data
        });
      }
    });
    
    // Ищем сумму в аргументах
    if (tx.payload?.arguments) {
      tx.payload.arguments.forEach((arg: any, index: number) => {
        if (typeof arg === 'string' && !isNaN(parseFloat(arg))) {
          console.log(`[DEBUG] Аргумент ${index} с числом:`, arg);
        }
      });
    }
    
    console.log('[DEBUG] === КОНЕЦ ИЗВЛЕЧЕНИЯ СУММЫ ===');
  }
  
  // Вспомогательная функция для получения информации о токене
  const getTokenInfo = (tokenIdentifier: string) => {
    const tokenInfo = getTokenInfoByCoinName(tokenIdentifier);
    if (tokenInfo) {
      return { token: tokenInfo.symbol, decimals: tokenInfo.decimals };
    }
    return { token: 'APT', decimals: 8 };
  };
  
      // Определяем токен из изменений состояния (changes) - более надежный способ для Hyperion
    if (tx.changes) {
      // Специальная обработка для конкретной транзакции
      if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
        console.log('[DEBUG] Анализируем изменения для определения токена...');
        tx.changes.forEach((change: any, index: number) => {
          console.log(`[DEBUG] Изменение ${index}:`, {
            type: change.data?.type,
            data: change.data?.data,
            address: change.address
          });
        });
      }
      
      // Ищем изменения в FungibleStore для определения токена
      const fungibleStoreChanges = tx.changes.filter((change: any) => 
        change.data?.type?.includes('fungible_asset::FungibleStore') ||
        change.data?.type?.includes('fungible_asset::Metadata')
      );
    
    for (const change of fungibleStoreChanges) {
      if (change.data?.type?.includes('Metadata') && change.data?.data?.symbol) {
        const symbol = change.data.data.symbol;
        const tokenInfo = getTokenInfoByCoinName(symbol);
        if (tokenInfo) {
          token = tokenInfo.symbol;
          decimals = tokenInfo.decimals;
          break;
        }
      }
    }
    
    // Если не нашли в Metadata, ищем по адресу токена
    if (token === 'APT') {
      for (const change of fungibleStoreChanges) {
        if (change.data?.type?.includes('FungibleStore') && change.data?.data?.metadata?.inner) {
          const tokenAddress = change.data.data.metadata.inner;
          console.log('[DEBUG] Найден адрес токена в FungibleStore:', tokenAddress);
          const tokenInfo = getTokenInfoByCoinName(tokenAddress);
          if (tokenInfo) {
            token = tokenInfo.symbol;
            decimals = tokenInfo.decimals;
            console.log('[DEBUG] Определен токен из FungibleStore:', token, decimals);
            break;
          }
        }
      }
    }
    
    // Специальная обработка для конкретной транзакции - ищем токен в событиях
    if (token === 'APT' && tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
      console.log('[DEBUG] Ищем токен в событиях...');
      tx.events.forEach((event: any, index: number) => {
        console.log(`[DEBUG] Событие ${index}:`, {
          type: event.type,
          data: event.data
        });
        
        // Ищем токен в типе события
        if (event.type && event.type.includes('<')) {
          const typeMatch = event.type.match(/<([^>]+)>/);
          if (typeMatch) {
            const tokenType = typeMatch[1];
            console.log('[DEBUG] Найден тип токена в событии:', tokenType);
            
            if (tokenType.includes('stapt::StakedApt') || tokenType.includes('stapt_token::StakedApt')) {
              token = 'stAPT';
              decimals = getTokenDecimals('stAPT');
              console.log('[DEBUG] Определен stAPT из типа события');
            }
          }
        }
      });
      
      // Ищем токен в type_arguments payload
      if (tx.payload?.type_arguments && tx.payload.type_arguments.length > 0) {
        console.log('[DEBUG] Type arguments в payload:', tx.payload.type_arguments);
        tx.payload.type_arguments.forEach((typeArg: string, index: number) => {
          console.log(`[DEBUG] Type argument ${index}:`, typeArg);
          if (typeArg.includes('stapt::StakedApt') || typeArg.includes('stapt_token::StakedApt')) {
            token = 'stAPT';
            decimals = getTokenDecimals('stAPT');
            console.log('[DEBUG] Определен stAPT из type_arguments');
          }
        });
      }
      
      // Ищем токен в аргументах функции
      if (tx.payload?.arguments && tx.payload.arguments.length > 0) {
        console.log('[DEBUG] Arguments в payload:', tx.payload.arguments);
        tx.payload.arguments.forEach((arg: any, index: number) => {
          console.log(`[DEBUG] Argument ${index}:`, arg);
          if (typeof arg === 'string' && arg.includes('0x')) {
            const tokenInfo = getTokenInfoByCoinName(arg);
            if (tokenInfo) {
              console.log('[DEBUG] Найден токен в аргументах:', tokenInfo.symbol);
            }
          }
        });
      }
    }
  }
  
  // Обрабатываем разные типы операций Hyperion
  if (functionName.includes('remove_liquidity')) {
    // Операция удаления ликвидности
    const removeLiquidityEvents = tx.events.filter((event: any) => 
      event.type?.includes('RemoveLiquidityEventV3')
    );
    
    const depositEvents = tx.events.filter((event: any) => 
      event.type === '0x1::fungible_asset::Deposit'
    );
    
    // Приоритет: основная операция удаления ликвидности
    for (const event of removeLiquidityEvents) {
      if (event.data?.amount) {
        amount = parseFloat(event.data.amount);
        amount = amount / Math.pow(10, decimals);
        break;
      }
    }
    
    // Если не нашли в RemoveLiquidityEventV3, ищем в Deposit событиях
    if (amount === 0) {
      for (const depositEvent of depositEvents) {
        if (depositEvent.data?.amount && depositEvent.data?.store?.includes(userAddress)) {
          amount = parseFloat(depositEvent.data.amount);
          amount = amount / Math.pow(10, decimals);
          break;
        }
      }
    }
    
  } else if (functionName.includes('add_liquidity')) {
    // Операция добавления ликвидности
    const addLiquidityEvents = tx.events.filter((event: any) => 
      event.type?.includes('AddLiquidityEventV3')
    );
    
    const withdrawEvents = tx.events.filter((event: any) => 
      event.type === '0x1::fungible_asset::Withdraw'
    );
    
    // Приоритет: основная операция добавления ликвидности
    for (const event of addLiquidityEvents) {
      if (event.data?.amount) {
        amount = parseFloat(event.data.amount);
        amount = amount / Math.pow(10, decimals);
        break;
      }
    }
    
    // Если не нашли в AddLiquidityEventV3, ищем в Withdraw событиях
    if (amount === 0) {
      for (const withdrawEvent of withdrawEvents) {
        if (withdrawEvent.data?.amount && withdrawEvent.data?.store?.includes(userAddress)) {
          amount = parseFloat(withdrawEvent.data.amount);
          amount = amount / Math.pow(10, decimals);
          break;
        }
      }
    }
    
  } else if (functionName.includes('swap')) {
    // Операция свопа
    console.log('[DEBUG] Обрабатываем swap транзакцию');
    console.log('[DEBUG] Events:', tx.events);
    console.log('[DEBUG] Changes:', tx.changes);
    
    // Специальная обработка для конкретной транзакции
    if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
      console.log('[DEBUG] === СПЕЦИАЛЬНАЯ ОБРАБОТКА SWAP ТРАНЗАКЦИИ ===');
      console.log('[DEBUG] Все события:', JSON.stringify(tx.events, null, 2));
      console.log('[DEBUG] Все изменения:', JSON.stringify(tx.changes, null, 2));
      console.log('[DEBUG] Payload:', JSON.stringify(tx.payload, null, 2));
    }
    
    const swapEvents = tx.events.filter((event: any) => 
      event.type?.includes('SwapEvent')
    );
    
    console.log('[DEBUG] Найденные SwapEvent:', swapEvents);
    
    if (swapEvents.length > 0) {
      const swapEvent = swapEvents[0];
      console.log('[DEBUG] SwapEvent data:', swapEvent.data);
      
      // Пытаемся определить токен из SwapEvent
      if (swapEvent.data?.token_in) {
        const tokenIn = swapEvent.data.token_in;
        console.log('[DEBUG] Token in from SwapEvent:', tokenIn);
        
        // Определяем токен из token_in
        if (tokenIn.inner) {
          const tokenInfo = getTokenInfoByCoinName(tokenIn.inner);
          if (tokenInfo) {
            token = tokenInfo.symbol;
            decimals = tokenInfo.decimals;
            console.log('[DEBUG] Определен токен из token_in:', token, decimals);
          }
        }
      }
      
      if (swapEvent.data?.amount_in) {
        amount = parseFloat(swapEvent.data.amount_in);
        amount = amount / Math.pow(10, decimals);
        console.log('[DEBUG] Извлеченная сумма для swap:', amount, token);
      }
      
      // Специальная обработка для конкретной транзакции
      if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
        console.log('[DEBUG] SwapEvent data детально:', JSON.stringify(swapEvent.data, null, 2));
        console.log('[DEBUG] amount_in:', swapEvent.data?.amount_in);
        console.log('[DEBUG] token_in:', swapEvent.data?.token_in);
        console.log('[DEBUG] amount_out:', swapEvent.data?.amount_out);
        console.log('[DEBUG] token_out:', swapEvent.data?.token_out);
      }
    }
    
    // Если не нашли в SwapEvent, ищем в других событиях
    if (amount === 0) {
      console.log('[DEBUG] Ищем сумму в других событиях для swap');
      
      const depositEvents = tx.events.filter((event: any) => 
        event.type === '0x1::fungible_asset::Deposit'
      );
      
      const withdrawEvents = tx.events.filter((event: any) => 
        event.type === '0x1::fungible_asset::Withdraw'
      );
      
      console.log('[DEBUG] Deposit events:', depositEvents);
      console.log('[DEBUG] Withdraw events:', withdrawEvents);
      
      // Для swap берем сумму из Withdraw (токены, которые были потрачены)
      for (const withdrawEvent of withdrawEvents) {
        if (withdrawEvent.data?.amount && withdrawEvent.data?.store?.includes(userAddress)) {
          amount = parseFloat(withdrawEvent.data.amount);
          amount = amount / Math.pow(10, decimals);
          console.log('[DEBUG] Найдена сумма в Withdraw event:', amount, token);
          break;
        }
      }
      
      // Специальная обработка для конкретной транзакции
      if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
        console.log('[DEBUG] Анализируем все события для поиска суммы...');
        tx.events.forEach((event: any, index: number) => {
          if (event.data?.amount) {
            console.log(`[DEBUG] Событие ${index} с amount:`, {
              type: event.type,
              amount: event.data.amount,
              store: event.data.store
            });
          }
        });
      }
    }
  } else if (functionName.includes('claim')) {
    // Операция получения наград
    const claimFeesEvents = tx.events.filter((event: any) => 
      event.type?.includes('ClaimFeesEventV2')
    );
    
    for (const claimEvent of claimFeesEvents) {
      if (claimEvent.data?.amount) {
        const feeAmount = parseFloat(claimEvent.data.amount);
        const feeToken = claimEvent.data.token?.inner;
        
        if (feeToken) {
          const tokenInfo = getTokenInfoByCoinName(feeToken);
          if (tokenInfo) {
            return {
              amount: feeAmount / Math.pow(10, tokenInfo.decimals),
              token: tokenInfo.symbol,
              decimals: tokenInfo.decimals
            };
          }
        }
      }
    }
  }
  
  console.log('[DEBUG] extractHyperionAmount возвращает:', { amount, token, decimals });
  return { amount, token, decimals };
}

/**
 * Общая обработка для остальных протоколов
 */
function extractGenericAmount(tx: any, userAddress: string): { amount: number; token: string; decimals: number } {
  console.log('[DEBUG] extractGenericAmount вызвана');
  console.log('[DEBUG] Функция:', tx.payload?.function);
  console.log('[DEBUG] Events count:', tx.events?.length || 0);
  console.log('[DEBUG] Changes count:', tx.changes?.length || 0);
  
  let amount = 0;
  let token = 'APT';
  let decimals = getTokenDecimals('APT');
  
  if (!tx.events || !Array.isArray(tx.events)) {
    console.log('[DEBUG] extractGenericAmount - нет событий, возвращаем значения по умолчанию');
    return { amount, token, decimals };
  }
  
  // Специальная обработка для конкретной транзакции
  if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
    console.log('[DEBUG] === СПЕЦИАЛЬНАЯ ОБРАБОТКА В extractGenericAmount ===');
    console.log('[DEBUG] Все события:', JSON.stringify(tx.events, null, 2));
    console.log('[DEBUG] Все изменения:', JSON.stringify(tx.changes, null, 2));
    console.log('[DEBUG] Payload:', JSON.stringify(tx.payload, null, 2));
    
    // Детальный анализ всех событий для поиска суммы
    console.log('[DEBUG] === ДЕТАЛЬНЫЙ АНАЛИЗ СОБЫТИЙ ===');
    tx.events.forEach((event: any, index: number) => {
      console.log(`[DEBUG] Событие ${index}:`, {
        type: event.type,
        data: event.data,
        sequence_number: event.sequence_number,
        guid: event.guid
      });
      
      // Ищем любые числовые значения в данных события
      if (event.data) {
        const allKeys = Object.keys(event.data);
        console.log(`[DEBUG] Ключи в событии ${index}:`, allKeys);
        
        allKeys.forEach(key => {
          const value = event.data[key];
          if (typeof value === 'string' && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
            console.log(`[DEBUG] Найдено числовое значение в событии ${index}, ключ ${key}:`, value);
          }
        });
      }
    });
    
    // Детальный анализ всех изменений для поиска суммы
    console.log('[DEBUG] === ДЕТАЛЬНЫЙ АНАЛИЗ ИЗМЕНЕНИЙ ===');
    if (tx.changes) {
      tx.changes.forEach((change: any, index: number) => {
        console.log(`[DEBUG] Изменение ${index}:`, {
          type: change.data?.type,
          data: change.data?.data,
          address: change.address,
          resource: change.resource
        });
        
        // Ищем любые числовые значения в данных изменения
        if (change.data?.data) {
          const allKeys = Object.keys(change.data.data);
          console.log(`[DEBUG] Ключи в изменении ${index}:`, allKeys);
          
          allKeys.forEach(key => {
            const value = change.data.data[key];
            if (typeof value === 'string' && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
              console.log(`[DEBUG] Найдено числовое значение в изменении ${index}, ключ ${key}:`, value);
            }
          });
        }
      });
    }
    
    console.log('[DEBUG] === КОНЕЦ ДЕТАЛЬНОГО АНАЛИЗА ===');
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
      
      // Специальная обработка для конкретной транзакции
      if (tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
        console.log('[DEBUG] Найдено событие с суммой:', {
          eventType: event.type,
          amountData,
          parsedAmount: amount,
          token,
          decimals
        });
      }
    }
  }
  
  // Специальная обработка для конкретной транзакции - если не найдено событий с суммой
  if (amountEvents.length === 0 && tx.hash === '0xf96adf5f9270a8e6d1f0bcca38d6678ed4153e0289474d1832ff4394f1cb043f') {
    console.log('[DEBUG] Не найдено событий с суммой, анализируем все события...');
    
    // Ищем токен в type_arguments payload
    if (tx.payload?.type_arguments && tx.payload.type_arguments.length > 0) {
      console.log('[DEBUG] Type arguments в payload:', tx.payload.type_arguments);
      tx.payload.type_arguments.forEach((typeArg: string, index: number) => {
        console.log(`[DEBUG] Type argument ${index}:`, typeArg);
        if (typeArg.includes('stapt::StakedApt') || typeArg.includes('stapt_token::StakedApt')) {
          token = 'stAPT';
          decimals = getTokenDecimals('stAPT');
          console.log('[DEBUG] Определен stAPT из type_arguments в extractGenericAmount');
        }
      });
    }
    
    // Ищем токен в function name
    if (tx.payload?.function && (tx.payload.function.includes('stapt') || tx.payload.function.includes('StakedApt'))) {
      token = 'stAPT';
      decimals = getTokenDecimals('stAPT');
      console.log('[DEBUG] Определен stAPT из function name в extractGenericAmount');
    }
  }
  
  // Специальная обработка для swap транзакций
  if ((tx.payload?.function && tx.payload.function.includes('swap')) || 
      (tx.payload?.function === undefined && tx.payload?.type === 'entry_function_payload')) {
    console.log('[DEBUG] Обрабатываем swap транзакцию');
    
    // Если функция не определена, пытаемся определить тип операции по событиям
    if (!tx.payload?.function) {
      console.log('[DEBUG] Функция не определена, анализируем события для определения типа операции...');
      
      const hasSwapEvents = tx.events.some((event: any) => 
        event.type.includes('swap') || 
        event.type.includes('Swap') ||
        event.type.includes('trade') ||
        event.type.includes('Trade')
      );
      
      if (!hasSwapEvents) {
        console.log('[DEBUG] Не найдены swap события, возвращаем значения по умолчанию');
        return { amount, token, decimals };
      }
    }
    
    // Ищем события swap
    const swapEvents = tx.events.filter((event: any) => 
      event.type.includes('swap') || 
      event.type.includes('Swap') ||
      event.type.includes('trade') ||
      event.type.includes('Trade')
    );
    
    if (swapEvents.length > 0) {
      const swapEvent = swapEvents[0];
      console.log('[DEBUG] Найдено swap событие:', swapEvent);
      
      // Ищем сумму в swap событии
      if (swapEvent.data) {
        const swapAmounts = [
          swapEvent.data.amount_in,
          swapEvent.data.amount_out,
          swapEvent.data.amount,
          swapEvent.data.value,
          swapEvent.data.quantity
        ];
        
        for (const swapAmount of swapAmounts) {
          if (swapAmount && !isNaN(parseFloat(swapAmount))) {
            console.log('[DEBUG] Найдена сумма в swap событии:', {
              eventType: swapEvent.type,
              amount: swapAmount,
              parsed: parseFloat(swapAmount)
            });
            amount = parseFloat(swapAmount) / Math.pow(10, decimals);
            break;
          }
        }
      }
    }
    
    // Если не нашли в swap событиях, ищем в любых событиях с суммой
    if (amount === 0) {
      console.log('[DEBUG] Не найдена сумма в swap событиях, ищем в других событиях...');
      
      // Ищем в changes для определения суммы
      if (tx.changes && tx.changes.length > 0) {
        console.log('[DEBUG] Анализируем changes для поиска суммы...');
        tx.changes.forEach((change: any, index: number) => {
          console.log(`[DEBUG] Change ${index}:`, change);
          
          // Ищем изменения в CoinStore или FungibleStore
          if (change.data?.type?.includes('CoinStore') || change.data?.type?.includes('FungibleStore')) {
            if (change.data?.data?.coin?.value) {
              const coinValue = parseFloat(change.data.data.coin.value);
              if (!isNaN(coinValue) && coinValue > 0) {
                console.log('[DEBUG] Найдена сумма в CoinStore change:', coinValue);
                amount = coinValue / Math.pow(10, decimals);
              }
            }
          }
        });
      }
      
      // Ищем сумму во всех событиях
      tx.events.forEach((event: any, index: number) => {
        console.log(`[DEBUG] Событие ${index}:`, {
          type: event.type,
          data: event.data
        });
        
        // Ищем токен в типе события
        if (event.type && event.type.includes('<')) {
          const typeMatch = event.type.match(/<([^>]+)>/);
          if (typeMatch) {
            const tokenType = typeMatch[1];
            console.log('[DEBUG] Найден тип токена в событии:', tokenType);
            
            if (tokenType.includes('stapt::StakedApt') || tokenType.includes('stapt_token::StakedApt')) {
              token = 'stAPT';
              decimals = getTokenDecimals('stAPT');
              console.log('[DEBUG] Определен stAPT из типа события в extractGenericAmount');
            }
          }
        }
        
        // Ищем сумму в данных события
        if (event.data) {
          const possibleAmounts = [
            event.data.amount,
            event.data.value,
            event.data.coin_amount,
            event.data.amount_in,
            event.data.amount_out,
            event.data.quantity,
            event.data.volume
          ];
          
          for (const possibleAmount of possibleAmounts) {
            if (possibleAmount && !isNaN(parseFloat(possibleAmount))) {
              console.log('[DEBUG] Найдена возможная сумма в событии:', {
                eventType: event.type,
                amount: possibleAmount,
                parsed: parseFloat(possibleAmount)
              });
              amount = parseFloat(possibleAmount) / Math.pow(10, decimals);
              break;
            }
          }
        }
      });
    }
  } else {
    // Обычная обработка для не-swap транзакций
    tx.events.forEach((event: any, index: number) => {
      console.log(`[DEBUG] Событие ${index}:`, {
        type: event.type,
        data: event.data
      });
      
      // Ищем токен в типе события
      if (event.type && event.type.includes('<')) {
        const typeMatch = event.type.match(/<([^>]+)>/);
        if (typeMatch) {
          const tokenType = typeMatch[1];
          console.log('[DEBUG] Найден тип токена в событии:', tokenType);
          
          if (tokenType.includes('stapt::StakedApt') || tokenType.includes('stapt_token::StakedApt')) {
            token = 'stAPT';
            decimals = getTokenDecimals('stAPT');
            console.log('[DEBUG] Определен stAPT из типа события в extractGenericAmount');
          }
        }
      }
      
      // Ищем сумму в данных события
      if (event.data) {
        const possibleAmounts = [
          event.data.amount,
          event.data.value,
          event.data.coin_amount,
          event.data.amount_in,
          event.data.amount_out,
          event.data.quantity,
          event.data.volume
        ];
        
        for (const possibleAmount of possibleAmounts) {
          if (possibleAmount && !isNaN(parseFloat(possibleAmount))) {
            console.log('[DEBUG] Найдена возможная сумма в событии:', {
              eventType: event.type,
              amount: possibleAmount,
              parsed: parseFloat(possibleAmount)
            });
            amount = parseFloat(possibleAmount) / Math.pow(10, decimals);
            break;
          }
        }
      }
    });
  }
  
  console.log('[DEBUG] extractGenericAmount возвращает:', { amount, token, decimals });
  return { amount, token, decimals };
}

/**
 * Получает информацию о токене по coin_name или названию токена
 */
export function getTokenInfoByCoinName(coinName: string, debugCallback?: (message: string) => void): { name: string; symbol: string; decimals: number } | null {
  if (!coinName) return null;
  
  if (debugCallback) debugCallback(`[DEBUG] getTokenInfoByCoinName вызвана с: ${coinName}`);
  
  // Специальная обработка для известных адресов stAPT
  if (coinName.includes('stapt') || coinName.includes('StakedApt') || coinName.includes('0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627')) {
    if (debugCallback) debugCallback(`[DEBUG] Обнаружен stAPT адрес: ${coinName}`);
    return { name: 'Staked Aptos Coin', symbol: 'stAPT', decimals: 8 };
  }
  
  // Убираем префикс @ если есть
  const normalizedCoinName = coinName.replace(/^@/, '');
  if (debugCallback) debugCallback(`[DEBUG] Нормализованное имя: ${normalizedCoinName}`);
  
  // Сначала ищем токен в списке по faAddress
  let token = tokenList.data.data.find((token: any) => {
    return token.faAddress === normalizedCoinName;
  });
  
  if (token) {
    if (debugCallback) debugCallback(`[DEBUG] Найден токен по faAddress: ${token.symbol}`);
    return {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals
    };
  }
  
  // Если не нашли по faAddress, ищем по tokenAddress
  if (!token) {
    token = tokenList.data.data.find((token: any) => {
      return token.tokenAddress === normalizedCoinName;
    });
  }
  
  if (token) {
    if (debugCallback) debugCallback(`[DEBUG] Найден токен по tokenAddress: ${token.symbol}`);
    return {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals
    };
  }
  
  // Если не нашли по tokenAddress, ищем по названию токена
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
    if (debugCallback) debugCallback(`[DEBUG] Найден токен по частичному совпадению: ${token.symbol}`);
    return {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals
    };
  }
  
  // Специальная обработка для известных токенов
  if (!token) {
    if (debugCallback) debugCallback(`[DEBUG] Пробуем специальную обработку для: ${normalizedCoinName}`);
    // Проверяем известные FA адреса
    if (normalizedCoinName === '0xa') {
      if (debugCallback) debugCallback('[DEBUG] Найден APT по специальной обработке');
      return { name: 'Aptos Coin', symbol: 'APT', decimals: 8 };
    }
    if (normalizedCoinName === '0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627') {
      if (debugCallback) debugCallback('[DEBUG] Найден stAPT по специальной обработке');
      return { name: 'Staked Aptos Coin', symbol: 'stAPT', decimals: 8 };
    }
    if (normalizedCoinName === '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b') {
      if (debugCallback) debugCallback('[DEBUG] Найден USDt по специальной обработке');
      return { name: 'Tether USD', symbol: 'USDt', decimals: 6 };
    }
    if (normalizedCoinName === '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b') {
      if (debugCallback) debugCallback('[DEBUG] Найден USDC по специальной обработке');
      return { name: 'USDC', symbol: 'USDC', decimals: 6 };
    }
    if (normalizedCoinName === '0xa0d9d647c5737a5aed08d2cfeb39c31cf901d44bc4aa024eaa7e5e68b804e011') {
      if (debugCallback) debugCallback('[DEBUG] Найден thAPT по специальной обработке');
      return { name: 'Thala APT', symbol: 'thAPT', decimals: 8 };
    }
    if (normalizedCoinName === '0x0a9ce1bddf93b074697ec5e483bc5050bc64cff2acd31e1ccfd8ac8cae5e4abe') {
      if (debugCallback) debugCallback('[DEBUG] Найден sthAPT по специальной обработке');
      return { name: 'Staked Thala APT', symbol: 'sthAPT', decimals: 8 };
    }
  }
  
  if (debugCallback) debugCallback(`[DEBUG] Токен не найден для: ${coinName}`);
  return null;
}

/**
 * Определяет токен из события или аргументов
 */
function determineTokenFromEvent(event: any, typeArguments: string[], debugCallback?: (message: string) => void): string {
  if (debugCallback) debugCallback(`[DEBUG] determineTokenFromEvent вызвана с: ${JSON.stringify({ eventType: event.type, typeArguments })}`);
  
  // Пытаемся определить токен из типа события
  if (event.type) {
    const typeMatch = event.type.match(/<([^>]+)>/);
    if (typeMatch) {
      const tokenType = typeMatch[1];
      if (debugCallback) debugCallback(`[DEBUG] Найден тип токена в событии: ${tokenType}`);
      
      if (tokenType.includes('aptos_coin::AptosCoin')) {
        if (debugCallback) debugCallback('[DEBUG] Определен APT из типа события');
        return 'APT';
      }
      if (tokenType.includes('usda::USDA')) {
        if (debugCallback) debugCallback('[DEBUG] Определен USDA из типа события');
        return 'USDA';
      }
      if (tokenType.includes('stapt::StakedApt') || tokenType.includes('stapt_token::StakedApt')) {
        if (debugCallback) debugCallback('[DEBUG] Определен stAPT из типа события');
        return 'stAPT';
      }
      if (tokenType.includes('usde::USDe')) {
        if (debugCallback) debugCallback('[DEBUG] Определен USDe из типа события');
        return 'USDe';
      }
      if (tokenType.includes('staked_usde::StakedUSDe')) {
        if (debugCallback) debugCallback('[DEBUG] Определен sUSDe из типа события');
        return 'sUSDe';
      }
      if (tokenType.includes('staking::ThalaAPT')) {
        if (debugCallback) debugCallback('[DEBUG] Определен thAPT из типа события');
        return 'thAPT';
      }
      if (tokenType.includes('staking::StakedThalaAPT')) {
        if (debugCallback) debugCallback('[DEBUG] Определен sthAPT из типа события');
        return 'sthAPT';
      }
      // Добавьте другие токены по необходимости
    }
  }
  
  // Пытаемся определить из type_arguments
  if (typeArguments && typeArguments.length > 0) {
    const tokenType = typeArguments[0];
    if (tokenType.includes('aptos_coin::AptosCoin')) return 'APT';
    if (tokenType.includes('usda::USDA')) return 'USDA';
    if (tokenType.includes('stapt::StakedApt') || tokenType.includes('stapt_token::StakedApt')) return 'stAPT';
    if (tokenType.includes('usde::USDe')) return 'USDe';
    if (tokenType.includes('staked_usde::StakedUSDe')) return 'sUSDe';
    if (tokenType.includes('staking::ThalaAPT')) return 'thAPT';
    if (tokenType.includes('staking::StakedThalaAPT')) return 'sthAPT';
  }
  
  if (debugCallback) debugCallback('[DEBUG] determineTokenFromEvent возвращает APT по умолчанию');
  return 'APT'; // По умолчанию
}

/**
 * Получает количество десятичных знаков для токена
 */
function getTokenDecimals(token: string, debugCallback?: (message: string) => void): number {
  if (debugCallback) debugCallback(`[DEBUG] getTokenDecimals вызвана с: ${token}`);
  
  const decimalsMap: { [key: string]: number } = {
    'APT': 8,
    'USDA': 6,
    'stAPT': 8,
    'amAPT': 8,
    'USDe': 6,
    'sUSDe': 6,
    'USDC': 6,
    'USDt': 6,
    'WBTC': 8,
    'thAPT': 8,
    'sthAPT': 8,
    'kAPT': 8,
    // Добавьте другие токены по необходимости
  };
  
  const decimals = decimalsMap[token] || 8; // По умолчанию 8
  if (debugCallback) debugCallback(`[DEBUG] getTokenDecimals возвращает: ${decimals}`);
  return decimals;
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