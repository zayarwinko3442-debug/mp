import React, { useState } from 'react';
import { ShieldCheck, Lock, LogIn, Key, X, Eye, EyeOff, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { User } from 'firebase/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  onGoogleLogin: () => void;
  isLoggingIn: boolean;
}

const DEFAULT_ADMIN_PIN = '1234';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  onGoogleLogin,
  isLoggingIn,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Change PIN mode
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('movie_perfect_admin_pin') || DEFAULT_ADMIN_PIN;
    if (pin.trim() === savedPin) {
      localStorage.setItem('movie_perfect_is_admin', 'true');
      setError(null);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('PIN နံပါတ် မှားယွင်းနေပါသည်။ စီမံခန့်ခွဲသူသာ ဝင်ရောက်နိုင်ပါသည်။');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('movie_perfect_admin_pin') || DEFAULT_ADMIN_PIN;
    if (currentPin.trim() !== savedPin) {
      setError('လက်ရှိ PIN နံပါတ် မှားယွင်းနေပါသည်');
      return;
    }
    if (newPin.trim().length < 4) {
      setError('PIN အသစ်သည် အနည်းဆုံး ၄ လုံး ရှိရပါမည်');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PIN အသစ်နှစ်ခု ကိုက်ညီမှု မရှိပါ');
      return;
    }

    localStorage.setItem('movie_perfect_admin_pin', newPin.trim());
    localStorage.setItem('movie_perfect_is_admin', 'true');
    setPinSuccessMsg('PIN အသစ် ပြောင်းလဲသတ်မှတ်ပြီးပါပြီ!');
    setError(null);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setPinSuccessMsg(null);
      setIsChangingPin(false);
      onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div
      id="admin-login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="admin-login-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-7 text-zinc-100 animate-scale-up"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/40 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {isChangingPin ? 'Admin PIN နံပါတ် ပြောင်းရန်' : 'စီမံခန့်ခွဲသူ ဝင်ရောက်ရန် (Admin Login)'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isChangingPin
                ? 'သင်တစ်ဦးတည်းသာ သိရှိနိုင်သော လျှို့ဝှက် PIN နံပါတ် အသစ် သတ်မှတ်ပါ'
                : 'ပုံတင်ခြင်းနှင့် ဖျက်ခြင်းများကို စီမံခန့်ခွဲသူ (Owner) သာ ပြုလုပ်နိုင်ပါသည်'}
            </p>
          </div>
        </div>

        {pinSuccessMsg ? (
          <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-300">{pinSuccessMsg}</p>
          </div>
        ) : !isChangingPin ? (
          <div className="space-y-4">
            {/* Method 1: Google Account (Owner) */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <p className="text-xs font-bold text-zinc-200 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                နည်းလမ်း ၁: Google Account (Owner Email) ဖြင့် ဝင်ရန်
              </p>
              <p className="text-[11px] text-zinc-400 mb-3">
                Owner Email (<strong className="text-zinc-200">movieperfect155@gmail.com</strong> သို့မဟုတ် <strong className="text-zinc-200">zayarwinko3442@gmail.com</strong>) ဖြင့် ချိတ်ဆက်ပါက Admin Mode အလိုအလျောက် ပွင့်ပါမည်။
              </p>

              <button
                id="btn-admin-google-login"
                type="button"
                onClick={() => {
                  onGoogleLogin();
                  onClose();
                }}
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-950/50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoggingIn ? 'Connecting to Google...' : 'Google Account ဖြင့် Admin ဝင်မည်'}</span>
              </button>
            </div>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-zinc-800" />
              <span className="px-3 text-[11px] text-zinc-500 font-semibold uppercase">သို့မဟုတ် (Or Secret PIN)</span>
              <div className="flex-1 border-t border-zinc-800" />
            </div>

            {/* Method 2: Admin Quick PIN */}
            <form onSubmit={handlePinSubmit} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  နည်းလမ်း ၂: Admin လျှို့ဝှက် PIN ဖြင့် ဝင်ရန်
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(true);
                    setError(null);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  PIN ပြောင်းမည်
                </button>
              </div>

              <div className="relative">
                <input
                  id="input-admin-pin"
                  type={showPin ? 'text' : 'password'}
                  placeholder="လျှို့ဝှက် PIN နံပါတ် ရိုက်ထည့်ပါ"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  maxLength={12}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <button
                id="btn-submit-admin-pin"
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 transition-colors"
              >
                <span>Admin Mode ဖွင့်မည် (Unlock)</span>
              </button>
            </form>
          </div>
        ) : (
          /* Change PIN Form */
          <form onSubmit={handleChangePinSubmit} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">လက်ရှိ PIN နံပါတ်:</label>
              <input
                type="password"
                placeholder="လက်ရှိ PIN နံပါတ် ရိုက်ထည့်ပါ"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">PIN အသစ် (အနည်းဆုံး ၄ လုံး):</label>
              <input
                type="password"
                placeholder="PIN အသစ် ရိုက်ထည့်ပါ"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">PIN အသစ် ထပ်မံရိုက်ထည့်ပါ:</label>
              <input
                type="password"
                placeholder="PIN အသစ် အတည်ပြုပါ"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setError(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                နောက်သို့
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-colors shadow-md"
              >
                PIN အသစ်သိမ်းမည်
              </button>
            </div>
          </form>
        )}

        {/* Info */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-500 text-center">
          💡 အခြားသူများ ဝင်ကြည့်သည့်အခါ Admin Mode ခလုတ်များ၊ ပုံတင်ခြင်း၊ ပုံဖျက်ခြင်းခလုတ်များ လုံးဝ ပေါ်မည် မဟုတ်ပါ။
        </div>
      </div>
    </div>
  );
};
