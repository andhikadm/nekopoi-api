import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TtlCache, cacheKey } from '../../src/utils/cache.js';
import { NekopoiClient } from '../../src/client.js';

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and returns values within TTL', () => {
    const cache = new TtlCache(1000);
    cache.set('a', { ok: true });
    expect(cache.get('a')).toEqual({ ok: true });
  });

  it('expires entries after TTL', () => {
    const cache = new TtlCache(500);
    cache.set('a', 1);
    vi.advanceTimersByTime(501);
    expect(cache.get('a')).toBeUndefined();
  });

  it('is disabled when ttl is 0', () => {
    const cache = new TtlCache(0);
    expect(cache.enabled).toBe(false);
    cache.set('a', 1);
    expect(cache.get('a')).toBeUndefined();
  });

  it('evicts oldest when max entries exceeded', () => {
    const cache = new TtlCache(10_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('cacheKey joins parts stably', () => {
    expect(cacheKey(['search', 'shota', 1])).toBe('search::shota::1');
    expect(cacheKey(['x', undefined, null])).toBe('x::::');
  });
});

describe('NekopoiClient cache integration', () => {
  it('reuses cached getGenres results', async () => {
    const html = `
      <div class="nk-genre-list"><ul>
        <li><a href="https://nekopoi.care/genres/action/">Action</a></li>
      </ul></div>`;

    const client = new NekopoiClient({ cacheTtlMs: 60_000 });
    const getSpy = vi.spyOn(client.getAxios(), 'get').mockResolvedValue({ data: html } as never);

    const first = await client.getGenres();
    const second = await client.getGenres();
    expect(first).toHaveLength(1);
    expect(second).toEqual(first);
    expect(getSpy).toHaveBeenCalledTimes(1);

    client.clearCache();
    await client.getGenres();
    expect(getSpy).toHaveBeenCalledTimes(2);

    getSpy.mockRestore();
  });
});
