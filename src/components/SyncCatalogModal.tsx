import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  X,
  AlertCircle,
  FileJson,
  CheckCircle2,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';
import { Poster } from '../types';

interface SyncCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  posters: Poster[];
  onImportPosters: (imported: Poster[], replaceAll?: boolean) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const SyncCatalogModal: React.FC<SyncCatalogModalProps> = ({
  isOpen,
  onClose,
  posters,
  onImportPosters,
  showToast,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter custom uploaded or Drive synced posters
  const customPosters = posters.filter((p) => p.isCustomUpload || Boolean(p.driveFileId));
  const totalCount = posters.length;

  // Prepare export payload
  const exportData = {
    version: '1.0',
    app: 'Movie Perfect',
    exportedAt: new Date().toISOString(),
    totalPosters: posters.length,
    posters: posters,
  };
  const exportJsonString = JSON.stringify(exportData, null, 2);

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(exportJsonString);
    setCopied(true);
    showToast('Sync Code ကို ကူးယူပြီးပါပြီ! တက်ပလက်သို့ သွားရောက် Paste ပြုလုပ်နိုင်ပါပြီ။', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Download JSON file
  const handleDownload = () => {
    const blob = new Blob([exportJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movie-perfect-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Catalog Backup ဖိုင် (.json) ကို ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!', 'success');
  };

  // Handle File upload on tablet
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportInput(content);
        executeImport(content);
      }
    };
    reader.readAsText(file);
  };

  // Execute Import
  const executeImport = (rawContent?: string) => {
    const content = rawContent || importInput.trim();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!content) {
      setErrorMsg('ကျေးဇူးပြု၍ ကူးယူထားသော Sync Code (သို့မဟုတ် Backup ဖိုင်) ထည့်သွင်းပေးပါခင်ဗျာ။');
      return;
    }

    try {
      const parsed = JSON.parse(content);
      let incomingPosters: Poster[] = [];

      if (Array.isArray(parsed)) {
        incomingPosters = parsed;
      } else if (parsed && Array.isArray(parsed.posters)) {
        incomingPosters = parsed.posters;
      } else {
        throw new Error('Invalid catalog format');
      }

      // Basic validation
      const validPosters = incomingPosters.filter(
        (p) => p && typeof p.id === 'string' && typeof p.title === 'string' && typeof p.imageUrl === 'string'
      );

      if (validPosters.length === 0) {
        setErrorMsg('ထည့်သွင်းထားသော အချက်အလက်ထဲတွင် မှန်ကန်သော ဇာတ်ကားပုံများ မပါရှိပါ။');
        return;
      }

      onImportPosters(validPosters, replaceMode);
      setSuccessMsg(`ဇာတ်ကားပုံပေါင်း ${validPosters.length} ခုကို တက်ပလက်ထဲသို့ အောင်မြင်စွာ ကူးပြောင်းထည့်သွင်းပြီးပါပြီ!`);
      showToast(`${validPosters.length} posters synced successfully!`, 'success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('Import error:', e);
      setErrorMsg('ထည့်သွင်းထားသော စာသား format မမှန်ကန်ပါ။ Copy ကူးထားသော Code အပြည့်အစုံ ဖြစ်စေရန် သေချာစစ်ဆေးပေးပါ။');
    }
  };

  return (
    <div
      id="sync-catalog-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="sync-catalog-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-zinc-100 my-8 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Cross-Device Sync (ဖုန်း / တက်ပလက် ပုံများ ကူးယူရန်)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                ဖုန်းတွင် တင်ထားသော ဇာတ်ကားပုံများကို တက်ပလက် သို့မဟုတ် တခြားဖုန်းသို့ ချက်ချင်း ကူးယူခြင်း
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Why this happens info box */}
        <div className="mt-3 p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200 leading-relaxed flex items-start gap-2.5 shrink-0">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <b>အဘယ်ကြောင့် တခြား တက်ပလက်တွင် ချက်ချင်း မပေါ်သနည်း -</b>
            <p className="text-zinc-300 mt-0.5">
              လုံခြုံရေးနှင့် မြန်ဆန်စေရန်အတွက် မိမိတင်ထားသော ပုံများကို လက်ရှိသုံးနေသော ဖုန်း၏ Browser Memory တွင်သာ သိမ်းဆည်းထားခြင်း ဖြစ်ပါသည်။ တက်ပလက်တွင် ပေါ်စေရန် အောက်ပါအတိုင်း <b>၁ ချက်နှိပ် ကူးယူ (Sync)</b> နိုင်ပါသည်ခင်ဗျာ။
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-3 pt-1 border-b border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setTab('export')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-colors ${
              tab === 'export'
                ? 'bg-zinc-800 text-white border-t-2 border-sky-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>၁။ ဖုန်းမှ ထုတ်ယူရန် (Export from Phone)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-colors ${
              tab === 'import'
                ? 'bg-zinc-800 text-white border-t-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5 text-emerald-400" />
            <span>၂။ တက်ပလက်သို့ သွင်းရန် (Import to Tablet)</span>
          </button>
        </div>

        {/* Tab 1: Export from Phone */}
        {tab === 'export' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">လက်ရှိ စုစုပေါင်း ဇာတ်ကားပုံများ:</span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-sky-950/80 border border-sky-800 text-sky-300 font-bold">
                  {totalCount} Posters ({customPosters.length} Custom / Drive)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                အောက်ပါ ခလုတ်များထဲမှ ကြိုက်နှစ်သက်ရာတစ်ခုကို နှိပ်၍ သင့်တက်ပလက် သို့မဟုတ် တခြားဖုန်းသို့ ပေးပို့နိုင်ပါသည်-
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1-Click Copy Sync Code */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Code ကူးယူပြီးပါပြီ!' : 'Sync Code ကူးယူရန် (Copy Code)'}</span>
                </button>

                {/* Download Backup File */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Backup ဖိုင် ဒေါင်းလုဒ်ဆွဲရန် (.json)</span>
                </button>
              </div>
            </div>

            {/* Step-by-step Guide */}
            <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-300 space-y-2.5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <p className="font-bold flex items-center gap-1.5 text-xs text-amber-300 mb-1">
                  <span>🌐 အခြားသူများ အားလုံး (Visitors) ထံတွင် အမြဲတမ်း ပေါ်စေလိုပါက:</span>
                </p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  အပေါ်ရှိ <b>"Sync Code ကူးယူရန်"</b> ခလုတ်ကို နှိပ်ပြီး ရရှိလာသော စာသား Code များကို <b>AI Studio Chat ထဲသို့ Paste ချ၍ ပို့ပေးလိုက်ပါခင်ဗျာ</b>။ Website ၏ မူလ Database/Catalog ထဲသို့ တိုက်ရိုက် ထည့်သွင်းပေးလိုက်ပါမည်။ ထိုအခါ Netlify ပေါ်တွင် အခြားသူ မည်သူမဆို ဝင်ကြည့်သည်နှင့် သင်တင်ထားသော ပုံများ အားလုံး အလိုအလျောက် ချက်ချင်း အပြည့်အစုံ ပေါ်နေပါမည်။
                </p>
              </div>

              <span className="font-bold text-sky-400 block pt-1">📝 တက်ပလက်သို့ တိုက်ရိုက် ကူးပြောင်းနည်း:</span>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                <li>အပေါ်မှ <b>"Sync Code ကူးယူရန်"</b> ခလုတ်ကို နှိပ်ပါ။</li>
                <li>ကူးယူရရှိသော စာသားများကို Telegram သို့မဟုတ် Viber မှတစ်ဆင့် သင်၏ တက်ပလက်သို့ ပို့လိုက်ပါ။</li>
                <li>တက်ပလက်ပေါ်ရှိ Movie Perfect တွင် <b>"တက်ပလက်သို့ သွင်းရန် (Import)"</b> သို့သွား၍ Paste လုပ်ကာ <b>"Sync Now"</b> နှိပ်လိုက်ပါ။</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Import into Tablet */}
        {tab === 'import' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    ဖုန်းမှ ကူးယူလာသော Sync Code ကို ဤနေရာတွင် Paste လုပ်ပါ:
                  </label>
                  <label className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1 font-semibold">
                    <FileJson className="w-3.5 h-3.5" />
                    <span>ဖိုင်ရွေးချယ်မည် (.json)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={6}
                  placeholder="ဖုန်းမှ Copy ကူးလာသော Sync Code စာသားများကို ဤနေရာတွင် Paste ချပေးပါ..."
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Mode switch: Merge vs Replace */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="replace-mode-chk"
                  checked={replaceMode}
                  onChange={(e) => setReplaceMode(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="replace-mode-chk" className="text-xs text-zinc-300 cursor-pointer">
                  ရှိပြီးသားကားများနှင့် မရောဘဲ <b>ဖုန်းထဲကအတိုင်း အတိအကျ အစားထိုးမည်</b> (Replace completely)
                </label>
              </div>

              <button
                type="button"
                onClick={() => executeImport()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>တက်ပလက်ထဲသို့ အချက်အလက်များ ထည့်သွင်းမည် (Sync Now)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
