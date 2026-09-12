import React, { useState } from 'react';
import { Tv, Globe, Search, UploadCloud, Folder, ArrowUpDown, Calendar, LayoutGrid, Grid, Hash } from 'lucide-react';
import { Poster, SeriesCountry, SeriesYear } from '../types';
import { PosterCard } from './PosterCard';
import { SortMode, sortPosters } from '../utils/sortUtils';

interface SeriesViewProps {
  posters: Poster[];
  onSelectPoster: (poster: Poster) => void;
  onOpenUpload: (defaults?: { type?: 'series'; country?: SeriesCountry; year?: number }) => void;
  onDeletePoster: (poster: Poster) => void;
  isAdmin?: boolean;
}

const SERIES_COUNTRIES: SeriesCountry[] = ['Korea', 'Thai', 'China', 'English', 'Bollywood'];
const SERIES_YEARS: SeriesYear[] = [2026, 2025, 2024, 2023, 2022, 2021];

export const SeriesView: React.FC<SeriesViewProps> = ({
  posters,
  onSelectPoster,
  onOpenUpload,
  onDeletePoster,
  isAdmin = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<SeriesCountry | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<SeriesYear | 'all'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('numeric');
  const [search, setSearch] = useState('');
  const [viewSize, setViewSize] = useState<'large' | 'compact'>('large');

  // Filter only series
  const series = posters.filter((p) => p.type === 'series');

  // Extract distinct folders from series
  const availableFolders = Array.from(
    new Set(series.map((s) => s.folderName).filter(Boolean))
  ) as string[];

  const filteredSeries = series.filter((s) => {
    const matchesCountry = selectedCountry === 'all' || s.country === selectedCountry;
    // If a folder is selected, show all folder series regardless of year
    const matchesYear =
      selectedFolder !== 'all' ||
      selectedYear === 'all' ||
      s.year === selectedYear;
    const matchesFolder = selectedFolder === 'all' || s.folderName === selectedFolder;
    const matchesSearch =
      !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.genre.toLowerCase().includes(search.toLowerCase()) ||
      (s.folderName && s.folderName.toLowerCase().includes(search.toLowerCase()));
    return matchesCountry && matchesYear && matchesFolder && matchesSearch;
  });

  // Apply natural numerical sorting
  const sortedSeries = sortPosters(filteredSeries, sortMode);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Tv className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              📺 Series Catalog
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Explore Asian & International Dramas (Korea, Thai, China, English, Bollywood) • 2021 – 2026
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-series-search"
              type="text"
              placeholder="Search series or folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
                  ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold'
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
                  ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold'
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

      {/* Region / Origin & 2021-2026 Year Selection Tabs Section */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3.5">
        {/* Country / Region Tabs (Korea, Thai, China, English, Bollywood) & Upload Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1.5 shrink-0">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Region / Origin:
            </span>

            <button
              id="btn-series-country-all"
              onClick={() => setSelectedCountry('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCountry === 'all'
                  ? 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              All Regions ({series.length})
            </button>

            {SERIES_COUNTRIES.map((c) => {
              const count = series.filter((s) => s.country === c).length;
              return (
                <button
                  key={c}
                  id={`btn-series-country-${c.toLowerCase()}`}
                  onClick={() => setSelectedCountry(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCountry === c
                      ? 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-950/40'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  {c} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Direct Upload Series Button for selected Region and Year */}
          {isAdmin && (
            <button
              type="button"
              id="btn-series-region-upload-tab"
              onClick={() =>
                onOpenUpload({
                  type: 'series',
                  country: selectedCountry !== 'all' ? selectedCountry : 'Korea',
                  year: selectedYear !== 'all' ? selectedYear : 2026,
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all active:scale-95 border border-emerald-400/30 shrink-0"
              title="Upload Series into this Region & Year"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                + Upload {selectedCountry !== 'all' ? selectedCountry : ''} Series{' '}
                {selectedYear !== 'all' ? `[${selectedYear}]` : ''}
              </span>
            </button>
          )}
        </div>

        {/* 2021 - 2026 Release Year Tabs (Kept as requested) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-zinc-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Release Year:
          </span>

          <button
            id="btn-series-year-all"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedYear === 'all'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-950/40'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            All Years ({selectedCountry === 'all' ? series.length : series.filter((s) => s.country === selectedCountry).length})
          </button>

          {SERIES_YEARS.map((yr) => {
            const count = series.filter(
              (s) => s.year === yr && (selectedCountry === 'all' || s.country === selectedCountry)
            ).length;
            return (
              <button
                key={yr}
                id={`btn-series-year-${yr}`}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedYear === yr
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-950/40'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                }`}
              >
                {yr} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Folder Filter Bar (Only if folders exist) */}
        {availableFolders.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1.5 shrink-0">
              <Folder className="w-3.5 h-3.5 text-sky-400" />
              Folder:
            </span>

            <button
              onClick={() => setSelectedFolder('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedFolder === 'all'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 border border-zinc-700/60'
              }`}
            >
              All Folders
            </button>

            {availableFolders.map((folder) => {
              const count = series.filter((s) => s.folderName === folder).length;
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedFolder === folder
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 border border-zinc-700/60'
                  }`}
                >
                  <span>{folder}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-900 text-zinc-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count & Quick Upload */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <span>
            Showing <strong>{sortedSeries.length}</strong> series{' '}
            {selectedCountry !== 'all' ? `(${selectedCountry})` : ''}
            {selectedFolder !== 'all' ? ` in folder "${selectedFolder}"` : ''}
          </span>
          {sortMode === 'numeric' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
              <Hash className="w-3 h-3" /> နံပါတ် အစဉ်လိုက် (1, 2, 3...)
            </span>
          )}
        </span>
        {isAdmin && (
          <button
            id="btn-add-series-poster"
            onClick={() =>
              onOpenUpload({
                type: 'series',
                country: selectedCountry !== 'all' ? selectedCountry : 'Korea',
              })
            }
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Series Poster</span>
          </button>
        )}
      </div>

      {/* Series Grid */}
      {sortedSeries.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">No Series Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No series poster found in {selectedCountry !== 'all' ? `"${selectedCountry}"` : 'the catalog'}.
          </p>
          {isAdmin && (
            <button
              onClick={() =>
                onOpenUpload({
                  type: 'series',
                  country: selectedCountry !== 'all' ? selectedCountry : 'Korea',
                })
              }
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Upload Series Poster
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
          {sortedSeries.map((poster) => (
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
