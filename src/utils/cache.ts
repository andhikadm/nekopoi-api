export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Simple in-memory TTL cache with optional max entry cap (FIFO eviction). */
export class TtlCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs: number, maxEntries = 100) {
    this.ttlMs = Math.max(0, ttlMs);
    this.maxEntries = Math.max(1, maxEntries);
  }

  get enabled(): boolean {
    return this.ttlMs > 0;
  }

  get size(): number {
    return this.store.size;
  }

  get<T>(key: string): T | undefined {
    if (!this.enabled) return undefined;
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (!this.enabled) return;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export function cacheKey(parts: unknown[]): string {
  return parts
    .map((part) => {
      if (part === undefined || part === null) return '';
      if (typeof part === 'string' || typeof part === 'number' || typeof part === 'boolean') {
        return String(part);
      }
      return JSON.stringify(part);
    })
    .join('::');
}
