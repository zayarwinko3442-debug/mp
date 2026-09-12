import React, { useState } from 'react';
import { X, UploadCloud, Film, Tv, CheckCircle2, AlertCircle, Loader2, Folder, Image, Images } from 'lucide-react';
import { MediaType, MovieYear, SeriesYear, SeriesCountry, Poster } from '../types';
import { uploadPosterToDrive } from '../services/driveService';
import { User } from 'firebase/auth';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePoster: (poster: Poster) => void;
  onBatchSavePosters?: (posters: Poster[]) => void;
  user: User | null;
  accessToken: string | null;
  onConnectDrive: () => void;
  initialType?: MediaType;
  initialCountry?: SeriesCountry;
  initialYear?: number;
}

const MOVIE_YEARS: MovieYear[] = [2026, 2025, 2024, 2023, 2022, 2021];
const SERIES_YEARS: SeriesYear[] = [2026, 2025, 2024, 2023, 2022, 2021];
const SERIES_COUNTRIES: SeriesCountry[] = ['Korea', 'Thai', 'China', 'English', 'Bollywood'];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSavePoster,
  onBatchSavePosters,
  user,
  accessToken,
  onConnectDrive,
  initialType = 'movie',
  initialCountry = 'Korea',
  initialYear = 2026,
}) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('single');

  // Single Upload states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>(initialType);
  const [movieYear, setMovieYear] = useState<MovieYear | ''>(
    initialYear && initialYear >= 2021 && initialYear <= 2026 ? (initialYear as MovieYear) : 2026
  );
  const [country, setCountry] = useState<SeriesCountry>(initialCountry);
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('8.5');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Folder Upload states (No Rating, No Year as requested)
  const [folderName, setFolderName] = useState('');
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderPreviews, setFolderPreviews] = useState<string[]>([]);
  const [folderType, setFolderType] = useState<MediaType>(initialType);
  const [folderCountry, setFolderCountry] = useState<SeriesCountry>(initialCountry);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setType(initialType);
        setFolderType(initialType);
      }
      if (initialCountry) {
        setCountry(initialCountry);
        setFolderCountry(initialCountry);
      }
      if (initialYear && initialYear >= 2021 && initialYear <= 2026) {
        setMovieYear(initialYear as MovieYear);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialType, initialCountry, initialYear]);

  if (!isOpen) return null;

  // Single file handlers
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  // Folder file handlers
  const handleFolderFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processSelectedFolderFiles(Array.from(files));
  };

  const processSelectedFolderFiles = (files: File[]) => {
    const imageFiles = files
      .filter((f) => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    if (imageFiles.length === 0) {
      setErrorMessage('ရွေးချယ်ထားသော Folder ထဲတွင် ပုံ (JPG/PNG/WEBP) မတွေ့ရှိပါ။');
      return;
    }

    setFolderFiles(imageFiles);

    // Auto-derive folder name from webkitRelativePath
    const firstPath = imageFiles[0]?.webkitRelativePath;
    let detectedFolderName = '';
    if (firstPath) {
      const parts = firstPath.split('/');
      if (parts.length > 1) {
        detectedFolderName = parts[0];
      }
    }
    if (!detectedFolderName) {
      detectedFolderName = `${folderType === 'movie' ? 'Movie' : 'Series'} Folder`;
    }
    setFolderName(detectedFolderName);

    // Create thumbnail previews for first 6 images
    const previews = imageFiles.slice(0, 8).map((f) => URL.createObjectURL(f));
    setFolderPreviews(previews);
    setErrorMessage(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    if (uploadMode === 'single') {
      const file = files?.[0];
      if (file && file.type.startsWith('image/')) {
        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        if (!title) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setTitle(cleanName);
        }
        setErrorMessage(null);
      }
    } else {
      if (files && files.length > 0) {
        processSelectedFolderFiles(Array.from(files));
      }
    }
  };

  // Submit Single Poster
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a poster title.');
      return;
    }
    if (!selectedFile && !previewUrl) {
      setErrorMessage('Please select a photo poster file.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      let finalImageUrl = previewUrl || '';
      let driveFileId: string | undefined = undefined;
      let driveWebViewLink: string | undefined = undefined;

      if (accessToken && selectedFile) {
        try {
          const driveResult = await uploadPosterToDrive(selectedFile, accessToken);
          driveFileId = driveResult.fileId;
          driveWebViewLink = driveResult.webViewLink;
          finalImageUrl = driveResult.displayUrl;
        } catch (driveErr: any) {
          console.warn('Drive upload error, falling back to local URL:', driveErr);
        }
      }

      const validYear = typeof movieYear === 'number' ? movieYear : undefined;

      const newPoster: Poster = {
        id: `custom-${Date.now()}`,
        title: title.trim(),
        type,
        year: validYear,
        country: type === 'series' ? country : undefined,
        genre: genre.trim() || (type === 'movie' ? 'Cinema / Feature' : 'Series / Drama'),
        rating: type === 'movie' && rating ? Math.min(10, Math.max(1, parseFloat(rating) || 8.0)) : undefined,
        imageUrl: previewUrl || finalImageUrl,
        thumbnailUrl: finalImageUrl,
        driveFileId,
        driveWebViewLink,
        description: description.trim() || (validYear ? `${title} (${validYear})` : title),
        addedAt: new Date().toISOString(),
        isCustomUpload: true,
      };

      onSavePoster(newPoster);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload and save poster.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Folder Upload (No Rating, No Year)
  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (folderFiles.length === 0) {
      setErrorMessage('ကျေးဇူးပြု၍ တင်လိုသော Folder ကို အရင်ရွေးချယ်ပါ။');
      return;
    }

    const cleanFolder = folderName.trim() || 'Folder';
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const createdPosters: Poster[] = [];

      for (let i = 0; i < folderFiles.length; i++) {
        const file = folderFiles[i];
        setUploadProgressText(`Uploading ${i + 1}/${folderFiles.length}: "${file.name}"...`);

        let finalImageUrl = URL.createObjectURL(file);
        let driveFileId: string | undefined = undefined;
        let driveWebViewLink: string | undefined = undefined;

        if (accessToken) {
          try {
            const driveResult = await uploadPosterToDrive(file, accessToken);
            driveFileId = driveResult.fileId;
            driveWebViewLink = driveResult.webViewLink;
            finalImageUrl = driveResult.displayUrl;
          } catch (driveErr) {
            console.warn(`Drive upload failed for ${file.name}, using local preview:`, driveErr);
          }
        }

        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

        const poster: Poster = {
          id: `folder-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          title: cleanTitle,
          type: folderType,
          year: undefined, // Folder upload does NOT assign year!
          country: folderType === 'series' ? folderCountry : undefined,
          genre: folderType === 'movie' ? 'Cinema / Feature' : 'Series / Drama',
          rating: undefined, // Folder upload does NOT assign rating!
          imageUrl: finalImageUrl,
          thumbnailUrl: finalImageUrl,
          driveFileId,
          driveWebViewLink,
          folderName: cleanFolder,
          originalFileName: file.name,
          orderIndex: i + 1,
          description: `${cleanTitle} - ${folderType === 'movie' ? 'Cinema Feature Poster' : `${folderCountry} Series Poster`}.`,
          addedAt: new Date().toISOString(),
          isCustomUpload: true,
        };

        createdPosters.push(poster);
      }

      if (onBatchSavePosters) {
        onBatchSavePosters(createdPosters);
      } else {
        createdPosters.forEach((p) => onSavePoster(p));
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload folder posters.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  return (
    <div
      id="upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="upload-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-zinc-100 my-8"
      >
        <button
          id="btn-close-upload"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <UploadCloud className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Upload Photo Posters
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Upload photo posters directly into Movie Perfect & your Google Drive.
        </p>

        {/* Upload Mode Selector: Single vs Folder */}
        <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 mb-5">
          <button
            type="button"
            id="btn-mode-single"
            onClick={() => setUploadMode('single')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              uploadMode === 'single'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>🖼️ ပုံ တစ်ပုံချင်း တင်မည် (Single Photo)</span>
          </button>
          <button
            type="button"
            id="btn-mode-folder"
            onClick={() => setUploadMode('folder')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              uploadMode === 'folder'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>📁 Folder လိုက် တင်မည် (No Rating & No Year)</span>
          </button>
        </div>

        {/* Google Drive Status Notification */}
        {user && accessToken ? (
          <div className="mb-5 p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-200">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Connected to <strong>{user.email}</strong> Google Drive.
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Drive not connected. Posters will be saved locally.</span>
            </div>
            <button
              id="btn-upload-connect-drive"
              type="button"
              onClick={onConnectDrive}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0 ml-2"
            >
              Connect Drive
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* MODE 1: SINGLE POSTER UPLOAD */}
        {uploadMode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            {/* File Upload Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-4 text-center cursor-pointer bg-zinc-950/50 transition-colors"
              onClick={() => document.getElementById('single-poster-file-input')?.click()}
            >
              <input
                id="single-poster-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSingleFileChange}
              />

              {previewUrl ? (
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-24 object-cover rounded-lg shadow-md border border-zinc-700"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-zinc-200 truncate max-w-xs">
                      {selectedFile?.name || 'Selected Poster Image'}
                    </p>
                    <p className="text-[11px] text-emerald-400 mt-1">
                      ✓ Click or drop another image to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-zinc-300">
                    Drag and drop poster photo here, or <span className="text-rose-400 underline">browse</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Supports JPG, PNG, WEBP movie/series posters
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Poster / Title *
              </label>
              <input
                id="input-poster-title"
                type="text"
                required
                placeholder="e.g. Avengers: Secret Wars"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Category: Movie vs Series */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Category
                </label>
                <div className="flex rounded-lg bg-zinc-800 p-1 border border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setType('movie')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                      type === 'movie' ? 'bg-rose-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    🎬 Movie
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('series')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                      type === 'series' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    📺 Series
                  </button>
                </div>
              </div>

              {/* Release Year */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Release Year (ခုနှစ်)
                </label>
                <select
                  value={movieYear}
                  onChange={(e) => setMovieYear(e.target.value ? (Number(e.target.value) as MovieYear) : '')}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value="">ခုနှစ် မထည့်ပါ (No Year)</option>
                  {(type === 'movie' ? MOVIE_YEARS : SERIES_YEARS).map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If Series: Select Region */}
            {type === 'series' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Series Origin / Region (ဒေသ ရွေးချယ်ရန်)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SERIES_COUNTRIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCountry(c)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        country === c
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Genre & Rating (Rating only for Movie) */}
            <div className={type === 'movie' ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Genre / အမျိုးအစား
                </label>
                <input
                  type="text"
                  placeholder={type === 'movie' ? 'e.g. Action, Sci-Fi' : 'e.g. Romance, Drama'}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              {type === 'movie' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Rating (1 - 10, Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    placeholder="8.5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Description / Synopsis (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Enter storyline or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Save Poster</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: FOLDER UPLOAD (No Rating, No Year) */
          <form onSubmit={handleFolderSubmit} className="space-y-4">
            {/* Folder Select Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-emerald-600/60 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer bg-zinc-950/50 transition-colors"
              onClick={() => document.getElementById('folder-input-picker')?.click()}
            >
              {/* Native directory upload input */}
              <input
                id="folder-input-picker"
                type="file"
                multiple
                // @ts-ignore
                webkitdirectory="true"
                directory=""
                className="hidden"
                onChange={handleFolderFilesChange}
              />

              {folderFiles.length > 0 ? (
                <div>
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                    <Folder className="w-6 h-6" />
                    <span className="text-sm font-bold">
                      {folderFiles.length} photo posters selected
                    </span>
                  </div>

                  {/* Thumbnail Previews */}
                  <div className="flex items-center justify-center gap-2 flex-wrap max-h-32 overflow-y-auto p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                    {folderPreviews.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-12 h-16 object-cover rounded shadow border border-zinc-700"
                      />
                    ))}
                    {folderFiles.length > folderPreviews.length && (
                      <span className="text-xs text-zinc-400 font-semibold px-2">
                        +{folderFiles.length - folderPreviews.length} more
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-emerald-400/90 mt-2">
                    ✓ Click to choose a different folder
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <Folder className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-200">
                    Click to select an entire Folder of photo posters
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Or drag and drop multiple poster images here
                  </p>
                  <p className="text-[10px] text-emerald-400 mt-2 font-medium">
                    ✨ Folder လိုက် တင်ရာတွင် Rating နှင့် Year ထည့်ရန် မလိုပါ (No Rating & No Year)
                  </p>
                </div>
              )}
            </div>

            {/* Folder Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Folder Name (Folder အမည်) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Korea Drama Series, Squid Game Season 2, etc."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            {/* Category: Movie vs Series */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Category (ရုပ်ရှင် သို့မဟုတ် ဇာတ်လမ်းတွဲ ရွေးချယ်ပါ)
              </label>
              <div className="flex rounded-lg bg-zinc-800 p-1 border border-zinc-700">
                <button
                  type="button"
                  onClick={() => setFolderType('movie')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${
                    folderType === 'movie' ? 'bg-rose-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  🎬 Movie Category ထဲသို့ ထည့်မည်
                </button>
                <button
                  type="button"
                  onClick={() => setFolderType('series')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${
                    folderType === 'series' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  📺 Series Category ထဲသို့ ထည့်မည်
                </button>
              </div>
            </div>

            {/* If Series: Select Region */}
            {folderType === 'series' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Series Origin / Region (ဒေသ / နိုင်ငံ ရွေးချယ်ရန်)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SERIES_COUNTRIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFolderCountry(c)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        folderCountry === c
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notice explaining clean folder upload */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-bold">ℹ️ သတိပြုရန်:</span>
              <span>
                Folder လိုက်တင်သော ပုံများတွင် Rating နှင့် Year (ခုနှစ်) မထည့်ဘဲ မူရင်းအစဉ်အတိုင်း သန့်ရှင်းစွာ သိမ်းဆည်းပေးပါမည်။
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-400 font-medium">
                {folderFiles.length > 0 ? `${folderFiles.length} ပုံ တင်ရန် အသင့်ဖြစ်ပါပြီ` : 'Folder မရွေးရသေးပါ'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading || folderFiles.length === 0}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{uploadProgressText || 'Uploading folder...'}</span>
                    </>
                  ) : (
                    <span>
                      Upload All {folderFiles.length > 0 ? `(${folderFiles.length} Posters)` : 'Folder'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
