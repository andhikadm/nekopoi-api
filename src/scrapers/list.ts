import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { AnimeSeries, GenreItem, SeriesDetail, EpisodeItem } from '../types/index.js';
import { cleanText } from '../utils/parser.js';

export async function scrapeHentaiList(axiosInstance: AxiosInstance): Promise<AnimeSeries[]> {
  try {
    const { data } = await axiosInstance.get('/hentai-list/');
    const $ = cheerio.load(data);
    const results: AnimeSeries[] = [];

    $('.nk-az-item a.nk-series-link').each((_, element) => {
      const item = $(element);
      const url = item.attr('href') || '';
      const tooltipHtml = item.attr('original-title') || '';

      // Default info dasar
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
            const genreText = text.replace('Genre:', '');
            genres = genreText.split(',').map(g => cleanText(g)).filter(Boolean);
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
          score
        });
      }
    });

    return results;
  } catch (error) {
    throw new Error(`Failed to scrape hentai list: ${(error as Error).message}`);
  }
}

export async function scrapeGenres(axiosInstance: AxiosInstance): Promise<GenreItem[]> {
  try {
    const { data } = await axiosInstance.get('/genre-list/');
    const $ = cheerio.load(data);
    const results: GenreItem[] = [];

    $('.nk-genre-list ul li a').each((_, element) => {
      const a = $(element);
      const name = cleanText(a.text());
      const url = a.attr('href') || '';

      // Ambil slug dari URL (misal: "https://nekopoi.care/genres/action/" -> "action")
      const slugMatch = url.match(/\/genres\/([^\/]+)\/?$/);
      const slug = slugMatch ? slugMatch[1] : '';

      if (name && url) {
        results.push({ name, url, slug });
      }
    });

    return results;
  } catch (error) {
    throw new Error(`Failed to scrape genres: ${(error as Error).message}`);
  }
}

export async function scrapeSeriesDetails(axiosInstance: AxiosInstance, urlOrSlug: string): Promise<SeriesDetail> {
  try {
    let targetPath = urlOrSlug;
    if (urlOrSlug.startsWith('http')) {
      const urlObj = new URL(urlOrSlug);
      targetPath = urlObj.pathname + urlObj.search;
    } else if (!urlOrSlug.startsWith('/hentai/')) {
      targetPath = `/hentai/${urlOrSlug}/`;
    }

    const { data } = await axiosInstance.get(targetPath);
    const $ = cheerio.load(data);

    // Ambil Judul
    const title = cleanText($('.nk-series-info h2').text().replace(/^Unduh\s+["']|["']\s+Indonesian.*$/gi, ''));

    // Ambil Poster dari background-image
    const posterDiv = $('.nk-series-poster');
    const style = posterDiv.attr('style') || '';
    const bgMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
    const thumbnail = bgMatch ? bgMatch[1] : '';

    // Ambil Sinopsis
    const synopsis = cleanText($('.nk-series-synopsis p').text()) || cleanText($('.nk-series-synopsis').text().replace(/Episode Terbaru[\s\S]*?Unduh/gi, ''));

    // Ambil metadata dari list
    let japaneseTitle = '';
    let type = 'Hentai';
    let status = '';
    let totalEpisodes = '';
    let releaseDate = '';
    let producer = '';
    let duration = '';
    let score = '';
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
        score = cleanText(text.replace('Skor:', ''));
      } else if (text.includes('Genre')) {
        $(el).find('a').each((_, aEl) => {
          genres.push(cleanText($(aEl).text()));
        });
      }
    });

    // Ambil daftar episode
    const episodes: EpisodeItem[] = [];
    $('.nk-episode-grid ul li').each((_, el) => {
      const item = $(el);
      const card = item.find('a.nk-episode-card');
      const url = card.attr('href') || '';

      const epThumbDiv = card.find('.nk-episode-card-thumb');
      const epStyle = epThumbDiv.attr('style') || '';
      const epBgMatch = epStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
      const epThumb = epBgMatch ? epBgMatch[1] : '';

      const episodeNumber = cleanText(epThumbDiv.find('.nk-episode-badge').text());
      const epTitle = cleanText(card.find('.nk-episode-card-title').text());
      const epDate = cleanText(card.find('.nk-episode-card-date').text());

      if (url) {
        episodes.push({
          title: epTitle,
          url,
          episodeNumber,
          uploadedDate: epDate,
          thumbnail: epThumb
        });
      }
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
      score: score || undefined,
      episodes
    };
  } catch (error) {
    throw new Error(`Failed to scrape series details: ${(error as Error).message}`);
  }
}
