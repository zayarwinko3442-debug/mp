import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ActiveTab, Poster } from './types';
import { INITIAL_POSTERS } from './data/initialPosters';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebase';
import { deleteDriveFile } from './services/driveService';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MovieView } from './components/MovieView';
import { SeriesView } from './components/SeriesView';
import { PosterDetailModal } from './components/PosterDetailModal';
import { UploadModal } from './components/UploadModal';
import { DrivePickerModal } from './components/DrivePickerModal';
import { PwaApkGuideModal } from './components/PwaApkGuideModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ManageFoldersModal } from './components/ManageFoldersModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { BrandLogo } from './components/BrandLogo';
import { Film, Tv, UploadCloud, Smartphone, CheckCircle, AlertCircle, Folder, Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'movie_perfect_posters_v1';
const OWNER_EMAIL = 'zayarwinko3442@gmail.com';
const ADMIN_STORAGE_KEY = 'movie_perfect_is_admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [posters, setPosters] = useState<Poster[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load posters from localStorage:', e);
    }
    return INITIAL_POSTERS;
  });

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin & Viewer permissions state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  });
  const [isVisitorPreview, setIsVisitorPreview] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Modals state
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isApkGuideOpen, setIsApkGuideOpen] = useState(false);

  // Delete modal state
  const [posterToDelete, setPosterToDelete] = useState<Poster | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManageFoldersOpen, setIsManageFoldersOpen] = useState(false);

  // Search state for Home view
  const [searchQuery, setSearchQuery] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Determine owner & admin status
  const isOwnerEmail = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const isAdmin = isOwnerEmail || isAdminUnlocked;
  // Controls are only visible if user is admin AND not previewing as visitor
  const showAdminControls = isAdmin && !isVisitorPreview;

  // Persist posters changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posters));
    } catch (e) {
      console.warn('Failed to save posters to localStorage', e);
    }
  }, [posters]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          setIsAdminUnlocked(true);
          localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        if (result.user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          setIsAdminUnlocked(true);
          localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
          showToast(`👑 မင်္ဂလာပါ Owner (${result.user.email})! စီမံခန့်ခွဲသူမုဒ် ဖွင့်ထားပါပြီ။`, 'success');
        } else {
          showToast(`Google Drive ချိတ်ဆက်ပြီးပါပြီ (${result.user.email})`, 'success');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showToast(error.message || 'Google Drive sign in failed.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAdminUnlocked(false);
    setIsVisitorPreview(false);
    if (user) {
      handleLogout();
    } else {
      showToast('Admin Mode မှ ထွက်လိုက်ပါပြီ (ဧည့်သည်မုဒ်သို့ ပြောင်းထားပါသည်)', 'info');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      showToast('Signed out of Google Drive.', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSavePoster = (newPoster: Poster) => {
    setPosters((prev) => [newPoster, ...prev]);
    showToast(`"${newPoster.title}" added to ${newPoster.type === 'movie' ? 'Movies' : 'Series'}!`);
  };

  // Batch join multiple posters from Drive folders
  const handleBatchJoinPosters = (newPosters: Poster[]) => {
    setPosters((prev) => {
      const existingDriveIds = new Set(prev.filter((p) => p.driveFileId).map((p) => p.driveFileId));
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = newPosters.filter(
        (p) => !existingIds.has(p.id) && (!p.driveFileId || !existingDriveIds.has(p.driveFileId))
      );
      return [...toAdd, ...prev];
    });
    showToast(
      `Google Drive မှ ပုံ ${newPosters.length} ပုံအား သက်ဆိုင်ရာ ခုနှစ်အလိုက် အောင်မြင်စွာ သွင်းယူပြီးပါပြီ!`,
      'success'
    );
  };

  // Clear all default sample demo posters with 1-click
  const handleClearSamplePosters = () => {
    setPosters((prev) => prev.filter((p) => p.isCustomUpload));
    showToast('မူလ Sample ပုံများအားလုံး ရှင်းထုတ်ပြီးပါပြီ။ သင်၏ Drive ပုံများသာ ကျန်ရှိပါမည်။', 'info');
  };

  // Restore default sample demo posters
  const handleRestoreSamplePosters = () => {
    setPosters((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const missingInitial = INITIAL_POSTERS.filter((p) => !existingIds.has(p.id));
      return [...prev, ...missingInitial];
    });
    showToast('မူလ Sample ပုံများ ပြန်လည်ထည့်သွင်းပြီးပါပြီ။', 'success');
  };

  // Delete all posters from a specific imported folder
  const handleDeleteByFolder = (folderName: string) => {
    setPosters((prev) => {
      const remaining = prev.filter((p) => {
        const pFolder = p.folderName || 'Drive Unsorted / Direct Uploads';
        return pFolder !== folderName;
      });
      return remaining;
    });
    showToast(`Folder "${folderName}" မှ ပုံများ အားလုံး ဖျက်ပြီးပါပြီ။`, 'info');
  };

  // Delete all posters from a specific year (e.g. 2026 or 2025)
  const handleDeleteByYear = (year: number) => {
    setPosters((prev) => prev.filter((p) => p.year !== year));
    showToast(`${year} ခုနှစ် ပုံများ အားလုံး ဖယ်ရှားပြီးပါပြီ။`, 'info');
  };

  // Delete all Drive-synced posters with 1-click
  const handleDeleteAllDrivePosters = () => {
    setPosters((prev) => prev.filter((p) => !p.driveFileId));
    showToast('Google Drive မှ သွင်းထားသော ပုံများ အားလုံး ရှင်းထုတ်ပြီးပါပြီ။', 'info');
  };

  // Request deletion with confirmation
  const handleRequestDelete = (poster: Poster) => {
    setPosterToDelete(poster);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (poster: Poster) => {
    setIsDeleting(true);
    try {
      // If synced to Google Drive and access token available, delete from Drive
      if (poster.driveFileId && accessToken) {
        try {
          await deleteDriveFile(poster.driveFileId, accessToken);
        } catch (driveErr) {
          console.warn('Could not delete from Google Drive directly:', driveErr);
        }
      }

      setPosters((prev) => prev.filter((p) => p.id !== poster.id));
      setIsDeleteModalOpen(false);
      setPosterToDelete(null);
      if (selectedPoster?.id === poster.id) {
        setSelectedPoster(null);
      }
      showToast(`Poster "${poster.title}" deleted.`);
    } catch (err: any) {
      showToast('Failed to delete poster.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const movieCount = posters.filter((p) => p.type === 'movie').length;
  const seriesCount = posters.filter((p) => p.type === 'series').length;
  const driveSyncedCount = posters.filter((p) => !!p.driveFileId).length;
  const sampleCount = posters.filter((p) => !p.isCustomUpload).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDrivePicker={() => setIsDrivePickerOpen(true)}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
        isAdmin={isAdmin}
        isVisitorPreview={isVisitorPreview}
        onToggleVisitorPreview={() => setIsVisitorPreview((prev) => !prev)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Visitor Preview Banner (Visible when Admin tests Visitor Mode) */}
      {isAdmin && isVisitorPreview && (
        <div className="bg-gradient-to-r from-amber-500/20 via-zinc-900 to-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <span className="font-bold flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            👁️ [ဧည့်သည်အမြင် စမ်းသပ်မုဒ်] သူငယ်ချင်းများ ကြည့်ရှုမည့်ပုံစံဖြစ်ပြီး Upload, Delete နှင့် Drive Join ခလုတ်များ အားလုံး ဝှက်ထားပါသည်
          </span>
          <button
            onClick={() => setIsVisitorPreview(false)}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Admin မုဒ်သို့ ပြန်သွားမည်</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Sub-Header Breadcrumb / Hierarchy Indicator & Quick Action */}
        <div className="mb-6 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <BrandLogo size="sm" />
            <span className="font-bold text-zinc-200">Mobile Perfect</span>
            <span>/</span>
            <span className="text-sky-400 font-semibold capitalize">
              {activeTab === 'home' ? 'Home (🎬 Movie & 📺 Series)' : activeTab}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-zinc-400 font-medium">
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <strong>{movieCount}</strong> Movies
            </span>
            <span className="flex items-center gap-1">
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              <strong>{seriesCount}</strong> Series
            </span>
            {driveSyncedCount > 0 && (
              <span className="flex items-center gap-1 text-sky-400">
                ☁️ <strong>{driveSyncedCount}</strong> Drive Synced
              </span>
            )}

            {/* ONLY ADMIN CAN MANAGE OR DELETE FOLDERS & SAMPLE DATA */}
            {showAdminControls && (
              <>
                {/* Button to manage / delete posters by folder or year */}
                <button
                  id="btn-open-manage-folders"
                  onClick={() => setIsManageFoldersOpen(true)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-rose-950/60 hover:border-rose-800 border border-zinc-700 text-zinc-300 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                  title="Drive မှ သွင်းထားသော Folder အလိုက် သို့မဟုတ် ခုနှစ်အလိုက် ပုံများ ပြန်ဖျက်ရန်"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>📁 Folder အလိုက် ပုံများ ပြန်ဖျက်ရန်</span>
                </button>

                {/* Quick action to Clear or Restore Sample demo posters */}
                {sampleCount > 0 ? (
                  <button
                    id="btn-clear-sample-posters"
                    onClick={handleClearSamplePosters}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-rose-950/60 hover:border-rose-800 border border-zinc-700 text-zinc-300 hover:text-rose-300 transition-colors"
                    title="မူလပါဝင်သော Sample ပုံများအားလုံး ရှင်းထုတ်ပြီး သင်၏ Drive ပုံများသာ ထားရှိရန်"
                  >
                    🗑️ Sample ပုံများရှင်းထုတ်ရန် ({sampleCount})
                  </button>
                ) : (
                  <button
                    id="btn-restore-sample-posters"
                    onClick={handleRestoreSamplePosters}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-950/60 hover:border-emerald-800 border border-zinc-700 text-zinc-300 hover:text-emerald-300 transition-colors"
                    title="မူလ Sample ပုံများ ပြန်လည်ထည့်သွင်းရန်"
                  >
                    🔄 Demo Sample ပုံများ ပြန်ယူရန်
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dynamic Views */}
        {activeTab === 'home' && (
          <HomeView
            posters={posters}
            onSelectPoster={(p) => setSelectedPoster(p)}
            onNavigateTab={setActiveTab}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDeletePoster={showAdminControls ? handleRequestDelete : undefined}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAdmin={showAdminControls}
          />
        )}

        {activeTab === 'movie' && (
          <MovieView
            posters={posters}
            onSelectPoster={(p) => setSelectedPoster(p)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDeletePoster={showAdminControls ? handleRequestDelete : undefined}
            isAdmin={showAdminControls}
          />
        )}

        {activeTab === 'series' && (
          <SeriesView
            posters={posters}
            onSelectPoster={(p) => setSelectedPoster(p)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDeletePoster={showAdminControls ? handleRequestDelete : undefined}
            isAdmin={showAdminControls}
          />
        )}
      </main>

      {/* Floating Action Button for Mobile Users (Admin only) */}
      {showAdminControls && (
        <div className="fixed bottom-5 right-5 z-30 sm:hidden flex flex-col gap-2">
          <button
            id="btn-mobile-upload-fab"
            onClick={() => setIsUploadOpen(true)}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 transition-transform active:scale-95"
            title="Upload poster"
          >
            <UploadCloud className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-zinc-950/80 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-200">Mobile Perfect</span>
              <span className="text-zinc-600">•</span>
              <span>Cinema & Series Poster Vault</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setIsApkGuideOpen(true)}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Web to APK Guide (Beginner)</span>
            </button>
            <span>•</span>
            <span>Google Drive API v3 Integrated</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-2xl border border-zinc-700 animate-fade-in">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Modals */}
      <PosterDetailModal
        poster={selectedPoster}
        onClose={() => setSelectedPoster(null)}
        onDelete={showAdminControls ? handleRequestDelete : undefined}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSavePoster={handleSavePoster}
        user={user}
        accessToken={accessToken}
        onConnectDrive={handleLogin}
      />

      <DrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onJoinPoster={handleSavePoster}
        onBatchJoinPosters={handleBatchJoinPosters}
        user={user}
        accessToken={accessToken}
        onConnectDrive={handleLogin}
      />

      <PwaApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />

      <DeleteConfirmModal
        poster={posterToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPosterToDelete(null);
        }}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <ManageFoldersModal
        isOpen={isManageFoldersOpen}
        onClose={() => setIsManageFoldersOpen(false)}
        posters={posters}
        onDeleteByFolder={handleDeleteByFolder}
        onDeleteByYear={handleDeleteByYear}
        onDeleteAllDrivePosters={handleDeleteAllDrivePosters}
      />

      {/* Admin Unlock Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminUnlocked(true);
          setIsVisitorPreview(false);
          showToast('👑 Admin Mode အောင်မြင်စွာ ဖွင့်လိုက်ပါပြီ (Upload/Delete ပြုလုပ်နိုင်ပါသည်)', 'success');
        }}
        user={user}
        onGoogleLogin={handleLogin}
        isLoggingIn={isLoggingIn}
      />
    </div>
  );
}
