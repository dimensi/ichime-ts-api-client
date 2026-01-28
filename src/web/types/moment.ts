export interface MomentPreview {
  momentId: number;
  coverUrl: string;
  momentTitle: string;
  sourceDescription: string;
  /** Duration in seconds */
  durationSeconds: number;
}

export interface MomentDetails {
  seriesId: number;
  seriesTitle: string;
  episodeId: number;
}

export interface VideoSource {
  height: number;
  urls: string[];
}

export interface MomentEmbed {
  videoUrl: string;
}

export type MomentSorting = "new" | "old" | "popular";
