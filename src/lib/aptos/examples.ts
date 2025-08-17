import { makeAptos, type AptosNetwork } from '@/lib/aptos';

// Примеры использования фабрики клиента Aptos

/**
 * Пример получения баланса аккаунта
 */
export const getAccountBalance = async (address: string, network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const balance = await aptos.getAccountResource({
      accountAddress: address,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    });
    
    return balance;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    return null;
  }
};

/**
 * Пример получения информации об аккаунте
 */
export const getAccountInfo = async (address: string, network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const accountInfo = await aptos.getAccountInfo({
      accountAddress: address,
    });
    
    return accountInfo;
  } catch (error) {
    console.error('Failed to get account info:', error);
    return null;
  }
};

/**
 * Пример получения ресурсов аккаунта
 */
export const getAccountResources = async (address: string, network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const resources = await aptos.getAccountResources({
      accountAddress: address,
    });
    
    return resources;
  } catch (error) {
    console.error('Failed to get account resources:', error);
    return [];
  }
};

/**
 * Пример получения модулей аккаунта
 */
export const getAccountModules = async (address: string, network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const modules = await aptos.getAccountModules({
      accountAddress: address,
    });
    
    return modules;
  } catch (error) {
    console.error('Failed to get account modules:', error);
    return [];
  }
};

/**
 * Пример получения транзакций аккаунта
 */
export const getAccountTransactions = async (
  address: string, 
  network: AptosNetwork,
  limit: number = 10
) => {
  const aptos = makeAptos(network);
  
  try {
    const transactions = await aptos.getAccountTransactions({
      accountAddress: address,
      options: {
        limit,
        order: 'desc',
      },
    });
    
    return transactions;
  } catch (error) {
    console.error('Failed to get account transactions:', error);
    return [];
  }
};

/**
 * Пример получения информации о транзакции
 */
export const getTransaction = async (txnHashOrVersion: string, network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const transaction = await aptos.getTransactionByHash({
      txnHash: txnHashOrVersion,
    });
    
    return transaction;
  } catch (error) {
    console.error('Failed to get transaction:', error);
    return null;
  }
};

/**
 * Пример получения информации о блоке
 */
export const getBlockByHeight = async (blockHeight: number, network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const block = await aptos.getBlockByHeight({
      blockHeight: BigInt(blockHeight),
    });
    
    return block;
  } catch (error) {
    console.error('Failed to get block:', error);
    return null;
  }
};

/**
 * Пример получения информации о сети
 */
export const getLedgerInfo = async (network: AptosNetwork) => {
  const aptos = makeAptos(network);
  
  try {
    const ledgerInfo = await aptos.getLedgerInfo();
    return ledgerInfo;
  } catch (error) {
    console.error('Failed to get ledger info:', error);
    return null;
  }
};
