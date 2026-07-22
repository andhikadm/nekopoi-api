export type ContentType =
  'Hentai' | '3D Hentai' | 'Live2D Hentai' | 'Cosplay' | 'CAV' | 'JAV' | (string & {});

export type SeriesStatus = 'Ongoing' | 'Completed' | (string & {});

/**
 * Known navbar/category slugs on nekopoi.
 * Open string union so custom/mirror slugs still type-check.
 */
export type NekopoiCategory =
  'hentai' | '2d-animation' | '3d-hentai' | 'jav' | 'jav-cosplay' | (string & {});

/** Well-known category slugs (for autocomplete / iteration). */
export const NEKOPOI_CATEGORIES = [
  'hentai',
  '2d-animation',
  '3d-hentai',
  'jav',
  'jav-cosplay',
] as const satisfies readonly NekopoiCategory[];

export type KnownNekopoiCategory = (typeof NEKOPOI_CATEGORIES)[number];

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
  /** Numeric score when parseable; null when present but invalid; undefined when absent. */
  score?: number | null;
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
  /** Numeric score when parseable; null when present but invalid; undefined when absent. */
  score?: number | null;
  episodes: EpisodeItem[];
}

/** Envelope for list endpoints that support pagination. */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  hasNext: boolean;
}

/** Resolved client configuration (read-only view). */
export interface NekopoiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelayMs: number;
  minRequestIntervalMs: number;
  cacheTtlMs: number;
  cacheMaxEntries: number;
}

export interface NekopoiClientOptions {
  /**
   * Site origin used as Axios `baseURL`.
   * @defaultValue `https://nekopoi.care`
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   * @defaultValue `15000`
   */
  timeout?: number;
  /** Extra HTTP headers merged into the default browser-like headers. */
  headers?: Record<string, string>;
  /**
   * Max retry attempts for transient HTTP failures (network, 408, 429, 5xx).
   * @defaultValue `2`
   */
  retries?: number;
  /**
   * Base delay in ms for exponential backoff between retries.
   * @defaultValue `300`
   */
  retryDelayMs?: number;
  /**
   * Minimum interval between outbound requests in ms (`0` = no rate limit).
   * @defaultValue `0`
   */
  minRequestIntervalMs?: number;
  /**
   * In-memory response cache TTL in ms.
   * `0` disables caching. Positive values cache successful method results.
   * @defaultValue `0`
   */
  cacheTtlMs?: number;
  /**
   * Max cached entries before FIFO eviction.
   * @defaultValue `100`
   */
  cacheMaxEntries?: number;
}
