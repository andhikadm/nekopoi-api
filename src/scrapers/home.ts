import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { LatestRelease } from '../types/index.js';
import { cleanText, detectContentType, extractBgImage, buildPagedPath } from '../utils/parser.js';
import { NekopoiScrapeError, getAxiosStatus, getErrorMessage } from '../errors.js';

export async function scrapeHome(
  axiosInstance: AxiosInstance,
  page?: number
): Promise<LatestRelease[]> {
  const targetPath = buildPagedPath('/', page);

  try {
    const { data } = await axiosInstance.get(targetPath);
    const $ = cheerio.load(data);
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

    return results;
  } catch (error) {
    if (error instanceof NekopoiScrapeError) throw error;
    throw new NekopoiScrapeError(`Failed to scrape homepage: ${getErrorMessage(error)}`, {
      cause: error,
      path: targetPath,
      statusCode: getAxiosStatus(error),
    });
  }
}
