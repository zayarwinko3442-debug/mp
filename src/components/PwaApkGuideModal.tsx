import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, Layers, HelpCircle, Check, Copy } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface PwaApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaApkGuideModal: React.FC<PwaApkGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'apk' | 'architecture' | 'security'>('apk');

  if (!isOpen) return null;

  const currentUrl = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="pwa-apk-guide-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="pwa-apk-guide-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-zinc-100 my-8 overflow-hidden"
      >
        <button
          id="btn-close-pwa-guide"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <BrandLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Movie Perfect App</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Official APK Guide</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              Web မှ ဖုန်း App (APK) အဖြစ် ပြောင်းလဲအသုံးပြုနည်း
            </h2>
          </div>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Coding လုံးဝမသိသေးသော Beginner များအတွက် Full-Stack၊ Architecture နှင့် Security လမ်းညွှန်ချက်
        </p>

        {/* Tab switchers */}
        <div className="flex gap-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800 mb-6">
          <button
            id="tab-guide-apk"
            onClick={() => setActiveGuideTab('apk')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeGuideTab === 'apk'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            1. Web မှ APK ပြုလုပ်နည်း
          </button>
          <button
            id="tab-guide-arch"
            onClick={() => setActiveGuideTab('architecture')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeGuideTab === 'architecture'
                ? 'bg-rose-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            2. System Architecture
          </button>
          <button
            id="tab-guide-security"
            onClick={() => setActiveGuideTab('security')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeGuideTab === 'security'
                ? 'bg-blue-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            3. Security Engineering
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4 leading-relaxed">
          {activeGuideTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    A
                  </span>
                  အလွယ်ကူဆုံးနည်းလမ်း - ဖုန်းတွင် တိုက်ရိုက် Install ပြုလုပ်ခြင်း (PWA)
                </h3>
                <p className="text-zinc-300">
                  ဤ Web Application တွင် PWA (Progressive Web App) စနစ်ပါဝင်ပြီး ဖြစ်သောကြောင့် ဖုန်းတွင် APK ကဲ့သို့ ချက်ချင်း အသုံးပြုနိုင်ပါသည်:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 pl-2">
                  <li>ဖုန်း၏ Chrome Browser ဖြင့် ဤ App URL ကို ဖွင့်ပါ။</li>
                  <li>အပေါ်ညာဘက်ရှိ အစက် ၃ စက် (⋮) Menu ကို နှိပ်ပါ။</li>
                  <li><strong>"Add to Home screen"</strong> သို့မဟုတ် <strong>"Install app"</strong> ကို နှိပ်ပါ။</li>
                  <li>ဖုန်း Desktop ပေါ်တွင် <strong>Movie Perfect</strong> App Icon ရောက်ရှိသွားမည်ဖြစ်ပြီး နှိပ်လိုက်ပါက Browser Bar မပါဘဲ Native App ကဲ့သို့ Fullscreen ပွင့်လာပါမည်။</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
                    B
                  </span>
                  စစ်မှန်သော .APK ဖိုင် ရယူနည်း (PWABuilder - အခမဲ့ အသုံးပြုနိုင်သည်)
                </h3>
                <p className="text-zinc-300">
                  Android ဖုန်းများတွင် သူငယ်ချင်းများထံ Share ပေးနိုင်မည့် တကယ့် <strong>.apk</strong> ဖိုင်အဖြစ် ပြောင်းလဲရန်:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-zinc-400 pl-2">
                  <li>
                    အောက်ပါ သင်၏ Live App URL ကို Copy ကူးပါ:
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-mono text-[11px] truncate max-w-sm">
                        {currentUrl}
                      </code>
                      <button
                        onClick={handleCopy}
                        className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 font-semibold"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy URL'}
                      </button>
                    </div>
                  </li>
                  <li>
                    Browser တွင် <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-sky-400 underline font-bold">PWABuilder.com</a> သို့ သွားရောက်ပါ။
                  </li>
                  <li>Copy ယူထားသော URL ကို ထည့်ပြီး <strong>"Start"</strong> နှိပ်ပါ။</li>
                  <li><strong>"Package for Stores"</strong> တွင် <strong>Android</strong> ကို ရွေးချယ်ပြီး <strong>Generate APK</strong> ကို နှိပ်ကာ Download ရယူနိုင်ပါသည်။</li>
                </ol>
              </div>
            </div>
          )}

          {activeGuideTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2.5">
                <h3 className="text-sm font-bold text-rose-400">Movie Perfect ၏ စနစ်တည်ဆောက်ပုံ (System Architecture)</h3>
                <div className="font-mono text-[11px] bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-zinc-300 overflow-x-auto whitespace-pre">
{`Movie Perfect App
│
├── 🎨 Client UI (React 19 + Tailwind CSS)
│    ├── Home View (Featured Movies & Series)
│    ├── Movie Catalog (2021 - 2026 filterable)
│    └── Series Catalog (Korea, Thai, China, English, Bollywood & 2023-2026)
│
├── 🔑 Authentication Layer
│    └── Firebase Auth + Google Identity (OAuth 2.0 popup)
│
├── ☁️ Storage & Asset Integration
│    ├── Google Drive REST API v3
│    │    ├── Upload: Multipart/related upload to "Movie Perfect Posters" folder
│    │    └── Join: Read user's existing Drive images into movie categories
│    └── Local Cache: Browser LocalStorage (Fast instant loading)
│
└── 📱 App Distribution
     ├── Web Browser (Desktop / Tablet)
     └── PWA / TWA Android APK (Mobile Device)`}
                </div>
              </div>
            </div>
          )}

          {activeGuideTab === 'security' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <h3 className="text-sm font-bold text-blue-400">Security Engineering Best Practices</h3>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>OAuth 2.0 Scope Minimization:</strong> App အနေဖြင့် Drive တစ်ခုလုံးကို မလိုအပ်ဘဲ ထိန်းချုပ်ခွင့်မတောင်းဘဲ သီးသန့် Poster များ သိမ်းဆည်းရန်အတွက်သာ လိုအပ်သည့် `drive.file` နှင့် `drive.readonly` သီးသန့် Scope များကိုသာ အသုံးပြုထားပါသည်။
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>In-Memory Token Cache:</strong> Google Drive Access Token ကို Browser ၏ LocalStorage ထဲတွင် မသိမ်းဆည်းဘဲ Memory ထဲတွင်သာ လုံခြုံစွာ ခေတ္တထိန်းသိမ်းထားသောကြောင့် XSS Attack များမှ ကာကွယ်ပေးပါသည်။
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Safe Deletions:</strong> Google Drive ထဲမှ Poster ဓာတ်ပုံများကို ဖျက်ပစ်ပါက အသုံးပြုသူထံမှ Explicit Confirmation (အတည်ပြုချက်) ရယူပြီးမှသာ လုပ်ဆောင်ပေးပါသည်။
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
