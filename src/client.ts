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
  PaginatedResult,
} from './types/index.js';
import {
  assertPage,
  assertSearchQuery,
  assertSlug,
  assertUrlOrSlug,
} from './utils/validate.js';
import { buildPagedPath, stripSlugPrefix } from './utils/parser.js';

export class NekopoiClient {
  private axiosInstance: AxiosInstance;

  /**
   * @param baseUrlOrOptions Custom base URL string, or full client options.
   *                         Defaults to https://nekopoi.care
   */
  constructor(baseUrlOrOptions?: string | NekopoiClientOptions) {
    if (typeof baseUrlOrOptions === 'string' || baseUrlOrOptions === undefined) {
      this.axiosInstance = createHttpClient(baseUrlOrOptions || BASE_URL);
    } else {
      this.axiosInstance = createHttpClient(baseUrlOrOptions);
    }
  }

  /** Latest episode releases from the homepage. */
  async getLatest(page?: number): Promise<PaginatedResult<LatestRelease>> {
    assertPage(page);
    return scrapeHome(this.axiosInstance, page);
  }

  /** Search posts by keyword. */
  async search(query: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertSearchQuery(query);
    assertPage(page);
    return scrapeSearch(this.axiosInstance, query.trim(), page);
  }

  /** Posts under a category slug (e.g. "3d-hentai", "jav"). */
  async getByCategory(category: string, page?: number): Promise<PaginatedResult<SearchResult>> {
    assertPage(page);
    const cleanCat = assertSlug(stripSlugPrefix(category, 'category'), 'category');
    const path = buildPagedPath(`/category/${cleanCat}`, page);
    return scrapePostList(this.axiosInstance, path, page ?? 1);
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
    return scrapePostList(this.axiosInstance, path, page ?? 1);
  }

  /** Full indexed genre list. */
  async getGenres(): Promise<GenreItem[]> {
    return scrapeGenres(this.axiosInstance);
  }

  /** Single post detail including download links. */
  async getPostDetails(urlOrSlug: string): Promise<AnimeDetail> {
    const value = assertUrlOrSlug(urlOrSlug);
    return scrapePost(this.axiosInstance, value);
  }

  /** Series profile with episode list. */
  async getSeriesDetails(urlOrSlug: string): Promise<SeriesDetail> {
    const value = assertUrlOrSlug(urlOrSlug);
    return scrapeSeriesDetails(this.axiosInstance, value);
  }

  /** Full A–Z hentai index. */
  async getHentaiList(): Promise<AnimeSeries[]> {
    return scrapeHentaiList(this.axiosInstance);
  }
}
