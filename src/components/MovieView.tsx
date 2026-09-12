import React, { useState } from 'react';
import { Film, Calendar, Search, UploadCloud, Folder, ArrowUpDown, Hash, LayoutGrid, Grid } from 'lucide-react';
import { Poster, MovieYear } from '../types';
import { PosterCard } from './PosterCard';
import { SortMode, sortPosters } from '../utils/sortUtils';

interface MovieViewProps {
  posters: Poster[];
  onSelectPoster: (poster: Poster) => void;
  onOpenUpload: () => void;
  onDeletePoster: (poster: Poster) => void;
  isAdmin?: boolean;
}

const MOVIE_YEARS: MovieYear[] = [2026, 2025, 2024, 2023, 2022, 2021];

export const MovieView: React.FC<MovieViewProps> = ({
  posters,
  onSelectPoster,
  onOpenUpload,
  onDeletePoster,
  isAdmin = false,
}) => {
  const [selectedYear, setSelectedYear] = useState<MovieYear | 'all'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('numeric');
  const [search, setSearch] = useState('');
  const [viewSize, setViewSize] = useState<'large' | 'compact'>('large');

  // Filter only movies
  const movies = posters.filter((p) => p.type === 'movie');

  // Extract distinct folders from movies
  const availableFolders = Array.from(
    new Set(movies.map((m) => m.folderName).filter(Boolean))
  ) as string[];

  // Filter movies
  const filtered = movies.filter((m) => {
    const matchesYear =
      selectedFolder !== 'all' ||
      selectedYear === 'all' ||
      m.year === selectedYear;
    const matchesFolder = selectedFolder === 'all' || m.folderName === selectedFolder;
    const q = search.toLowerCase();
    const title = (m.title || '').toLowerCase();
    const genre = (m.genre || '').toLowerCase();
    const folder = (m.folderName || '').toLowerCase();
    const matchesSearch =
      !search.trim() ||
      title.includes(q) ||
      genre.includes(q) ||
      folder.includes(q);
    return matchesYear && matchesFolder && matchesSearch;
  });

  // Apply natural numerical sorting
  const sortedMovies = sortPosters(filtered, sortMode);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Film className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              🎬 Movie Catalog
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browse cinematic releases categorized by release year (2021 – 2026) & folders
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-movie-search"
              type="text"
              placeholder="Search movies or folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-zinc-400 font-semibold shrink-0">အစဉ်လိုက်:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="numeric" className="bg-zinc-900 text-white">
                🔢 နံပါတ် အစဉ်လိုက် (1, 2, 3... 10)
              </option>
              <option value="year-desc" className="bg-zinc-900 text-white">
                📅 ခုနှစ် (၂၀၂၆ → ၂၀၂၁)
              </option>
              <option value="rating-desc" className="bg-zinc-900 text-white">
                ★ Rating အမြင့်ဆုံး
              </option>
              <option value="title-asc" className="bg-zinc-900 text-white">
                🔤 အမည် (A → Z)
              </option>
              <option value="title-desc" className="bg-zinc-900 text-white">
                🔤 အမည် (Z → A)
              </option>
            </select>
          </div>

          {/* View Size Switcher (Large vs Compact) */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewSize('large')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewSize === 'large'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Large View (ပိုကြီးသော ပုံများ)"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>ပုံကြီး (Large)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewSize('compact')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewSize === 'compact'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Compact View (ပုံလတ်များ)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ပုံလတ်</span>
            </button>
          </div>
        </div>
      </div>

      {/* Year Filter Bar (2021 - 2026) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          Year:
        </span>

        <button
          id="btn-movie-year-all"
          onClick={() => setSelectedYear('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            selectedYear === 'all'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/40 font-black'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
          }`}
        >
          All Years ({movies.length})
        </button>

        {MOVIE_YEARS.map((yr) => {
          const count = movies.filter((m) => m.year === yr).length;
          return (
            <button
              key={yr}
              id={`btn-movie-year-${yr}`}
              onClick={() => setSelectedYear(yr)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedYear === yr
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/40 font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              {yr} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Folder Filter Bar (Only if folders exist) */}
      {availableFolders.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1 shrink-0">
            <Folder className="w-3.5 h-3.5 text-sky-400" />
            Folder:
          </span>

          <button
            onClick={() => setSelectedFolder('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedFolder === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
            }`}
          >
            All Folders
          </button>

          {availableFolders.map((folder) => {
            const count = movies.filter((m) => m.folderName === folder).length;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedFolder === folder
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                }`}
              >
                <span>{folder}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800/80 text-zinc-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results Count & Quick Upload */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <span>
            Showing <strong>{sortedMovies.length}</strong> movies
            {selectedYear !== 'all' && ` from ${selectedYear}`}
            {selectedFolder !== 'all' && ` in folder "${selectedFolder}"`}
          </span>
          {sortMode === 'numeric' && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
              <Hash className="w-3 h-3" /> နံပါတ် အစဉ်လိုက် (1, 2, 3...)
            </span>
          )}
        </span>
        {isAdmin && (
          <button
            id="btn-add-movie-poster"
            onClick={onOpenUpload}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Movie Poster</span>
          </button>
        )}
      </div>

      {/* Movie Grid */}
      {sortedMovies.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">No Movies Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {selectedYear === 'all'
              ? 'No movies match your search term or folder.'
              : `No movie posters available for year ${selectedYear}.`}
          </p>
          {isAdmin && (
            <button
              onClick={onOpenUpload}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Upload {selectedYear !== 'all' ? `${selectedYear} ` : ''}Movie Poster
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewSize === 'large'
              ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'
              : 'grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4'
          }
        >
          {sortedMovies.map((poster) => (
            <PosterCard
              key={poster.id}
              poster={poster}
              size={viewSize}
              onSelect={onSelectPoster}
              onDelete={isAdmin ? onDeletePoster : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
