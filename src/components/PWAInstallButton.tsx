import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as app, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Edge / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
        title="ဖုန်းထဲတွင် App အဖြစ် တိုက်ရိုက် ထည့်သွင်းရန်"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed space-y-2">
                <span>Safari Browser ဖြင့် ဖွင့်ထားပါက-</span><br />
                <strong>၁။</strong> အောက်ဘက်ရှိ <strong>Share (မျှဝေရန်)</strong> ခလုတ်ကို နှိပ်ပါ။<br />
                <strong>၂။</strong> အောက်သို့ အနည်းငယ်ဆွဲပြီး <strong>"Add to Home Screen"</strong> ကို ရွေးချယ်ပေးပါက ဖုန်းထဲတွင် App အဖြစ် အသုံးပြုနိုင်ပါပြီ။
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
              >
                နားလည်ပါပြီ
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
