import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { isChallengeHtml, detectHasNextPage, assertParseableHtml } from '../../src/utils/html.js';
import { NekopoiParseError } from '../../src/errors.js';

describe('html helpers', () => {
  it('isChallengeHtml detects common challenge pages', () => {
    expect(
      isChallengeHtml(
        '<html><title>Just a moment...</title><body>Checking your browser</body></html>'
      )
    ).toBe(true);
    expect(
      isChallengeHtml(
        '<html><body><div class="cf-browser-verification">wait</div>Ray ID: abc</body></html>'
      )
    ).toBe(true);
    expect(isChallengeHtml('<html><body><div id="nk-episode-grid">ok</div></body></html>')).toBe(
      false
    );
  });

  it('detectHasNextPage finds next links', () => {
    const withRel = cheerio.load('<a rel="next" href="/page/2/">Next</a>');
    expect(detectHasNextPage(withRel, 1)).toBe(true);

    const withPage = cheerio.load('<a href="/category/hentai/page/3/">3</a>');
    expect(detectHasNextPage(withPage, 2)).toBe(true);

    const last = cheerio.load('<span class="page-numbers current">5</span>');
    expect(detectHasNextPage(last, 5)).toBe(false);
  });

  it('assertParseableHtml throws on missing marker with zero results', () => {
    const $ = cheerio.load('<html><body>empty</body></html>');
    expect(() =>
      assertParseableHtml('<html><body>empty</body></html>', '/x/', {
        resultCount: 0,
        expectedMarkerSelector: '#nk-episode-grid',
        $,
      })
    ).toThrow(NekopoiParseError);
  });

  it('assertParseableHtml allows empty when allowEmpty is true', () => {
    expect(() =>
      assertParseableHtml('<html><body>empty</body></html>', '/x/', {
        resultCount: 0,
        allowEmpty: true,
      })
    ).not.toThrow();
  });
});
