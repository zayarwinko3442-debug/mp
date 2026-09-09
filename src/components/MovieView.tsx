import React, { useState } from 'react';
import { Film, Calendar, Search, UploadCloud } from 'lucide-react';
import { Poster, MovieYear } from '../types';
import { PosterCard } from './PosterCard';

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
  const [search, setSearch] = useState('');

  // Filter only movies
  const movies = posters.filter((p) => p.type === 'movie');

  const filteredMovies = movies.filter((m) => {
    const matchesYear = selectedYear === 'all' || m.year === selectedYear;
    const matchesSearch =
      !search.trim() ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.genre.toLowerCase().includes(search.toLowerCase());
    return matchesYear && matchesSearch;
  });

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
            Browse cinematic releases categorized by release year (2021 – 2026)
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-movie-search"
            type="text"
            placeholder="Search movie titles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Year Filter Bar (2021 - 2026) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2 flex items-center gap-1">
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

      {/* Results Count & Quick Upload */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>
          Showing <strong>{filteredMovies.length}</strong> {selectedYear === 'all' ? 'total' : selectedYear} movies
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
      {filteredMovies.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-200">No Movies Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {selectedYear === 'all'
              ? 'No movies match your search term.'
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredMovies.map((poster) => (
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
