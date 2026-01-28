import type { AnimeListEntryStatus } from "./anime-list-status.js";

export interface AnimeListEntry {
  seriesId: number;
  seriesTitleFull: string;
  episodesWatched: number;
  episodesTotal: number | null;
  score: number | null;
}

export interface AnimeListEditableEntry {
  episodesWatched: number;
  status: AnimeListEntryStatus;
  score: number | null;
  commentary: string | null;
}

export interface EditAnimeListResult {
  id: number;
  status: string;
  score: string;
  episodes: string;
}
