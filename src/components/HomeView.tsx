import React, { useState } from 'react';
import { Film, Tv, Sparkles, ChevronRight, Search, UploadCloud, LayoutGrid, Grid } from 'lucide-react';
import { Poster, ActiveTab } from '../types';
import { PosterCard } from './PosterCard';
import { BrandLogo } from './BrandLogo';
import { comparePostersNumerically } from '../utils/sortUtils';

interface HomeViewProps {
  posters: Poster[];
  onSelectPoster: (poster: Poster) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenUpload: () => void;
  onDeletePoster?: (poster: Poster) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdmin?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  posters,
  onSelectPoster,
  onNavigateTab,
  onOpenUpload,
  onDeletePoster,
  searchQuery,
  setSearchQuery,
  isAdmin = false,
}) => {
  const [viewSize, setViewSize] = useState<'large' | 'compact'>('large');
  // Filter by search
  const filtered = posters.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.genre.toLowerCase().includes(q) ||
      (p.country && p.country.toLowerCase().includes(q)) ||
      p.year.toString().includes(q)
    );
  });

  // Sort movies and series so 2026 releases appear first, and items in the same year/folder are naturally numbered
  const movies = filtered
    .filter((p) => p.type === 'movie')
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return comparePostersNumerically(a, b);
    });

  const series = filtered
    .filter((p) => p.type === 'series')
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return comparePostersNumerically(a, b);
    });

  // Featured hero poster (prioritize latest 2026 custom upload or first 2026 poster)
  const featured =
    posters.find((p) => p.year === 2026 && p.isCustomUpload) ||
    posters.find((p) => p.year === 2026) ||
    posters[0];

  return (
    <div className="space-y-10 pb-16">
      {/* Featured Hero Showcase */}
      {featured && !searchQuery && (
        <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="absolute inset-0">
            <img
              src={featured.imageUrl}
              alt={featured.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center opacity-30 filter blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-3xl flex flex-col justify-end min-h-[340px] sm:min-h-[400px]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/90 shadow-md backdrop-blur-md">
                <BrandLogo size="sm" />
                <span className="text-xs font-bold text-white tracking-wide">Mobile Perfect</span>
              </div>
              <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-600 text-white shadow-lg shadow-rose-950/50">
                <Sparkles className="w-3.5 h-3.5" /> Featured Spotlight
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700">
                {featured.year}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ★ {featured.rating.toFixed(1)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
              {featured.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl line-clamp-2 sm:line-clamp-3 mb-6">
              {featured.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-hero-view-details"
                onClick={() => onSelectPoster(featured)}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs sm:text-sm shadow-xl transition-all"
              >
                View Poster Details
              </button>
              {isAdmin && (
                <button
                  id="btn-hero-upload-poster"
                  onClick={onOpenUpload}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm border border-zinc-700 backdrop-blur-sm transition-all"
                >
                  <UploadCloud className="w-4 h-4 text-rose-400" />
                  Upload New Poster
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & View Size Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-global-search"
            type="text"
            placeholder="Search posters by title, year, genre or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* View Size Switcher (Large vs Compact) */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewSize('large')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewSize === 'large'
                ? 'bg-rose-600 text-white shadow-md font-extrabold'
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewSize === 'compact'
                ? 'bg-rose-600 text-white shadow-md font-extrabold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Compact View (ပုံလတ်များ)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>ပုံလတ်</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 🎬 MOVIE */}
      <section id="home-section-movies" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                🎬 Movie Posters
              </h2>
              <p className="text-xs text-zinc-400">
                2021 – 2026 Blockbusters & Cinematic Releases ({movies.length})
              </p>
            </div>
          </div>

          <button
            id="btn-see-all-movies"
            onClick={() => onNavigateTab('movie')}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <span>All Movies</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {movies.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
            No movie posters found. Try another search or upload one!
          </div>
        ) : (
          <div
            className={
              viewSize === 'large'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4'
            }
          >
            {movies.slice(0, 12).map((poster) => (
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
      </section>

      {/* SECTION 2: 📺 SERIES */}
      <section id="home-section-series" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                📺 Series Posters
              </h2>
              <p className="text-xs text-zinc-400">
                Korea, Thai, China, English, Bollywood (2021 – 2026) ({series.length})
              </p>
            </div>
          </div>

          <button
            id="btn-see-all-series"
            onClick={() => onNavigateTab('series')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group"
          >
            <span>All Series</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {series.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
            No series posters found. Try another search or upload one!
          </div>
        ) : (
          <div
            className={
              viewSize === 'large'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4'
            }
          >
            {series.slice(0, 12).map((poster) => (
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
      </section>
    </div>
  );
};
