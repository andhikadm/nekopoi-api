# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-22

### Added
- Optional in-memory response cache via `cacheTtlMs` / `cacheMaxEntries`
- `NekopoiClient#clearCache()`
- `NekopoiClient#getAxios()` for custom interceptors / debugging
- `NekopoiClient#getOptions()` returning a read-only resolved config snapshot
- `NekopoiClientConfig` type
- `parseScore()` helper

### Changed
- `AnimeSeries.score` and `SeriesDetail.score` are now `number | null | undefined`
  (was `string | undefined`)

## [1.1.0] - 2026-07-22

### Added
- Input validation for page, query, slug, and urlOrSlug
- Typed errors: `NekopoiError`, `NekopoiValidationError`, `NekopoiScrapeError`, `NekopoiParseError`
- Retry with exponential backoff and optional request rate limiting
- Challenge-page / unexpected HTML parse detection
- Pagination envelope `PaginatedResult<T>` (`data`, `page`, `hasNext`) for list endpoints
- ESLint + Prettier tooling
- GitHub Actions CI (Node 22 / 24)
- Offline unit tests with HTML fixtures
- `LICENSE` (ISC)
- Package export fields (`types`, `exports`, `files`, `repository`, …)

### Changed
- **Breaking:** list methods (`getLatest`, `search`, `getByCategory`, shortcuts, `getByGenre`)
  now return `PaginatedResult<T>` instead of a bare array
- Constructor accepts `string | NekopoiClientOptions`
- Scrapers split: `genres`, `series`, `hentai-list` (removed monolithic `list.ts`)
- Shared parser helpers: `extractBgImage`, `detectContentType`, `buildPagedPath`, etc.

### Fixed
- Node 18 `File is not defined` crash when loading cheerio/undici in tests (polyfill setup)
- Stale `dist/utils/bypass.*` artifact removed from clean builds
- README install instructions and clone URL

## [1.0.0] - 2026-07

### Added
- Initial unofficial Nekopoi API wrapper (TypeScript + Axios + Cheerio)
- Methods: latest, search, categories, genres, post details, series details, hentai list A–Z
- Demo script and live integration tests

[1.2.0]: https://github.com/andhikadm/nekopoi-api/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/andhikadm/nekopoi-api/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/andhikadm/nekopoi-api/releases/tag/v1.0.0
