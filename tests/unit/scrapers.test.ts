import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { AxiosInstance } from 'axios';
import { scrapeHome } from '../../src/scrapers/home.js';
import { scrapePostList } from '../../src/scrapers/category.js';
import { scrapePost } from '../../src/scrapers/post.js';
import { scrapeSeriesDetails } from '../../src/scrapers/series.js';
import { scrapeGenres } from '../../src/scrapers/genres.js';
import { scrapeHentaiList } from '../../src/scrapers/hentai-list.js';
import { NekopoiClient } from '../../src/client.js';
import { NekopoiParseError, NekopoiValidationError } from '../../src/errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8');
}

function mockAxios(htmlByPath: Record<string, string> | string): AxiosInstance {
  const get = vi.fn(async (path: string) => {
    if (typeof htmlByPath === 'string') {
      return { data: htmlByPath };
    }
    const data = htmlByPath[path] ?? htmlByPath['*'];
    if (data === undefined) {
      const err = new Error(`Unexpected path: ${path}`) as Error & {
        response?: { status: number };
      };
      err.response = { status: 404 };
      throw err;
    }
    return { data };
  });
  return { get } as unknown as AxiosInstance;
}

describe('scraper unit tests (fixtures)', () => {
  it('scrapeHome parses cards, content types, and pagination', async () => {
    const axios = mockAxios(loadFixture('home.html'));
    const result = await scrapeHome(axios);

    expect(result.page).toBe(1);
    expect(result.hasNext).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toMatchObject({
      title: '[3D] Sample Title Episode 1',
      url: 'https://nekopoi.care/sample-3d-episode/',
      thumbnail: 'https://cdn.example/thumb1.jpg',
      type: '3D Hentai',
      uploadedDate: '3 July 2026',
    });
    expect(result.data[1].type).toBe('Live2D Hentai');
    expect(result.data[2].type).toBe('Hentai');
    expect(result.data[2].thumbnail).toBe('https://cdn.example/thumb3.jpg');
  });

  it('scrapePostList parses search/category items with pagination', async () => {
    const axios = mockAxios(loadFixture('search.html'));
    const result = await scrapePostList(axios, '/search/shota/', 1);

    expect(result.page).toBe(1);
    expect(result.hasNext).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].type).toBe('Cosplay');
    expect(result.data[0].uploadedDate).toBe('10 June 2026');
    expect(result.data[1].uploadedDate).toBe('');
    expect(result.data[1].thumbnail).toBe('https://cdn.example/s2.jpg');
  });

  it('scrapePost extracts metadata and downloads', async () => {
    const axios = mockAxios(loadFixture('post.html'));
    const detail = await scrapePost(axios, 'sample-post');

    expect(detail.title).toBe('Sample Post Title');
    expect(detail.japaneseTitle).toBe('サンプルタイトル');
    expect(detail.producer).toBe('Studio Sample');
    expect(detail.duration).toBe('24 min');
    expect(detail.genres).toEqual(['Action', 'Romance', 'Comedy']);
    expect(detail.synopsis).toContain('synopsis paragraph');
    expect(detail.synopsis).not.toContain('Size :');
    expect(detail.uploadedDate).toBe('5 July 2026');
    expect(detail.downloads).toHaveLength(1);
    expect(detail.downloads[0].episode).toBe('Episode 1');
    expect(detail.downloads[0].downloads).toHaveLength(2);
    expect(detail.downloads[0].downloads[0].resolution).toBe('720p');
    expect(detail.downloads[0].downloads[0].links).toHaveLength(2);
  });

  it('scrapeSeriesDetails parses series profile and episodes', async () => {
    const axios = mockAxios(loadFixture('series.html'));
    const series = await scrapeSeriesDetails(axios, 'front-innocent');

    expect(series.title).toContain('Front Innocent');
    expect(series.japaneseTitle).toBe('フロントイノセント');
    expect(series.status).toBe('Completed');
    expect(series.totalEpisodes).toBe('2');
    expect(series.score).toBe(7.8);
    expect(series.genres).toEqual(['Drama', 'Romance']);
    expect(series.thumbnail).toBe('https://cdn.example/poster.jpg');
    expect(series.episodes).toHaveLength(2);
    expect(series.episodes[0].episodeNumber).toBe('Ep 1');
    expect(series.episodes[1].url).toContain('episode-2');
  });

  it('scrapeGenres extracts name, url, slug', async () => {
    const axios = mockAxios(loadFixture('genres.html'));
    const genres = await scrapeGenres(axios);

    expect(genres).toHaveLength(3);
    expect(genres[0]).toEqual({
      name: 'Action',
      url: 'https://nekopoi.care/genres/action/',
      slug: 'action',
    });
    expect(genres[1].slug).toBe('big-oppai');
  });

  it('scrapeHentaiList parses tooltip metadata', async () => {
    const axios = mockAxios(loadFixture('hentai-list.html'));
    const list = await scrapeHentaiList(axios);

    expect(list).toHaveLength(2);
    expect(list[0].title).toBe('Sample Series Full');
    expect(list[0].status).toBe('Ongoing');
    expect(list[0].score).toBe(8.1);
    expect(list[0].genres).toEqual(['Action', 'Drama']);
    expect(list[0].thumbnail).toBe('https://cdn.example/tt.jpg');
    expect(list[1].title).toBe('Another Series');
  });

  it('scrapePostList returns empty paginated result on 404', async () => {
    const get = vi.fn(async () => {
      const err = new Error('Not Found') as Error & { response?: { status: number } };
      err.response = { status: 404 };
      throw err;
    });
    const axios = { get } as unknown as AxiosInstance;
    await expect(scrapePostList(axios, '/missing/', 3)).resolves.toEqual({
      data: [],
      page: 3,
      hasNext: false,
    });
  });

  it('throws NekopoiParseError on challenge HTML', async () => {
    const axios = mockAxios(loadFixture('challenge.html'));
    await expect(scrapeHome(axios)).rejects.toBeInstanceOf(NekopoiParseError);
    await expect(scrapePost(axios, 'blocked-post')).rejects.toBeInstanceOf(NekopoiParseError);
  });
});

