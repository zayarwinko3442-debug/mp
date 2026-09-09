import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Poster } from '../types';

interface DeleteConfirmModalProps {
  poster: Poster | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (poster: Poster) => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  poster,
  isOpen,
  onClose,
  onConfirmDelete,
  isDeleting,
}) => {
  if (!isOpen || !poster) return null;

  return (
    <div
      id="delete-confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="delete-confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>Confirm Deletion</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 mb-2">
          Are you sure you want to delete the poster for:
        </p>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 mb-4">
          <img
            src={poster.imageUrl}
            alt={poster.title}
            referrerPolicy="no-referrer"
            className="w-12 h-16 object-cover rounded-md"
          />
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{poster.title}</h4>
            <p className="text-[11px] text-zinc-400">
              {poster.type === 'movie' ? '🎬 Movie' : '📺 Series'} ({poster.year})
              {poster.country ? ` • ${poster.country}` : ''}
            </p>
            {poster.driveFileId && (
              <span className="text-[10px] text-sky-400 block mt-0.5">
                Note: This will also remove the photo reference from your Google Drive files.
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 mb-6">
          This action cannot be undone. Please confirm to proceed.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-delete-action"
            onClick={() => onConfirmDelete(poster)}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Poster'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
