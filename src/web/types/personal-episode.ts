export interface NewPersonalEpisode {
  seriesId: number;
  seriesPosterUrl: string;
  seriesTitleRu: string;
  seriesTitleRomaji: string;
  episodeId: number;
  episodeNumberLabel: string;
  episodeUpdateType: string;
}

export interface NewRecentEpisode {
  seriesId: number;
  seriesPosterUrl: string;
  seriesTitleRu: string;
  seriesTitleRomaji: string;
  episodeId: number;
  episodeNumberLabel: string;
  episodeUploadedAt: Date;
}
