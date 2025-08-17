# Настройка разработки

## Требования

- Node.js 18+
- npm или yarn
- Git

## Установка

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
cd yield-ai-history
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env.local` с необходимыми переменными окружения:

```bash
cp .env.example .env.local
```

## Настройка ESLint и Prettier

Проект настроен с ESLint и Prettier для обеспечения качества кода:

### ESLint

- Конфигурация: `eslint.config.mjs`
- Правила для TypeScript, React и общие правила
- Автоматическая сортировка импортов

### Prettier

- Конфигурация: `.prettierrc`
- Исключения: `.prettierignore`
- Форматирование кода в едином стиле

## Скрипты

```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run build        # Сборка проекта
npm run start        # Запуск production сервера

# Линтинг и форматирование
npm run lint         # Проверка ESLint
npm run lint:fix     # Исправление ошибок ESLint
npm run format       # Форматирование кода Prettier
npm run format:check # Проверка форматирования

# Тестирование
npm run test         # Запуск тестов
npm run test:ui      # UI для тестов
npm run test:run     # Запуск тестов один раз
npm run test:coverage # Покрытие тестами

# Другие
npm run codegen      # Генерация GraphQL типов
npm run update-tokens # Обновление списка токенов
```

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── explorer/          # Страницы эксплорера
│   │   ├── account/       # Страницы аккаунтов
│   │   └── ...
│   └── ...
├── components/            # React компоненты
│   ├── ui/               # UI компоненты (shadcn/ui)
│   └── ...
├── lib/                  # Утилиты и библиотеки
│   ├── aptos/           # Aptos интеграция
│   └── ...
└── ...
```

## Path Aliases

Настроены алиасы путей в `tsconfig.json`:

- `@/*` → `src/*`

## Стилизация

- **Tailwind CSS** для стилизации
- **shadcn/ui** для UI компонентов
- **lucide-react** для иконок
- Поддержка темной темы

## Современные возможности

- **TypeScript** для типизации
- **React 19** с новыми возможностями
- **Next.js 15** с App Router
- **ESLint** и **Prettier** для качества кода
- **Vitest** для тестирования
- **GraphQL** для API запросов

## Рекомендации по разработке

1. **Коммиты**: Используйте conventional commits
2. **Код**: Следуйте правилам ESLint и Prettier
3. **Типизация**: Используйте TypeScript везде
4. **Компоненты**: Создавайте переиспользуемые компоненты
5. **Тестирование**: Пишите тесты для критической логики

## VS Code настройки

Рекомендуемые расширения:

- ESLint
- Prettier
- TypeScript Importer
- Tailwind CSS IntelliSense
- Lucide Icons

Настройки для автоформатирования:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
