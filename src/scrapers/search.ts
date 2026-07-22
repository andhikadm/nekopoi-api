import type { AxiosInstance } from 'axios';
import type { PaginatedResult, SearchResult } from '../types/index.js';
import { scrapePostList } from './category.js';
import { buildPagedPath } from '../utils/parser.js';

export async function scrapeSearch(
  axiosInstance: AxiosInstance,
  query: string,
  page?: number
): Promise<PaginatedResult<SearchResult>> {
  const encodedQuery = encodeURIComponent(query);
  const path = buildPagedPath(`/search/${encodedQuery}`, page);
  return scrapePostList(axiosInstance, path, page ?? 1);
}
