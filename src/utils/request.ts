import axios, { AxiosInstance } from 'axios';
import type { NekopoiClientOptions } from '../types/index.js';

export const BASE_URL = 'https://nekopoi.care';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
};

export function createHttpClient(
  baseUrlOrOptions: string | NekopoiClientOptions = BASE_URL
): AxiosInstance {
  const options: NekopoiClientOptions =
    typeof baseUrlOrOptions === 'string'
      ? { baseUrl: baseUrlOrOptions }
      : baseUrlOrOptions ?? {};

  const baseURL = options.baseUrl || BASE_URL;

  return axios.create({
    baseURL,
    timeout: options.timeout ?? 15_000,
    headers: {
      ...DEFAULT_HEADERS,
      Referer: baseURL,
      ...options.headers,
    },
  });
}
