import { DriveFile, DriveFolderGroup, MediaType, MovieYear, SeriesYear, SeriesCountry, Poster } from '../types';

const FOLDER_NAME = 'Movie Perfect Posters';

/**
 * Intelligent Year detector from folder name or file name or date
 */
export function detectYear(name: string, dateStr?: string): MovieYear | SeriesYear {
  // Convert Burmese numerals if present: ၂၀၂၁ -> 2021, etc.
  const burmeseMap: Record<string, string> = {
    '၀': '0', '၁': '1', '၂': '2', '၃': '3', '၄': '4',
    '၅': '5', '၆': '6', '၇': '7', '၈': '8', '၉': '9',
  };
  const normalizedName = name.replace(/[၀-၉]/g, (ch) => burmeseMap[ch] || ch);

  // Check 4-digit years 2021..2026 with word boundaries
  const match = normalizedName.match(/\b(202[1-6])\b/);
  if (match) {
    const yr = parseInt(match[1], 10);
    if (yr >= 2021 && yr <= 2026) return yr as MovieYear;
  }

  // Check 4-digit years 2021..2026 anywhere without word boundary (e.g. "Movie2026", "2026_photo", "Poster2026")
  const looseMatch = normalizedName.match(/(202[1-6])/);
  if (looseMatch) {
    const yr = parseInt(looseMatch[1], 10);
    if (yr >= 2021 && yr <= 2026) return yr as MovieYear;
  }

  // Try fallback to createdTime date
  if (dateStr) {
    const dateYear = new Date(dateStr).getFullYear();
    if (dateYear >= 2021 && dateYear <= 2026) return dateYear as MovieYear;
  }

  // Default to 2026
  return 2026;
}

/**
 * Intelligent MediaType & Series Country detector
 */
export function detectCategoryAndCountry(name: string, year: number): {
  type: MediaType;
  country?: SeriesCountry;
} {
  const lower = name.toLowerCase();

  // If year is 2021 or 2022, Series only supports 2023-2026, so default to movie
  if (year === 2021 || year === 2022) {
    return { type: 'movie' };
  }

  // Detect Series country keywords
  if (lower.includes('korea') || lower.includes('kdrama') || lower.includes('k-drama')) {
    return { type: 'series', country: 'Korea' };
  }
  if (lower.includes('thai') || lower.includes('thailand')) {
    return { type: 'series', country: 'Thai' };
  }
  if (lower.includes('china') || lower.includes('chinese') || lower.includes('cdrama') || lower.includes('c-drama')) {
    return { type: 'series', country: 'China' };
  }
  if (lower.includes('bollywood') || lower.includes('hindi') || lower.includes('india')) {
    return { type: 'series', country: 'Bollywood' };
  }
  if (lower.includes('english') || lower.includes('hollywood') || lower.includes('western') || lower.includes('us') || lower.includes('uk')) {
    return { type: 'series', country: 'English' };
  }

  // Detect Series keywords
  if (
    lower.includes('series') ||
    lower.includes('drama') ||
    lower.includes('season') ||
    lower.includes('ep') ||
    lower.includes('episode')
  ) {
    return { type: 'series', country: 'Korea' };
  }

  // Detect Movie keywords
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film')) {
    return { type: 'movie' };
  }

  return { type: 'movie' };
}

/**
 * Clean human-readable title from file name
 */
export function cleanTitleFromFilename(name: string): string {
  let clean = name.replace(/\.[^/.]+$/, ''); // remove extension
  // Remove year if appended (e.g. "Dune 2024" or "Dune (2024)")
  clean = clean.replace(/[\(_-]?\b202[1-6]\b[\)]?/g, '');
  // Replace underscores and hyphens with spaces
  clean = clean.replace(/[-_.]+/g, ' ').trim();
  if (!clean) return name;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Find or create dedicated "Movie Perfect Posters" folder in user's Drive
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`
    )}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      console.warn('Failed to search Drive folders', await searchRes.text());
      return null;
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) return null;
    const createData = await createRes.json();
    return createData.id || null;
  } catch (err) {
    console.error('Error finding/creating folder:', err);
    return null;
  }
}

/**
 * Upload an image file to Google Drive using multipart upload
 */
export async function uploadPosterToDrive(
  file: File,
  accessToken: string
): Promise<{ fileId: string; webViewLink?: string; displayUrl: string }> {
  const folderId = await getOrCreateAppFolder(accessToken);

  const metadata: Record<string, unknown> = {
    name: file.name,
    mimeType: file.type || 'image/jpeg',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const fileBytes = await fileDataPromise;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || 'image/jpeg'}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n';

  // Convert ArrayBuffer to base64
  let binary = '';
  const bytes = new Uint8Array(fileBytes);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody = metadataPart + base64Data + closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${errText}`);
  }

  const uploadedFile = await uploadRes.json();
  const fileId = uploadedFile.id;

  // Make public viewable so poster renders seamlessly in the app
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Could not set public permission on Drive file:', permErr);
  }

  // Reliable instant thumbnail URL that loads immediately without CDN cache delay
  const displayUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

  return {
    fileId,
    webViewLink: uploadedFile.webViewLink,
    displayUrl,
  };
}

