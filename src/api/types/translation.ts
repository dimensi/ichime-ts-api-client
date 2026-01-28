import type { Episode } from "./episode.js";
import type { Series } from "./series.js";

export interface Translation {
  id: number;
  activeDateTime: Date;
  addedDateTime: Date;
  isActive: number;
  qualityType: string;
  typeKind: string;
  typeLang: string;
  authorsSummary: string;
  height: number;
}

export interface TranslationFull {
  episode: Episode;
  series: Series;
}

export interface TranslationEmbedStream {
  height: number;
  urls: string[];
}

export interface TranslationEmbed {
  stream: TranslationEmbedStream[];
  subtitlesUrl: string | null;
  subtitlesVttUrl: string | null;
}
