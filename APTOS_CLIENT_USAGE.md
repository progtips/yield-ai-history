# Использование Aptos Client

## Обзор

Создан новый клиент Aptos с использованием `@aptos-labs/ts-sdk` для работы с блокчейном Aptos. Клиент поддерживает работу с разными сетями (mainnet, testnet, devnet) и предоставляет удобную фабрику для создания экземпляров.

## Основные файлы

### `src/lib/aptos.ts`
Основной файл с фабрикой клиента и утилитами.

### `src/lib/aptos/examples.ts`
Примеры использования клиента для различных операций.

## Использование

### 1. Создание клиента

```typescript
import { makeAptos, type AptosNetwork } from '@/lib/aptos';

// Создание клиента для конкретной сети
const aptosClient = makeAptos('mainnet');
const testnetClient = makeAptos('testnet');
const devnetClient = makeAptos('devnet');
```

### 2. Получение информации об аккаунте

```typescript
import { getAccountInfo, getAccountBalance } from '@/lib/aptos/examples';

// Получение информации об аккаунте
const accountInfo = await getAccountInfo(address, 'mainnet');

// Получение баланса APT
const balance = await getAccountBalance(address, 'mainnet');
```

### 3. Получение ресурсов и модулей

```typescript
import { getAccountResources, getAccountModules } from '@/lib/aptos/examples';

// Получение всех ресурсов аккаунта
const resources = await getAccountResources(address, 'mainnet');

// Получение всех модулей аккаунта
const modules = await getAccountModules(address, 'mainnet');
```

### 4. Работа с транзакциями

```typescript
import { getAccountTransactions, getTransaction } from '@/lib/aptos/examples';

// Получение транзакций аккаунта
const transactions = await getAccountTransactions(address, 'mainnet', 10);

// Получение информации о конкретной транзакции
const transaction = await getTransaction(txHash, 'mainnet');
```

### 5. Утилиты

```typescript
import { 
  isValidAptosAddress, 
  formatAptosAddress, 
  aptToOcta, 
  octaToApt 
} from '@/lib/aptos';

// Валидация адреса
const isValid = isValidAptosAddress('0x123...');

// Форматирование адреса для отображения
const formatted = formatAptosAddress('0x1234567890abcdef...', 6);
// Результат: "0x1234...cdef"

// Конвертация APT в Octa
const octa = aptToOcta(1.5); // 150000000n

// Конвертация Octa в APT
const apt = octaToApt('150000000'); // 1.5
```

## Конфигурация сети

### Переменные окружения

Создайте файл `.env.local` с настройками:

```bash
# Сеть по умолчанию
NEXT_PUBLIC_APTOS_NETWORK=mainnet

# URL для RPC
NEXT_PUBLIC_APTOS_RPC_URL=https://fullnode.mainnet.aptoslabs.com

# URL для Indexer
NEXT_PUBLIC_APTOS_INDEXER_URL=https://indexer.mainnet.aptoslabs.com/v1/graphql
```

### Динамическое переключение сети

```typescript
import { makeAptos, type AptosNetwork } from '@/lib/aptos';

// В компоненте React
const [network, setNetwork] = useState<AptosNetwork>('mainnet');
const aptosClient = makeAptos(network);

// При изменении сети клиент автоматически пересоздается
const handleNetworkChange = (newNetwork: AptosNetwork) => {
  setNetwork(newNetwork);
  // aptosClient автоматически обновится
};
```

## Конфигурации сетей

Доступные конфигурации сетей:

```typescript
import { NETWORK_CONFIGS } from '@/lib/aptos';

console.log(NETWORK_CONFIGS.mainnet);
// {
//   name: 'Mainnet',
//   rpcUrl: 'https://fullnode.mainnet.aptoslabs.com',
//   faucetUrl: 'https://faucet.mainnet.aptoslabs.com',
//   explorerUrl: 'https://explorer.aptoslabs.com'
// }
```

## Обработка ошибок

Все функции из `examples.ts` включают обработку ошибок:

```typescript
import { getAccountInfo } from '@/lib/aptos/examples';

const accountInfo = await getAccountInfo(address, 'mainnet');
if (accountInfo) {
  // Успешное получение данных
  console.log(accountInfo);
} else {
  // Ошибка при получении данных
  console.error('Failed to get account info');
}
```

## Интеграция с существующим кодом

### Обновление страницы аккаунта

Страница аккаунта уже обновлена для использования нового клиента:

```typescript
// В src/app/explorer/account/[address]/page.tsx
import { makeAptos, type AptosNetwork } from '@/lib/aptos';

const [network, setNetwork] = useState<AptosNetwork>('mainnet');
const aptosClient = makeAptos(network);
```

### Использование в других компонентах

```typescript
import { makeAptos } from '@/lib/aptos';

function MyComponent() {
  const [network, setNetwork] = useState<AptosNetwork>('mainnet');
  const aptosClient = makeAptos(network);

  const handleGetBalance = async () => {
    try {
      const balance = await aptosClient.getAccountResource({
        accountAddress: address,
        resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      });
      console.log('Balance:', balance);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleGetBalance}>Get Balance</button>
    </div>
  );
}
```

## Преимущества нового клиента

1. **Типизация**: Полная поддержка TypeScript
2. **Гибкость**: Легкое переключение между сетями
3. **Производительность**: Оптимизированные запросы
4. **Надежность**: Встроенная обработка ошибок
5. **Удобство**: Простой API для работы с блокчейном

## Миграция с старого клиента

Если у вас есть код, использующий старый клиент Aptos, замените:

```typescript
// Старый способ
import { AptosClient } from 'aptos';
const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com');

// Новый способ
import { makeAptos } from '@/lib/aptos';
const client = makeAptos('mainnet');
```
