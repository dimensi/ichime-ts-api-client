import type { ListSeriesOptions } from "./api/series.js";
import { listSeries } from "./api/series.js";
import type { ApiErrorResponse, ApiSuccessResponse } from "./types/errors.js";
import { ApiClientError } from "./types/errors.js";
import type { Series } from "./types/series.js";

export interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
}

export class ApiClient {
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL ?? "https://smotret-anime.com";
    this.timeout = options.timeout ?? 10000;
  }

  protected async sendRequest<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = new URL(`/api${endpoint}`, this.baseURL);

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw ApiClientError.requestFailed(
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        );
      }

      const data = await response.json();

      // Проверяем, является ли ответ ошибкой API
      if ("error" in data) {
        const errorResponse = data as ApiErrorResponse;
        throw ApiClientError.fromApiError(errorResponse.error);
      }

      // Проверяем, является ли ответ успешным
      if ("data" in data) {
        const successResponse = data as ApiSuccessResponse<T>;
        return successResponse.data;
      }

      // Если формат неожиданный, пытаемся вернуть данные как есть
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw ApiClientError.decodeFailed(error);
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw ApiClientError.requestFailed(new Error("Request timeout"));
      }

      throw ApiClientError.requestFailed(error);
    }
  }

  async listSeries(options: ListSeriesOptions = {}): Promise<Series[]> {
    return listSeries.call(this, options);
  }
}
