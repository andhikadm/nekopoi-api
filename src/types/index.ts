export interface LatestRelease {
  title: string;
  url: string;
  thumbnail: string;
  type: string; // misal "Hentai", "3D Hentai", "Cosplay"
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
  host: string; // misal "Sendcm", "Mega", "Google Drive"
  url: string;
}

export interface DownloadResolution {
  resolution: string; // misal "360p", "480p", "720p", "1080p"
  links: DownloadLink[];
}

export interface EpisodeDownload {
  episode: string; // misal "Episode 1" atau "Full Episode"
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
  status?: string; // misal "Ongoing", "Completed"
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
  episodeNumber: string; // misal "Ep 1"
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

