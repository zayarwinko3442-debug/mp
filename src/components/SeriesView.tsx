import React, { useState } from 'react';
import { Tv, Globe, Calendar, Search, UploadCloud } from 'lucide-react';
import { Poster, SeriesCountry, SeriesYear } from '../types';
import { PosterCard } from './PosterCard';

interface SeriesViewProps {
  posters: Poster[];
  onSelectPoster: (poster: Poster) => void;
  onOpenUpload: () => void;
  onDeletePoster: (poster: Poster) => void;
  isAdmin?: boolean;
}

const SERIES_COUNTRIES: SeriesCountry[] = ['Korea', 'Thai', 'China', 'English', 'Bollywood'];
const SERIES_YEARS: SeriesYear[] = [2026, 2025, 2024, 2023];

export const SeriesView: React.FC<SeriesViewProps> = ({
  posters,
  onSelectPoster,
  onOpenUpload,
  onDeletePoster,
  isAdmin = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<SeriesCountry | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<SeriesYear | 'all'>('all');
  const [search, setSearch] = useState('');

  // Filter only series
  const series = posters.filter((p) => p.type === 'series');

  const filteredSeries = series.filter((s) => {
    const matchesCountry = selectedCountry === 'all' || s.country === selectedCountry;
    const matchesYear = selectedYear === 'all' || s.year === selectedYear;
    const matchesSearch =
      !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.genre.toLowerCase().includes(search.toLowerCase());
    return matchesCountry && matchesYear && matchesSearch;
  });

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
            Explore Asian & International Dramas (Korea, Thai, China, English, Bollywood) & Years (2023 – 2026)
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-series-search"
            type="text"
            placeholder="Search series titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Dual Filter Section: Countries and Years */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        {/* Country Filter (Korea, Thai, China, English, Bollywood) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1.5 shrink-0">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Region / Origin:
          </span>

          <button
            id="btn-series-country-all"
            onClick={() => setSelectedCountry('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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

        {/* Year Filter (2023 - 2026) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Release Year:
          </span>

          <button
            id="btn-series-year-all"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedYear === 'all'
                ? 'bg-sky-500 text-zinc-950 font-black shadow-md shadow-sky-950/40'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
            }`}
          >
            All Years
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
                    ? 'bg-sky-500 text-zinc-950 font-black shadow-md shadow-sky-950/40'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                }`}
              >
                {yr} {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Quick Upload */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>
          Showing <strong>{filteredSeries.length}</strong> series{' '}
          {selectedCountry !== 'all' ? `(${selectedCountry})` : ''}{' '}
          {selectedYear !== 'all' ? `[${selectedYear}]` : ''}
        </span>
        {isAdmin && (
          <button
            id="btn-add-series-poster"
            onClick={onOpenUpload}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Series Poster</span>
          </button>
        )}
      </div>

      {/* Series Grid */}
      {filteredSeries.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">No Series Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No series poster matches {selectedCountry !== 'all' ? `"${selectedCountry}"` : ''}{' '}
            {selectedYear !== 'all' ? `in ${selectedYear}` : ''}.
          </p>
          {isAdmin && (
            <button
              onClick={onOpenUpload}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
            >
              Upload Series Poster
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredSeries.map((poster) => (
            <PosterCard
              key={poster.id}
              poster={poster}
              onSelect={onSelectPoster}
              onDelete={isAdmin ? onDeletePoster : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
