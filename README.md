# ichime-ts-api-client

TypeScript API client для работы с сайтом **anime365**

## Установка

```bash
pnpm add ichime-ts-api-client
```

## Быстрый старт

```typescript
import { HttpSession, ApiClient, WebClient } from "ichime-ts-api-client";

// Создаем сессию
const session = new HttpSession("https://smotret-anime.com");

// Используем публичный API
const apiClient = new ApiClient(session);
const series = await apiClient.listSeries({ query: "naruto" });

// Или веб-клиент с авторизацией
const webClient = new WebClient(session);
await webClient.login("username", "password");
const profile = await webClient.getProfile();
```

## Архитектура

Библиотека состоит из трех основных компонентов:

- **HttpSession** — базовый класс для HTTP запросов с поддержкой cookies
- **ApiClient** — клиент для публичного JSON API (`/api/*`)
- **WebClient** — клиент для веб-скрапинга HTML страниц (требует авторизации для большинства методов)

## HttpSession

Базовый класс для выполнения HTTP запросов с автоматическим управлением cookies.

```typescript
import { HttpSession } from "ichime-ts-api-client";

const session = new HttpSession("https://smotret-anime.com");

// Выполнить запрос
const response = await session.request("/api/series", {
  method: "GET",
  timeout: 15000, // таймаут в мс (по умолчанию 10000)
});

// Работа с cookies
await session.setCookie("name", "value");
const value = await session.getCookie("name");
const cookieString = await session.getCookieString();
```

## ApiClient

Клиент для работы с публичным JSON API. Не требует авторизации.

### Создание клиента

```typescript
import { HttpSession, ApiClient } from "ichime-ts-api-client";

const session = new HttpSession("https://smotret-anime.com");
const client = new ApiClient(session);
```

### Методы

#### `listSeries(options?: ListSeriesOptions): Promise<Series[]>`

Поиск сериалов.

**Параметры:**
- `query` — поисковый запрос
- `limit` — количество результатов
- `offset` — смещение для пагинации
- `chips` — фильтры в виде объекта ключ-значение
- `myAnimeListId` — ID из MyAnimeList

```typescript
const series = await client.listSeries({
  query: "attack on titan",
  limit: 20,
});

// Поиск по MyAnimeList ID
const series = await client.listSeries({
  myAnimeListId: 16498,
});
```

#### `getSeries(seriesId: number): Promise<SeriesFull>`

Получить полную информацию о сериале.

```typescript
const series = await client.getSeries(12345);
console.log(series.titles, series.descriptions, series.genres);
```

#### `listEpisodes(options?: ListEpisodesOptions): Promise<Episode[]>`

Получить список эпизодов.

**Параметры:**
- `seriesId` — ID сериала
- `limit` — количество результатов
- `offset` — смещение для пагинации

```typescript
const episodes = await client.listEpisodes({
  seriesId: 12345,
  limit: 50,
});
```

#### `getEpisode(episodeId: number): Promise<EpisodeFull>`

Получить полную информацию об эпизоде.

```typescript
const episode = await client.getEpisode(67890);
console.log(episode.translations);
```

#### `getTranslation(translationId: number): Promise<TranslationFull>`

Получить информацию о переводе.

```typescript
const translation = await client.getTranslation(111222);
console.log(translation.authorsSummary, translation.qualitySummary);
```

#### `getTranslationEmbed(translationId: number): Promise<TranslationEmbed>`

Получить embed-информацию для воспроизведения перевода.

```typescript
const embed = await client.getTranslationEmbed(111222);
console.log(embed.stream); // информация о потоках видео
```

## WebClient

Клиент для работы с веб-страницами через HTML парсинг. Большинство методов требуют авторизации.

### Создание клиента

```typescript
import { HttpSession, WebClient } from "ichime-ts-api-client";

const session = new HttpSession("https://smotret-anime.com");
const client = new WebClient(session);
```

### Авторизация

#### `login(username: string, password: string): Promise<void>`

Авторизация на сайте.

```typescript
await client.login("user@example.com", "password123");
```

### Профиль

#### `getProfile(): Promise<Profile>`

Получить профиль текущего пользователя.

```typescript
const profile = await client.getProfile();
console.log(profile.id, profile.name, profile.avatarUrl);
```

### Эпизоды

#### `getPersonalEpisodes(page: number): Promise<NewPersonalEpisode[]>`

Получить персональную ленту новых эпизодов (из списка отслеживаемых аниме).

```typescript
const episodes = await client.getPersonalEpisodes(1);
for (const ep of episodes) {
  console.log(ep.seriesTitleRu, ep.episodeNumberLabel, ep.episodeUpdateType);
}
```

#### `getRecentEpisodes(page: number): Promise<NewRecentEpisode[]>`

Получить общую ленту недавно вышедших эпизодов.

```typescript
const episodes = await client.getRecentEpisodes(1);
for (const ep of episodes) {
  console.log(ep.seriesTitleRu, ep.episodeNumberLabel, ep.episodeUploadedAt);
}
```

