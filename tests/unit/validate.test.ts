import { describe, it, expect } from 'vitest';
import {
  assertPage,
  assertSearchQuery,
  assertSlug,
  assertUrlOrSlug,
} from '../../src/utils/validate.js';
import { NekopoiValidationError } from '../../src/errors.js';

describe('validate', () => {
  it('assertPage accepts valid pages and rejects invalid ones', () => {
    expect(() => assertPage(undefined)).not.toThrow();
    expect(() => assertPage(1)).not.toThrow();
    expect(() => assertPage(99)).not.toThrow();
    expect(() => assertPage(0)).toThrow(NekopoiValidationError);
    expect(() => assertPage(-1)).toThrow(NekopoiValidationError);
    expect(() => assertPage(1.5)).toThrow(NekopoiValidationError);
  });

  it('assertSearchQuery validates non-empty query', () => {
    expect(() => assertSearchQuery('shota')).not.toThrow();
    expect(() => assertSearchQuery('')).toThrow(NekopoiValidationError);
    expect(() => assertSearchQuery('   ')).toThrow(NekopoiValidationError);
    expect(() => assertSearchQuery('x'.repeat(201))).toThrow(NekopoiValidationError);
  });

  it('assertSlug rejects path traversal and invalid chars', () => {
    expect(assertSlug('3d-hentai')).toBe('3d-hentai');
    expect(() => assertSlug('../etc')).toThrow(NekopoiValidationError);
    expect(() => assertSlug('foo/bar')).toThrow(NekopoiValidationError);
    expect(() => assertSlug('')).toThrow(NekopoiValidationError);
    expect(() => assertSlug('has space')).toThrow(NekopoiValidationError);
  });

  it('assertUrlOrSlug allows http(s) urls and simple slugs', () => {
    expect(assertUrlOrSlug('https://nekopoi.care/foo/')).toContain('https://');
    expect(assertUrlOrSlug('my-post-slug')).toBe('my-post-slug');
    expect(() => assertUrlOrSlug('ftp://bad')).toThrow(NekopoiValidationError);
    expect(() => assertUrlOrSlug('https://nekopoi.care/../secret')).toThrow(NekopoiValidationError);
    expect(() => assertUrlOrSlug('')).toThrow(NekopoiValidationError);
  });
});
