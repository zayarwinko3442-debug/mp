import React from 'react';
import { Film, Tv, Home as HomeIcon, UploadCloud, FolderSync, Smartphone, LogIn, LogOut, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { ActiveTab } from '../types';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenDrivePicker: () => void;
  onOpenApkGuide: () => void;
  isAdmin: boolean;
  isVisitorPreview: boolean;
  onToggleVisitorPreview: () => void;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  onOpenUpload,
  onOpenDrivePicker,
  onOpenApkGuide,
  isAdmin,
  isVisitorPreview,
  onToggleVisitorPreview,
  onOpenAdminLogin,
  onAdminLogout,
}) => {
  const showAdminControls = isAdmin && !isVisitorPreview;

  // Secret 5-tap on logo to open admin login for the owner
  const [logoClickCount, setLogoClickCount] = React.useState(0);
  const logoTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleBrandLogoClick = () => {
    setActiveTab('home');
    if (isAdmin && !isVisitorPreview) return; // Already in full admin mode

    setLogoClickCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        onOpenAdminLogin();
        return 0;
      }
      return next;
    });

    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => {
      setLogoClickCount(0);
    }, 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name (With secret 5-tap admin trigger for owner) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              id="brand-home-button"
              onClick={handleBrandLogoClick}
              className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group shrink-0"
              title="Home"
            >
              <BrandLogo size="md" />
              <div className="flex flex-col">
                <span className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                  Movie Perfect
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    CINEMA
                  </span>
                </span>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium hidden xs:block sm:block">
                  Movie & Series Poster Vault
                </p>
              </div>
            </button>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <HomeIcon className="w-4 h-4 text-rose-400" />
              <span>Home</span>
            </button>

            <button
              id="nav-tab-movie"
              onClick={() => setActiveTab('movie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'movie'
                  ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>🎬 Movie</span>
            </button>

            <button
              id="nav-tab-series"
              onClick={() => setActiveTab('series')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'series'
                  ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>📺 Series</span>
            </button>
          </nav>

          {/* Action Tools & Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* If Admin is actively previewing what visitors see */}
            {isAdmin && isVisitorPreview && (
              <button
                id="btn-exit-visitor-preview"
                onClick={onToggleVisitorPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow transition-colors"
                title="ဧည့်သည်များမြင်ရမည့် ပုံစံမှ စီမံခန့်ခွဲသူမုဒ်သို့ ပြန်သွားမည်"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Mode သို့ ပြန်သွားမည်</span>
                <span className="sm:hidden">Admin ပြန်ဖွင့်</span>
              </button>
            )}

            {/* ONLY ADMIN CAN SEE UPLOAD & DRIVE JOIN CONTROLS */}
            {showAdminControls && (
              <>
                {/* Upload Button */}
                <button
                  id="btn-upload-poster"
                  onClick={onOpenUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50 transition-colors"
                  title="Upload new poster directly"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span className="hidden md:inline">Upload</span>
                </button>

                {/* Join from Google Drive */}
                <button
                  id="btn-join-drive-photos"
                  onClick={onOpenDrivePicker}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  title="Join photos from Google Drive"
                >
                  <FolderSync className="w-4 h-4 text-sky-400" />
                  <span className="hidden lg:inline">Drive Join</span>
                </button>

                {/* Toggle Visitor View Preview */}
                <button
                  id="btn-toggle-visitor-preview"
                  onClick={onToggleVisitorPreview}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors"
                  title="သူငယ်ချင်းများ ကြည့်ရှုမည့် ဧည့်သည်ပုံစံဖြင့် စမ်းသပ်ကြည့်ရှုရန်"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>ဧည့်သည်အမြင် စမ်းကြည့်ရန်</span>
                </button>
              </>
            )}

            {/* In-App Direct Install Button for Android/Chrome/Edge/iOS */}
            <PWAInstallButton />

            {/* Web to APK Guide (Available for all) */}
            <button
              id="btn-pwa-guide"
              onClick={onOpenApkGuide}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors"
              title="Web to APK Guide"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Web / APK</span>
            </button>

            {/* Admin / Owner status & Login */}
            {showAdminControls && (
              <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    👑 Admin Mode
                  </span>
                  <span className="text-[10px] text-zinc-400 max-w-[110px] truncate">
                    {user?.email || 'Owner'}
                  </span>
                </div>
                <button
                  id="btn-admin-logout"
                  onClick={onAdminLogout}
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors"
                  title="Admin Mode ပိတ်မည် (Exit Admin Mode)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
