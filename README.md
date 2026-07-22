# Nekopoi Unofficial API

API Wrapper tidak resmi (Unofficial API Wrapper) untuk website **nekopoi.care** yang ditulis menggunakan TypeScript/Node.js, Axios, dan Cheerio. Pustaka ini memfasilitasi pengambilan data rilis terbaru, detail anime, tautan unduhan, penyaringan kategori, hingga indeks A-Z secara terstruktur.

---

## Daftar Isi

- [Fitur](#fitur)
- [Instalasi](#instalasi)
- [Inisialisasi Client](#inisialisasi-client)
- [API Reference (Metode Client)](#api-reference-metode-client)
  - [1. Rilis Terbaru & Pencarian](#1-rilis-terbaru--pencarian)
  - [2. Kategori & Pintasan Navbar](#2-kategori--pintasan-navbar)
  - [3. Genre](#3-genre)
  - [4. Detail Konten (Episode & Seri)](#4-detail-konten-episode--seri)
  - [5. Indeks Lengkap A-Z](#5-indeks-lengkap-a-z)
- [Pagination Helpers](#pagination-helpers)
- [Definisi Tipe Data (TypeScript Interfaces)](#definisi-tipe-data-typescript-interfaces)
- [Error Handling](#error-handling)
- [Tips & Penggunaan Lanjutan](#tips--penggunaan-lanjutan)
  - [Menggunakan Mirror Site](#menggunakan-mirror-site)
  - [Penanganan Tautan Unduhan (ouo.io)](#penanganan-tautan-unduhan-ouoio)
- [Pengembangan (Development)](#pengembangan-development)
- [Disclaimer](#disclaimer)

---

## Fitur

- 🚀 **Get Latest Releases**: Mengambil daftar rilis episode/video terbaru dari homepage dengan dukungan pagination.
- 🔍 **Search**: Mencari anime berdasarkan kata kunci dengan dukungan pagination.
- 📁 **Filter Kategori**: Mengambil postingan berdasarkan kategori (Hentai, 2D Animation, 3D Hentai, JAV, JAV Cosplay).
- 🏷️ **Filter & Indeks Genre**: Mengambil daftar genre terindeks dan mencari postingan berdasarkan genre (tag).
- 📝 **Post Details & Download Links**: Mengambil metadata detail anime beserta tautan unduhan (download links) berdasarkan resolusi dan server host (ouo.io shortlink).
- 📚 **Series Details**: Mengambil informasi rinci suatu serial hentai (Poster, Sinopsis lengkap, Skor, Status tayang, beserta daftar episode yang tersedia).
- 📚 **Hentai List A-Z**: Mengambil daftar lengkap hentai terindeks berserta status dan skor dari index list A-Z.
- ⚙️ **Custom Base URL**: Mendukung custom base URL untuk mem-bypass pemblokiran menggunakan situs cermin (mirror site).
- 🛡️ **Input validation & typed errors**: Validasi slug/query/page dan error class khusus (`NekopoiValidationError`, `NekopoiScrapeError`, `NekopoiParseError`).
- 🔁 **Retry & rate limit**: Exponential backoff untuk error sementara, plus interval request opsional.
- 📄 **Pagination metadata**: Endpoint list mengembalikan `{ data, page, hasNext }`.
- 🧰 **Pagination helpers**: `mapPage`, `filterPage`, `collectAllPages`, `nextPageNumber`, dll.
- 🏷️ **Typed categories**: `NekopoiCategory` + `NEKOPOI_CATEGORIES` untuk autocomplete slug navbar.
- 💾 **Optional cache**: Cache in-memory berbasis TTL (`cacheTtlMs`) untuk mengurangi request berulang.
- 🔌 **getAxios() / getOptions()**: Akses instance Axios dan snapshot konfigurasi client.

---

## Instalasi

```bash
# Menggunakan NPM
npm install nekopoi-api

# Menggunakan Yarn
yarn add nekopoi-api

# Menggunakan PNPM
pnpm add nekopoi-api
```

Dependensi runtime (`axios`, `cheerio`) sudah termasuk; tidak perlu diinstal terpisah.

---

## Inisialisasi Client

Impor dan buat instance dari `NekopoiClient`. Secara default client akan terhubung ke `https://nekopoi.care`.

```typescript
import { NekopoiClient } from 'nekopoi-api';

const client = new NekopoiClient();

// Atau dengan opsi
const clientWithOptions = new NekopoiClient({
  baseUrl: 'https://mirror-nekopoi.net',
  timeout: 30_000,
  retries: 2,
  retryDelayMs: 300,
  minRequestIntervalMs: 250,
  cacheTtlMs: 60_000, // cache hasil sukses selama 60 detik
});

// Akses axios / config
clientWithOptions.getAxios().interceptors.request.use((cfg) => cfg);
console.log(clientWithOptions.getOptions());
clientWithOptions.clearCache();
```

---

## API Reference (Metode Client)

### 1. Rilis Terbaru & Pencarian

#### `getLatest(page?: number)`

Mengambil daftar rilis terbaru (episode video terbaru) dari halaman beranda nekopoi.care.

- **Parameter**: `page` (opsional) - Nomor halaman untuk pagination (integer ≥ 1).
- **Return**: `Promise<PaginatedResult<LatestRelease>>`

```typescript
const latest = await client.getLatest(); // Halaman 1
console.log(latest.data, latest.page, latest.hasNext);
const latestPage2 = await client.getLatest(2); // Halaman 2
```

#### `search(query: string, page?: number)`

Melakukan pencarian anime/hentai berdasarkan kata kunci.

- **Parameter**:
  - `query` (wajib) - Kata kunci pencarian (misal: `"shota"`, `"milf"`).
  - `page` (opsional) - Nomor halaman untuk pagination.
- **Return**: `Promise<PaginatedResult<SearchResult>>`

```typescript
const results = await client.search('shota');
console.log(results.data.length, results.hasNext);
const resultsPage2 = await client.search('shota', 2);
```

---

### 2. Kategori & Pintasan Navbar

#### `getByCategory(category: NekopoiCategory, page?: number)`

Mengambil postingan berdasarkan nama kategori tertentu.

- **Parameter**:
  - `category` (wajib) - Slug kategori bertipe `NekopoiCategory` (contoh: `"hentai"`, `"3d-hentai"`, `"jav"`, `"2d-animation"`, `"jav-cosplay"`; slug mirror kustom tetap diterima).
  - `page` (opsional) - Nomor halaman untuk pagination.
- **Return**: `Promise<PaginatedResult<SearchResult>>`

```typescript
import { NEKOPOI_CATEGORIES } from 'nekopoi-api';

const posts = await client.getByCategory('3d-hentai', 1);
console.log(posts.data, posts.hasNext);

// Iterasi slug navbar yang dikenal
for (const cat of NEKOPOI_CATEGORIES) {
  const page1 = await client.getByCategory(cat);
  console.log(cat, page1.data.length);
}
```

#### Pintasan Kategori (Navbar Shortcuts)

Untuk kemudahan pengembangan, disediakan metode shortcut untuk rute navbar utama:

```typescript
// Mengambil rilis terbaru kategori Hentai (2D)
const hentai = await client.getHentai(page);

// Mengambil rilis terbaru kategori 2D Animation
const animation2d = await client.get2DAnimation(page);

// Mengambil rilis terbaru kategori 3D Hentai
const hentai3d = await client.get3DHentai(page);

// Mengambil rilis terbaru kategori JAV (Live Action)
const jav = await client.getJAV(page);

// Mengambil rilis terbaru kategori JAV Cosplay
const javCosplay = await client.getJAVCosplay(page);
```

---

### 3. Genre

#### `getGenres()`

Mengambil seluruh daftar genre yang terindeks di situs.

- **Return**: `Promise<GenreItem[]>`

```typescript
const genres = await client.getGenres();
// Output: [{ name: 'Action', url: 'https://...', slug: 'action' }, ...]
```

#### `getByGenre(genre: string, page?: number)`

Mengambil postingan rilis terbaru berdasarkan genre tertentu.

- **Parameter**:
  - `genre` (wajib) - Slug genre (contoh: `"action"`, `"big-oppai"`, `"creampie"`).
  - `page` (opsional) - Nomor halaman untuk pagination.
- **Return**: `Promise<PaginatedResult<SearchResult>>`

```typescript
const actionPosts = await client.getByGenre('action');
console.log(actionPosts.data, actionPosts.page, actionPosts.hasNext);
```

---

### 4. Detail Konten (Episode & Seri)

#### `getPostDetails(urlOrSlug: string)`

Mengambil informasi lengkap dari postingan episode tunggal (single post), termasuk tautan unduhan (download links) berdasarkan resolusi dan server/hoster.

- **Parameter**: `urlOrSlug` (wajib) - URL lengkap postingan atau slug postingan (contoh: `"3d-marie-pingsan-dibius..."`).
- **Return**: `Promise<AnimeDetail>`

```typescript
const details = await client.getPostDetails(
  '3d-marie-pingsan-dibius-shota-nakal-ditempat-umum-dead-or-alive'
);
console.log(details.downloads);
```

#### `getSeriesDetails(urlOrSlug: string)`

Mengambil profil lengkap serial anime/hentai, termasuk deskripsi, status, skor, produser, dan daftar seluruh episode yang tersedia untuk ditonton/diunduh.

- **Parameter**: `urlOrSlug` (wajib) - URL lengkap serial atau slug serial (contoh: `"front-innocent-mou-hitotsu-no-lady-innocent"`).
- **Return**: `Promise<SeriesDetail>`

```typescript
const series = await client.getSeriesDetails('front-innocent-mou-hitotsu-no-lady-innocent');
console.log(series.episodes);
```

---

### 5. Indeks Lengkap A-Z

#### `getHentaiList()`

Mengambil daftar lengkap seluruh judul hentai terindeks (index A-Z). Data ini diambil dari menu Hentai List, di mana metadata diekstrak langsung dari tooltip situs.

- **Return**: `Promise<AnimeSeries[]>`

```typescript
const fullList = await client.getHentaiList();
```

---

## Pagination Helpers

Helper untuk bekerja dengan envelope `PaginatedResult<T>` diekspor dari paket utama:

```typescript
import {
  NekopoiClient,
  collectAllPages,
  mapPage,
  filterPage,
  nextPageNumber,
  isEmptyPage,
  hasNextPage,
} from 'nekopoi-api';

const client = new NekopoiClient();

// Ambil semua item hingga hasNext = false (default max 50 halaman)
const allLatest = await collectAllPages((page) => client.getLatest(page), {
  maxPages: 5,
});

const page1 = await client.search('shota');
const titles = mapPage(page1, (item) => item.title);
const onlyHentai = filterPage(page1, (item) => item.type === 'Hentai');

if (hasNextPage(page1) && !isEmptyPage(page1)) {
  const next = nextPageNumber(page1); // 2
  await client.search('shota', next!);
}
```

| Helper                                   | Deskripsi                                   |
| ---------------------------------------- | ------------------------------------------- |
| `toPaginatedResult(data, page, hasNext)` | Bangun envelope paginasi                    |
| `isEmptyPage(result)`                    | `true` jika `data` kosong                   |
| `hasNextPage(result)`                    | Alias boolean untuk `result.hasNext`        |
| `nextPageNumber(result)`                 | `page + 1` jika ada next, selain itu `null` |
| `mapPage(result, mapper)`                | Map item, metadata halaman tetap            |
| `filterPage(result, predicate)`          | Filter item, `hasNext` tidak diubah         |
| `collectAllPages(loadPage, options?)`    | Loop halaman sampai habis / `maxPages`      |

---

## Definisi Tipe Data (TypeScript Interfaces)

Pustaka ini didesain penuh dengan TypeScript untuk memastikan _type safety_:

```typescript
export type ContentType =
  'Hentai' | '3D Hentai' | 'Live2D Hentai' | 'Cosplay' | 'CAV' | 'JAV' | (string & {});

export type SeriesStatus = 'Ongoing' | 'Completed' | (string & {});

/** Known navbar/category slugs (open union — custom/mirror slugs still type-check). */
export type NekopoiCategory =
  'hentai' | '2d-animation' | '3d-hentai' | 'jav' | 'jav-cosplay' | (string & {});

export const NEKOPOI_CATEGORIES = [
  'hentai',
  '2d-animation',
  '3d-hentai',
  'jav',
  'jav-cosplay',
] as const;

export type KnownNekopoiCategory = (typeof NEKOPOI_CATEGORIES)[number];

export interface LatestRelease {
  title: string;
  url: string;
  thumbnail: string;
  type: ContentType;
  uploadedDate: string;
}

/** Search/category/genre list items share the same shape as latest releases. */
export type SearchResult = LatestRelease;

export interface DownloadLink {
  host: string;
  url: string;
}

export interface DownloadResolution {
  resolution: string;
  links: DownloadLink[];
}

export interface EpisodeDownload {
  episode: string;
  downloads: DownloadResolution[];
}

export interface AnimeDetail {
  title: string;
  japaneseTitle?: string;
  synopsis: string;
  thumbnail: string;
  uploadedDate: string;
  genres: string[];
  duration?: string;
  producer?: string;
  downloads: EpisodeDownload[];
}

export interface AnimeSeries {
  title: string;
  url: string;
  thumbnail?: string;
  japaneseTitle?: string;
  producer?: string;
  type?: ContentType;
  status?: SeriesStatus;
  genres?: string[];
  duration?: string;
  score?: number | null;
}

export interface GenreItem {
  name: string;
  url: string;
  slug: string;
}

export interface EpisodeItem {
  title: string;
  url: string;
  episodeNumber: string;
  uploadedDate: string;
  thumbnail: string;
}

export interface SeriesDetail {
  title: string;
  japaneseTitle?: string;
  thumbnail: string;
  synopsis: string;
  type: ContentType;
  status: SeriesStatus;
  totalEpisodes: string;
  releaseDate?: string;
  producer?: string;
  genres: string[];
  duration?: string;
  score?: number | null;
  episodes: EpisodeItem[];
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  hasNext: boolean;
}

export interface NekopoiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelayMs: number;
  minRequestIntervalMs: number;
  cacheTtlMs: number;
  cacheMaxEntries: number;
}

export interface NekopoiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
  minRequestIntervalMs?: number;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
}
```

---

## Error Handling

```typescript
import {
  NekopoiClient,
  NekopoiValidationError,
  NekopoiScrapeError,
  NekopoiParseError,
} from 'nekopoi-api';

try {
  await client.getByCategory('../admin');
} catch (err) {
  if (err instanceof NekopoiValidationError) {
    // Input tidak valid (slug, page, query, URL)
  } else if (err instanceof NekopoiParseError) {
    // HTML challenge / struktur halaman tidak dikenali
  } else if (err instanceof NekopoiScrapeError) {
    // Gagal fetch/jaringan — cek err.path, err.statusCode, err.cause
  }
}
```

---

## Tips & Penggunaan Lanjutan

### Menggunakan Mirror Site

Jika domain utama `https://nekopoi.care` diblokir oleh ISP/Internet Sehat di wilayah Anda, Anda dapat menginisialisasi client dengan situs cermin (mirror site) yang masih aktif:

```typescript
const client = new NekopoiClient('https://mirror-nekopoi.net');
// atau
const client2 = new NekopoiClient({
  baseUrl: 'https://mirror-nekopoi.net',
  timeout: 30_000,
  retries: 3,
  minRequestIntervalMs: 500,
});
```

### Penanganan Tautan Unduhan (ouo.io)

Tautan unduhan yang dikembalikan oleh `getPostDetails` dibungkus menggunakan pemendek tautan (URL Shortener) `ouo.io` oleh pihak nekopoi. Untuk mengakses tautan unduhan langsung (seperti Pixeldrain atau KrakenFiles), Anda perlu mem-bypass `ouo.io` tersebut. Anda dapat menggunakan library bypass pihak ketiga atau API bypasser khusus di proyek Anda untuk mengurai link tersebut secara otomatis.

---

## Pengembangan (Development)

Jika Anda ingin berkontribusi atau melakukan modifikasi kode secara lokal:

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/andhikadm/nekopoi-api.git
   cd nekopoi-api
   ```
2. **Install Dependensi**:
   ```bash
   npm install
   ```
3. **Jalankan Uji Coba Demo**:
   Proyek ini menyertakan script demo interaktif yang memanggil semua endpoint scraper secara real-time:
   ```bash
   npm run demo
   ```
4. **Lint & Format**:
   ```bash
   npm run lint
   npm run format
   ```
5. **Jalankan Unit Test** (offline, HTML fixtures):
   ```bash
   npm run test:unit
   ```
6. **Jalankan Integration Test** (live network):
   ```bash
   npm run test:integration
   ```
7. **Kompilasi TypeScript**:
   ```bash
   npm run build
   ```

---

## Disclaimer

Repository ini disediakan semata-mata untuk tujuan edukasi dan penelitian. Proyek ini bertujuan untuk menunjukkan bagaimana data publik dari situs pihak ketiga dapat diakses, diproses, dan disajikan kembali melalui API yang terstruktur. Repository ini tidak menyimpan konten berhak cipta, tidak mendorong pelanggaran terhadap ketentuan layanan situs sumber, dan tidak boleh digunakan untuk kegiatan yang melanggar hukum, kebijakan, atau hak pengguna lain. Pengguna bertanggung jawab penuh atas pemanfaatan proyek ini sesuai dengan peraturan dan ketentuan yang berlaku.
