import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { LatestRelease } from '../types/index.js';
import { cleanText } from '../utils/parser.js';

export async function scrapeHome(axiosInstance: AxiosInstance, page?: number): Promise<LatestRelease[]> {
  try {
    const targetPath = page && page > 1 ? `/page/${page}/` : '/';
    const { data } = await axiosInstance.get(targetPath);
    const $ = cheerio.load(data);
    const results: LatestRelease[] = [];

    $('#nk-episode-grid .nk-post-card').each((_, element) => {
      const card = $(element);
      const titleLink = card.find('.nk-post-meta h2 a');
      const title = cleanText(titleLink.text());
      const url = titleLink.attr('href') || '';

      // Ambil thumbnail dari background-image
      const thumbDiv = card.find('.nk-post-thumb .nk-thumb-crop');
      const style = thumbDiv.attr('style') || '';
      const bgMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      const thumbnail = bgMatch ? bgMatch[1] : '';

      // Ambil tanggal rilis
      const dateText = cleanText(card.find('.nk-post-meta span').text());

      // Deteksi tipe konten dari judul (misal: [3D], [L2D], [CAV SUB INDO], dll)
      let type = 'Hentai';
      if (title.toLowerCase().includes('[3d]')) {
        type = '3D Hentai';
      } else if (title.toLowerCase().includes('[l2d]')) {
        type = 'Live2D Hentai';
      } else if (title.toLowerCase().includes('[cosplay]')) {
        type = 'Cosplay';
      } else if (title.toLowerCase().includes('[cav')) {
        type = 'CAV';
      }

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail,
          type,
          uploadedDate: dateText,
        });
      }
    });

    return results;
  } catch (error) {
    throw new Error(`Failed to scrape homepage: ${(error as Error).message}`);
  }
}
