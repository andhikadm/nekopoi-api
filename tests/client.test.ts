import { describe, it, expect, beforeAll } from 'vitest';
import { NekopoiClient } from '../src/client.js';

/**
 * Live integration tests against the real site.
 * Run with: npm run test:integration
 */
describe('NekopoiClient Integration Tests', () => {
  let client: NekopoiClient;

  beforeAll(() => {
    client = new NekopoiClient({ retries: 2, minRequestIntervalMs: 250 });
  });

  it('should fetch latest releases from home page', async () => {
    const latest = await client.getLatest();
    expect(latest.data).toBeInstanceOf(Array);
    expect(latest.data.length).toBeGreaterThan(0);
    expect(latest.page).toBe(1);
    expect(typeof latest.hasNext).toBe('boolean');

    const firstItem = latest.data[0];
    expect(firstItem).toHaveProperty('title');
    expect(firstItem).toHaveProperty('url');
    expect(firstItem).toHaveProperty('thumbnail');
    expect(firstItem).toHaveProperty('type');
    expect(firstItem).toHaveProperty('uploadedDate');
    expect(firstItem.url).toMatch(/^https?:\/\//);
  }, 20000);

  it('should search for query "shota"', async () => {
    const results = await client.search('shota');
    expect(results.data).toBeInstanceOf(Array);
    expect(results.data.length).toBeGreaterThan(0);
    expect(results.page).toBe(1);

    const firstItem = results.data[0];
    expect(firstItem).toHaveProperty('title');
    expect(firstItem).toHaveProperty('url');
    expect(firstItem).toHaveProperty('thumbnail');
    expect(firstItem.url).toMatch(/^https?:\/\//);
  }, 20000);

  it('should fetch details of a post', async () => {
    const latest = await client.getLatest();
    const firstUrl = latest.data[0].url;

    const details = await client.getPostDetails(firstUrl);
    expect(details).toHaveProperty('title');
    expect(details).toHaveProperty('synopsis');
    expect(details).toHaveProperty('genres');
    expect(details).toHaveProperty('downloads');
    expect(details.genres).toBeInstanceOf(Array);
    expect(details.downloads).toBeInstanceOf(Array);
  }, 20000);

  it('should fetch posts by category', async () => {
    const results = await client.getByCategory('3d-hentai');
    expect(results.data).toBeInstanceOf(Array);
    expect(results.data.length).toBeGreaterThan(0);
    expect(results.data[0]).toHaveProperty('title');
  }, 20000);

  it('should fetch posts using category shortcut methods', async () => {
    const hentai3d = await client.get3DHentai();
    expect(hentai3d.data).toBeInstanceOf(Array);
    expect(hentai3d.data.length).toBeGreaterThan(0);

    const jav = await client.getJAV();
    expect(jav.data).toBeInstanceOf(Array);
    expect(jav.data.length).toBeGreaterThan(0);
  }, 30000);

  it('should fetch genre list and get posts by a genre', async () => {
    const genres = await client.getGenres();
    expect(genres).toBeInstanceOf(Array);
    expect(genres.length).toBeGreaterThan(0);
    expect(genres[0]).toHaveProperty('name');
    expect(genres[0]).toHaveProperty('slug');

    const firstGenreSlug = genres[0].slug;
    const results = await client.getByGenre(firstGenreSlug);
    expect(results.data).toBeInstanceOf(Array);
    expect(results.data.length).toBeGreaterThan(0);
  }, 30000);

  it('should fetch details of a series', async () => {
    const series = await client.getSeriesDetails('front-innocent-mou-hitotsu-no-lady-innocent');
    expect(series).toHaveProperty('title');
    expect(series).toHaveProperty('status');
    expect(series).toHaveProperty('totalEpisodes');
    expect(series).toHaveProperty('genres');
    expect(series.genres).toBeInstanceOf(Array);
    expect(series.episodes).toBeInstanceOf(Array);
    expect(series.episodes.length).toBeGreaterThan(0);
  }, 20000);
});
