import type { ContentType } from '../types/index.js';

export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export function parseUploadedDate(text: string): string {
  const cleaned = cleanText(text);
  const match =
    cleaned.match(/Posted (?:by .+? )?on (.+)/i) ||
    cleaned.match(/(\d+\s+\w+\s+\d{4})/);
  return match ? match[1] : cleaned;
}

/** Extract first CSS background-image URL from an inline style attribute. */
export function extractBgImage(style?: string | null): string {
  if (!style) return '';
  const match = style.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
  return match?.[2] ?? '';
}

/** Infer content type from a post title tag like [3D], [L2D], [Cosplay], [CAV]. */
export function detectContentType(title: string, fallback: ContentType = 'Hentai'): ContentType {
  const lower = title.toLowerCase();
  if (lower.includes('[3d]')) return '3D Hentai';
  if (lower.includes('[l2d]')) return 'Live2D Hentai';
  if (lower.includes('[cosplay]')) return 'Cosplay';
  if (lower.includes('[cav')) return 'CAV';
  if (lower.includes('[jav]')) return 'JAV';
  return fallback;
}

/**
 * Build a WordPress-style paged path.
 * page 1 (or omitted) → basePath; page > 1 → basePath/page/N/
 */
export function buildPagedPath(basePath: string, page?: number): string {
  const normalized = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  if (page !== undefined && page > 1) {
    return `${normalized}/page/${page}/`;
  }
  return `${normalized}/`;
}

/** Strip a known prefix (e.g. category/, genres/) and surrounding slashes from a slug. */
export function stripSlugPrefix(value: string, prefix: string): string {
  const pattern = new RegExp(`^\\/?${prefix}\\/?`, 'i');
  return value.replace(pattern, '').replace(/^\/+|\/+$/g, '');
}

/** Resolve a full URL or relative slug into a request path for axios baseURL. */
export function resolveRequestPath(urlOrSlug: string, defaultPrefix?: string): string {
  if (urlOrSlug.startsWith('http://') || urlOrSlug.startsWith('https://')) {
    const urlObj = new URL(urlOrSlug);
    return urlObj.pathname + urlObj.search;
  }

  if (urlOrSlug.startsWith('/')) {
    return urlOrSlug.endsWith('/') || urlOrSlug.includes('?') ? urlOrSlug : `${urlOrSlug}/`;
  }

  if (defaultPrefix) {
    const prefix = defaultPrefix.endsWith('/') ? defaultPrefix : `${defaultPrefix}/`;
    const slug = urlOrSlug.replace(/^\/+|\/+$/g, '');
    return `${prefix}${slug}/`;
  }

  return `/${urlOrSlug.replace(/^\/+|\/+$/g, '')}/`;
}
