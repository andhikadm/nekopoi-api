import { AxiosInstance } from 'axios';
import { createHttpClient, BASE_URL } from './utils/request.js';
import { scrapeHome } from './scrapers/home.js';
import { scrapeSearch } from './scrapers/search.js';
import { scrapePost } from './scrapers/post.js';
import { scrapeHentaiList, scrapeGenres, scrapeSeriesDetails } from './scrapers/list.js';
import { scrapePostList } from './scrapers/category.js';
import { LatestRelease, SearchResult, AnimeDetail, AnimeSeries, GenreItem, SeriesDetail } from './types/index.js';

export class NekopoiClient {
  private axiosInstance: AxiosInstance;

  constructor(customBaseUrl?: string) {
    this.axiosInstance = createHttpClient(customBaseUrl || BASE_URL);
  }

  /**
   * Mengambil daftar rilis terbaru (Home) dari nekopoi.care
   * @param page Halaman rilis terbaru (opsional)
   */
  async getLatest(page?: number): Promise<LatestRelease[]> {
    return scrapeHome(this.axiosInstance, page);
  }

  /**
   * Melakukan pencarian berdasarkan kata kunci
   * @param query Kata kunci pencarian
   * @param page Halaman hasil pencarian (opsional)
   */
  async search(query: string, page?: number): Promise<SearchResult[]> {
    return scrapeSearch(this.axiosInstance, query, page);
  }

  /**
   * Mengambil daftar rilis berdasarkan kategori tertentu
   * @param category Nama kategori (contoh: "3d-hentai", "hentai", "jav", "2d-animation", "jav-cosplay")
   * @param page Halaman daftar kategori (opsional)
   */
  async getByCategory(category: string, page?: number): Promise<SearchResult[]> {
    const cleanCat = category.replace(/^\/?category\/?/i, '').replace(/^\/|\/$/g, '');
    const path = page && page > 1 ? `/category/${cleanCat}/page/${page}/` : `/category/${cleanCat}/`;
    return scrapePostList(this.axiosInstance, path);
  }

  /**
   * Mengambil daftar rilis terbaru kategori Hentai (2D)
   * @param page Halaman rilis (opsional)
   */
  async getHentai(page?: number): Promise<SearchResult[]> {
    return this.getByCategory('hentai', page);
  }

  /**
   * Mengambil daftar rilis terbaru kategori 2D Animation
   * @param page Halaman rilis (opsional)
   */
  async get2DAnimation(page?: number): Promise<SearchResult[]> {
    return this.getByCategory('2d-animation', page);
  }

  /**
   * Mengambil daftar rilis terbaru kategori 3D Hentai
   * @param page Halaman rilis (opsional)
   */
  async get3DHentai(page?: number): Promise<SearchResult[]> {
    return this.getByCategory('3d-hentai', page);
  }

  /**
   * Mengambil daftar rilis terbaru kategori JAV (Japanese Adult Video)
   * @param page Halaman rilis (opsional)
   */
  async getJAV(page?: number): Promise<SearchResult[]> {
    return this.getByCategory('jav', page);
  }

  /**
   * Mengambil daftar rilis terbaru kategori JAV Cosplay
   * @param page Halaman rilis (opsional)
   */
  async getJAVCosplay(page?: number): Promise<SearchResult[]> {
    return this.getByCategory('jav-cosplay', page);
  }

  /**
   * Mengambil daftar rilis berdasarkan genre tertentu
   * @param genre Nama genre atau slug (contoh: "shota", "big-oppai", "creampie")
   * @param page Halaman daftar (opsional)
   */
  async getByGenre(genre: string, page?: number): Promise<SearchResult[]> {
    const cleanGenre = genre.replace(/^\/?genres\/?/i, '').replace(/^\/|\/$/g, '');
    const path = page && page > 1 ? `/genres/${cleanGenre}/page/${page}/` : `/genres/${cleanGenre}/`;
    return scrapePostList(this.axiosInstance, path);
  }

  /**
   * Mengambil daftar semua genre yang terindeks
   */
  async getGenres(): Promise<GenreItem[]> {
    return scrapeGenres(this.axiosInstance);
  }

  /**
   * Mengambil detail postingan anime, termasuk tautan unduhan
   * @param urlOrSlug URL lengkap postingan atau slug postingan (misal: "3d-marie-pingsan-...")
   */
  async getPostDetails(urlOrSlug: string): Promise<AnimeDetail> {
    return scrapePost(this.axiosInstance, urlOrSlug);
  }

  /**
   * Mengambil detail lengkap seri anime hentai (kumpulan episode)
   * @param urlOrSlug URL lengkap seri atau slug seri (misal: "front-innocent-...")
   */
  async getSeriesDetails(urlOrSlug: string): Promise<SeriesDetail> {
    return scrapeSeriesDetails(this.axiosInstance, urlOrSlug);
  }

  /**
   * Mengambil daftar lengkap hentai terindeks (Hentai List A-Z)
   */
  async getHentaiList(): Promise<AnimeSeries[]> {
    return scrapeHentaiList(this.axiosInstance);
  }
}
