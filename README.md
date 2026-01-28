# ichime-ts-api-client

TypeScript API client для работы с сайтом [smotret-anime.com](https://smotret-anime.com).

## Установка

```bash
pnpm add ichime-ts-api-client
```

## Использование

```typescript
import { ApiClient } from "ichime-ts-api-client";

const client = new ApiClient();

// Получить список серий
const series = await client.listSeries({
  query: "naruto",
  limit: 10,
  offset: 0,
});

console.log(series);
```

## API

### ApiClient

Основной класс для работы с API.

#### Конструктор

```typescript
new ApiClient(options?: ApiClientOptions)
```

**Параметры:**
- `options.baseURL` - базовый URL API (по умолчанию: `https://smotret-anime.com`)
- `options.timeout` - таймаут запросов в миллисекундах (по умолчанию: `10000`)

#### Методы

##### `listSeries(options?: ListSeriesOptions): Promise<Series[]>`

Получить список серий.

**Параметры:**
- `options.query` - поисковый запрос
- `options.limit` - количество результатов
- `options.offset` - смещение для пагинации
- `options.chips` - фильтры в виде объекта ключ-значение
- `options.myAnimeListId` - ID из MyAnimeList

**Пример:**

```typescript
const series = await client.listSeries({
  query: "attack on titan",
  limit: 20,
});
```

## Разработка

### Требования

- Node.js >= 24.0.0
- pnpm

### Установка зависимостей

```bash
pnpm install
```

### Сборка

```bash
pnpm build
```

### Тестирование

```bash
pnpm test
```

### Линтинг

```bash
pnpm lint
```

### Форматирование

```bash
pnpm format
```

## Лицензия

MIT
