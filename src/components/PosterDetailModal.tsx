import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, Globe, Film, Tv, Trash2, ImageOff, RefreshCw } from 'lucide-react';
import { Poster } from '../types';

interface PosterDetailModalProps {
  poster: Poster | null;
  onClose: () => void;
  onDelete?: (poster: Poster) => void;
}

export const PosterDetailModal: React.FC<PosterDetailModalProps> = ({ poster, onClose, onDelete }) => {
  if (!poster) return null;

  return <PosterDetailModalContent poster={poster} onClose={onClose} onDelete={onDelete} />;
};

const PosterDetailModalContent: React.FC<{
  poster: Poster;
  onClose: () => void;
  onDelete?: (poster: Poster) => void;
}> = ({ poster, onClose, onDelete }) => {
  const [imgSrc, setImgSrc] = useState<string>(poster.imageUrl);
  const [retryStep, setRetryStep] = useState<number>(0);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reset image state whenever opened poster changes
  useEffect(() => {
    setImgSrc(poster.imageUrl);
    setRetryStep(0);
    setHasFailedAll(false);
    setIsLoading(true);
  }, [poster.id, poster.imageUrl]);

  const handleImageError = () => {
    if (poster.driveFileId) {
      if (retryStep === 0 && poster.thumbnailUrl && poster.thumbnailUrl !== imgSrc) {
        setRetryStep(1);
        setImgSrc(poster.thumbnailUrl);
        return;
      }
      if (retryStep <= 1) {
        setRetryStep(2);
        setImgSrc(`https://lh3.googleusercontent.com/d/${poster.driveFileId}`);
        return;
      }
      if (retryStep <= 2) {
        setRetryStep(3);
        setImgSrc(`https://drive.google.com/thumbnail?id=${poster.driveFileId}&sz=w800`);
        return;
      }
      if (retryStep <= 3) {
        setRetryStep(4);
        setImgSrc(`https://drive.google.com/uc?export=view&id=${poster.driveFileId}`);
        return;
      }
    }
    setHasFailedAll(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setHasFailedAll(false);
    setIsLoading(true);
    setRetryStep(0);
    setImgSrc(`${poster.imageUrl}&t=${Date.now()}`);
  };

  // Clean description to avoid leaking internal Drive technical details
  const cleanDescription = () => {
    if (!poster.description) return `${poster.title} (${poster.year}) full resolution poster.`;
    if (poster.description.includes('Google Drive') || poster.description.includes('Auto-imported')) {
      return `${poster.title} (${poster.year}) - Cinema High-Definition Poster.`;
    }
    return poster.description;
  };

  return (
    <div
      id="poster-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="poster-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="btn-close-detail-modal"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poster Image Left/Top */}
        <div className="w-full md:w-5/12 bg-zinc-950 flex items-center justify-center p-4">
          <div className="relative aspect-[2/3] w-full max-w-[280px] rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
            {/* Image display */}
            {!hasFailedAll ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-0">
                    <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={imgSrc}
                  alt={poster.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setIsLoading(false)}
                  onError={handleImageError}
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-400">
                <ImageOff className="w-10 h-10 text-rose-500/80 mb-2" />
                <h4 className="text-xs font-bold text-zinc-200">ပုံမပေါ်နိုင်ပါ (Loading Failed)</h4>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Google Drive တွင် ဤပုံ သို့မဟုတ် Folder ကို <strong className="text-amber-300">"Anyone with the link (Viewer)"</strong> ဖြင့် မျှဝေထားရန် လိုအပ်ပါသည်။
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ပြန်လည်စမ်းသပ်ရန်</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Content Right/Bottom */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Category / Type badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {poster.type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                {poster.type === 'movie' ? 'Movie' : 'Series'}
              </span>

              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Calendar className="w-3 h-3 text-amber-400" />
                {poster.year}
              </span>

              {poster.country && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Globe className="w-3 h-3" />
                  {poster.country}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {poster.title}
            </h2>

            {/* Rating & Genre */}
            <div className="flex items-center gap-4 mt-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-base">{poster.rating.toFixed(1)}</span>
                <span className="text-xs text-zinc-400 font-normal">/ 10</span>
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                {poster.genre}
              </span>
            </div>

            {/* Overview description */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Overview / Synopsis
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {cleanDescription()}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-zinc-800">
            {onDelete ? (
              <button
                id="btn-delete-poster-detail"
                onClick={() => {
                  onDelete(poster);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/90 border border-rose-900/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Poster
              </button>
            ) : (
              <span className="text-xs text-zinc-500 font-medium">Movie Perfect Catalog</span>
            )}

            <button
              id="btn-close-modal-bottom"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
