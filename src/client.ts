import type { AxiosInstance } from 'axios';
import { createHttpClient, BASE_URL } from './utils/request.js';
import { scrapeHome } from './scrapers/home.js';
import { scrapeSearch } from './scrapers/search.js';
import { scrapePost } from './scrapers/post.js';
import { scrapeHentaiList } from './scrapers/hentai-list.js';
import { scrapeGenres } from './scrapers/genres.js';
import { scrapeSeriesDetails } from './scrapers/series.js';
import { scrapePostList } from './scrapers/category.js';
import type {
  LatestRelease,
  SearchResult,
  AnimeDetail,
  AnimeSeries,
  GenreItem,
  SeriesDetail,
  NekopoiClientOptions,
  NekopoiClientConfig,
  PaginatedResult,
  NekopoiCategory,
} from './types/index.js';
import { assertPage, assertSearchQuery, assertSlug, assertUrlOrSlug } from './utils/validate.js';
import { buildPagedPath, stripSlugPrefix } from './utils/parser.js';
import { TtlCache, cacheKey } from './utils/cache.js';

function resolveOptions(
  baseUrlOrOptions?: string | NekopoiClientOptions
): Required<
  Pick<
    NekopoiClientOptions,
    | 'baseUrl'
    | 'timeout'
    | 'retries'
    | 'retryDelayMs'
    | 'minRequestIntervalMs'
    | 'cacheTtlMs'
    | 'cacheMaxEntries'
  >
> &
  Pick<NekopoiClientOptions, 'headers'> {
  if (typeof baseUrlOrOptions === 'string' || baseUrlOrOptions === undefined) {
    return {
      baseUrl: baseUrlOrOptions || BASE_URL,
      timeout: 15_000,
      retries: 2,
      retryDelayMs: 300,
      minRequestIntervalMs: 0,
      cacheTtlMs: 0,
      cacheMaxEntries: 100,
    };
  }

  return {
    baseUrl: baseUrlOrOptions.baseUrl || BASE_URL,
    timeout: baseUrlOrOptions.timeout ?? 15_000,
    retries: baseUrlOrOptions.retries ?? 2,
    retryDelayMs: baseUrlOrOptions.retryDelayMs ?? 300,
    minRequestIntervalMs: baseUrlOrOptions.minRequestIntervalMs ?? 0,
    cacheTtlMs: baseUrlOrOptions.cacheTtlMs ?? 0,
    cacheMaxEntries: baseUrlOrOptions.cacheMaxEntries ?? 100,
    headers: baseUrlOrOptions.headers,
  };
}

/**
 * Unofficial typed client for scraping structured data from nekopoi.care (or a mirror).
 *
 * @example
 * ```ts
 * const client = new NekopoiClient();
 * const latest = await client.getLatest();
 * for (const item of latest.data) {
 *   console.log(item.title, item.url);
 * }
 * if (latest.hasNext) {
 *   const page2 = await client.getLatest(latest.page + 1);
 * }
 * ```
 */
