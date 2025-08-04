# Руководство по разработке Yield AI

## 🎯 Принципы разработки

### 1. Пользователь-центричность
- **Всегда думайте о пользователе**: Каждая функция должна решать реальную проблему
- **Простота превыше всего**: Сложные функции должны быть простыми в использовании
- **Консистентность**: Единообразный опыт во всем приложении

### 2. Безопасность
- **Никогда не храните приватные ключи**: Все подписи только локально
- **Валидация данных**: Проверяйте все входные данные
- **Обработка ошибок**: Понятные сообщения об ошибках

### 3. Производительность
- **Оптимизация загрузки**: Ленивая загрузка и кэширование
- **Минимизация запросов**: Объединяйте API вызовы
- **Мониторинг**: Отслеживайте производительность

### 4. Масштабируемость
- **Модульная архитектура**: Легко добавлять новые протоколы
- **Переиспользуемые компоненты**: Избегайте дублирования кода
- **Типизация**: Используйте TypeScript для безопасности

## 📋 Процесс разработки

### 1. Планирование новой функции

**Вопросы для анализа:**
- Какую проблему решает эта функция?
- Кто является целевым пользователем?
- Как это вписывается в общую архитектуру?
- Какие API endpoints нужны?
- Нужны ли новые UI компоненты?

**Документация:**
```markdown
## Функция: [История транзакций]


### Цель
[
Цель истории транзакций - определить доходность инвестиций в DeFi.

]

### Пользователи
[Кто будет использовать]

### Архитектура
[Как интегрируется в систему]

### API
[Новые endpoints]

### UI/UX
[Новые компоненты и интерфейс]
```

### 2. Структура кода

#### Компоненты
```typescript
// Всегда используйте TypeScript
interface ComponentProps {
  // Обязательные пропсы
  required: string;
  // Опциональные с дефолтными значениями
  optional?: number;
}

// Функциональные компоненты с типизацией
export const Component: React.FC<ComponentProps> = ({ 
  required, 
  optional = 0 
}) => {
  // Логика компонента
  return <div>{required}</div>;
};
```

#### Протоколы
```typescript
// Наследуйтесь от BaseProtocol
export class NewProtocol extends BaseProtocol {
  // Реализуйте обязательные методы
  async getPools(): Promise<Pool[]> {
    // Логика получения пулов
  }
  
  async getUserPositions(address: string): Promise<Position[]> {
    // Логика получения позиций
  }
}
```

#### API Endpoints
```typescript
// Используйте типизированные ответы
export async function GET(request: Request) {
  try {
    // Логика API
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Описание ошибки' }, 
      { status: 500 }
    );
  }
}
```

### 3. Именование

#### Файлы и папки
- **Компоненты**: PascalCase (`PositionCard.tsx`)
- **Утилиты**: camelCase (`formatAmount.ts`)
- **Константы**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Типы**: PascalCase (`PoolData.ts`)

#### Переменные и функции
- **Переменные**: camelCase (`userBalance`)
- **Функции**: camelCase (`calculateAPY`)
- **Константы**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Типы**: PascalCase (`UserPosition`)

### 4. Комментарии и документация

#### JSDoc для функций
```typescript
/**
 * Рассчитывает APY на основе депозита и доходности
 * @param deposit - Сумма депозита в токенах
 * @param reward - Ожидаемая награда в токенах
 * @param period - Период в днях
 * @returns APY в процентах
 */
export function calculateAPY(deposit: number, reward: number, period: number): number {
  // Логика расчета
}
```

#### Комментарии в коде
```typescript
// Сложная логика требует объяснения
const adjustedAmount = amount * (1 + slippageTolerance);

// TODO: Добавить валидацию для отрицательных значений
// FIXME: Исправить баг с округлением
// NOTE: Временное решение, заменить на API
```

## 🧪 Тестирование

### 1. Типы тестов

#### Unit тесты
- Тестируйте отдельные функции
- Используйте моки для внешних зависимостей
- Покрывайте edge cases

#### Integration тесты
- Тестируйте взаимодействие компонентов
- Проверяйте API endpoints
- Тестируйте пользовательские сценарии

#### E2E тесты
- Тестируйте полные пользовательские потоки
- Проверяйте интеграцию с кошельками
- Тестируйте транзакции

### 2. Тестовые данные
```typescript
// Создавайте реалистичные тестовые данные
export const mockPool: Pool = {
  id: 'test-pool-1',
  protocol: 'echelon',
  token: 'APT',
  apy: 12.5,
  tvl: 1000000,
  // ... остальные поля
};
```

## 🔧 Инструменты разработки

### 1. ESLint и Prettier
```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### 2. Git hooks
```bash
# pre-commit
npm run lint
npm run type-check

# commit-msg
# Проверка формата сообщений
```

### 3. VS Code настройки
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📦 Управление зависимостями

### 1. Добавление новых пакетов
```bash
# Основные зависимости
pnpm add package-name

# Dev зависимости
pnpm add -D package-name

# Проверяйте размер бандла
pnpm add -D bundle-analyzer
```

### 2. Обновление зависимостей
```bash
# Регулярно обновляйте зависимости
pnpm update

# Проверяйте уязвимости
pnpm audit
```

## 🚀 Деплой и мониторинг

### 1. Environment variables
```bash
# .env.local
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com
NEXT_PUBLIC_PANORA_API_URL=https://api.panora.exchange
```

### 2. Мониторинг
- **Vercel Analytics**: Отслеживание производительности
- **Error tracking**: Sentry для ошибок
- **User analytics**: Понимание поведения пользователей

## 🤝 Работа в команде

### 1. Code Review
- **Обязательный review**: Все PR должны быть проверены
- **Автоматические проверки**: CI/CD pipeline
- **Конструктивная обратная связь**: Фокус на улучшении кода

### 2. Документация
- **README**: Обновляйте при изменении API
- **Комментарии**: Объясняйте сложную логику
- **Changelog**: Ведите историю изменений

### 3. Коммуникация
- **Issues**: Используйте GitHub Issues для задач
- **Discussions**: Обсуждайте архитектурные решения
- **Regular sync**: Еженедельные встречи команды

## 🎯 Метрики качества

### 1. Код
- **TypeScript coverage**: 100% типизация
- **ESLint errors**: 0 ошибок
- **Test coverage**: >80% покрытие

### 2. Производительность
- **Lighthouse score**: >90
- **Bundle size**: <500KB
- **Load time**: <3s

### 3. Пользовательский опыт
- **Error rate**: <1%
- **Success rate**: >95%
- **User satisfaction**: >4.5/5

## 🔄 Процесс релиза

### 1. Подготовка
- [ ] Все тесты проходят
- [ ] Документация обновлена
- [ ] Changelog заполнен
- [ ] Code review завершен

### 2. Релиз
- [ ] Создать release tag
- [ ] Деплой на staging
- [ ] Тестирование на staging
- [ ] Деплой на production

### 3. Пост-релиз
- [ ] Мониторинг ошибок
- [ ] Проверка метрик
- [ ] Сбор обратной связи
- [ ] Планирование следующих итераций 