#### `markEpisodeAsWatched(translationId: number): Promise<void>`

Отметить эпизод как просмотренный.

```typescript
await client.markEpisodeAsWatched(111222);
```

### Список аниме

#### `getAnimeList(userId: number, category: AnimeListCategory): Promise<AnimeListEntry[]>`

Получить список аниме пользователя по категории.

```typescript
import type { AnimeListCategory } from "ichime-ts-api-client";

const watching = await client.getAnimeList(userId, "watching");
const completed = await client.getAnimeList(userId, "completed");
const onHold = await client.getAnimeList(userId, "onHold");
const dropped = await client.getAnimeList(userId, "dropped");
const planToWatch = await client.getAnimeList(userId, "planToWatch");
```

#### `getAnimeListEditableEntry(seriesId: number): Promise<AnimeListEditableEntry>`

Получить редактируемую запись из списка аниме.

```typescript
const entry = await client.getAnimeListEditableEntry(12345);
console.log(entry.status, entry.episodesWatched, entry.score);
```

#### `editAnimeListEntry(seriesId, score, episodes, status, comment): Promise<void>`

Редактировать запись в списке аниме.

```typescript
import { AnimeListEntryStatusNumericId } from "ichime-ts-api-client";

await client.editAnimeListEntry(
  12345, // seriesId
  8, // score (1-10)
  5, // episodes watched
  AnimeListEntryStatusNumericId.watching, // status
  "Отличное аниме!" // comment
);
```

### Моменты

#### `getMoments(page: number, sort?: MomentSorting): Promise<MomentPreview[]>`

Получить список моментов.

```typescript
import type { MomentSorting } from "ichime-ts-api-client";

const moments = await client.getMoments(1, "popular");
for (const moment of moments) {
  console.log(moment.momentTitle, moment.sourceDescription, moment.durationSeconds);
}
```

#### `getMomentsBySeries(seriesId: number, page: number): Promise<MomentPreview[]>`

Получить моменты по конкретному сериалу.

```typescript
const moments = await client.getMomentsBySeries(12345, 1);
```

#### `getMomentDetails(momentId: number): Promise<MomentDetails>`

Получить детали момента.

```typescript
const details = await client.getMomentDetails(99999);
console.log(details.seriesId, details.seriesTitle, details.episodeId);
```

#### `getMomentEmbed(momentId: number): Promise<MomentEmbed>`

Получить URL видео для момента.

```typescript
const embed = await client.getMomentEmbed(99999);
console.log(embed.videoUrl);
```

## Типы

### API типы

```typescript
import type {
  // Сериалы
  Series,
  SeriesFull,
  SeriesFullDescription,
  SeriesFullGenre,
  SeriesType,
  Titles,
  // Эпизоды
  Episode,
  EpisodeFull,
  // Переводы
  Translation,
  TranslationFull,
  TranslationEmbed,
  TranslationEmbedStream,
} from "ichime-ts-api-client";
```

### Web типы

```typescript
import type {
  // Профиль
  Profile,
  // Эпизоды
  NewPersonalEpisode,
  NewRecentEpisode,
  // Список аниме
  AnimeListCategory,
  AnimeListEntry,
  AnimeListEditableEntry,
  AnimeListEntryStatus,
  EditAnimeListResult,
  // Моменты
  MomentPreview,
  MomentDetails,
  MomentEmbed,
  MomentSorting,
  VideoSource,
} from "ichime-ts-api-client";
```

### Утилиты для типов

```typescript
import {
  AnimeListCategoryNumericId,
  AnimeListCategoryWebPath,
  AnimeListEntryStatusNumericId,
  animeListCategoryFromNumericId,
  animeListEntryStatusFromNumericId,
} from "ichime-ts-api-client";
```

## Вспомогательные функции

```typescript
import {
  parseApiDate,
  isEmptyDate,
  parseWebDate,
  parseDurationString,
  extractIdentifiersFromUrl,
} from "ichime-ts-api-client";

// Парсинг дат из API
const date = parseApiDate("2024-01-15 12:30:00");

// Проверка пустой даты
if (!isEmptyDate("0000-00-00 00:00:00")) {
  // дата валидна
}

// Парсинг даты из веб-страницы
const webDate = parseWebDate("15 января 12:30");

// Парсинг длительности "1:30" -> 90 секунд
const seconds = parseDurationString("1:30");

// Извлечение ID из URL
const url = new URL("https://smotret-anime.com/catalog/1234-naruto/5678-episode-1");
const { seriesId, episodeId } = extractIdentifiersFromUrl(url);
```

## Обработка ошибок

```typescript
import { ApiClientError, ApiError, WebClientError } from "ichime-ts-api-client";

try {
  await apiClient.getSeries(99999999);
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error("API client error:", error.message);
  }
}

try {
  await webClient.getProfile();
} catch (error) {
  if (error instanceof WebClientError) {
    console.error("Web client error:", error.message);
  }
}
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
