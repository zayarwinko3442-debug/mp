import React, { useState } from 'react';
import { Star, Trash2, Film, Tv } from 'lucide-react';
import { Poster } from '../types';

interface PosterCardProps {
  poster: Poster;
  onSelect: (poster: Poster) => void;
  onDelete?: (poster: Poster) => void;
}

export const PosterCard: React.FC<PosterCardProps> = ({ poster, onSelect, onDelete }) => {
  const [imgSrc, setImgSrc] = useState(poster.imageUrl);
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
        setImgSrc(`https://drive.google.com/thumbnail?id=${poster.driveFileId}&sz=w800`);
        return;
      }
      if (retryCount <= 2) {
        setRetryCount(3);
        setImgSrc(`https://lh3.googleusercontent.com/d/${poster.driveFileId}`);
        return;
      }
    }
    setHasFailedAll(true);
  };

  return (
    <div
      id={`poster-card-${poster.id}`}
      onClick={() => onSelect(poster)}
      className="group relative flex flex-col bg-zinc-900/90 rounded-xl overflow-hidden border border-zinc-800/80 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/60 transition-all duration-300 cursor-pointer text-left"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
        {!hasFailedAll ? (
          <img
            src={imgSrc}
            alt={poster.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-400">
            {poster.type === 'movie' ? (
              <Film className="w-8 h-8 text-amber-500/60 mb-2" />
            ) : (
              <Tv className="w-8 h-8 text-emerald-500/60 mb-2" />
            )}
            <p className="text-xs font-bold text-zinc-200 line-clamp-2 px-1">{poster.title}</p>
            <span className="text-[10px] text-zinc-500 mt-1">{poster.year}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-amber-300 border border-amber-500/30">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {poster.rating.toFixed(1)}
          </span>

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-900/85 backdrop-blur-sm text-zinc-200 border border-zinc-700">
            {poster.year}
          </span>
        </div>

        {/* Series Country Badge */}
        {poster.country && (
          <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/90 backdrop-blur-sm text-white shadow-sm">
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
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white shadow-md transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10"
            title="Delete this poster"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Info Container */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between bg-zinc-900">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors">
            {poster.title}
          </h3>
          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
            {poster.genre}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
          <span className="capitalize text-zinc-300 font-medium">
            {poster.type === 'movie' ? '🎬 Movie' : '📺 Series'}
          </span>
          <span className="text-[10px] text-zinc-400">View Poster →</span>
        </div>
      </div>
    </div>
  );
};
