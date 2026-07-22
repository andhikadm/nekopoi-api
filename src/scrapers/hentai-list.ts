import type { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { AnimeSeries } from '../types/index.js';
import { cleanText } from '../utils/parser.js';
import {
  NekopoiParseError,
  NekopoiScrapeError,
  getAxiosStatus,
  getErrorMessage,
} from '../errors.js';
import { assertParseableHtml } from '../utils/html.js';

export async function scrapeHentaiList(axiosInstance: AxiosInstance): Promise<AnimeSeries[]> {
  const path = '/hentai-list/';

  try {
    const { data } = await axiosInstance.get(path);
    const html = typeof data === 'string' ? data : String(data);
    const $ = cheerio.load(html);
    const results: AnimeSeries[] = [];

    $('.nk-az-item a.nk-series-link').each((_, element) => {
      const item = $(element);
      const url = item.attr('href') || '';
      const tooltipHtml = item.attr('original-title') || '';

      let title = cleanText(item.text());
      let thumbnail: string | undefined;
      let japaneseTitle: string | undefined;
      let producer: string | undefined;
      let type: string | undefined;
      let status: string | undefined;
      let genres: string[] = [];
      let duration: string | undefined;
      let score: string | undefined;

      if (tooltipHtml) {
        const $$ = cheerio.load(tooltipHtml);
        const tooltipTitle = cleanText($$('h2').text());
        if (tooltipTitle) title = tooltipTitle;

        thumbnail = $$('.nk-tooltip-img').attr('src') || undefined;

        $$('.nk-tooltip-detail p').each((_, pEl) => {
          const text = $$(pEl).text();
          if (text.includes('Nama Jepang')) {
            japaneseTitle = cleanText(text.replace('Nama Jepang:', ''));
          } else if (text.includes('Produser')) {
            producer = cleanText(text.replace('Produser:', ''));
          } else if (text.includes('Tipe')) {
            type = cleanText(text.replace('Tipe:', ''));
          } else if (text.includes('Status')) {
            status = cleanText(text.replace('Status:', ''));
          } else if (text.includes('Genre')) {
            genres = text
              .replace('Genre:', '')
              .split(',')
              .map((g) => cleanText(g))
              .filter(Boolean);
          } else if (text.includes('Durasi')) {
            duration = cleanText(text.replace('Durasi:', ''));
          } else if (text.includes('Skor') || text.includes('Score')) {
            score = cleanText(text.replace(/Skor:|Score:/, ''));
          }
        });
      }

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail,
          japaneseTitle,
          producer,
          type,
          status,
          genres: genres.length > 0 ? genres : undefined,
          duration,
          score,
        });
      }
    });

    assertParseableHtml(html, path, {
      resultCount: results.length,
      expectedMarkerSelector: '.nk-az-item',
      $,
    });

    return results;
  } catch (error) {
    if (error instanceof NekopoiScrapeError || error instanceof NekopoiParseError) throw error;
    throw new NekopoiScrapeError(`Failed to scrape hentai list: ${getErrorMessage(error)}`, {
      cause: error,
      path,
      statusCode: getAxiosStatus(error),
    });
  }
}
