import type { PaginatedResult } from '../types/index.js';

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
