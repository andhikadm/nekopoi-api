import { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { AnimeDetail, EpisodeDownload, DownloadResolution, DownloadLink } from '../types/index.js';
import { cleanText } from '../utils/parser.js';

export async function scrapePost(axiosInstance: AxiosInstance, urlOrSlug: string): Promise<AnimeDetail> {
  try {
    let targetPath = urlOrSlug;
    // Jika URL lengkap, ambil path saja agar axios base URL berfungsi dengan baik, atau gunakan full url jika domain berbeda.
    if (urlOrSlug.startsWith('http')) {
      const urlObj = new URL(urlOrSlug);
      targetPath = urlObj.pathname + urlObj.search;
    }

    const { data } = await axiosInstance.get(targetPath);
    const $ = cheerio.load(data);

    const title = cleanText($('.nk-post-header h1').text());
    const thumbnail = $('.nk-featured-img img').attr('src') || '';

    // Ambil tanggal rilis
    let uploadedDate = '';
    $('.nk-post-header-meta span').each((_, el) => {
      const text = $(el).text().trim();
      // Kalender biasanya ada tanggal, di nekopoi ditulis langsung
      if (text && !text.includes('kali')) { // Lewati counter views "X kali"
        uploadedDate = cleanText(text);
      }
    });

    // Parsing info metadata dari kelas ".konten"
    let japaneseTitle = '';
    let producer = '';
    let duration = '';
    const genres: string[] = [];
    let synopsis = '';

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
          genreParts.split(',').forEach(g => {
            const cleanG = cleanText(g);
            if (cleanG) genres.push(cleanG);
          });
        }
      }
    });

    // Ambil sinopsis. Kadang sinopsis ditaruh di dalam paragraf tanpa tag strong di bagian akhir atau sebelum download
    // Kita juga bisa mengambil teks dari elemen tertentu. Untuk amannya, kita gabung paragraf yang bukan metadata.
    const synopsisParagraphs: string[] = [];
    $('.nk-post-body .konten p').each((_, el) => {
      const p = $(el);
      const text = p.text().trim();
      const hasStrong = p.find('strong').length > 0;
      // Paragraf metadata biasanya pakai <strong>
      if (!hasStrong && text && !text.includes('Size :')) {
        synopsisParagraphs.push(text);
      }
    });
    synopsis = synopsisParagraphs.join('\n\n') || 'Tidak ada sinopsis.';

    // Mengumpulkan tautan unduhan (download links)
    const downloadEpisodesMap: { [episodeName: string]: DownloadResolution[] } = {};

    $('.nk-download-section .nk-download-row').each((_, el) => {
      const row = $(el);
      const nameText = cleanText(row.find('.nk-download-name').text());

      // Biasanya resolusi ditulis di akhir nameText dalam tanda kurung siku, contoh: "[1080p]"
      const resMatch = nameText.match(/\[(\d+p)\]/i);
      const resolution = resMatch ? resMatch[1] : 'Unknown';

      // Ekstrak nama episode atau judul bersih (tanpa resolusi)
      let episodeName = 'Full Episode';
      const cleanEpisodeName = nameText.replace(/\[\d+p\]/i, '').trim();
      if (cleanEpisodeName) {
        // Cek apakah ada format episode
        const epMatch = cleanEpisodeName.match(/(Episode\s+\d+)/i);
        if (epMatch) {
          episodeName = epMatch[1];
        } else {
          // Jika tidak ada episode spesifik, gunakan judul bersih
          episodeName = cleanEpisodeName;
        }
      }

      // Ambil link download
      const links: DownloadLink[] = [];
      row.find('.nk-download-links a').each((_, aEl) => {
        const a = $(aEl);
        const host = cleanText(a.text());
        const url = a.attr('href') || '';
        if (host && url) {
          links.push({ host, url });
        }
      });

      if (links.length > 0) {
        if (!downloadEpisodesMap[episodeName]) {
          downloadEpisodesMap[episodeName] = [];
        }
        downloadEpisodesMap[episodeName].push({
          resolution,
          links
        });
      }
    });

    // Ubah map download menjadi format array EpisodeDownload
    const downloads: EpisodeDownload[] = Object.keys(downloadEpisodesMap).map(episode => ({
      episode,
      downloads: downloadEpisodesMap[episode]
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
      downloads
    };
  } catch (error) {
    throw new Error(`Failed to scrape post details for ${urlOrSlug}: ${(error as Error).message}`);
  }
}
