import React, { useState } from 'react';
import { X, UploadCloud, Film, Tv, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { MediaType, MovieYear, SeriesYear, SeriesCountry, Poster } from '../types';
import { uploadPosterToDrive } from '../services/driveService';
import { User } from 'firebase/auth';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePoster: (poster: Poster) => void;
  user: User | null;
  accessToken: string | null;
  onConnectDrive: () => void;
}

const MOVIE_YEARS: MovieYear[] = [2026, 2025, 2024, 2023, 2022, 2021];
const SERIES_YEARS: SeriesYear[] = [2026, 2025, 2024, 2023];
const SERIES_COUNTRIES: SeriesCountry[] = ['Korea', 'Thai', 'China', 'English', 'Bollywood'];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSavePoster,
  user,
  accessToken,
  onConnectDrive,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('movie');
  const [movieYear, setMovieYear] = useState<MovieYear>(2026);
  const [seriesYear, setSeriesYear] = useState<SeriesYear>(2026);
  const [country, setCountry] = useState<SeriesCountry>('Korea');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('8.5');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // If user is connected to Google Drive and access token exists, upload to Drive
      if (accessToken && selectedFile) {
        try {
          const driveResult = await uploadPosterToDrive(selectedFile, accessToken);
          driveFileId = driveResult.fileId;
          driveWebViewLink = driveResult.webViewLink;
          finalImageUrl = driveResult.displayUrl;
        } catch (driveErr: any) {
          console.warn('Drive upload error, falling back to local storage URL:', driveErr);
          // Still allow saving locally if drive upload had network or quota issue
        }
      }

      // If previewUrl is available, use it for immediate display so newly uploaded 2026 posters render instantly
      const newPoster: Poster = {
        id: `custom-${Date.now()}`,
        title: title.trim(),
        type,
        year: type === 'movie' ? movieYear : seriesYear,
        country: type === 'series' ? country : undefined,
        genre: genre.trim() || (type === 'movie' ? 'Action / Drama' : 'Drama / Romance'),
        rating: Math.min(10, Math.max(1, parseFloat(rating) || 8.0)),
        imageUrl: previewUrl || finalImageUrl,
        thumbnailUrl: finalImageUrl,
        driveFileId,
        driveWebViewLink,
        description: description.trim(),
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
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <UploadCloud className="w-6 h-6 text-rose-500" />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Upload Photo Poster
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          Upload and join movie or series posters directly into Movie Perfect & Google Drive.
        </p>

        {/* Google Drive Status Notification */}
        {user && accessToken ? (
          <div className="mb-6 p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-sky-200">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Connected to <strong>{user.email}</strong> Google Drive. Posters will be saved to your Drive folder.
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Drive not connected. Poster will be saved locally.</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-4 text-center cursor-pointer bg-zinc-950/50 transition-colors"
            onClick={() => document.getElementById('poster-file-input')?.click()}
          >
            <input
              id="poster-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
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
                  Supports JPG, PNG, WEBP high-resolution movie posters
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

          {/* Type Switcher: Movie vs Series */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Category
              </label>
              <div className="flex rounded-lg bg-zinc-800 p-1 border border-zinc-700">
                <button
                  type="button"
                  id="btn-select-movie"
                  onClick={() => setType('movie')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                    type === 'movie'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  🎬 Movie
                </button>
                <button
                  type="button"
                  id="btn-select-series"
                  onClick={() => setType('series')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                    type === 'series'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  📺 Series
                </button>
              </div>
            </div>

            {/* Year Selector matching hierarchy */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Year
              </label>
              {type === 'movie' ? (
                <select
                  id="select-movie-year"
                  value={movieYear}
                  onChange={(e) => setMovieYear(Number(e.target.value) as MovieYear)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
                >
                  {MOVIE_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="select-series-year"
                  value={seriesYear}
                  onChange={(e) => setSeriesYear(Number(e.target.value) as SeriesYear)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
                >
                  {SERIES_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Series Country Selector (Only if series) */}
          {type === 'series' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Series Origin / Country
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SERIES_COUNTRIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCountry(c)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                      country === c
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Genre & Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Genre
              </label>
              <input
                id="input-poster-genre"
                type="text"
                placeholder="e.g. Action, Sci-Fi"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Rating (1 - 10)
              </label>
              <input
                id="input-poster-rating"
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Short Description / Synopsis
            </label>
            <textarea
              id="input-poster-description"
              rows={2}
              placeholder="Enter short storyline or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              id="btn-cancel-upload"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="btn-submit-upload"
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Drive...</span>
                </>
              ) : (
                <span>Save Poster</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