/**
 * List recent image files from user's Drive so they can "join" existing Drive photos
 */
export async function listDriveImageFiles(accessToken: string): Promise<DriveFile[]> {
  try {
    const query = encodeURIComponent("mimeType contains 'image/' and trashed = false");
    const fields = encodeURIComponent('files(id,name,mimeType,thumbnailLink,webViewLink,createdTime,size,parents)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&orderBy=createdTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to list Drive images: ${await res.text()}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error fetching drive image files:', err);
    throw err;
  }
}

/**
 * Helper to fetch all paginated files from Google Drive API using nextPageToken
 */
async function fetchAllDrivePages(
  urlBase: string,
  accessToken: string,
  maxItems: number = 5000
): Promise<any[]> {
  let allItems: any[] = [];
  let pageToken: string | null = null;
  let pageCount = 0;

  do {
    pageCount++;
    const separator = urlBase.includes('?') ? '&' : '?';
    const pageParam = pageToken ? `${separator}pageToken=${encodeURIComponent(pageToken)}` : '';
    const fetchUrl = `${urlBase}${pageParam}`;

    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Drive fetch error on page ${pageCount}:`, errText);
      break;
    }

    const data = await res.json();
    if (data.files && Array.isArray(data.files)) {
      allItems = allItems.concat(data.files);
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken && allItems.length < maxItems);

  return allItems;
}

/**
 * Fetch both folders and images from Google Drive with full pagination,
 * resolving nested folder hierarchy and grouping images by folder
 * with auto-detected Year (2021-2026), Category (Movie/Series), and Country.
 * Supports scanning up to 5000+ files using max pageSize (1000).
 */
export async function fetchDriveFoldersAndImages(
  accessToken: string,
  maxPhotos: number = 5000
): Promise<{
  folders: DriveFolderGroup[];
  allImages: DriveFile[];
  totalScanned: number;
}> {
  try {
    // 1. Fetch all folders (paginated up to 500 folders)
    const folderQuery = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=${encodeURIComponent('nextPageToken,files(id,name,parents)')}&pageSize=100`;
    const driveFolders: Array<{ id: string; name: string; parents?: string[] }> = await fetchAllDrivePages(
      folderUrl,
      accessToken,
      500
    );

    // 2. Fetch all image files with full pagination up to maxPhotos (using pageSize=1000 for maximum speed)
    const imageQuery = encodeURIComponent("mimeType contains 'image/' and trashed = false");
    const imageUrl = `https://www.googleapis.com/drive/v3/files?q=${imageQuery}&fields=${encodeURIComponent('nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,createdTime,parents)')}&pageSize=1000&orderBy=createdTime desc`;
    const allImages: DriveFile[] = await fetchAllDrivePages(imageUrl, accessToken, maxPhotos);

    // Map of folderId -> folder
    const folderMap = new Map<string, { id: string; name: string; parents?: string[] }>();
    driveFolders.forEach((f) => folderMap.set(f.id, f));

    // Resolve full folder path / hierarchy for better detection (e.g. "Series / Korea / 2024")
    const getFolderPathName = (folderId: string): string => {
      const parts: string[] = [];
      let currentId: string | undefined = folderId;
      let depth = 0;
      while (currentId && folderMap.has(currentId) && depth < 5) {
        const folder = folderMap.get(currentId)!;
        parts.unshift(folder.name);
        currentId = folder.parents && folder.parents[0];
        depth++;
      }
      return parts.join(' / ');
    };

    // Group images by folder
    const groupsByFolderId = new Map<string, DriveFile[]>();
    const ungroupedImages: DriveFile[] = [];

    allImages.forEach((img) => {
      let matchedFolderId: string | null = null;
      if (img.parents && img.parents.length > 0) {
        for (const parentId of img.parents) {
          if (folderMap.has(parentId)) {
            matchedFolderId = parentId;
            break;
          }
        }
      }

      if (matchedFolderId) {
        const list = groupsByFolderId.get(matchedFolderId) || [];
        list.push(img);
        groupsByFolderId.set(matchedFolderId, list);
      } else {
        ungroupedImages.push(img);
      }
    });

    const folderGroups: DriveFolderGroup[] = [];

    // Build folder groups that actually contain images
    groupsByFolderId.forEach((files, folderId) => {
      const folder = folderMap.get(folderId);
      const folderName = folder ? folder.name : 'Unknown Folder';
      const fullPath = getFolderPathName(folderId) || folderName;

      // Detect year from full path or folder name
      const detectedYear = detectYear(fullPath);
      const { type: detectedType, country: detectedCountry } = detectCategoryAndCountry(fullPath, detectedYear);

      folderGroups.push({
        folderId,
        folderName,
        detectedYear,
        detectedType,
        detectedCountry,
        files,
      });
    });

    // Also include any detected folders that might have been empty in the first pass
    // but exist in Drive (e.g. user created 2021, 2022, 2023, etc.)
    driveFolders.forEach((folder) => {
      // If folder already has files grouped, skip
      if (groupsByFolderId.has(folder.id)) return;

      const yr = detectYear(folder.name);
      // Only include if folder name has year (2021-2026) or movie/series keyword
      if (yr || folder.name.toLowerCase().includes('movie') || folder.name.toLowerCase().includes('series')) {
        const { type: detectedType, country: detectedCountry } = detectCategoryAndCountry(folder.name, yr);
        folderGroups.push({
          folderId: folder.id,
          folderName: folder.name,
          detectedYear: yr,
          detectedType,
          detectedCountry,
          files: [],
        });
      }
    });

    // If there are ungrouped images (stored in root of Drive), group them by detected year
    if (ungroupedImages.length > 0) {
      const ungroupedByYear = new Map<number, DriveFile[]>();
      ungroupedImages.forEach((img) => {
        const yr = detectYear(img.name, img.createdTime);
        const list = ungroupedByYear.get(yr) || [];
        list.push(img);
        ungroupedByYear.set(yr, list);
      });

      ungroupedByYear.forEach((files, yr) => {
        folderGroups.push({
          folderId: `ungrouped-${yr}`,
          folderName: `Drive Root (${yr} Posters)`,
          detectedYear: yr as MovieYear,
          detectedType: 'movie',
          files,
        });
      });
    }

    // Sort folder groups by year descending
    folderGroups.sort((a, b) => b.detectedYear - a.detectedYear);

    return {
      folders: folderGroups,
      allImages,
      totalScanned: allImages.length,
    };
  } catch (err) {
    console.error('Error fetching drive folders and images:', err);
    throw err;
  }
}

