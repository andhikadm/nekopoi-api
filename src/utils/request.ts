import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
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

type RetryConfig = InternalAxiosRequestConfig & {
  __retryCount?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: AxiosError): boolean {
  if (!error.response) {
    // network / timeout
    return true;
  }
  const status = error.response.status;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function createRateLimiter(minIntervalMs: number): () => Promise<void> {
  if (minIntervalMs <= 0) {
    return async () => undefined;
  }

  let lastRequestAt = 0;
  let chain: Promise<void> = Promise.resolve();

  return () => {
    chain = chain.then(async () => {
      const now = Date.now();
      const wait = Math.max(0, lastRequestAt + minIntervalMs - now);
      if (wait > 0) await sleep(wait);
      lastRequestAt = Date.now();
    });
    return chain;
  };
}

export function createHttpClient(
  baseUrlOrOptions: string | NekopoiClientOptions = BASE_URL
): AxiosInstance {
  const options: NekopoiClientOptions =
    typeof baseUrlOrOptions === 'string'
      ? { baseUrl: baseUrlOrOptions }
      : (baseUrlOrOptions ?? {});

  const baseURL = options.baseUrl || BASE_URL;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 300;
  const minRequestIntervalMs = options.minRequestIntervalMs ?? 0;
  const waitForSlot = createRateLimiter(minRequestIntervalMs);

  const instance = axios.create({
    baseURL,
    timeout: options.timeout ?? 15_000,
    headers: {
      ...DEFAULT_HEADERS,
      Referer: baseURL,
      ...options.headers,
    },
  });

  instance.interceptors.request.use(async (config) => {
    await waitForSlot();
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryConfig | undefined;
      if (!config || retries <= 0 || !isRetryable(error)) {
        return Promise.reject(error);
      }

      const retryCount = config.__retryCount ?? 0;
      if (retryCount >= retries) {
        return Promise.reject(error);
      }

      config.__retryCount = retryCount + 1;
      const delay = retryDelayMs * 2 ** retryCount;
      await sleep(delay);
      return instance.request(config);
    }
  );

  return instance;
}
