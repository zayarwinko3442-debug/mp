import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Calendar,
  Globe,
  Film,
  Tv,
  Trash2,
  ImageOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Eye,
} from 'lucide-react';
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
  // Use high-resolution source for detail viewing when available
  const getInitialHighResSrc = (p: Poster) => {
    if (p.driveFileId) {
      return `https://drive.google.com/thumbnail?id=${p.driveFileId}&sz=w1600`;
    }
    return p.imageUrl;
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getInitialHighResSrc(poster));
  const [retryStep, setRetryStep] = useState<number>(0);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');

  // Reset image state whenever opened poster changes
  useEffect(() => {
    setImgSrc(getInitialHighResSrc(poster));
    setRetryStep(0);
    setHasFailedAll(false);
    setIsLoading(true);
    setIsFullscreen(false);
    setZoomLevel(1);
  }, [poster.id, poster.imageUrl, poster.driveFileId]);

  // Handle ESC key to exit fullscreen lightbox or close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          setZoomLevel(1);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  const handleImageError = () => {
    if (poster.driveFileId) {
      if (retryStep === 0) {
        setRetryStep(1);
        setImgSrc(`https://lh3.googleusercontent.com/d/${poster.driveFileId}`);
        return;
      }
      if (retryStep === 1) {
        setRetryStep(2);
        setImgSrc(`https://drive.google.com/thumbnail?id=${poster.driveFileId}&sz=w1000`);
        return;
      }
      if (retryStep === 2 && poster.thumbnailUrl && poster.thumbnailUrl !== imgSrc) {
        setRetryStep(3);
        setImgSrc(poster.thumbnailUrl);
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
    setImgSrc(`${getInitialHighResSrc(poster)}&t=${Date.now()}`);
  };

  // Clean description to avoid leaking internal Drive technical details
  const cleanDescription = () => {
    if (!poster.description) {
      return poster.type === 'movie' && poster.year
        ? `${poster.title} (${poster.year}) full resolution poster.`
        : `${poster.title} full resolution poster.`;
    }
    if (poster.description.includes('Google Drive') || poster.description.includes('Auto-imported')) {
      return poster.type === 'movie' && poster.year
        ? `${poster.title} (${poster.year}) - Cinema High-Definition Poster.`
        : `${poster.title} - High-Definition Series Poster.`;
    }
    return poster.description;
  };

  return (
    <>
      {/* Main Poster Detail Modal */}
      <div
        id="poster-detail-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div
          id="poster-detail-modal-card"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl lg:max-w-6xl max-h-[92vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
        >
          {/* Close Button Top Right */}
          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-zinc-300 hover:text-white border border-zinc-700/60 shadow-lg transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Poster Image Left/Top - Large & Crisp Display */}
          <div className="w-full md:w-1/2 lg:w-7/12 bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative border-b md:border-b-0 md:border-r border-zinc-800/80">
            {/* Control bar above image */}
            <div className="w-full max-w-[360px] sm:max-w-[460px] lg:max-w-[540px] flex items-center justify-between mb-2.5 px-1 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-zinc-300 font-semibold">Poster View</span>
              </span>

              <div className="flex items-center gap-2">
                {/* Fit Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'))}
                  className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
                  title="Toggle between showing whole photo or filling the frame"
                >
                  {fitMode === 'contain' ? 'ပုံအပြည့် (Fit)' : 'ဘောင်ဖြည့် (Cover)'}
                </button>

                {/* Enlarge / Fullscreen Button */}
                {!hasFailedAll && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullscreen(true);
                      setZoomLevel(1);
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-md transition-all active:scale-95"
                    title="Open Fullscreen Lightbox"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>အကြီးချဲ့မည်</span>
                  </button>
                )}
              </div>
            </div>

            {/* Poster Image Container */}
            <div
              onClick={() => {
                if (!hasFailedAll && !isLoading) {
                  setIsFullscreen(true);
                  setZoomLevel(1);
                }
              }}
              className="relative w-full max-w-[360px] sm:max-w-[460px] lg:max-w-[540px] aspect-[2/3] max-h-[55vh] sm:max-h-[65vh] md:max-h-[76vh] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/90 bg-zinc-900 flex items-center justify-center cursor-pointer group"
            >
              {!hasFailedAll ? (
                <>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/85 z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-zinc-400 font-medium">ဓာတ်ပုံ ဖွင့်နေပါသည်...</span>
                      </div>
                    </div>
                  )}

                  <img
                    src={imgSrc}
                    alt={poster.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full transition-all duration-300 ${
                      fitMode === 'contain' ? 'object-contain' : 'object-cover'
                    } ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={handleImageError}
                  />

                  {/* Hover Overlay Hint for Enlarge */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md text-white font-bold text-xs shadow-xl border border-white/20">
                      <Maximize2 className="w-4 h-4 text-rose-400" />
                      <span>မျက်နှာပြင်ပြည့် အကြီးချဲ့ကြည့်ရန် နှိပ်ပါ</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-400">
                  <ImageOff className="w-12 h-12 text-rose-500/80 mb-3" />
                  <h4 className="text-sm font-bold text-zinc-200">ပုံမပေါ်နိုင်ပါ (Loading Failed)</h4>
                  <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                    Google Drive တွင် ဤပုံ သို့မဟုတ် Folder ကို <strong className="text-amber-300">"Anyone with the link (Viewer)"</strong> ဖြင့် မျှဝေထားရန် လိုအပ်ပါသည်။
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry();
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-colors shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ပြန်လည်စမ်းသပ်ရန်</span>
                  </button>
                </div>
              )}
            </div>

            {/* Click to enlarge caption */}
            {!hasFailedAll && (
              <p className="text-[11px] text-zinc-500 mt-2.5 text-center flex items-center gap-1">
                <span>💡 ပုံကို နှိပ်ပြီး မျက်နှာပြင်ပြည့် အကြီးချဲ့ကြည့်ရှုနိုင်ပါသည်</span>
              </p>
            )}
          </div>

          {/* Details Content Right/Bottom */}
          <div className="w-full md:w-1/2 lg:w-5/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto max-h-[92vh]">
            <div className="space-y-5">
              {/* Category / Type badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {poster.type === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                  {poster.type === 'movie' ? 'Movie' : 'Series'}
                </span>

                {poster.year && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {poster.year}
                  </span>
                )}

                {poster.country && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Globe className="w-3.5 h-3.5" />
                    {poster.country}
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  {poster.title}
                </h2>
                {poster.originalFileName && (
                  <p className="text-xs text-zinc-500 mt-1 font-mono truncate" title={poster.originalFileName}>
                    File: {poster.originalFileName}
                  </p>
                )}
              </div>

              {/* Rating & Genre */}
              <div className="flex items-center gap-5 pb-5 border-b border-zinc-800">
                {typeof poster.rating === 'number' && poster.rating > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-lg">{poster.rating.toFixed(1)}</span>
                    <span className="text-xs text-amber-400/70 font-normal">/ 10</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-zinc-400 block">Genre / အမျိုးအစား</span>
                  <span className="text-sm text-zinc-200 font-semibold">{poster.genre}</span>
                </div>
              </div>

              {/* Overview description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Overview / Synopsis
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
                  {cleanDescription()}
                </p>
              </div>

              {/* Google Drive Link if present */}
              {(poster.driveWebViewLink || poster.driveFileId) && (
                <div className="pt-1">
                  <a
                    href={
                      poster.driveWebViewLink ||
                      `https://drive.google.com/file/d/${poster.driveFileId}/view?usp=sharing`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 font-medium underline underline-offset-4 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Drive တွင် မူရင်းဖိုင်ဖွင့်ရန် (Open in Drive)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-zinc-800">
              {onDelete ? (
                <button
                  id="btn-delete-poster-detail"
                  type="button"
                  onClick={() => {
                    onDelete(poster);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-900/50 transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ဖျက်မည် (Delete)</span>
                </button>
              ) : (
                <span className="text-xs text-zinc-500 font-medium">Movie Perfect Catalog</span>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {!hasFailedAll && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFullscreen(true);
                      setZoomLevel(1);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>အကြီးချဲ့ကြည့်ရှုမည်</span>
                  </button>
                )}

                <button
                  id="btn-close-modal-bottom"
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  ပိတ်မည် (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Dedicated Fullscreen Lightbox / Zoom Viewer for Maximum Size */}
      {isFullscreen && (
        <div
          id="poster-fullscreen-lightbox"
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col justify-between animate-fade-in"
          onClick={() => {
            setIsFullscreen(false);
            setZoomLevel(1);
          }}
        >
          {/* Top Floating Controls */}
          <div
            className="w-full flex items-center justify-between p-4 sm:p-6 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-md">
                {poster.title} ({poster.year})
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl backdrop-blur-md shadow-2xl">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Reset Zoom"
              >
                100%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {(poster.driveWebViewLink || poster.driveFileId) && (
                <a
                  href={
                    poster.driveWebViewLink ||
                    `https://drive.google.com/file/d/${poster.driveFileId}/view?usp=sharing`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-sky-400 hover:text-sky-300 hover:bg-zinc-800 transition-colors"
                  title="Open in Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  setZoomLevel(1);
                }}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors ml-1 shadow-md"
                title="Close Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Full viewport image */}
          <div
            className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-auto cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              // Click to toggle zoom between 1x and 1.75x
              e.stopPropagation();
              setZoomLevel((z) => (z > 1 ? 1 : 1.75));
            }}
          >
            <img
              src={imgSrc}
              alt={poster.title}
              referrerPolicy="no-referrer"
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[82vh] max-w-[92vw] w-auto h-auto object-contain rounded-xl shadow-2xl transition-transform duration-200 select-none"
            />
          </div>

          {/* Bottom Hint */}
          <div className="p-3 text-center text-xs text-zinc-400 z-20 pointer-events-none">
            <span>နှိပ်၍ Zoom အကြီး/အသေး ပြုလုပ်နိုင်ပါသည် (သို့မဟုတ် ESC နှိပ်၍ ပိတ်ပါ)</span>
          </div>
        </div>
      )}
    </>
  );
};

