import { NekopoiValidationError } from '../errors.js';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;
const MAX_QUERY_LENGTH = 200;
const MAX_PAGE = 10_000;

export function assertPage(page?: number): void {
  if (page === undefined) return;
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new NekopoiValidationError(
      `Invalid page: expected integer between 1 and ${MAX_PAGE}, got ${String(page)}`
    );
  }
}

export function assertNonEmptyString(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new NekopoiValidationError(`Invalid ${field}: must be a non-empty string`);
  }
}

export function assertSearchQuery(query: string): void {
  assertNonEmptyString(query, 'query');
  if (query.length > MAX_QUERY_LENGTH) {
    throw new NekopoiValidationError(`Invalid query: max length is ${MAX_QUERY_LENGTH} characters`);
  }
}

/** Validate a category/genre slug (after prefix stripping). */
export function assertSlug(slug: string, field = 'slug'): string {
  assertNonEmptyString(slug, field);
  const cleaned = slug.trim().replace(/^\/+|\/+$/g, '');
  if (cleaned.includes('..') || cleaned.includes('/') || cleaned.includes('\\')) {
    throw new NekopoiValidationError(`Invalid ${field}: path separators and ".." are not allowed`);
  }
  if (!SLUG_PATTERN.test(cleaned)) {
    throw new NekopoiValidationError(
      `Invalid ${field}: only alphanumeric characters and hyphens are allowed`
    );
  }
  return cleaned;
}

/**
 * Validate a post/series identifier. Allows full http(s) URLs or simple slugs.
 * Full URLs are returned as-is (path resolution happens later); slugs are sanitized.
 */
export function assertUrlOrSlug(urlOrSlug: string, field = 'urlOrSlug'): string {
  assertNonEmptyString(urlOrSlug, field);
  const value = urlOrSlug.trim();

  // Reject non-http(s) absolute URLs (ftp:, file:, javascript:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      throw new NekopoiValidationError(`Invalid ${field}: only http(s) URLs are allowed`);
    }
    // Check raw string before URL normalizes "../" away
    if (value.includes('..')) {
      throw new NekopoiValidationError(`Invalid ${field}: ".." is not allowed in path`);
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new NekopoiValidationError(`Invalid ${field}: only http(s) URLs are allowed`);
      }
    } catch (error) {
      if (error instanceof NekopoiValidationError) throw error;
      throw new NekopoiValidationError(`Invalid ${field}: malformed URL`);
    }
    return value;
  }

  // Relative path or bare slug
  if (value.includes('..')) {
    throw new NekopoiValidationError(`Invalid ${field}: ".." is not allowed`);
  }

  return value;
}
