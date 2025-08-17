import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Типы для сетей
export type AptosNetwork = 'mainnet' | 'testnet' | 'devnet';

// Фабрика для создания клиента Aptos
export const makeAptos = (net: AptosNetwork): Aptos => {
  const network = 
    net === 'mainnet' 
      ? Network.MAINNET 
      : net === 'testnet' 
        ? Network.TESTNET 
        : Network.DEVNET;

  return new Aptos(new AptosConfig({ network }));
};

// Получение сети из переменных окружения
export const getDefaultNetwork = (): AptosNetwork => {
  const envNetwork = process.env.NEXT_PUBLIC_APTOS_NETWORK;
  
  if (envNetwork === 'mainnet' || envNetwork === 'testnet' || envNetwork === 'devnet') {
    return envNetwork;
  }
  
  // По умолчанию используем mainnet
  return 'mainnet';
};

// Создание клиента с сетью по умолчанию
export const aptosClient = makeAptos(getDefaultNetwork());

// Утилиты для работы с сетями
export const NETWORK_CONFIGS = {
  mainnet: {
    name: 'Mainnet',
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com',
    faucetUrl: 'https://faucet.mainnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
  },
  testnet: {
    name: 'Testnet',
    rpcUrl: 'https://fullnode.testnet.aptoslabs.com',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
  },
  devnet: {
    name: 'Devnet',
    rpcUrl: 'https://fullnode.devnet.aptoslabs.com',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
  },
} as const;

// Получение конфигурации сети
export const getNetworkConfig = (network: AptosNetwork) => {
  return NETWORK_CONFIGS[network];
};

// Валидация адреса Aptos
export const isValidAptosAddress = (address: string): boolean => {
  // Aptos адрес должен быть 64 символа hex без 0x префикса
  const addressRegex = /^[0-9a-fA-F]{64}$/;
  return addressRegex.test(address);
};

// Форматирование адреса для отображения
export const formatAptosAddress = (address: string, length: number = 6): string => {
  if (!address || address.length < length * 2) {
    return address;
  }
  
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Конвертация APT в Octa (наименьшая единица)
export const aptToOcta = (apt: number): bigint => {
  return BigInt(Math.floor(apt * 100_000_000));
};

// Конвертация Octa в APT
export const octaToApt = (octa: bigint | string | number): number => {
  const octaBigInt = typeof octa === 'string' ? BigInt(octa) : BigInt(octa);
  return Number(octaBigInt) / 100_000_000;
};
