import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { SearchResult } from '../types/index.js';
import { cleanText, detectContentType, extractBgImage } from '../utils/parser.js';
import { NekopoiScrapeError, getAxiosStatus, getErrorMessage } from '../errors.js';

/**
 * Generic scraper for pages that list posts as `.nk-search-item`
 * (search results, category archives, genre archives).
 */
export async function scrapePostList(
  axiosInstance: AxiosInstance,
  path: string
): Promise<SearchResult[]> {
  try {
    const { data } = await axiosInstance.get(path);
    const $ = cheerio.load(data);
    const results: SearchResult[] = [];

    $('.nk-search-item').each((_, element) => {
      const item = $(element);
      const url = item.attr('href') || '';
      const thumbnail = extractBgImage(item.find('.nk-search-thumb').attr('style'));
      const infoDiv = item.find('.nk-search-info');
      const title = cleanText(infoDiv.find('h2').text());
      const descText = cleanText(infoDiv.find('.nk-search-desc').text());

      let uploadedDate = '';
      if (descText) {
        const dateMatch = descText.match(/(\d+\s+\w+\s+\d{4})/);
        if (dateMatch) uploadedDate = dateMatch[1];
      }

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail,
          type: detectContentType(title),
          uploadedDate,
        });
      }
    });

    return results;
  } catch (error) {
    const status = getAxiosStatus(error);
    if (status === 404) return [];
    if (error instanceof NekopoiScrapeError) throw error;
    throw new NekopoiScrapeError(
      `Failed to scrape post list for path ${path}: ${getErrorMessage(error)}`,
      { cause: error, path, statusCode: status }
    );
  }
}
