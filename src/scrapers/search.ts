import { AxiosInstance } from 'axios';
import { SearchResult } from '../types/index.js';
import { scrapePostList } from './category.js';

export async function scrapeSearch(axiosInstance: AxiosInstance, query: string, page?: number): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const path = page && page > 1 ? `/search/${encodedQuery}/page/${page}/` : `/search/${encodedQuery}/`;
  return scrapePostList(axiosInstance, path);
}
