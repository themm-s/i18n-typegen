# i18n-typegen
Автоматическая генерация TypeScript-типов для i18next и react-i18next на основе JSON-файлов неймспейсов в языковых папках.

- **Типобезопасные ключи переводов** с автодополнением в `t('ns:key')`
- **Поддержка вложенных ключей** через вычисляемый тип `NestedKeyOf`
- **Декларации модулей** для `i18next` и `react-i18next`
- **CLI** с автосозданием выходной папки

## Установка
```bash
npm install i18n-typegen --save-dev
# или
yarn add -D i18n-typegen
# или
pnpm add -D i18n-typegen
```

## Быстрый старт (CLI)
Укажите путь к КОНКРЕТНОЙ языковой папке (например, `./src/locales/en`), где лежат `.json`-файлы неймспейсов.

```bash
# Генерация типов из всех .json в папке ./src/locales/en
# и сохранение результата в ./src/lib/i18n/i18n.d.ts
npx i18n-typegen ./src/locales/en ./src/lib/i18n/i18n.d.ts
```

- **Аргумент 1**: путь к папке ЯЗЫКА с JSON-файлами неймспейсов (например, `./src/locales/en`).
- **Аргумент 2**: путь к выходному `.d.ts` файлу (папка будет создана при необходимости).

> Пример для `package.json`:
```json
{
  "scripts": {
    "i18n:types": "i18n-typegen ./src/locales/en ./src/lib/i18n/i18n.d.ts"
  }
}
```

## Структура локалей
Храните неймспейсы по языкам. Утилита читает файлы только из указанной папки языка.

```text
src/
└─ locales/
   ├─ en/
   │  ├─ common.json
   │  └─ auth.json
   └─ ru/
      ├─ common.json
      └─ auth.json
```

Пример `src/locales/en/common.json`:
```json
{
  "hello": "Hello",
  "menu": {
    "home": "Home",
    "about": "About"
  }
}
```

## Что генерируется
- `declare module 'i18next' { ... }`
- `declare module 'react-i18next' { ... }`
- Типы:
  - `TranslationKeys` — объединение всех ключей формата `ns:key`
  - `NamespaceKeys<'common'>` — ключи выбранного неймспейса
  - Отдельные типы вида `CommonKeys`, `AuthKeys`, …

Разделители:
- `keySeparator: '.'` (вложенные ключи: `menu.home`)
- `nsSeparator: ':'` (неймспейс: `common:menu.home`)

`defaultNS` берётся равным ПЕРВОМУ найденному `.json` файлу в папке.

## Использование
```ts
import i18next from 'i18next';

i18next.t('common:hello');       // ок
i18next.t('common:menu.home');   // ок
// i18next.t('common:unknown');  // ошибка типов
```

```tsx
import { useTranslation } from 'react-i18next';

function Header() {
  const { t } = useTranslation();
  return (
    <>
      <h1>{t('common:hello')}</h1>
      <nav>{t('common:menu.home')}</nav>
    </>
  );
}
```

## Рекомендации
- Запускайте генерацию по одному выбранному языку (обычно по `en` как эталону структуры).
- Следите, чтобы структура ключей совпадала во всех языках.
- Массивы в JSON интерпретируются как `string` значения на листовых узлах.

## Частые вопросы
- Можно ли указать корень `./src/locales`?  
  — Нет, укажите конкретную языковую папку, например `./src/locales/en`.
- Зачем нужен один язык, если у меня несколько?  
  — Типы зависят от структуры ключей; обычно одного эталонного языка достаточно.

## Лицензия
MIT