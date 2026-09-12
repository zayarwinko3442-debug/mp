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
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { DriveFile, DriveFolderGroup, Poster, MediaType, MovieYear, SeriesYear, SeriesCountry } from '../types';
import {
  fetchDriveFoldersAndImages,
  listDriveImageFiles,
  createPosterFromDriveFile,
  makeDriveFilesPublic,
  makeDriveFolderPublic,
  extractDriveIdFromUrl,
  cleanTitleFromFilename,
} from '../services/driveService';
import { User } from 'firebase/auth';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinPoster: (poster: Poster) => void;
  onBatchJoinPosters?: (posters: Poster[]) => void;
  user: User | null;
  accessToken: string | null;
  onConnectDrive: () => Promise<void> | void;
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
  // Mode: 'folders' (Batch by Folder & Year), 'single' (Pick 1 photo), or 'direct_link' (Direct Drive Link without login)
  const [activeMode, setActiveMode] = useState<'folders' | 'single' | 'direct_link'>('folders');

  // Folders and files state
  const [folderGroups, setFolderGroups] = useState<DriveFolderGroup[]>([]);
  const [allDriveFiles, setAllDriveFiles] = useState<DriveFile[]>([]);
  const [totalScanned, setTotalScanned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connect / Auth diagnostics state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectErrorDetails, setConnectErrorDetails] = useState<{
    type: 'unauthorized_domain' | 'popup_blocked' | 'popup_closed' | 'general';
    message: string;
    host: string;
  } | null>(null);
  const [copiedHost, setCopiedHost] = useState(false);

  // Direct Link Join states (Zero login required)
  const [directLinkInput, setDirectLinkInput] = useState('');
  const [directTitle, setDirectTitle] = useState('');
  const [directType, setDirectType] = useState<MediaType>('movie');
  const [directMovieYear, setDirectMovieYear] = useState<MovieYear>(2026);
  const [directSeriesYear, setDirectSeriesYear] = useState<SeriesYear>(2026);
  const [directCountry, setDirectCountry] = useState<SeriesCountry>('Korea');
  const [directGenre, setDirectGenre] = useState('');
  const [directSuccessMsg, setDirectSuccessMsg] = useState<string | null>(null);

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

  // Connect with Drive and handle popup errors gracefully
  const handleConnectClick = async () => {
    setIsConnecting(true);
    setConnectErrorDetails(null);
    try {
      await onConnectDrive();
    } catch (err: any) {
      console.error('Drive connect caught in modal:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      const host = typeof window !== 'undefined' ? window.location.hostname : 'Netlify';

      if (code === 'auth/unauthorized-domain' || msg.includes('Unauthorized Domain') || msg.includes('authorized-domain')) {
        setConnectErrorDetails({
          type: 'unauthorized_domain',
          message: `လက်ရှိ Website Domain "${host}" ကို Firebase Authentication တွင် ခွင့်ပြုချက် (Authorized) မပေးရသေးပါခင်ဗျာ။ ထို့ကြောင့် Google Sign-In Popup သည် အကောင့်မရွေးနိုင်ဘဲ အလိုအလျောက် ပိတ်သွားခြင်း ဖြစ်ပါသည်။`,
          host,
        });
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setConnectErrorDetails({
          type: 'popup_blocked',
          message: 'သင့် Browser (သို့မဟုတ် ဖုန်း) မှ Pop-up Window များကို ပိတ်ထားသဖြင့် Google Login Window ပွင့်မလာဘဲ ချက်ချင်း ပိတ်သွားခြင်း ဖြစ်ပါသည်။ ကျေးဇူးပြု၍ Browser Settings တွင် Pop-up ခွင့်ပြုပေးပါ။',
          host,
        });
      } else if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed')) {
        setConnectErrorDetails({
          type: 'popup_closed',
          message: 'Google Sign-In Pop-up Window ကို အကောင့်မရွေးဘဲ ပိတ်လိုက်သဖြင့် မအောင်မြင်ခဲ့ပါ။',
          host,
        });
      } else {
        setConnectErrorDetails({
          type: 'general',
          message: msg || 'Google Drive ချိတ်ဆက်မှု မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပေးပါ။',
          host,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyHost = () => {
    if (!connectErrorDetails?.host) return;
    navigator.clipboard.writeText(connectErrorDetails.host);
    setCopiedHost(true);
    setTimeout(() => setCopiedHost(false), 2500);
  };

  // Direct Link Submit (Zero Login Required)
  const handleDirectLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDirectSuccessMsg(null);
    setError(null);

    const lines = directLinkInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError('ကျေးဇူးပြု၍ Google Drive ဖိုင် Link တစ်ခု ထည့်သွင်းပေးပါ');
      return;
    }

    const createdPosters: Poster[] = [];

    lines.forEach((line, index) => {
      const fileId = extractDriveIdFromUrl(line);
      if (!fileId) return;

      const yr = directType === 'movie' ? directMovieYear : directSeriesYear;
      const baseTitle = lines.length === 1 && directTitle.trim()
        ? directTitle.trim()
        : directTitle.trim()
          ? `${directTitle.trim()} - #${index + 1}`
          : `Drive Poster #${index + 1}`;

      const displayUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
      const secondaryUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

      createdPosters.push({
        id: `drive-direct-${fileId}-${Date.now()}-${index}`,
        title: baseTitle,
        type: directType,
        year: yr,
        country: directType === 'series' ? directCountry : undefined,
        genre: directGenre.trim() || (directType === 'movie' ? 'Cinema / Feature' : 'Series / Drama'),
        rating: undefined,
        imageUrl: displayUrl,
        thumbnailUrl: secondaryUrl,
        driveFileId: fileId,
        driveWebViewLink: `https://drive.google.com/file/d/${fileId}/view`,
        description: `${baseTitle} (${yr}) - ${directType === 'movie' ? 'Cinema Feature Poster' : `${directCountry} Series Drama Poster`}.`,
        addedAt: new Date().toISOString(),
        isCustomUpload: true,
      });
    });

    if (createdPosters.length === 0) {
      setError('ထည့်သွင်းထားသော Link ထဲမှ မှန်ကန်သော Google Drive File ID ကို ရှာမတွေ့ပါ။ ဥပမာ- https://drive.google.com/file/d/.../view ပုံစံ မှန်ကန်မှု ရှိမရှိ စစ်ဆေးပေးပါ။');
      return;
    }

    if (onBatchJoinPosters && createdPosters.length > 1) {
      onBatchJoinPosters(createdPosters);
    } else {
      createdPosters.forEach((p) => onJoinPoster(p));
    }

    setDirectSuccessMsg(`${createdPosters.length} ပုံကို Movie Perfect ထဲသို့ အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ!`);
    setDirectLinkInput('');
    setDirectTitle('');
    setTimeout(() => {
      onClose();
    }, 1200);
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
  const directPreviewFileId = extractDriveIdFromUrl(directLinkInput.split('\n')[0] || '');

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
                Drive မှ Folder လိုက် သို့မဟုတ် Link ဖြင့် ပုံများကို ခုနှစ်အလိုက် (2021 - 2026) အလိုအလျောက် သွင်းယူပါမည်။
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

        {/* Universal Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 shrink-0 border-b border-zinc-800/60">
          <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs">
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
              <span>Folder လိုက် အကုန်သွင်းရန် {folderGroups.length > 0 ? `(${folderGroups.length})` : ''}</span>
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
            <button
              type="button"
              onClick={() => setActiveMode('direct_link')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeMode === 'direct_link'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>🔗 Drive Link ဖြင့်သွင်းမည် (Login မလိုပါ)</span>
            </button>
          </div>

          {user && accessToken && activeMode !== 'direct_link' && (
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
              title="Refresh from Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Drive</span>
            </button>
          )}
        </div>

        {/* VIEW 1: DIRECT LINK MODE (Zero Login Required!) */}
        {activeMode === 'direct_link' ? (
          <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-800/60 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Google Drive Link ဖြင့် တိုက်ရိုက် သွင်းယူရန်</h3>
              </div>
              <p className="text-xs text-zinc-300">
                Google Login မလိုအပ်ဘဲ Google Drive ရှိ ပုံဖိုင် Link များ (Anyone with the link can view) ကို ထည့်သွင်းကာ Movie Perfect ထဲသို့ အလိုအလျောက် သွင်းနိုင်ပါသည်။
              </p>
            </div>

            {directSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{directSuccessMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDirectLinkSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Link Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Google Drive File Link(s) သို့မဟုတ် File ID <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder={`ဥပမာ-\nhttps://drive.google.com/file/d/1ABC123xyz/view?usp=sharing\n(ဖိုင် link တစ်ခုထက်ပိုပါက တစ်ကြောင်းလျှင် တစ်ခုစီ ရိုက်ထည့်နိုင်ပါသည်)`}
                    value={directLinkInput}
                    onChange={(e) => setDirectLinkInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    💡 Drive ပေါ်တွင် "Anyone with the link can view" ဖွင့်ထားသော ပုံဖိုင်များ အလုပ်လုပ်ပါသည်။
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Poster Title (ဇာတ်ကား အမည်)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alien Romulus, Queen of Tears..."
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Live Preview of Direct Link */}
                {directPreviewFileId && (
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
                    <img
                      src={`https://drive.google.com/thumbnail?id=${directPreviewFileId}&sz=w400`}
                      alt="Drive preview"
                      referrerPolicy="no-referrer"
                      className="w-14 aspect-[2/3] object-cover rounded-lg border border-zinc-700 bg-zinc-900"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://lh3.googleusercontent.com/d/${directPreviewFileId}`;
                      }}
                    />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> File ID အောင်မြင်စွာ ရှာဖွေတွေ့ရှိပါသည်
                      </span>
                      <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                        ID: {directPreviewFileId}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata & Year Selection */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div>
                  {/* Category Type */}
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Category (ကဏ္ဍ)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDirectType('movie')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          directType === 'movie'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Film className="w-4 h-4" /> 🎬 Movie (ရုပ်ရှင်)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirectType('series')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          directType === 'series'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Tv className="w-4 h-4" /> 📺 Series (ဇာတ်လမ်းတွဲ)
                      </button>
                    </div>
                  </div>

                  {/* Year */}
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Release Year (ထွက်ရှိသည့် ခုနှစ်)
                    </label>
                    {directType === 'movie' ? (
                      <select
                        value={directMovieYear}
                        onChange={(e) => setDirectMovieYear(Number(e.target.value) as MovieYear)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-bold focus:outline-none"
                      >
                        {MOVIE_YEARS.map((yr) => (
                          <option key={yr} value={yr}>
                            Year {yr}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={directSeriesYear}
                        onChange={(e) => setDirectSeriesYear(Number(e.target.value) as SeriesYear)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-bold focus:outline-none"
                      >
                        {SERIES_YEARS.map((yr) => (
                          <option key={yr} value={yr}>
                            Year {yr}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Series Country */}
                  {directType === 'series' && (
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        Country (နိုင်ငံ)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {SERIES_COUNTRIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setDirectCountry(c)}
                            className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                              directCountry === c
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Genre */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Genre (အမျိုးအစား)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Action / Romance / Sci-Fi"
                      value={directGenre}
                      onChange={(e) => setDirectGenre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-direct-drive-link"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Movie Perfect ထဲသို့ တိုက်ရိုက်သွင်းမည်</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* VIEW 2: OAUTH FOLDERS & SINGLE PHOTO MODES */
          !user || !accessToken ? (
            <div className="py-10 px-4 text-center my-auto space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-2">
                <FolderSync className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Google Drive ချိတ်ဆက်ထားခြင်း မရှိသေးပါ
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Google Drive အကောင့်ဖြင့် ဝင်ရောက်ပြီး Folder လိုက် သို့မဟုတ် ပုံတစ်ပုံချင်း ရွေးချယ်ကာ Movie Perfect ကတ်တလောက်ထဲသို့ ခုနှစ်အလိုက် တစ်ခါတည်း သွင်းနိုင်ပါသည်။
                </p>
              </div>

              {/* Login Button with Loading State */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="btn-drive-picker-login"
                  type="button"
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-xl shadow-blue-950/50 transition-all flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Google Account ဖွင့်နေပါသည်...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect with Google Drive</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('direct_link')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 transition-colors flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Login မလိုဘဲ Drive Link ဖြင့်သွင်းမည်</span>
                </button>
              </div>

              {/* Detailed Diagnostic Banner if Popup Closes Instantly */}
              {connectErrorDetails && (
                <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-200 text-left text-xs max-w-lg mx-auto shadow-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Google Popup ချက်ချင်း ပိတ်သွားရသည့် အကြောင်းရင်း</span>
                  </div>

                  <p className="text-zinc-200 leading-relaxed text-[11px]">
                    {connectErrorDetails.message}
                  </p>

                  {connectErrorDetails.type === 'unauthorized_domain' && (
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2 text-[11px]">
                      <div className="text-zinc-400 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>သင်၏ လက်ရှိ Website Domain:</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-zinc-900 px-3 py-1.5 rounded border border-zinc-700 font-mono text-xs text-sky-400">
                        <span className="truncate">{connectErrorDetails.host}</span>
                        <button
                          type="button"
                          onClick={handleCopyHost}
                          className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-800 px-2.5 py-1 rounded transition-colors shrink-0"
                        >
                          {copiedHost ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedHost ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="text-zinc-400 leading-relaxed pt-1">
                        <b>ဖြေရှင်းနည်း (၁ မိနစ်သာ ကြာပါသည်) -</b>
                        <ol className="list-decimal list-inside space-y-1 mt-1 text-zinc-300">
                          <li>
                            <a
                              href="https://console.firebase.google.com/project/gen-lang-client-0071270554/authentication/settings"
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-400 underline font-semibold hover:text-sky-300 inline-flex items-center gap-0.5"
                            >
                              Firebase Console Settings <ExternalLink className="w-2.5 h-2.5" />
                            </a> သို့ သွားပါ။
                          </li>
                          <li><b>Authorized domains</b> အောက်ရှိ <b>"Add domain"</b> ကို နှိပ်ပါ။</li>
                          <li>အပေါ်မှ Copy ကူးထားသော <b>"{connectErrorDetails.host}"</b> ကို Paste လုပ်ပြီး Save လိုက်ပါ။</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConnectClick}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      🔄 ပြန်လည်ကြိုးစားရန် (Retry)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('direct_link')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Drive Link ဖြင့် တိုက်ရိုက်သွင်းမည် (အလွယ်ဆုံး)</span>
                    </button>
                  </div>
                </div>
              )}
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
                    onClick={handleConnectClick}
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
                  <button
                    type="button"
                    onClick={() => setActiveMode('direct_link')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                  >
                    Drive Link ဖြင့်သွင်းမည်
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
        ))}
      </div>
    </div>
  );
};
