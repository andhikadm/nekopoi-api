import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { AnimeDetail, EpisodeDownload, DownloadLink } from '../types/index.js';
import { cleanText, resolveRequestPath } from '../utils/parser.js';
import { NekopoiScrapeError, getAxiosStatus, getErrorMessage } from '../errors.js';

export async function scrapePost(
  axiosInstance: AxiosInstance,
  urlOrSlug: string
): Promise<AnimeDetail> {
  const targetPath = resolveRequestPath(urlOrSlug);

  try {
    const { data } = await axiosInstance.get(targetPath);
    const $ = cheerio.load(data);

    const title = cleanText($('.nk-post-header h1').text());
    const thumbnail = $('.nk-featured-img img').attr('src') || '';

    let uploadedDate = '';
    $('.nk-post-header-meta span').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes('kali')) {
        uploadedDate = cleanText(text);
      }
    });

    let japaneseTitle = '';
    let producer = '';
    let duration = '';
    const genres: string[] = [];

    $('.nk-post-body .konten p').each((_, el) => {
      const pText = $(el).text();
      if (pText.includes('Original Title')) {
        japaneseTitle = cleanText(pText.split(':')[1]);
      } else if (pText.includes('Producers') || pText.includes('Producer')) {
        producer = cleanText(pText.split(':')[1]);
      } else if (pText.includes('Duration')) {
        duration = cleanText(pText.split(':')[1]);
      } else if (pText.includes('Genre')) {
        const genreParts = pText.split(':')[1];
        if (genreParts) {
          genreParts.split(',').forEach((g) => {
            const cleanG = cleanText(g);
            if (cleanG) genres.push(cleanG);
          });
        }
      }
    });

    const synopsisParagraphs: string[] = [];
    $('.nk-post-body .konten p').each((_, el) => {
      const p = $(el);
      const text = p.text().trim();
      const hasStrong = p.find('strong').length > 0;
      if (!hasStrong && text && !text.includes('Size :')) {
        synopsisParagraphs.push(text);
      }
    });
    const synopsis = synopsisParagraphs.join('\n\n') || 'Tidak ada sinopsis.';

    const downloadEpisodesMap: Record<string, EpisodeDownload['downloads']> = {};

    $('.nk-download-section .nk-download-row').each((_, el) => {
      const row = $(el);
      const nameText = cleanText(row.find('.nk-download-name').text());

      const resMatch = nameText.match(/\[(\d+p)\]/i);
      const resolution = resMatch ? resMatch[1] : 'Unknown';

      let episodeName = 'Full Episode';
      const cleanEpisodeName = nameText.replace(/\[\d+p\]/i, '').trim();
      if (cleanEpisodeName) {
        const epMatch = cleanEpisodeName.match(/(Episode\s+\d+)/i);
        episodeName = epMatch ? epMatch[1] : cleanEpisodeName;
      }

      const links: DownloadLink[] = [];
      row.find('.nk-download-links a').each((_, aEl) => {
        const a = $(aEl);
        const host = cleanText(a.text());
        const url = a.attr('href') || '';
        if (host && url) links.push({ host, url });
      });

      if (links.length > 0) {
        if (!downloadEpisodesMap[episodeName]) downloadEpisodesMap[episodeName] = [];
        downloadEpisodesMap[episodeName].push({ resolution, links });
      }
    });

    const downloads: EpisodeDownload[] = Object.keys(downloadEpisodesMap).map((episode) => ({
      episode,
      downloads: downloadEpisodesMap[episode],
    }));

    return {
      title,
      japaneseTitle: japaneseTitle || undefined,
      synopsis,
      thumbnail,
      uploadedDate,
      genres,
      duration: duration || undefined,
      producer: producer || undefined,
      downloads,
    };
  } catch (error) {
    if (error instanceof NekopoiScrapeError) throw error;
    throw new NekopoiScrapeError(
      `Failed to scrape post details for ${urlOrSlug}: ${getErrorMessage(error)}`,
      { cause: error, path: targetPath, statusCode: getAxiosStatus(error) }
    );
  }
}
