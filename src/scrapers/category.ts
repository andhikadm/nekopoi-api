import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { SearchResult } from '../types/index.js';
import { cleanText } from '../utils/parser.js';

/**
 * Scraper generik untuk halaman yang berisi daftar postingan dalam format ".nk-search-item"
 * Digunakan oleh halaman pencarian, kategori, dan genre.
 */
export async function scrapePostList(axiosInstance: AxiosInstance, path: string): Promise<SearchResult[]> {
  try {
    const { data } = await axiosInstance.get(path);
    const $ = cheerio.load(data);
    const results: SearchResult[] = [];

    $('.nk-search-item').each((_, element) => {
      const item = $(element);
      const url = item.attr('href') || '';

      const thumbDiv = item.find('.nk-search-thumb');
      const style = thumbDiv.attr('style') || '';
      const bgMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      const thumbnail = bgMatch ? bgMatch[1] : '';

      const infoDiv = item.find('.nk-search-info');
      const title = cleanText(infoDiv.find('h2').text());
      const descText = cleanText(infoDiv.find('.nk-search-desc').text());

      // Deteksi tipe konten dari judul
      let type = 'Hentai';
      if (title.toLowerCase().includes('[3d]')) {
        type = '3D Hentai';
      } else if (title.toLowerCase().includes('[l2d]')) {
        type = 'Live2D Hentai';
      } else if (title.toLowerCase().includes('[cosplay]')) {
        type = 'Cosplay';
      }

      // Cari tanggal rilis dari teks deskripsi jika ada, atau biarkan kosong
      let uploadedDate = '';
      if (descText) {
        // Kadang deskripsi berisi info tanggal atau kita default kosong
        const dateMatch = descText.match(/(\d+\s+\w+\s+\d{4})/);
        if (dateMatch) {
          uploadedDate = dateMatch[1];
        }
      }

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail,
          type,
          uploadedDate,
        });
      }
    });

    return results;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw new Error(`Failed to scrape post list for path ${path}: ${error.message}`);
  }
}
