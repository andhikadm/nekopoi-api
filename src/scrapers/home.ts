import type { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { LatestRelease, PaginatedResult } from '../types/index.js';
import { cleanText, detectContentType, extractBgImage, buildPagedPath } from '../utils/parser.js';
import {
  NekopoiParseError,
  NekopoiScrapeError,
  getAxiosStatus,
  getErrorMessage,
} from '../errors.js';
import { assertParseableHtml, detectHasNextPage } from '../utils/html.js';
import { toPaginatedResult } from '../utils/pagination.js';

export async function scrapeHome(
  axiosInstance: AxiosInstance,
  page?: number
): Promise<PaginatedResult<LatestRelease>> {
  const currentPage = page && page > 0 ? page : 1;
  const targetPath = buildPagedPath('/', page);

  try {
    const { data } = await axiosInstance.get(targetPath);
    const html = typeof data === 'string' ? data : String(data);
    const $ = cheerio.load(html);
    const results: LatestRelease[] = [];

    $('#nk-episode-grid .nk-post-card').each((_, element) => {
      const card = $(element);
      const titleLink = card.find('.nk-post-meta h2 a');
      const title = cleanText(titleLink.text());
      const url = titleLink.attr('href') || '';
      const thumbnail = extractBgImage(card.find('.nk-post-thumb .nk-thumb-crop').attr('style'));
      const dateText = cleanText(card.find('.nk-post-meta span').text());

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail,
          type: detectContentType(title),
          uploadedDate: dateText,
        });
      }
    });

    assertParseableHtml(html, targetPath, {
      resultCount: results.length,
      expectedMarkerSelector: '#nk-episode-grid',
      $,
      allowEmpty: currentPage > 1,
    });

    return toPaginatedResult(results, currentPage, detectHasNextPage($, currentPage));
  } catch (error) {
    if (error instanceof NekopoiScrapeError || error instanceof NekopoiParseError) throw error;
    throw new NekopoiScrapeError(`Failed to scrape homepage: ${getErrorMessage(error)}`, {
      cause: error,
      path: targetPath,
      statusCode: getAxiosStatus(error),
    });
  }
}
