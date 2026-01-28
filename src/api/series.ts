import type { ApiClient } from "../client.js";
import type { Series } from "../types/series.js";

export interface ListSeriesOptions {
  query?: string;
  limit?: number;
  offset?: number;
  chips?: Record<string, string>;
  myAnimeListId?: number;
}

export function listSeries(this: ApiClient, options: ListSeriesOptions = {}): Promise<Series[]> {
  const queryParams: Record<string, string | number | undefined> = {};

  if (options.query !== undefined) {
    queryParams.query = options.query;
  }

  if (options.limit !== undefined) {
    queryParams.limit = options.limit;
  }

  if (options.offset !== undefined) {
    queryParams.offset = options.offset;
  }

  if (options.chips !== undefined) {
    const chipsString = Object.entries(options.chips)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(";");
    queryParams.chips = chipsString;
  }

  if (options.myAnimeListId !== undefined) {
    queryParams.myAnimeListId = options.myAnimeListId;
  }

  return this.sendRequest<Series[]>("/series", queryParams);
}