/**
 * Convert a DriveFile to a complete Poster object
 */
export function createPosterFromDriveFile(
  file: DriveFile,
  year: number,
  type: MediaType,
  country?: SeriesCountry,
  folderName?: string
): Poster {
  // Primary: Google Drive high-resolution thumbnail endpoint (instant rendering)
  const displayUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`;
  const secondaryUrl = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s1200') : `https://lh3.googleusercontent.com/d/${file.id}`;
  const title = cleanTitleFromFilename(file.name);

  return {
    id: `drive-${file.id}`,
    title,
    type,
    year,
    country: type === 'series' ? country || 'Korea' : undefined,
    genre: type === 'movie' ? 'Cinema / Feature' : 'Series / Drama',
    rating: 8.5,
    imageUrl: displayUrl,
    thumbnailUrl: secondaryUrl,
    driveFileId: file.id,
    driveWebViewLink: file.webViewLink,
    folderName: folderName,
    description: `${title} (${year}) - ${type === 'movie' ? 'Cinema Feature Poster' : `${country || 'Asian'} Series Drama Poster`}.`,
    addedAt: file.createdTime || new Date().toISOString(),
    isCustomUpload: true,
  };
}

/**
 * Make an entire Google Drive folder public so all images inside inherit read access
 */
export async function makeDriveFolderPublic(folderId: string, accessToken: string): Promise<void> {
  if (!folderId || folderId.startsWith('ungrouped')) return;
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (e) {
    console.warn('Could not set permissions for folder', folderId, e);
  }
}

/**
 * Make drive files public in background with concurrency throttling so Google API does not rate-limit
 */
export async function makeDriveFilesPublic(fileIds: string[], accessToken: string): Promise<void> {
  // Process in small batches of 6 with short delay to prevent HTTP 429 Rate Limit
  const batchSize = 6;
  for (let i = 0; i < fileIds.length; i += batchSize) {
    const batch = fileIds.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((fileId) =>
        fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }).catch((e) => console.warn('Could not set permissions for file', fileId, e))
      )
    );
  }
}

/**
 * Delete a file from Google Drive (Mandatory user confirmation handled by caller)
 */
export async function deleteDriveFile(fileId: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete Google Drive file: ${await res.text()}`);
  }
}
