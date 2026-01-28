// Core

// API Client
export {
  ApiClient,
  type ListEpisodesOptions,
  type ListSeriesOptions,
} from "./api/api-client.js";
export { isEmptyDate, parseApiDate } from "./api/date-decoder.js";
export { ApiClientError, ApiError } from "./api/errors.js";
// API Types
export type {
  Episode,
  EpisodeFull,
  Series,
  SeriesFull,
  SeriesFullDescription,
  SeriesFullGenre,
  SeriesType,
  Titles,
  Translation,
  TranslationEmbed,
  TranslationEmbedStream,
  TranslationFull,
} from "./api/types/index.js";
export { HttpSession, type RequestOptions } from "./http-session.js";
export { WebClientError, WebClientTypeNormalizationError } from "./web/errors.js";
export { extractIdentifiersFromUrl, parseDurationString, parseWebDate } from "./web/helpers.js";
// Web Types
export type {
  AnimeListCategory,
  AnimeListEditableEntry,
  AnimeListEntry,
  AnimeListEntryStatus,
  EditAnimeListResult,
  MomentDetails,
  MomentEmbed,
  MomentPreview,
  MomentSorting,
  NewPersonalEpisode,
  NewRecentEpisode,
  Profile,
  VideoSource,
} from "./web/types/index.js";
export {
  AnimeListCategoryNumericId,
  AnimeListCategoryWebPath,
  AnimeListEntryStatusNumericId,
  animeListCategoryFromNumericId,
  animeListEntryStatusFromNumericId,
} from "./web/types/index.js";
// Web Client
export { WebClient } from "./web/web-client.js";
