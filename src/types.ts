export type MediaType = 'movie' | 'series';

export type MovieYear = 2021 | 2022 | 2023 | 2024 | 2025 | 2026;
export type SeriesYear = 2023 | 2024 | 2025 | 2026;

export type SeriesCountry = 'Korea' | 'Thai' | 'China' | 'English' | 'Bollywood';

export interface Poster {
  id: string;
  title: string;
  type: MediaType;
  year: number;
  country?: SeriesCountry;
  genre: string;
  rating: number; // e.g. 8.5
  imageUrl: string;
  thumbnailUrl?: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  folderName?: string;
  originalFileName?: string;
  orderIndex?: number;
  description: string;
  addedAt: string;
  isCustomUpload?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
  parents?: string[];
}

export interface DriveFolderGroup {
  folderId: string;
  folderName: string;
  detectedYear: MovieYear | SeriesYear;
  detectedType: MediaType;
  detectedCountry?: SeriesCountry;
  files: DriveFile[];
}

export type ActiveTab = 'home' | 'movie' | 'series';
