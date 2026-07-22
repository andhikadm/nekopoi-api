import type { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { GenreItem } from '../types/index.js';
import { cleanText } from '../utils/parser.js';
import {
  NekopoiParseError,
  NekopoiScrapeError,
  getAxiosStatus,
  getErrorMessage,
} from '../errors.js';
import { assertParseableHtml } from '../utils/html.js';

export async function scrapeGenres(axiosInstance: AxiosInstance): Promise<GenreItem[]> {
  const path = '/genre-list/';

  try {
    const { data } = await axiosInstance.get(path);
    const html = typeof data === 'string' ? data : String(data);
    const $ = cheerio.load(html);
    const results: GenreItem[] = [];

    $('.nk-genre-list ul li a').each((_, element) => {
      const a = $(element);
      const name = cleanText(a.text());
      const url = a.attr('href') || '';
      const slugMatch = url.match(/\/genres\/([^/]+)\/?$/);
      const slug = slugMatch ? slugMatch[1] : '';

      if (name && url) {
        results.push({ name, url, slug });
      }
    });

    assertParseableHtml(html, path, {
      resultCount: results.length,
      expectedMarkerSelector: '.nk-genre-list',
      $,
    });

    return results;
  } catch (error) {
    if (error instanceof NekopoiScrapeError || error instanceof NekopoiParseError) throw error;
    throw new NekopoiScrapeError(`Failed to scrape genres: ${getErrorMessage(error)}`, {
      cause: error,
      path,
      statusCode: getAxiosStatus(error),
    });
  }
}
