import React, { useState, useEffect } from 'react';
import {
  X,
  FolderSync,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Film,
  Tv,
  Folder,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { DriveFile, DriveFolderGroup, Poster, MediaType, MovieYear, SeriesYear, SeriesCountry } from '../types';
import {
  fetchDriveFoldersAndImages,
  listDriveImageFiles,
  createPosterFromDriveFile,
  makeDriveFilesPublic,
  makeDriveFolderPublic,
} from '../services/driveService';
import { User } from 'firebase/auth';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinPoster: (poster: Poster) => void;
  onBatchJoinPosters?: (posters: Poster[]) => void;
  user: User | null;
  accessToken: string | null;
  onConnectDrive: () => void;
}

const MOVIE_YEARS: MovieYear[] = [2026, 2025, 2024, 2023, 2022, 2021];
const SERIES_YEARS: SeriesYear[] = [2026, 2025, 2024, 2023, 2022, 2021];
const SERIES_COUNTRIES: SeriesCountry[] = ['Korea', 'Thai', 'China', 'English', 'Bollywood'];

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  onClose,
  onJoinPoster,
  onBatchJoinPosters,
  user,
  accessToken,
  onConnectDrive,
}) => {
  // Mode: 'folders' (Batch by Folder & Year) or 'single' (Pick 1 photo)
  const [activeMode, setActiveMode] = useState<'folders' | 'single'>('folders');

  // Folders and files state
  const [folderGroups, setFolderGroups] = useState<DriveFolderGroup[]>([]);
  const [allDriveFiles, setAllDriveFiles] = useState<DriveFile[]>([]);
  const [totalScanned, setTotalScanned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single file join state
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);
  const [singleTitle, setSingleTitle] = useState('');
  const [singleType, setSingleType] = useState<MediaType>('movie');
  const [singleMovieYear, setSingleMovieYear] = useState<MovieYear>(2026);
  const [singleSeriesYear, setSingleSeriesYear] = useState<SeriesYear>(2026);
  const [singleCountry, setSingleCountry] = useState<SeriesCountry>('Korea');
  const [singleGenre, setSingleGenre] = useState('');

  // Fetch Drive photos and folders when modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      loadData();
    }
  }, [isOpen, accessToken]);

  const loadData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const { folders, allImages, totalScanned: scanned } = await fetchDriveFoldersAndImages(accessToken);
      const sortedImages = [...allImages].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      setFolderGroups(folders);
      setAllDriveFiles(sortedImages);
      setTotalScanned(scanned);

      if (sortedImages.length > 0 && !selectedDriveFile) {
        selectSingleFile(sortedImages[0]);
      }
    } catch (err: any) {
      console.error('Error fetching drive data:', err);
      const errMsg = err?.message || '';
      const isAuthErr = errMsg.includes('AUTH_EXPIRED') || errMsg.includes('401');

      if (isAuthErr) {
        setError('Google Drive ချိတ်ဆက်မှု သက်တမ်းကုန်သွားပါပြီ။ ကျေးဇူးပြု၍ Re-connect ပြုလုပ်ပေးပါ။');
        return;
      }

      // Fallback to basic image listing with client-side year grouping
      try {
        const fallbackFiles = await listDriveImageFiles(accessToken);
        const sortedFallback = [...fallbackFiles].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        setAllDriveFiles(sortedFallback);
        setTotalScanned(sortedFallback.length);

        if (sortedFallback.length > 0) {
          const byYear = new Map<number, DriveFile[]>();
          sortedFallback.forEach((f) => {
            const yr = (f as any).createdTime ? new Date((f as any).createdTime).getFullYear() : 2026;
            const targetYr = yr >= 2021 && yr <= 2026 ? yr : 2026;
            const list = byYear.get(targetYr) || [];
            list.push(f);
            byYear.set(targetYr, list);
          });

          const fallbackGroups: DriveFolderGroup[] = [];
          byYear.forEach((files, yr) => {
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            fallbackGroups.push({
              folderId: `fallback-${yr}`,
              folderName: `Drive (${yr} Posters)`,
              detectedYear: yr as MovieYear,
              detectedType: 'movie',
              files,
            });
          });
          setFolderGroups(fallbackGroups);
        }
      } catch (fallbackErr) {
        setError('Google Drive မှ ဖိုင်များကို ရယူ၍မရသေးပါ။ Re-connect ပြုလုပ်ပေးပါ။');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectSingleFile = (file: DriveFile) => {
    setSelectedDriveFile(file);
    const cleanName = (file.name || 'Untitled').replace(/\.[^/.]+$/, '').replace(/[-_.]+/g, ' ');
    setSingleTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
  };

  // Update a folder's auto-detected configuration if the user wants to customize
  const updateFolderConfig = (
    folderId: string,
    updates: Partial<{
      detectedYear?: MovieYear | SeriesYear;
      detectedType: MediaType;
      detectedCountry: SeriesCountry;
    }>
  ) => {
    setFolderGroups((prev) =>
      prev.map((fg) => (fg.folderId === folderId ? { ...fg, ...updates } : fg))
    );
  };

  // 1-Click: Import a specific folder group
  const handleImportFolder = async (group: DriveFolderGroup) => {
    if (!group.files || group.files.length === 0) {
      setError(`"${group.folderName}" ထဲတွင် ပုံများ မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ ပုံရှိသော Folder ကို ရွေးချယ်ပါ။`);
      return;
    }

    setIsImporting(true);
    setImportStatus(
      `Importing ${group.files.length} photos from "${group.folderName}"${
        group.detectedYear ? ` (Year ${group.detectedYear})` : ''
      }...`
    );

    try {
      const sortedFiles = [...group.files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

      const newPosters: Poster[] = sortedFiles.map((file, idx) =>
        createPosterFromDriveFile(
          file,
          group.detectedYear,
          group.detectedType,
          group.detectedType === 'series' ? group.detectedCountry || 'Korea' : undefined,
          group.folderName,
          idx + 1
        )
      );

      // Trigger public folder and files permissions in background (non-blocking)
      if (group.folderId && !group.folderId.startsWith('ungrouped') && !group.folderId.startsWith('fallback')) {
        makeDriveFolderPublic(group.folderId, accessToken!).catch(() => {});
      }
      const fileIds = group.files.map((f) => f.id);
      makeDriveFilesPublic(fileIds, accessToken!).catch(() => {});

      if (onBatchJoinPosters) {
        onBatchJoinPosters(newPosters);
      } else {
        newPosters.forEach((p) => onJoinPoster(p));
      }

      onClose();
    } catch (err) {
      console.error('Failed to import folder:', err);
      setError('Failed to import photos from this folder.');
    } finally {
      setIsImporting(false);
      setImportStatus(null);
    }
  };

  // ⚡ 1-Click: Import ALL folders by Year at once
  const handleImportAllFolders = async () => {
    const validGroups = folderGroups.filter((g) => g.files && g.files.length > 0);
    if (validGroups.length === 0) {
      setError('သွင်းယူရန် ဓာတ်ပုံပါရှိသော Folder မတွေ့ရှိပါ');
      return;
    }

    setIsImporting(true);
    const totalFiles = validGroups.reduce((acc, g) => acc + g.files.length, 0);
    setImportStatus(`Auto-importing ${totalFiles} photos across all Drive folders sorted by year...`);

    try {
      const allNewPosters: Poster[] = [];
      const allFileIds: string[] = [];
      const seenFileIds = new Set<string>();

      validGroups.forEach((group) => {
        const sortedFiles = [...group.files].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        sortedFiles.forEach((file, idx) => {
          if (!seenFileIds.has(file.id)) {
            seenFileIds.add(file.id);
            allFileIds.push(file.id);
            allNewPosters.push(
              createPosterFromDriveFile(
                file,
                group.detectedYear,
                group.detectedType,
                group.detectedType === 'series' ? group.detectedCountry || 'Korea' : undefined,
                group.folderName,
                idx + 1
              )
            );
          }
        });
      });

      // Set public permissions for folders and files in background
      validGroups.forEach((group) => {
        if (group.folderId && !group.folderId.startsWith('ungrouped') && !group.folderId.startsWith('fallback')) {
          makeDriveFolderPublic(group.folderId, accessToken!).catch(() => {});
        }
      });
      makeDriveFilesPublic(allFileIds, accessToken!).catch(() => {});

      if (onBatchJoinPosters) {
        onBatchJoinPosters(allNewPosters);
      } else {
        allNewPosters.forEach((p) => onJoinPoster(p));
      }

      onClose();
    } catch (err) {
      console.error('Failed to batch import all folders:', err);
      setError('Failed to batch import photos.');
    } finally {
      setIsImporting(false);
      setImportStatus(null);
    }
  };

  // Single file join form submission
  const handleSingleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriveFile) return;

    const poster = createPosterFromDriveFile(
      selectedDriveFile,
      singleType === 'movie' ? singleMovieYear : singleSeriesYear,
      singleType,
      singleType === 'series' ? singleCountry : undefined
    );

    if (singleTitle.trim()) {
      poster.title = singleTitle.trim();
    }
    if (singleGenre.trim()) {
      poster.genre = singleGenre.trim();
    }

    if (accessToken) {
      makeDriveFilesPublic([selectedDriveFile.id], accessToken);
    }

    onJoinPoster(poster);
    onClose();
  };

  if (!isOpen) return null;

  const totalPhotos = folderGroups.reduce((sum, g) => sum + g.files.length, 0) || allDriveFiles.length;

  return (
    <div
      id="drive-picker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="drive-picker-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-zinc-100 my-4 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Google Drive Join & Auto-Categorize</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  By Year
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Drive ထဲက Folder လိုက်တင်ထားသော ပုံများကို ခုနှစ်အလိုက် (2021 - 2026) အလိုအလျောက် သွင်းယူပါမည်။
              </p>
            </div>
          </div>
          <button
            id="btn-close-drive-picker"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector (Folder Batch vs Single Photo) */}
        {user && accessToken && (
          <div className="flex items-center justify-between gap-3 pt-3 pb-2 shrink-0 border-b border-zinc-800/60">
            <div className="flex gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode('folders')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activeMode === 'folders'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Folder လိုက် အကုန်သွင်းရန် ({folderGroups.length} Folders)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activeMode === 'single'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ပုံတစ်ပုံချင်း ရွေးသွင်းရန်</span>
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
              title="Refresh from Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Drive</span>
            </button>
          </div>
        )}

        {/* Auth Check */}
        {!user || !accessToken ? (
          <div className="py-14 px-4 text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
              <FolderSync className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Google Drive ချိတ်ဆက်ထားခြင်း မရှိသေးပါ
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
              Google Drive အကောင့်ဖြင့် ဝင်ရောက်ပြီး Folder လိုက် သို့မဟုတ် ပုံတစ်ပုံချင်း ရွေးချယ်ကာ Movie Perfect ကတ်တလောက်ထဲသို့ ခုနှစ်အလိုက် တစ်ခါတည်း သွင်းနိုင်ပါသည်။
            </p>
            <button
              id="btn-drive-picker-login"
              onClick={onConnectDrive}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-950/50 transition-colors"
            >
              Connect with Google Drive
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-20 text-center text-zinc-400 my-auto">
            <Loader2 className="w-9 h-9 animate-spin mx-auto text-sky-400 mb-3" />
            <p className="text-sm font-semibold text-white">Google Drive မှ Folders နှင့် ဓာတ်ပုံများကို ရှာဖွေနေပါသည်...</p>
            <p className="text-xs text-zinc-500 mt-1">Analyzing folder structure and release years (2021 - 2026)...</p>
          </div>
        ) : error ? (
          <div className="p-6 my-auto text-center">
            <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs max-w-md mx-auto shadow-xl">
              <p className="font-semibold leading-relaxed mb-4">{error}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onConnectDrive}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-colors"
                >
                  🔄 Re-connect Google Drive
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors"
                >
                  ပြန်လည်ကြိုးစားရန် (Retry)
                </button>
              </div>
            </div>
          </div>
        ) : isImporting ? (
          <div className="py-20 text-center text-zinc-400 my-auto">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-400 mb-3" />
            <p className="text-sm font-bold text-white">{importStatus || 'Importing photos into Movie Perfect...'}</p>
            <p className="text-xs text-zinc-500 mt-1">Setting permissions and categorizing by year...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pt-3 space-y-4 pr-1">
            {/* MODE 1: FOLDER BATCH AUTO-IMPORT */}
            {activeMode === 'folders' && (
              <div className="space-y-4">
                {/* 1-Click Master Action Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <h3 className="text-sm font-black text-white">
                        Folder အလိုက် စုစည်းထားသော ပုံများ ({totalPhotos} Photos • {folderGroups.length} Folders)
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      Drive မှ ဖိုင်စုစုပေါင်း {totalScanned} ပုံအား စစ်ဆေးပြီး သက်ဆိုင်ရာ Folders နှင့် ခုနှစ်များ (2021-2026) အလိုက် ခွဲခြားပေးထားပါသည်။
                    </p>
                  </div>

                  {folderGroups.length > 0 && (
                    <button
                      id="btn-import-all-folders"
                      type="button"
                      onClick={handleImportAllFolders}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>ခုနှစ်အလိုက် အကုန်သွင်းမည် ({totalPhotos} ပုံ)</span>
                    </button>
                  )}
                </div>

                {folderGroups.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 bg-zinc-950/50 rounded-2xl border border-zinc-800">
                    <Folder className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="text-sm font-semibold text-white">Google Drive ထဲတွင် Folder များ မတွေ့ရှိပါ</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      "ပုံတစ်ပုံချင်း ရွေးသွင်းရန်" Tab သို့ပြောင်း၍ သို့မဟုတ် Drive ထဲတွင် Folder များ (ဥပမာ 2024, 2025, Korea) ဖန်တီး၍ အသုံးပြုနိုင်ပါသည်။
                    </p>
                    <button
                      onClick={() => setActiveMode('single')}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    >
                      ပုံတစ်ပုံချင်း ရွေးချယ်သွင်းရန်
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {folderGroups.map((group) => (
                      <div
                        key={group.folderId}
                        className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                          {/* Folder info */}
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">
                                  {group.folderName}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                                  {group.files.length} photos
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-400">
                                Target: {group.detectedType === 'movie' ? '🎬 Movie' : '📺 Series'} ({group.detectedYear})
                                {group.detectedType === 'series' && ` • ${group.detectedCountry}`}
                              </span>
                            </div>
                          </div>

                          {/* Quick Adjust Dropdowns & Import Button */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Type Toggle */}
                            <select
                              value={group.detectedType}
                              onChange={(e) =>
                                updateFolderConfig(group.folderId, {
                                  detectedType: e.target.value as MediaType,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white font-medium focus:outline-none"
                            >
                              <option value="movie">🎬 Movie</option>
                              <option value="series">📺 Series</option>
                            </select>

                            {/* Year Selector */}
                            <select
                              value={group.detectedYear ?? ''}
                              onChange={(e) =>
                                updateFolderConfig(group.folderId, {
                                  detectedYear: e.target.value
                                    ? (Number(e.target.value) as MovieYear)
                                    : undefined,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white font-medium focus:outline-none"
                            >
                              <option value="">ခုနှစ် မထည့်ပါ (No Year)</option>
                              {group.detectedType === 'movie'
                                ? MOVIE_YEARS.map((yr) => (
                                    <option key={yr} value={yr}>
                                      Year {yr}
                                    </option>
                                  ))
                                : SERIES_YEARS.map((yr) => (
                                    <option key={yr} value={yr}>
                                      Year {yr}
                                    </option>
                                  ))}
                            </select>

                            {/* Series Country Selector if Series */}
                            {group.detectedType === 'series' && (
                              <select
                                value={group.detectedCountry || 'Korea'}
                                onChange={(e) =>
                                  updateFolderConfig(group.folderId, {
                                    detectedCountry: e.target.value as SeriesCountry,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white font-medium focus:outline-none"
                              >
                                {SERIES_COUNTRIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            )}

                            <button
                              type="button"
                              disabled={group.files.length === 0}
                              onClick={() => handleImportFolder(group)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                group.files.length === 0
                                  ? 'bg-zinc-800/60 text-zinc-500 cursor-not-allowed border border-zinc-800'
                                  : 'bg-sky-600 hover:bg-sky-500 active:scale-95 text-white'
                              }`}
                            >
                              {group.files.length === 0 ? (
                                <span>ပုံ မရှိပါ (0)</span>
                              ) : (
                                <>
                                  <span>သွင်းမည် ({group.files.length})</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Thumbnails row */}
                        {group.files.length === 0 ? (
                          <div className="py-4 text-center text-xs text-zinc-500 italic bg-zinc-900/30 rounded-lg mt-2 border border-dashed border-zinc-800/60">
                            ဤ Folder ထဲတွင် တိုက်ရိုက်ပုံများ မရှိသေးပါ (Drive ထဲသို့ ပုံထည့်ပြီး "ပြန်လည်စစ်ဆေးရန်" နှိပ်နိုင်ပါသည်)
                          </div>
                        ) : (
                        <div className="pt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                          {group.files.map((file, fileIdx) => {
                            const thumb =
                              file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}`;
                            return (
                              <div
                                key={file.id}
                                className="relative shrink-0 w-20 aspect-[2/3] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 group"
                              >
                                <img
                                  src={thumb}
                                  alt={file.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 left-1 bg-black/85 text-[9px] font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded shadow">
                                  #{fileIdx + 1}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 p-1 bg-black/80 text-[8px] text-zinc-300 truncate">
                                  {file.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: SINGLE PHOTO JOIN */}
            {activeMode === 'single' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Images Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Google Drive ဓာတ်ပုံများ ({allDriveFiles.length})
                    </span>
                  </div>

                  {allDriveFiles.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      No photos found in Drive
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5 max-h-80 overflow-y-auto p-1.5 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      {allDriveFiles.map((file) => {
                        const isSelected = selectedDriveFile?.id === file.id;
                        const thumb =
                          file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}`;

                        return (
                          <div
                            key={file.id}
                            onClick={() => selectSingleFile(file)}
                            className={`relative aspect-[2/3] rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                              isSelected
                                ? 'border-sky-500 ring-2 ring-sky-500/50 shadow-md'
                                : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <img
                              src={thumb}
                              alt={file.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 p-0.5 rounded-full bg-sky-500 text-white">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-1 bg-black/80 backdrop-blur-xs text-[9px] text-zinc-300 truncate">
                              {file.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Join Configuration Form */}
                {selectedDriveFile ? (
                  <form onSubmit={handleSingleJoin} className="space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                        ခုနှစ်နှင့် ကဏ္ဍ ရွေးချယ်သွင်းယူရန်
                      </span>

                      {/* Title */}
                      <div className="mb-3">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Poster Title (ခေါင်းစဉ်)
                        </label>
                        <input
                          type="text"
                          required
                          value={singleTitle}
                          onChange={(e) => setSingleTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Type: Movie or Series */}
                      <div className="mb-3">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Category (ကဏ္ဍ)
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSingleType('movie')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border ${
                              singleType === 'movie'
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            <Film className="w-3.5 h-3.5" /> Movie
                          </button>
                          <button
                            type="button"
                            onClick={() => setSingleType('series')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold border ${
                              singleType === 'series'
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            <Tv className="w-3.5 h-3.5" /> Series
                          </button>
                        </div>
                      </div>

                      {/* Year */}
                      <div className="mb-3">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Year (ခုနှစ်)
                        </label>
                        {singleType === 'movie' ? (
                          <select
                            value={singleMovieYear}
                            onChange={(e) => setSingleMovieYear(Number(e.target.value) as MovieYear)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none"
                          >
                            {MOVIE_YEARS.map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={singleSeriesYear}
                            onChange={(e) => setSingleSeriesYear(Number(e.target.value) as SeriesYear)}
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none"
                          >
                            {SERIES_YEARS.map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Series Country */}
                      {singleType === 'series' && (
                        <div className="mb-3">
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                            Country (နိုင်ငံ)
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {SERIES_COUNTRIES.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSingleCountry(c)}
                                className={`py-1 px-1.5 text-[11px] font-medium rounded border ${
                                  singleCountry === c
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Genre */}
                      <div className="mb-3">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Genre (အမျိုးအစား)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Action / Thriller"
                          value={singleGenre}
                          onChange={(e) => setSingleGenre(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="btn-confirm-join-drive"
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Movie Perfect သို့ သွင်းမည်</span>
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center text-zinc-500 text-xs">
                    ဘယ်ဘက်မှ ပုံတစ်ပုံ ရွေးချယ်ပါ
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
