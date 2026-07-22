import type { PaginatedResult } from '../types/index.js';

/** Build a paginated envelope from scraped items. */
export function toPaginatedResult<T>(
  data: T[],
  page: number | undefined,
  hasNext: boolean
): PaginatedResult<T> {
  return {
    data,
    page: page && page > 0 ? page : 1,
    hasNext,
  };
}

/** True when the current page has no items. */
export function isEmptyPage<T>(result: PaginatedResult<T>): boolean {
  return result.data.length === 0;
}

/** True when a subsequent page is likely available. */
export function hasNextPage<T>(result: PaginatedResult<T>): boolean {
  return result.hasNext;
}

/** Next page number when `hasNext` is true; otherwise `null`. */
export function nextPageNumber<T>(result: PaginatedResult<T>): number | null {
  return result.hasNext ? result.page + 1 : null;
}

/** Map items while preserving page metadata. */
export function mapPage<T, U>(
  result: PaginatedResult<T>,
  mapper: (item: T, index: number) => U
): PaginatedResult<U> {
  return {
    data: result.data.map(mapper),
    page: result.page,
    hasNext: result.hasNext,
  };
}

/** Filter items while preserving page metadata (`hasNext` unchanged). */
export function filterPage<T>(
  result: PaginatedResult<T>,
  predicate: (item: T, index: number) => boolean
): PaginatedResult<T> {
  return {
    data: result.data.filter(predicate),
    page: result.page,
    hasNext: result.hasNext,
  };
}

/**
 * Fetch every page until `hasNext` is false or `maxPages` is reached.
 * Caller supplies the page loader (typically a client method bound to args).
 */
export async function collectAllPages<T>(
  loadPage: (page: number) => Promise<PaginatedResult<T>>,
  options?: { maxPages?: number; startPage?: number }
): Promise<T[]> {
  const maxPages = options?.maxPages ?? 50;
  const startPage = options?.startPage ?? 1;
  const items: T[] = [];
  let page = startPage;

  for (let i = 0; i < maxPages; i += 1) {
    const result = await loadPage(page);
    items.push(...result.data);
    if (!result.hasNext || result.data.length === 0) break;
    page = result.page + 1;
  }

  return items;
}
