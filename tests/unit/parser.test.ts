import { describe, it, expect } from 'vitest';
import {
  cleanText,
  extractBgImage,
  detectContentType,
  buildPagedPath,
  stripSlugPrefix,
  resolveRequestPath,
  parseUploadedDate,
  parseScore,
} from '../../src/utils/parser.js';

describe('parser helpers', () => {
  it('cleanText collapses whitespace', () => {
    expect(cleanText('  foo \n bar  ')).toBe('foo bar');
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
  });

  it('extractBgImage handles quoted and unquoted urls', () => {
    expect(extractBgImage("background-image: url('https://cdn/a.jpg')")).toBe('https://cdn/a.jpg');
    expect(extractBgImage('background-image: url("https://cdn/b.jpg")')).toBe('https://cdn/b.jpg');
    expect(extractBgImage('background-image:url(https://cdn/c.jpg)')).toBe('https://cdn/c.jpg');
    expect(extractBgImage('')).toBe('');
    expect(extractBgImage(undefined)).toBe('');
  });

  it('detectContentType reads title tags', () => {
    expect(detectContentType('[3D] Foo')).toBe('3D Hentai');
    expect(detectContentType('[L2D] Bar')).toBe('Live2D Hentai');
    expect(detectContentType('[Cosplay] Baz')).toBe('Cosplay');
    expect(detectContentType('[CAV SUB INDO] Qux')).toBe('CAV');
    expect(detectContentType('[JAV] Live')).toBe('JAV');
    expect(detectContentType('Plain Title')).toBe('Hentai');
  });

  it('buildPagedPath paginates correctly', () => {
    expect(buildPagedPath('/')).toBe('/');
    expect(buildPagedPath('/', 1)).toBe('/');
    expect(buildPagedPath('/', 2)).toBe('/page/2/');
    expect(buildPagedPath('/category/hentai', 3)).toBe('/category/hentai/page/3/');
    expect(buildPagedPath('/search/shota/', 2)).toBe('/search/shota/page/2/');
  });

  it('stripSlugPrefix removes known prefixes', () => {
    expect(stripSlugPrefix('category/3d-hentai', 'category')).toBe('3d-hentai');
    expect(stripSlugPrefix('/genres/action/', 'genres')).toBe('action');
    expect(stripSlugPrefix('action', 'genres')).toBe('action');
  });

  it('resolveRequestPath handles urls and slugs', () => {
    expect(resolveRequestPath('https://nekopoi.care/foo/bar/')).toBe('/foo/bar/');
    expect(resolveRequestPath('my-slug')).toBe('/my-slug/');
    expect(resolveRequestPath('my-slug', '/hentai')).toBe('/hentai/my-slug/');
    expect(resolveRequestPath('/already/path')).toBe('/already/path/');
  });

  it('parseUploadedDate extracts date patterns', () => {
    expect(parseUploadedDate('Posted on July 3, 2026')).toBe('July 3, 2026');
    expect(parseUploadedDate('3 July 2026')).toBe('3 July 2026');
  });

  it('parseScore extracts numeric scores', () => {
    expect(parseScore('7.8')).toBe(7.8);
    expect(parseScore('8,1')).toBe(8.1);
    expect(parseScore('Score: 7.5/10')).toBe(7.5);
    expect(parseScore('')).toBeNull();
    expect(parseScore(undefined)).toBeNull();
    expect(parseScore('N/A')).toBeNull();
  });
});
