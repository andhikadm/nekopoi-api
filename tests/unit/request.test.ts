import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { createHttpClient } from '../../src/utils/request.js';

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const defaultExport = actual.default as Record<string, unknown>;
  return {
    ...actual,
    default: {
      ...defaultExport,
      create: vi.fn(),
    },
  };
});

describe('createHttpClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('attaches request/response interceptors and applies options', () => {
    const interceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    };
    const instance = {
      interceptors,
      defaults: {},
      request: vi.fn(),
    };
    vi.mocked(axios.create).mockReturnValue(instance as never);

    createHttpClient({
      baseUrl: 'https://mirror.example',
      timeout: 9000,
      retries: 3,
      retryDelayMs: 100,
      minRequestIntervalMs: 50,
      headers: { 'X-Test': '1' },
    });

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://mirror.example',
        timeout: 9000,
        headers: expect.objectContaining({
          'X-Test': '1',
          Referer: 'https://mirror.example',
        }),
      })
    );
    expect(interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('rate limiter waits between requests', async () => {
    const interceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    };
    const instance = {
      interceptors,
      request: vi.fn(),
    };
    vi.mocked(axios.create).mockReturnValue(instance as never);

    createHttpClient({ minRequestIntervalMs: 200 });
    const requestHandler = interceptors.request.use.mock.calls[0][0] as (
      config: object
    ) => Promise<object>;

    const first = requestHandler({ url: '/a' });
    await vi.advanceTimersByTimeAsync(0);
    await first;

    const secondPromise = requestHandler({ url: '/b' });
    let secondDone = false;
    void secondPromise.then(() => {
      secondDone = true;
    });

    await vi.advanceTimersByTimeAsync(100);
    expect(secondDone).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    await secondPromise;
    expect(secondDone).toBe(true);
  });
});
