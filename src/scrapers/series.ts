import type { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import type { SeriesDetail, EpisodeItem } from '../types/index.js';
import { cleanText, extractBgImage, parseScore, resolveRequestPath } from '../utils/parser.js';
import {
  NekopoiParseError,
  NekopoiScrapeError,
  getAxiosStatus,
  getErrorMessage,
} from '../errors.js';
import { assertParseableHtml } from '../utils/html.js';

export async function scrapeSeriesDetails(
  axiosInstance: AxiosInstance,
  urlOrSlug: string
): Promise<SeriesDetail> {
  const targetPath = resolveRequestPath(urlOrSlug, '/hentai');

  try {
    const { data } = await axiosInstance.get(targetPath);
    const html = typeof data === 'string' ? data : String(data);
    const $ = cheerio.load(html);

    const title = cleanText(
      $('.nk-series-info h2').text().replace(/^Unduh\s+["']|["']\s+Indonesian.*$/gi, '')
    );
    const thumbnail = extractBgImage($('.nk-series-poster').attr('style'));
    const synopsis =
      cleanText($('.nk-series-synopsis p').text()) ||
      cleanText($('.nk-series-synopsis').text().replace(/Episode Terbaru[\s\S]*?Unduh/gi, ''));

    let japaneseTitle = '';
    let type = 'Hentai';
    let status = '';
    let totalEpisodes = '';
    let releaseDate = '';
    let producer = '';
    let duration = '';
    let score: number | null | undefined;
    const genres: string[] = [];

    $('.nk-series-meta-list ul li').each((_, el) => {
      const text = $(el).text();
      if (text.includes('Judul Jepang')) {
        japaneseTitle = cleanText(text.replace('Judul Jepang:', ''));
      } else if (text.includes('Jenis')) {
        type = cleanText(text.replace('Jenis:', ''));
      } else if (text.includes('Episode') && !text.includes('Jadwal')) {
        totalEpisodes = cleanText(text.replace('Episode:', ''));
      } else if (text.includes('Status')) {
        status = cleanText(text.replace('Status:', ''));
      } else if (text.includes('Tayang')) {
        releaseDate = cleanText(text.replace('Tayang:', ''));
      } else if (text.includes('Produser')) {
        producer = cleanText(text.replace('Produser:', ''));
      } else if (text.includes('Durasi')) {
        duration = cleanText(text.replace('Durasi:', ''));
      } else if (text.includes('Skor')) {
        score = parseScore(text.replace('Skor:', ''));
      } else if (text.includes('Genre')) {
        $(el)
          .find('a')
          .each((_, aEl) => {
            genres.push(cleanText($(aEl).text()));
          });
      }
    });

    const episodes: EpisodeItem[] = [];
    $('.nk-episode-grid ul li').each((_, el) => {
      const item = $(el);
      const card = item.find('a.nk-episode-card');
      const url = card.attr('href') || '';
      const epThumb = extractBgImage(card.find('.nk-episode-card-thumb').attr('style'));
      const episodeNumber = cleanText(card.find('.nk-episode-badge').text());
      const epTitle = cleanText(card.find('.nk-episode-card-title').text());
      const epDate = cleanText(card.find('.nk-episode-card-date').text());

      if (url) {
        episodes.push({
          title: epTitle,
          url,
          episodeNumber,
          uploadedDate: epDate,
          thumbnail: epThumb,
        });
      }
    });

    assertParseableHtml(html, targetPath, {
      resultCount: title ? 1 : 0,
      expectedMarkerSelector: '.nk-series-info',
      $,
    });

    return {
      title,
      japaneseTitle: japaneseTitle || undefined,
      thumbnail,
      synopsis,
      type,
      status,
      totalEpisodes,
      releaseDate: releaseDate || undefined,
      producer: producer || undefined,
      genres,
      duration: duration || undefined,
      score,
      episodes,
    };
  } catch (error) {
    if (error instanceof NekopoiScrapeError || error instanceof NekopoiParseError) throw error;
    throw new NekopoiScrapeError(
      `Failed to scrape series details: ${getErrorMessage(error)}`,
      { cause: error, path: targetPath, statusCode: getAxiosStatus(error) }
    );
  }
}
