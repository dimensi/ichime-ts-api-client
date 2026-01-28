import type { Translation } from "./translation.js";

export interface Episode {
  id: number;
  episodeFull: string;
  episodeInt: string;
  episodeType: string;
  firstUploadedDateTime: Date;
  isActive: number;
  isFirstUploaded: number;
}

export interface EpisodeFull extends Episode {
  seriesId: number;
  translations: Translation[];
}
