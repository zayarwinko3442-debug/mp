import React, { useState } from 'react';
import { Folder, Trash2, Calendar, AlertTriangle, X, Check, Film, Tv, Layers } from 'lucide-react';
import { Poster } from '../types';
import { comparePostersNumerically } from '../utils/sortUtils';

interface ManageFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  posters: Poster[];
  onDeleteByFolder: (folderName: string) => void;
  onDeleteByYear: (year: number) => void;
  onDeleteAllDrivePosters: () => void;
}

export const ManageFoldersModal: React.FC<ManageFoldersModalProps> = ({
  isOpen,
  onClose,
  posters,
  onDeleteByFolder,
  onDeleteByYear,
  onDeleteAllDrivePosters,
}) => {
  const [activeTab, setActiveTab] = useState<'folders' | 'years'>('folders');
  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'folder' | 'year' | 'all-drive';
    key: string | number;
    count: number;
    label: string;
  } | null>(null);

  if (!isOpen) return null;

  // Filter only Drive-imported or custom posters with folderName
  const drivePosters = posters.filter((p) => !!p.driveFileId || p.isCustomUpload);

  // Group posters by folderName
  const folderMap = new Map<string, Poster[]>();
  drivePosters.forEach((p) => {
    const folder = p.folderName || 'Drive Unsorted / Direct Uploads';
    const list = folderMap.get(folder) || [];
    list.push(p);
    folderMap.set(folder, list);
  });

  const folderEntries = Array.from(folderMap.entries()).sort((a, b) => b[1].length - a[1].length);

  // Group posters by year
  const yearMap = new Map<number, Poster[]>();
  posters.forEach((p) => {
    const list = yearMap.get(p.year) || [];
    list.push(p);
    yearMap.set(p.year, list);
  });
  const yearEntries = Array.from(yearMap.entries()).sort((a, b) => b[0] - a[0]);

  const handleExecuteDelete = () => {
    if (!confirmTarget) return;

    if (confirmTarget.type === 'folder') {
      onDeleteByFolder(confirmTarget.key as string);
    } else if (confirmTarget.type === 'year') {
      onDeleteByYear(confirmTarget.key as number);
    } else if (confirmTarget.type === 'all-drive') {
      onDeleteAllDrivePosters();
    }

    setConfirmTarget(null);
  };

  return (
    <div
      id="manage-folders-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="manage-folders-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-7 text-zinc-100 my-8 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Folder အလိုက် / ခုနှစ်အလိုက် ပုံများ ပြန်ဖျက်ရန်
              </h2>
              <p className="text-xs text-zinc-400">
                Drive မှ သွင်းယူထားသော ပုံများ အဆင်မပြေပါက Folder သို့မဟုတ် ခုနှစ်အလိုက် ချက်ချင်း ပြန်လည်ရှင်းထုတ်နိုင်ပါသည်။
              </p>
            </div>
          </div>
          <button
            id="btn-close-manage-folders"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between gap-3 pt-3 pb-2 shrink-0">
          <div className="flex gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('folders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'folders'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Folder အလိုက် ဖျက်ရန် ({folderEntries.length} Folders)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('years')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === 'years'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ခုနှစ်အလိုက် ဖျက်ရန် (Year Clean)</span>
            </button>
          </div>

          {drivePosters.length > 0 && (
            <button
              onClick={() =>
                setConfirmTarget({
                  type: 'all-drive',
                  key: 'all',
                  count: drivePosters.length,
                  label: 'Google Drive မှ သွင်းထားသော ပုံများ အားလုံး',
                })
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/80 border border-rose-800/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Drive ပုံများ အားလုံးရှင်းမည် ({drivePosters.length})</span>
              <span className="sm:hidden">Drive အားလုံးရှင်း ({drivePosters.length})</span>
            </button>
          )}
        </div>

        {/* Confirmation Banner */}
        {confirmTarget && (
          <div className="my-3 p-4 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shrink-0">
            <div className="flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-white">
                  "{confirmTarget.label}" မှ ပုံပေါင်း {confirmTarget.count} ပုံကို App မှ ဖယ်ရှားမည် သေချာပါသလား?
                </p>
                <p className="text-zinc-300 text-[11px] mt-0.5">
                  မှတ်ချက်: ဤလုပ်ဆောင်ချက်သည် App ထဲမှသာ ဖယ်ရှားမည်ဖြစ်ပြီး သင်၏ Google Drive ထဲရှိ မူရင်းဖိုင်များကို မထိခိုက်ပါ။
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                မလုပ်တော့ပါ (Cancel)
              </button>
              <button
                id="btn-confirm-folder-delete"
                onClick={handleExecuteDelete}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>သေချာပါသည် ဖျက်မည်</span>
              </button>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pt-2">
          {activeTab === 'folders' && (
            <>
              {folderEntries.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 bg-zinc-950/40 rounded-xl border border-zinc-800">
                  <Folder className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold text-white">Drive မှ Folder လိုက် သွင်းထားသော ပုံများ မရှိသေးပါ</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    "☁️ Drive Join" မှတစ်ဆင့် Folder လိုက် သွင်းထားသော ပုံများသည် ဤနေရာတွင် စာရင်းပေါ်လာမည် ဖြစ်ပါသည်။
                  </p>
                </div>
              ) : (
                folderEntries.map(([folderName, items]) => {
                  const sortedItems = [...items].sort(comparePostersNumerically);
                  const movies = sortedItems.filter((p) => p.type === 'movie').length;
                  const series = sortedItems.filter((p) => p.type === 'series').length;
                  const sampleYears = Array.from(new Set(sortedItems.map((p) => p.year))).sort().join(', ');

                  return (
                    <div
                      key={folderName}
                      className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 space-y-3 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{folderName}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                                {sortedItems.length} photos
                              </span>
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                              {movies > 0 && (
                                <span className="flex items-center gap-1">
                                  <Film className="w-3 h-3 text-amber-400" /> {movies} Movies
                                </span>
                              )}
                              {series > 0 && (
                                <span className="flex items-center gap-1">
                                  <Tv className="w-3 h-3 text-emerald-400" /> {series} Series
                                </span>
                              )}
                              <span className="text-[11px] text-zinc-500">
                                Years: {sampleYears}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setConfirmTarget({
                              type: 'folder',
                              key: folderName,
                              count: sortedItems.length,
                              label: `Folder "${folderName}"`,
                            })
                          }
                          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/80 hover:border-rose-700 border border-zinc-700 text-zinc-200 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>ပြန်ဖျက်မည်</span>
                        </button>
                      </div>

                      {/* Numerical order preview thumbnails */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-zinc-850">
                        <span className="text-[10px] font-semibold text-zinc-500 shrink-0 uppercase tracking-wider">
                          အစဉ်လိုက်:
                        </span>
                        {sortedItems.slice(0, 10).map((item, idx) => (
                          <div
                            key={item.id}
                            title={`${idx + 1}. ${item.title}`}
                            className="relative w-10 h-14 rounded-md bg-zinc-800 shrink-0 overflow-hidden border border-zinc-750 group"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[9px] text-white font-mono text-center font-bold py-0.5">
                              #{idx + 1}
                            </div>
                          </div>
                        ))}
                        {sortedItems.length > 10 && (
                          <span className="text-[10px] text-zinc-500 shrink-0 px-2">
                            +{sortedItems.length - 10} ပိုရှိသေးသည်
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'years' && (
            <div className="space-y-3">
              {yearEntries.map(([year, items]) => {
                const driveCount = items.filter((p) => !!p.driveFileId).length;
                const movies = items.filter((p) => p.type === 'movie').length;
                const series = items.filter((p) => p.type === 'series').length;

                return (
                  <div
                    key={year}
                    className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{year} ခုနှစ် ပုံများ (Release Year {year})</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            {items.length} total posters
                          </span>
                          {driveCount > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-300">
                              ☁️ {driveCount} from Drive
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Film className="w-3 h-3 text-amber-400" /> {movies} Movies
                          </span>
                          <span className="flex items-center gap-1">
                            <Tv className="w-3 h-3 text-emerald-400" /> {series} Series
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setConfirmTarget({
                          type: 'year',
                          key: year,
                          count: items.length,
                          label: `${year} ခုနှစ် ပုံများ`,
                        })
                      }
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-rose-950/80 hover:border-rose-700 border border-zinc-700 text-zinc-200 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{year} ပုံများ အားလုံးဖျက်မည် ({items.length})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-4 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>💡 Folder အလိုက် သို့မဟုတ် ခုနှစ်အလိုက် ပုံများကို အလွယ်တကူ စီမံဖယ်ရှားနိုင်ပါသည်</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
          >
            ပိတ်မည် (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
