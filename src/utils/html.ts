import type { CheerioAPI } from 'cheerio';
import { NekopoiParseError } from '../errors.js';

const CHALLENGE_PATTERNS = [
  /cf-browser-verification/i,
  /cf-challenge/i,
  /_cf_chl/i,
  /checking your browser/i,
  /just a moment/i,
  /attention required/i,
  /enable javascript and cookies/i,
  /cloudflare/i,
  /captcha-delivery/i,
  /ddos-guard/i,
];

/** Heuristic: response looks like a bot-challenge / anti-DDoS interstitial. */
export function isChallengeHtml(html: string): boolean {
  if (!html || typeof html !== 'string') return false;
  const sample = html.slice(0, 8000);
  // Cloudflare title alone is common; require stronger signals when only "cloudflare" matches
  const strong = CHALLENGE_PATTERNS.filter((p) => p.source !== 'cloudflare').some((p) =>
    p.test(sample)
  );
  if (strong) return true;
  return /cloudflare/i.test(sample) && /ray id|cf-ray|challenge-platform/i.test(sample);
}

/**
 * Detect whether a WordPress-style archive page has a "next" pagination link.
 */
export function detectHasNextPage($: CheerioAPI, currentPage: number): boolean {
  if ($('a[rel="next"]').length > 0) return true;
  if ($('.pagination a.next, a.next.page-numbers, .nav-links a.next').length > 0) return true;

  const nextPage = currentPage + 1;
  let found = false;
  $('a[href*="/page/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes(`/page/${nextPage}`) || href.includes(`/page/${nextPage}/`)) {
      found = true;
      return false;
    }
    return undefined;
  });
  if (found) return true;

  // Fallback: numbered page links greater than current
  $('a.page-numbers, .pagination a, .page-nav a').each((_, el) => {
    const text = $(el).text().trim();
    const num = Number(text);
    if (Number.isInteger(num) && num > currentPage) {
      found = true;
      return false;
    }
    return undefined;
  });

  return found;
}

/**
 * Guard after fetch: throw if HTML is a challenge page, or if expected markers
 * are missing while zero items were parsed (likely broken selectors / wrong page).
 */
export function assertParseableHtml(
  html: string,
  path: string,
  options: {
    resultCount: number;
    expectedMarkerSelector?: string;
    $?: CheerioAPI;
    allowEmpty?: boolean;
  }
): void {
  if (isChallengeHtml(html)) {
    throw new NekopoiParseError(
      `Blocked by anti-bot challenge while fetching ${path}`,
      { path }
    );
  }

  if (options.allowEmpty || options.resultCount > 0) return;

  if (options.expectedMarkerSelector && options.$) {
    const markerPresent = options.$(options.expectedMarkerSelector).length > 0;
    if (!markerPresent) {
      throw new NekopoiParseError(
        `Page structure unexpected at ${path}: missing ${options.expectedMarkerSelector}`,
        { path }
      );
    }
  }
}
