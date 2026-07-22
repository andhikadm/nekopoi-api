import { describe, it, expect, vi } from 'vitest';
import {
  toPaginatedResult,
  isEmptyPage,
  hasNextPage,
  nextPageNumber,
  mapPage,
  filterPage,
  collectAllPages,
} from '../../src/utils/pagination.js';
import type { PaginatedResult } from '../../src/types/index.js';

describe('pagination helpers', () => {
  const sample: PaginatedResult<{ id: number; title: string }> = {
    data: [
      { id: 1, title: 'A' },
      { id: 2, title: 'B' },
    ],
    page: 1,
    hasNext: true,
  };

  it('toPaginatedResult normalizes page', () => {
    expect(toPaginatedResult(['x'], undefined, false)).toEqual({
      data: ['x'],
      page: 1,
      hasNext: false,
    });
    expect(toPaginatedResult([], 3, true).page).toBe(3);
  });

  it('isEmptyPage / hasNextPage / nextPageNumber', () => {
    expect(isEmptyPage(sample)).toBe(false);
    expect(isEmptyPage({ data: [], page: 2, hasNext: false })).toBe(true);
    expect(hasNextPage(sample)).toBe(true);
    expect(nextPageNumber(sample)).toBe(2);
    expect(nextPageNumber({ data: [], page: 5, hasNext: false })).toBeNull();
  });

  it('mapPage and filterPage preserve metadata', () => {
    const mapped = mapPage(sample, (item) => item.title);
    expect(mapped).toEqual({ data: ['A', 'B'], page: 1, hasNext: true });

    const filtered = filterPage(sample, (item) => item.id === 2);
    expect(filtered.data).toEqual([{ id: 2, title: 'B' }]);
    expect(filtered.page).toBe(1);
    expect(filtered.hasNext).toBe(true);
  });

  it('collectAllPages walks until hasNext is false', async () => {
    const loadPage = vi.fn(async (page: number) => {
      if (page === 1) {
        return { data: ['a', 'b'], page: 1, hasNext: true };
      }
      if (page === 2) {
        return { data: ['c'], page: 2, hasNext: false };
      }
      return { data: [], page, hasNext: false };
    });

    const all = await collectAllPages(loadPage);
    expect(all).toEqual(['a', 'b', 'c']);
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it('collectAllPages respects maxPages', async () => {
    const loadPage = vi.fn(async (page: number) => ({
      data: [page],
      page,
      hasNext: true,
    }));

    const all = await collectAllPages(loadPage, { maxPages: 3 });
    expect(all).toEqual([1, 2, 3]);
    expect(loadPage).toHaveBeenCalledTimes(3);
  });
});
