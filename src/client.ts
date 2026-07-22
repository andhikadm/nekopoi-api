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
} from './types/index.js';
import {
  assertPage,
  assertSearchQuery,
  assertSlug,
  assertUrlOrSlug,
} from './utils/validate.js';
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

export class NekopoiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly cache: TtlCache;
  private readonly config: NekopoiClientConfig;

  /**
   * @param baseUrlOrOptions Custom base URL string, or full client options.
   *                         Defaults to https://nekopoi.care
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

  /** Underlying Axios instance (for custom interceptors / debugging). */
  getAxios(): AxiosInstance {
    return this.axiosInstance;
  }

  /** Read-only snapshot of resolved client configuration. */
  getOptions(): Readonly<NekopoiClientConfig> {
    return { ...this.config };
  }

  /** Clear the in-memory response cache. */
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

  /** Latest episode releases from the homepage. */
  async getLatest(page?: number): Promise<PaginatedResult<LatestRelease>> {
    assertPage(page);
    return this.cached(['getLatest', page ?? 1], () => scrapeHome(this.axiosInstance, page));
  }

  /** Search posts by keyword. */
  async search(query: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertSearchQuery(query);
    assertPage(page);
    const q = query.trim();
    return this.cached(['search', q, page ?? 1], () => scrapeSearch(this.axiosInstance, q, page));
  }

  /** Posts under a category slug (e.g. "3d-hentai", "jav"). */
  async getByCategory(category: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertPage(page);
    const cleanCat = assertSlug(stripSlugPrefix(category, 'category'), 'category');
    const path = buildPagedPath(`/category/${cleanCat}`, page);
    return this.cached(['getByCategory', cleanCat, page ?? 1], () =>
      scrapePostList(this.axiosInstance, path, page ?? 1)
    );
  }

  async getHentai(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('hentai', page);
  }

  async get2DAnimation(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('2d-animation', page);
  }

  async get3DHentai(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('3d-hentai', page);
  }

  async getJAV(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('jav', page);
  }

  async getJAVCosplay(page?: number): Promise<PaginatedResult<SearchResult>> {
    return this.getByCategory('jav-cosplay', page);
  }

  /** Posts under a genre slug (e.g. "action", "big-oppai"). */
  async getByGenre(genre: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertPage(page);
    const cleanGenre = assertSlug(stripSlugPrefix(genre, 'genres'), 'genre');
    const path = buildPagedPath(`/genres/${cleanGenre}`, page);
    return this.cached(['getByGenre', cleanGenre, page ?? 1], () =>
      scrapePostList(this.axiosInstance, path, page ?? 1)
    );
  }

  /** Full indexed genre list. */
  async getGenres(): Promise<GenreItem[]> {
    return this.cached(['getGenres'], () => scrapeGenres(this.axiosInstance));
  }

  /** Single post detail including download links. */
  async getPostDetails(urlOrSlug: string): Promise<AnimeDetail> {
    const value = assertUrlOrSlug(urlOrSlug);
    return this.cached(['getPostDetails', value], () => scrapePost(this.axiosInstance, value));
  }

  /** Series profile with episode list. */
  async getSeriesDetails(urlOrSlug: string): Promise<SeriesDetail> {
    const value = assertUrlOrSlug(urlOrSlug);
    return this.cached(['getSeriesDetails', value], () =>
      scrapeSeriesDetails(this.axiosInstance, value)
    );
  }

  /** Full A–Z hentai index. */
  async getHentaiList(): Promise<AnimeSeries[]> {
    return this.cached(['getHentaiList'], () => scrapeHentaiList(this.axiosInstance));
  }
}
