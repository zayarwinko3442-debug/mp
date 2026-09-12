import { DriveFile, DriveFolderGroup, MediaType, MovieYear, SeriesYear, SeriesCountry, Poster } from '../types';

const FOLDER_NAME = 'Movie Perfect Posters';

/**
 * Intelligent Year detector from folder name or file name or date
 */
export function detectYear(name: string): MovieYear | SeriesYear | undefined {
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

  // If no explicit year is detected in folder/file name, return undefined (do not force into 2026)
  return undefined;
}

/**
 * Intelligent MediaType & Series Country detector
 */
export function detectCategoryAndCountry(name: string, year?: number): {
  type: MediaType;
  country?: SeriesCountry;
} {
  const lower = name.toLowerCase();

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
export function cleanTitleFromFilename(name?: string): string {
  if (!name) return 'Untitled';
  const noExt = name.replace(/\.[^/.]+$/, ''); // remove extension
  let clean = noExt.replace(/[\(_-]?\b202[1-6]\b[\)]?/g, '').trim();
  clean = clean.replace(/[-_.]+/g, ' ').trim();
  if (!clean) return noExt || 'Untitled';
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
      if (res.status === 401) {
        throw new Error('AUTH_EXPIRED: Google Drive access token expired. Please reconnect.');
      }
      if (allItems.length > 0) {
        break; // return what was gathered so far if paginating
      }
      throw new Error(`Drive fetch error (${res.status}): ${errText}`);
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
 * Supports scanning up to 5000+ files.
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
    // 1. Fetch all folders with full Drive support (My Drive + Shared Drives)
    const folderQuery = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=${encodeURIComponent('nextPageToken,files(id,name,parents)')}&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true`;
    const driveFolders: Array<{ id: string; name: string; parents?: string[] }> = await fetchAllDrivePages(
      folderUrl,
      accessToken,
      1000
    );

    // 2. Fetch all image files with full pagination up to maxPhotos
    const imageQuery = encodeURIComponent("mimeType contains 'image/' and trashed = false");
    const imageUrl = `https://www.googleapis.com/drive/v3/files?q=${imageQuery}&fields=${encodeURIComponent('nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,createdTime,parents)')}&pageSize=500&supportsAllDrives=true&includeItemsFromAllDrives=true`;
    const allImages: DriveFile[] = await fetchAllDrivePages(imageUrl, accessToken, maxPhotos);

    // Map of folderId -> folder
    const folderMap = new Map<string, { id: string; name: string; parents?: string[] }>();
    driveFolders.forEach((f) => folderMap.set(f.id, f));

    // Resolve any parent folders referenced by images that were not in initial driveFolders
    const unknownParentIds = new Set<string>();
    allImages.forEach((img) => {
      if (img.parents) {
        img.parents.forEach((pid) => {
          if (!folderMap.has(pid)) unknownParentIds.add(pid);
        });
      }
    });

    if (unknownParentIds.size > 0) {
      const missingIds = Array.from(unknownParentIds).slice(0, 30);
      await Promise.allSettled(
        missingIds.map(async (pid) => {
          try {
            const r = await fetch(
              `https://www.googleapis.com/drive/v3/files/${pid}?fields=id,name,parents&supportsAllDrives=true`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (r.ok) {
              const f = await r.json();
              folderMap.set(f.id, f);
              driveFolders.push(f);
            }
          } catch {}
        })
      );
    }

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

    // Group images directly by immediate parent folder
    const directImagesByFolder = new Map<string, DriveFile[]>();
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
        const list = directImagesByFolder.get(matchedFolderId) || [];
        list.push(img);
        directImagesByFolder.set(matchedFolderId, list);
      } else {
        ungroupedImages.push(img);
      }
    });

    // Helper: is childFolder a descendant of ancestorFolder?
    const isDescendant = (childId: string, ancestorId: string): boolean => {
      let currentId: string | undefined = childId;
      let depth = 0;
      while (currentId && folderMap.has(currentId) && depth < 6) {
        const f = folderMap.get(currentId)!;
        if (f.parents && f.parents.includes(ancestorId)) return true;
        currentId = f.parents && f.parents[0];
        depth++;
      }
      return false;
    };

    // Aggregate files: For every folder, collect direct images PLUS any images in child subfolders
    const folderGroups: DriveFolderGroup[] = [];
    const processedFolderIds = new Set<string>();

    driveFolders.forEach((folder) => {
      const folderId = folder.id;
      const fullPath = getFolderPathName(folderId) || folder.name;

      // Collect direct files
      const fileMap = new Map<string, DriveFile>();
      const directList = directImagesByFolder.get(folderId) || [];
      directList.forEach((f) => fileMap.set(f.id, f));

      // Also collect files from child subfolders
      directImagesByFolder.forEach((childFiles, childId) => {
        if (childId !== folderId && isDescendant(childId, folderId)) {
          childFiles.forEach((f) => fileMap.set(f.id, f));
        }
      });

      const allFolderFiles = Array.from(fileMap.values());

      // Only include folders that have files, or match relevant keywords
      const yr = detectYear(fullPath);
      const isRelevantEmpty =
        yr || folder.name.toLowerCase().includes('movie') || folder.name.toLowerCase().includes('series');

      if (allFolderFiles.length > 0 || isRelevantEmpty) {
        const { type: detectedType, country: detectedCountry } = detectCategoryAndCountry(fullPath, yr);

        // Sort files numerically / naturally by file name (1.jpg, 2.jpg, ..., 10.jpg)
        allFolderFiles.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        folderGroups.push({
          folderId,
          folderName: fullPath,
          detectedYear: yr,
          detectedType,
          detectedCountry,
          files: allFolderFiles,
        });
        processedFolderIds.add(folderId);
      }
    });

    // Also include any direct folder groups that were not in driveFolders
    directImagesByFolder.forEach((files, folderId) => {
      if (processedFolderIds.has(folderId)) return;
      const folder = folderMap.get(folderId);
      const folderName = folder ? folder.name : 'Folder';
      const fullPath = getFolderPathName(folderId) || folderName;

      const detectedYear = detectYear(fullPath);
      const { type: detectedType, country: detectedCountry } = detectCategoryAndCountry(fullPath, detectedYear);

      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      folderGroups.push({
        folderId,
        folderName: fullPath,
        detectedYear,
        detectedType,
        detectedCountry,
        files,
      });
      processedFolderIds.add(folderId);
    });

    // If there are ungrouped images (stored in root of Drive), group them by detected year if any
    if (ungroupedImages.length > 0) {
      const ungroupedByYear = new Map<string, DriveFile[]>();
      ungroupedImages.forEach((img) => {
        const yr = detectYear(img.name);
        const key = yr ? String(yr) : 'uncategorized';
        const list = ungroupedByYear.get(key) || [];
        list.push(img);
        ungroupedByYear.set(key, list);
      });

      ungroupedByYear.forEach((files, key) => {
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        const isYear = key !== 'uncategorized';
        folderGroups.push({
          folderId: `ungrouped-${key}`,
          folderName: isYear ? `Drive Root (${key} Posters)` : 'Drive Root (Uncategorized Photos)',
          detectedYear: isYear ? (Number(key) as MovieYear) : undefined,
          detectedType: 'movie',
          files,
        });
      });
    }

    // Sort folder groups by file count descending, then by year descending
    folderGroups.sort((a, b) => {
      if (b.files.length !== a.files.length) return b.files.length - a.files.length;
      return (b.detectedYear || 0) - (a.detectedYear || 0);
    });

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
  year?: number,
  type: MediaType = 'movie',
  country?: SeriesCountry,
  folderName?: string,
  orderIndex?: number
): Poster {
  // Primary: Google Drive high-resolution thumbnail endpoint (instant rendering)
  const displayUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`;
  const secondaryUrl = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s1200') : `https://lh3.googleusercontent.com/d/${file.id}`;
  const title = cleanTitleFromFilename(file.name);
  const validYear = year && year >= 2021 && year <= 2026 ? year : undefined;

  return {
    id: `drive-${file.id}`,
    title,
    type,
    year: validYear,
    country: type === 'series' ? country || 'Korea' : undefined,
    genre: type === 'movie' ? 'Cinema / Feature' : 'Series / Drama',
    rating: undefined, // Folder import does NOT assign rating
    imageUrl: displayUrl,
    thumbnailUrl: secondaryUrl,
    driveFileId: file.id,
    driveWebViewLink: file.webViewLink,
    folderName: folderName,
    originalFileName: file.name,
    orderIndex: orderIndex,
    description: validYear
      ? `${title} (${validYear}) - ${type === 'movie' ? 'Cinema Feature Poster' : `${country || 'Asian'} Series Drama Poster`}.`
      : `${title} - ${type === 'movie' ? 'Cinema Feature Poster' : `${country || 'Asian'} Series Drama Poster`}.`,
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
 * Extract Google Drive file or folder ID from various Drive URL formats or plain ID
 */
export function extractDriveIdFromUrl(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();

  // If already a raw ID without slashes
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // /file/d/ID
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  // /folders/ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  // ?id=ID or &id=ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  return null;
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
