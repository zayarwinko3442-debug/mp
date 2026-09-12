import React, { useState } from 'react';
import { Star, Trash2, Film, Tv } from 'lucide-react';
import { Poster } from '../types';

interface PosterCardProps {
  poster: Poster;
  onSelect: (poster: Poster) => void;
  onDelete?: (poster: Poster) => void;
  size?: 'large' | 'compact';
}

export const PosterCard: React.FC<PosterCardProps> = ({
  poster,
  onSelect,
  onDelete,
  size = 'large',
}) => {
  const isLarge = size === 'large';
  const getInitialImage = () => {
    if (poster.driveFileId) {
      return `https://drive.google.com/thumbnail?id=${poster.driveFileId}&sz=${isLarge ? 'w1200' : 'w800'}`;
    }
    return poster.imageUrl;
  };

  const [imgSrc, setImgSrc] = useState(getInitialImage);
  const [retryCount, setRetryCount] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const handleImageError = () => {
    if (poster.driveFileId) {
      if (retryCount === 0 && poster.thumbnailUrl && poster.thumbnailUrl !== imgSrc) {
        setRetryCount(1);
        setImgSrc(poster.thumbnailUrl);
        return;
      }
      if (retryCount <= 1) {
        setRetryCount(2);
        setImgSrc(`https://lh3.googleusercontent.com/d/${poster.driveFileId}`);
        return;
      }
      if (retryCount <= 2) {
        setRetryCount(3);
        setImgSrc(`https://drive.google.com/thumbnail?id=${poster.driveFileId}&sz=w800`);
        return;
      }
    }
    setHasFailedAll(true);
  };

  return (
    <div
      id={`poster-card-${poster.id}`}
      onClick={() => onSelect(poster)}
      className={`group relative flex flex-col bg-zinc-900/95 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/80 transition-all duration-300 cursor-pointer text-left ${
        isLarge ? 'shadow-xl' : 'shadow-md'
      }`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
        {!hasFailedAll ? (
          <>
            <img
              src={imgSrc}
              alt={poster.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={handleImageError}
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3 pointer-events-none">
              <span className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white font-bold text-xs shadow-lg border border-white/10 flex items-center gap-1.5">
                <span>🔍 ဓာတ်ပုံ အကြီးကြည့်ရန်</span>
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-400">
            {poster.type === 'movie' ? (
              <Film className="w-10 h-10 text-amber-500/60 mb-2" />
            ) : (
              <Tv className="w-10 h-10 text-emerald-500/60 mb-2" />
            )}
            <p className="text-sm font-bold text-zinc-200 line-clamp-2 px-1">{poster.title}</p>
            {poster.type === 'movie' && poster.year ? (
              <span className="text-xs text-zinc-500 mt-1">{poster.year}</span>
            ) : poster.country ? (
              <span className="text-xs text-emerald-400 mt-1 font-semibold">{poster.country} Series</span>
            ) : null}
          </div>
        )}

        {/* Top Badges: Rating (if set) and Year (if set) */}
        {(Boolean(poster.rating && poster.rating > 0) || Boolean(poster.year)) && (
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
            {typeof poster.rating === 'number' && poster.rating > 0 ? (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {poster.rating.toFixed(1)}
              </span>
            ) : <span />}

            {poster.year ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-zinc-900/90 backdrop-blur-md text-zinc-200 border border-zinc-700 shadow-md">
                {poster.year}
              </span>
            ) : null}
          </div>
        )}

        {/* Series Country Badge */}
        {poster.country && (
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
            <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white shadow-md border border-emerald-400/30">
              {poster.country}
            </span>
          </div>
        )}

        {/* Quick Delete overlay for any poster */}
        {onDelete && (
          <button
            id={`btn-delete-${poster.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(poster);
            }}
            className="absolute top-2 right-2 p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white shadow-md transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10 active:scale-95"
            title="Delete this poster"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info Container */}
      <div className={`p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-zinc-900 ${isLarge ? 'gap-2' : 'gap-1'}`}>
        <div>
          <h3 className={`font-extrabold text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors ${
            isLarge ? 'text-base sm:text-lg' : 'text-sm'
          }`}>
            {poster.title}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 font-medium">
            {poster.genre}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-zinc-800 text-xs text-zinc-400">
          <span className="capitalize text-zinc-300 font-semibold flex items-center gap-1">
            {poster.type === 'movie' ? '🎬 Movie' : '📺 Series'}
          </span>
          <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform font-bold">
            View Poster →
          </span>
        </div>
      </div>
    </div>
  );
};
