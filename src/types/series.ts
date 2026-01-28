export interface Titles {
  ru?: string | null;
  romaji?: string | null;
}

export type SeriesType = "tv" | "movie" | "ova" | "ona" | "special" | "music";

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
  genres?: Array<{
    id: number;
    title: string;
  }> | null;
  descriptions?: Array<{
    source: string;
    value: string;
  }> | null;
  episodes?: Array<unknown> | null;
}
