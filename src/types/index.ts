export type ContentType =
  | 'Hentai'
  | '3D Hentai'
  | 'Live2D Hentai'
  | 'Cosplay'
  | 'CAV'
  | 'JAV'
  | string;

export type SeriesStatus = 'Ongoing' | 'Completed' | string;

export interface LatestRelease {
  title: string;
  url: string;
  thumbnail: string;
  type: ContentType;
  uploadedDate: string;
}

/** Search/category/genre list items share the same shape as latest releases. */
export type SearchResult = LatestRelease;

export interface DownloadLink {
  host: string;
  url: string;
}

export interface DownloadResolution {
  resolution: string;
  links: DownloadLink[];
}

export interface EpisodeDownload {
  episode: string;
  downloads: DownloadResolution[];
}

export interface AnimeDetail {
  title: string;
  japaneseTitle?: string;
  synopsis: string;
  thumbnail: string;
  uploadedDate: string;
  genres: string[];
  duration?: string;
  producer?: string;
  downloads: EpisodeDownload[];
}

export interface AnimeSeries {
  title: string;
  url: string;
  thumbnail?: string;
  japaneseTitle?: string;
  producer?: string;
  type?: ContentType;
  status?: SeriesStatus;
  genres?: string[];
  duration?: string;
  score?: string;
}

export interface GenreItem {
  name: string;
  url: string;
  slug: string;
}

export interface EpisodeItem {
  title: string;
  url: string;
  episodeNumber: string;
  uploadedDate: string;
  thumbnail: string;
}

export interface SeriesDetail {
  title: string;
  japaneseTitle?: string;
  thumbnail: string;
  synopsis: string;
  type: ContentType;
  status: SeriesStatus;
  totalEpisodes: string;
  releaseDate?: string;
  producer?: string;
  genres: string[];
  duration?: string;
  score?: string;
  episodes: EpisodeItem[];
}

/** Envelope for list endpoints that support pagination. */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  hasNext: boolean;
}

export interface NekopoiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  /** Max retry attempts for transient HTTP failures (default: 2). */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 300). */
  retryDelayMs?: number;
  /** Minimum interval between requests in ms (default: 0 = no rate limit). */
  minRequestIntervalMs?: number;
}
