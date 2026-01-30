import type { HttpSession } from "../http-session.js";
import { transformDatesInResponse } from "./date-decoder.js";
import { ApiClientError, ApiError } from "./errors.js";
import type {
  Episode,
  EpisodeFull,
  Series,
  SeriesFull,
  TranslationEmbed,
  TranslationFull,
} from "./types/index.js";

interface ApiSuccessfulResponse<T> {
  data: T;
}

interface ApiErrorResponse {
  error: {
    code: number;
    message: string;
  };
}

export interface ListSeriesOptions {
  query?: string;
  limit?: number;
  offset?: number;
  chips?: Record<string, string>;
  myAnimeListId?: number;
}

export interface ListEpisodesOptions {
  seriesId?: number;
  limit?: number;
  offset?: number;
}

export interface ApiClientConfig {
  debug?: boolean;
}

export class ApiClient {
  private readonly debug: boolean;

  constructor(
    private readonly session: HttpSession,
    config: ApiClientConfig = {}
  ) {
    this.debug = config.debug ?? false;
  }

  async sendRequest<T>(endpoint: string, queryItems: Record<string, string> = {}): Promise<T> {
    const url = new URL(`/api${endpoint}`, this.session.baseUrl);

    // Сортируем параметры по имени (как в Swift)
    const sortedParams = Object.entries(queryItems).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sortedParams) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await this.session.request(url.pathname + url.search, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (error) {
      if (this.debug) {
        console.debug(`[ApiClient] Request failed: GET ${url.toString()}`, error);
      }
      throw ApiClientError.requestFailed(error instanceof Error ? error : undefined);
    }

    if (this.debug) {
      console.debug(`[ApiClient] API request: GET ${url.toString()} [${response.status}]`);
    }

    let data: unknown;
    let responseText: string | undefined;
    try {
      responseText = await response.text();
      data = JSON.parse(responseText);
    } catch (error) {
      if (this.debug) {
        console.error(
          `[ApiClient] Decoding JSON error:\n\n${error}\n\nAPI response:\n\n${responseText ?? "(no response text)"}`
        );
      }
      throw ApiClientError.canNotDecodeResponseJson(error instanceof Error ? error : undefined);
    }

    // Проверяем на ошибку API
    if (this.isApiErrorResponse(data)) {
      const apiError = data.error;

      if (this.debug) {
        console.warn(`[ApiClient] API error:\n\n${responseText}`);
      }

      if (apiError.code === 403) {
        throw ApiClientError.apiError(ApiError.authenticationRequired());
      }

      if (apiError.code === 404) {
        throw ApiClientError.apiError(ApiError.notFound());
      }

      throw ApiClientError.apiError(ApiError.other(apiError.code, apiError.message));
    }

    // Успешный ответ
    if (this.isApiSuccessfulResponse<T>(data)) {
      return transformDatesInResponse<T>(data.data);
    }

    if (this.debug) {
      console.error(
        `[ApiClient] Could not decode response as ApiSuccessfulResponse:\n\n${responseText}`
      );
    }

    throw ApiClientError.canNotDecodeResponseJson();
  }

  private isApiErrorResponse(data: unknown): data is ApiErrorResponse {
    return (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as ApiErrorResponse).error === "object" &&
      (data as ApiErrorResponse).error !== null &&
      "code" in (data as ApiErrorResponse).error &&
      "message" in (data as ApiErrorResponse).error
    );
  }

  private isApiSuccessfulResponse<T>(data: unknown): data is ApiSuccessfulResponse<T> {
    return typeof data === "object" && data !== null && "data" in data;
  }

  // === API Requests ===

  async getSeries(seriesId: number): Promise<SeriesFull> {
    return this.sendRequest<SeriesFull>(`/series/${seriesId}`);
  }

  async getEpisode(episodeId: number): Promise<EpisodeFull> {
    return this.sendRequest<EpisodeFull>(`/episodes/${episodeId}`);
  }

  async listSeries(options: ListSeriesOptions = {}): Promise<Series[]> {
    const queryItems: Record<string, string> = {};

    if (options.chips) {
      const chipsValue = Object.entries(options.chips)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join(";");
      queryItems.chips = chipsValue;
    }

    if (options.query !== undefined) {
      queryItems.query = options.query;
    }

    if (options.limit !== undefined) {
      queryItems.limit = String(options.limit);
    }

    if (options.offset !== undefined) {
      queryItems.offset = String(options.offset);
    }

    if (options.myAnimeListId !== undefined) {
      queryItems.myAnimeListId = String(options.myAnimeListId);
    }

    return this.sendRequest<Series[]>("/series", queryItems);
  }

  async listEpisodes(options: ListEpisodesOptions = {}): Promise<Episode[]> {
    const queryItems: Record<string, string> = {};

    if (options.seriesId !== undefined) {
      queryItems.seriesId = String(options.seriesId);
    }

    if (options.limit !== undefined) {
      queryItems.limit = String(options.limit);
    }

    if (options.offset !== undefined) {
      queryItems.offset = String(options.offset);
    }

    return this.sendRequest<Episode[]>("/episodes", queryItems);
  }

  async getTranslation(translationId: number): Promise<TranslationFull> {
    return this.sendRequest<TranslationFull>(`/translations/${translationId}`);
  }

  async getTranslationEmbed(translationId: number): Promise<TranslationEmbed> {
    return this.sendRequest<TranslationEmbed>(`/translations/embed/${translationId}`);
  }
}