describe('NekopoiClient validation', () => {
  let client: NekopoiClient;

  beforeEach(() => {
    client = new NekopoiClient();
  });

  it('rejects invalid page and empty query without network', async () => {
    await expect(client.getLatest(0)).rejects.toBeInstanceOf(NekopoiValidationError);
    await expect(client.search('')).rejects.toBeInstanceOf(NekopoiValidationError);
    await expect(client.getByCategory('../x')).rejects.toBeInstanceOf(NekopoiValidationError);
    await expect(client.getByGenre('has space')).rejects.toBeInstanceOf(NekopoiValidationError);
    await expect(client.getPostDetails('')).rejects.toBeInstanceOf(NekopoiValidationError);
  });

  it('accepts options object constructor shape', () => {
    expect(
      () =>
        new NekopoiClient({
          baseUrl: 'https://mirror.example',
          timeout: 5000,
          retries: 1,
          minRequestIntervalMs: 100,
          cacheTtlMs: 1000,
        })
    ).not.toThrow();
    expect(() => new NekopoiClient('https://mirror.example')).not.toThrow();
  });

  it('exposes axios instance and resolved options', () => {
    const client = new NekopoiClient({
      baseUrl: 'https://mirror.example',
      timeout: 9000,
      cacheTtlMs: 5000,
      cacheMaxEntries: 10,
    });
    expect(client.getAxios()).toBeDefined();
    expect(typeof client.getAxios().get).toBe('function');
    expect(client.getOptions()).toMatchObject({
      baseUrl: 'https://mirror.example',
      timeout: 9000,
      cacheTtlMs: 5000,
      cacheMaxEntries: 10,
    });
  });
});
