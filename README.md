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
- [Definisi Tipe Data (TypeScript Interfaces)](#definisi-tipe-data-typescript-interfaces)
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

---

## Instalasi

Gunakan package manager pilihan Anda untuk memasang `nekopoi-api` beserta dependensinya:

```bash
# Menggunakan NPM
npm install axios cheerio nekopoi-api

# Menggunakan Yarn
yarn add axios cheerio nekopoi-api

# Menggunakan PNPM
pnpm add axios cheerio nekopoi-api
```

---

## Inisialisasi Client

Impor dan buat instance dari `NekopoiClient`. Secara default client akan terhubung ke `https://nekopoi.care`.

```typescript
import { NekopoiClient } from 'nekopoi-api';

const client = new NekopoiClient();
```

---

## API Reference (Metode Client)

### 1. Rilis Terbaru & Pencarian

#### `getLatest(page?: number)`
Mengambil daftar rilis terbaru (episode video terbaru) dari halaman beranda nekopoi.care.
- **Parameter**: `page` (opsional) - Nomor halaman untuk pagination.
- **Return**: `Promise<LatestRelease[]>`
```typescript
const latest = await client.getLatest(); // Halaman 1
const latestPage2 = await client.getLatest(2); // Halaman 2
```

#### `search(query: string, page?: number)`
Melakukan pencarian anime/hentai berdasarkan kata kunci.
- **Parameter**: 
  - `query` (wajib) - Kata kunci pencarian (misal: `"shota"`, `"milf"`).
  - `page` (opsional) - Nomor halaman untuk pagination.
- **Return**: `Promise<SearchResult[]>`
```typescript
const results = await client.search('shota');
const resultsPage2 = await client.search('shota', 2);
```

---

### 2. Kategori & Pintasan Navbar

#### `getByCategory(category: string, page?: number)`
Mengambil postingan berdasarkan nama kategori tertentu.
- **Parameter**:
  - `category` (wajib) - Nama/slug kategori (contoh: `"hentai"`, `"3d-hentai"`, `"jav"`, `"2d-animation"`, `"jav-cosplay"`).
  - `page` (opsional) - Nomor halaman untuk pagination.
- **Return**: `Promise<SearchResult[]>`
```typescript
const posts = await client.getByCategory('3d-hentai', 1);
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
- **Return**: `Promise<SearchResult[]>`
```typescript
const actionPosts = await client.getByGenre('action');
```

---

### 4. Detail Konten (Episode & Seri)

#### `getPostDetails(urlOrSlug: string)`
Mengambil informasi lengkap dari postingan episode tunggal (single post), termasuk tautan unduhan (download links) berdasarkan resolusi dan server/hoster.
- **Parameter**: `urlOrSlug` (wajib) - URL lengkap postingan atau slug postingan (contoh: `"3d-marie-pingsan-dibius..."`).
- **Return**: `Promise<AnimeDetail>`
```typescript
const details = await client.getPostDetails('3d-marie-pingsan-dibius-shota-nakal-ditempat-umum-dead-or-alive');
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

## Definisi Tipe Data (TypeScript Interfaces)

Pustaka ini didesain penuh dengan TypeScript untuk memastikan *type safety*:

```typescript
export interface LatestRelease {
  title: string;
  url: string;
  thumbnail: string;
  type: string;        // "Hentai" | "3D Hentai" | "Cosplay" | "CAV"
  uploadedDate: string;
}

export interface SearchResult {
  title: string;
  url: string;
  thumbnail: string;
  type: string;
  uploadedDate: string;
}

export interface DownloadLink {
  host: string;        // "KrakenFiles" | "Mp4Upload" | "Pixeldrain" | "Mirror" | dll
  url: string;         // Link yang biasanya berformat shortener ouo.io
}

export interface DownloadResolution {
  resolution: string;  // "360p" | "480p" | "720p" | "1080p"
  links: DownloadLink[];
}

export interface EpisodeDownload {
  episode: string;     // Nama/Nomor Episode (misal: "Episode 1" atau "Full Episode")
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
  type?: string;
  status?: string;     // "Ongoing" | "Completed"
  genres?: string[];
  duration?: string;
  score?: string;
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
  type: string;
  status: string;
  totalEpisodes: string;
  releaseDate?: string;
  producer?: string;
  genres: string[];
  duration?: string;
  score?: string;
  episodes: EpisodeItem[];
}
```

---

## Tips & Penggunaan Lanjutan

### Menggunakan Mirror Site
Jika domain utama `https://nekopoi.care` diblokir oleh ISP/Internet Sehat di wilayah Anda, Anda dapat menginisialisasi client dengan situs cermin (mirror site) yang masih aktif:

```typescript
const client = new NekopoiClient('https://mirror-nekopoi.net');
```

### Penanganan Tautan Unduhan (ouo.io)
Tautan unduhan yang dikembalikan oleh `getPostDetails` dibungkus menggunakan pemendek tautan (URL Shortener) `ouo.io` oleh pihak nekopoi. Untuk mengakses tautan unduhan langsung (seperti Pixeldrain atau KrakenFiles), Anda perlu mem-bypass `ouo.io` tersebut. Anda dapat menggunakan library bypass pihak ketiga atau API bypasser khusus di proyek Anda untuk mengurai link tersebut secara otomatis.

---

## Pengembangan (Development)

Jika Anda ingin berkontribusi atau melakukan modifikasi kode secara lokal:

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/username/nekopoi-api.git
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
4. **Jalankan Unit Test**:
   Tes integrasi ditulis menggunakan `Vitest` untuk memastikan scraper bekerja dengan struktur situs web terbaru:
   ```bash
   npm run test
   ```
5. **Kompilasi TypeScript**:
   Untuk melakukan build proyek ke JavaScript (dist):
   ```bash
   npm run build
   ```

---

## Disclaimer

Repository ini disediakan semata-mata untuk tujuan edukasi dan penelitian. Proyek ini bertujuan untuk menunjukkan bagaimana data publik dari situs pihak ketiga dapat diakses, diproses, dan disajikan kembali melalui API yang terstruktur. Repository ini tidak menyimpan konten berhak cipta, tidak mendorong pelanggaran terhadap ketentuan layanan situs sumber, dan tidak boleh digunakan untuk kegiatan yang melanggar hukum, kebijakan, atau hak pengguna lain. Pengguna bertanggung jawab penuh atas pemanfaatan proyek ini sesuai dengan peraturan dan ketentuan yang berlaku.
