import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { GenreItem } from '../types/index.js';
import { cleanText } from '../utils/parser.js';
import { NekopoiScrapeError, getAxiosStatus, getErrorMessage } from '../errors.js';

export async function scrapeGenres(axiosInstance: AxiosInstance): Promise<GenreItem[]> {
  const path = '/genre-list/';

  try {
    const { data } = await axiosInstance.get(path);
    const $ = cheerio.load(data);
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

    return results;
  } catch (error) {
    if (error instanceof NekopoiScrapeError) throw error;
    throw new NekopoiScrapeError(`Failed to scrape genres: ${getErrorMessage(error)}`, {
      cause: error,
      path,
      statusCode: getAxiosStatus(error),
    });
  }
}
