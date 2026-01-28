import type { Episode } from "./episode.js";
import type { SeriesType } from "./series-type.js";

export interface Titles {
  ru: string | null;
  romaji: string | null;
}

export interface Series {
  id: number;
  title: string;
  titles: Titles;
  posterUrl: string | null;
  myAnimeListScore: string;
  season: string;
  type: SeriesType | null;
  year: number | null;
}

export interface SeriesFullGenre {
  id: number;
  title: string;
}

export interface SeriesFullDescription {
  source: string;
  value: string;
}

export interface SeriesFull {
  id: number;
  title: string;
  posterUrl: string | null;
  myAnimeListScore: string;
  myAnimeListId: number;
  isAiring: number;
  numberOfEpisodes: number;
  season: string;
  type: SeriesType | null;
  titles: Titles;
  genres: SeriesFullGenre[] | null;
  descriptions: SeriesFullDescription[] | null;
  episodes: Episode[] | null;
}