export class NekopoiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly cache: TtlCache;
  private readonly config: NekopoiClientConfig;

  /**
   * Create a client.
   *
   * @param baseUrlOrOptions - Mirror base URL string, or full {@link NekopoiClientOptions}.
   *   Defaults to `https://nekopoi.care`.
   *
   * @example
   * ```ts
   * new NekopoiClient();
   * new NekopoiClient('https://mirror.example');
   * new NekopoiClient({ baseUrl: 'https://mirror.example', cacheTtlMs: 60_000 });
   * ```
   */
  constructor(baseUrlOrOptions?: string | NekopoiClientOptions) {
    const resolved = resolveOptions(baseUrlOrOptions);
    this.config = {
      baseUrl: resolved.baseUrl,
      timeout: resolved.timeout,
      retries: resolved.retries,
      retryDelayMs: resolved.retryDelayMs,
      minRequestIntervalMs: resolved.minRequestIntervalMs,
      cacheTtlMs: resolved.cacheTtlMs,
      cacheMaxEntries: resolved.cacheMaxEntries,
    };

    this.axiosInstance = createHttpClient({
      baseUrl: resolved.baseUrl,
      timeout: resolved.timeout,
      retries: resolved.retries,
      retryDelayMs: resolved.retryDelayMs,
      minRequestIntervalMs: resolved.minRequestIntervalMs,
      headers: resolved.headers,
      cacheTtlMs: resolved.cacheTtlMs,
      cacheMaxEntries: resolved.cacheMaxEntries,
    });

    this.cache = new TtlCache(resolved.cacheTtlMs, resolved.cacheMaxEntries);
  }

  /**
   * Underlying Axios instance for custom interceptors, proxies, or debugging.
   * Prefer client methods for scraping; use this only when you need low-level control.
   */
  getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  /** Read-only snapshot of resolved client configuration. */
  getOptions(): Readonly<NekopoiClientConfig> {
    return { ...this.config };
  }

  /** Clear the in-memory response cache (no-op when caching is disabled). */
  clearCache(): void {
    this.cache.clear();
  }

  private async cached<T>(keyParts: unknown[], loader: () => Promise<T>): Promise<T> {
    const key = cacheKey(keyParts);
    const hit = this.cache.get<T>(key);
    if (hit !== undefined) return hit;

    const value = await loader();
    this.cache.set(key, value);
    return value;
  }

  /**
   * Latest episode releases from the homepage.
   *
   * @param page - 1-based page index (default `1`).
   * @returns Paginated cards with title, url, thumbnail, type, and uploaded date.
   * @throws {NekopoiValidationError} When `page` is not a positive integer.
   * @throws {NekopoiParseError} When the HTML is a bot challenge or unexpected structure.
   * @throws {NekopoiScrapeError} On network / HTTP failures after retries.
   */
  async getLatest(page?: number): Promise<PaginatedResult<LatestRelease>> {
    assertPage(page);
    return this.cached(['getLatest', page ?? 1], () => scrapeHome(this.axiosInstance, page));
  }

  /**
   * Search posts by keyword.
   *
   * @param query - Non-empty search string.
   * @param page - 1-based page index (default `1`).
   * @returns Paginated search hits.
   * @throws {NekopoiValidationError} When `query` is empty/too long or `page` is invalid.
   */
  async search(query: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertSearchQuery(query);
    assertPage(page);
    const q = query.trim();
    return this.cached(['search', q, page ?? 1], () => scrapeSearch(this.axiosInstance, q, page));
  }

  /**
   * Posts under a category slug.
   *
   * Known slugs: {@link NEKOPOI_CATEGORIES} (`hentai`, `2d-animation`, `3d-hentai`, `jav`, `jav-cosplay`).
   * Custom mirror slugs are accepted as plain strings.
   *
   * @param category - Category slug (with or without a `category/` prefix).
   * @param page - 1-based page index (default `1`).
   */
  async getByCategory(
    category: NekopoiCategory,
    page?: number
  ): Promise<PaginatedResult<SearchResult>> {
    assertPage(page);
    const cleanCat = assertSlug(stripSlugPrefix(category, 'category'), 'category');
    const path = buildPagedPath(`/category/${cleanCat}`, page);
    return this.cached(['getByCategory', cleanCat, page ?? 1], () =>
      scrapePostList(this.axiosInstance, path, page ?? 1)
    );
  }

  /** Shortcut for {@link getByCategory} with slug `hentai`. */
  async getHentai(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('hentai', page);
  }

  /** Shortcut for {@link getByCategory} with slug `2d-animation`. */
  async get2DAnimation(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('2d-animation', page);
  }

  /** Shortcut for {@link getByCategory} with slug `3d-hentai`. */
  async get3DHentai(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('3d-hentai', page);
  }

  /** Shortcut for {@link getByCategory} with slug `jav`. */
  async getJAV(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('jav', page);
  }

  /** Shortcut for {@link getByCategory} with slug `jav-cosplay`. */
  async getJAVCosplay(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('jav-cosplay', page);
  }

  /**
   * Posts under a genre slug (e.g. `action`, `big-oppai`).
   * Prefer {@link getGenres} first to discover valid slugs.
   *
   * @param genre - Genre slug (with or without a `genres/` prefix).
   * @param page - 1-based page index (default `1`).
   */
  async getByGenre(genre: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertPage(page);
    const cleanGenre = assertSlug(stripSlugPrefix(genre, 'genres'), 'genre');
    const path = buildPagedPath(`/genres/${cleanGenre}`, page);
    return this.cached(['getByGenre', cleanGenre, page ?? 1], () =>
      scrapePostList(this.axiosInstance, path, page ?? 1)
    );
  }

  /**
   * Full indexed genre list (`name`, `url`, `slug`).
   * Useful as input for {@link getByGenre}.
   */
  async getGenres(): Promise<GenreItem[]> {
    return this.cached(['getGenres'], () => scrapeGenres(this.axiosInstance));
  }

  /**
   * Single post/episode detail including grouped download links by episode and resolution.
   *
   * @param urlOrSlug - Full post URL or bare slug path segment.
   * @returns Metadata plus `downloads` tree (`episode` → resolutions → host links).
   * @remarks Download URLs are often wrapped by third-party shorteners (e.g. ouo.io).
   */
  async getPostDetails(urlOrSlug: string): Promise<AnimeDetail> {
    const value = assertUrlOrSlug(urlOrSlug);
    return this.cached(['getPostDetails', value], () => scrapePost(this.axiosInstance, value));
  }

  /**
   * Series profile with synopsis, status, score, and the full episode list.
   *
   * @param urlOrSlug - Full series URL, `/hentai/...` path, or bare series slug.
   */
  async getSeriesDetails(urlOrSlug: string): Promise<SeriesDetail> {
    const value = assertUrlOrSlug(urlOrSlug);
    return this.cached(['getSeriesDetails', value], () =>
      scrapeSeriesDetails(this.axiosInstance, value)
    );
  }

  /**
   * Full A–Z hentai index (can be a large response).
   * Metadata is primarily extracted from tooltip HTML when present.
   */
  async getHentaiList(): Promise<AnimeSeries[]> {
    return this.cached(['getHentaiList'], () => scrapeHentaiList(this.axiosInstance));
  }
}
