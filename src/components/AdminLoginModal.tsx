import React, { useState } from 'react';
import { ShieldCheck, Lock, LogIn, Key, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('movie_perfect_admin_pin') || DEFAULT_ADMIN_PIN;
    if (pin.trim() === savedPin || pin.trim() === DEFAULT_ADMIN_PIN) {
      localStorage.setItem('movie_perfect_is_admin', 'true');
      setError(null);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('PIN နံပါတ် မှားယွင်းနေပါသည်။ (မူလ PIN: 1234)');
    }
  };

  return (
    <div
      id="admin-login-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/40">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">စီမံခန့်ခွဲသူ ဝင်ရောက်ရန် (Admin Login)</h3>
            <p className="text-xs text-zinc-400">
              ပုံတင်ခြင်း၊ ဖျက်ခြင်းနှင့် Drive ချိတ်ဆက်ခြင်းများကို စီမံခန့်ခွဲသူသာ ပြုလုပ်နိုင်ပါသည်
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Method 1: Google Account (Owner) */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <p className="text-xs font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              နည်းလမ်း ၁: Google Account (Owner Email) ဖြင့် ဝင်ရန်
            </p>
            <p className="text-[11px] text-zinc-400 mb-3">
              App ဖန်တီးထားသော Owner Email (zayarwinko3442@gmail.com) ဖြင့် ချိတ်ဆက်ပါက Admin Mode အလိုအလျောက် ပွင့်ပါမည်။
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
            <span className="px-3 text-[11px] text-zinc-500 font-semibold uppercase">သို့မဟုတ် (Or PIN)</span>
            <div className="flex-1 border-t border-zinc-800" />
          </div>

          {/* Method 2: Admin Quick PIN */}
          <form onSubmit={handlePinSubmit} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <p className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              နည်းလမ်း ၂: Admin PIN Code ဖြင့် အမြန်ဝင်ရန်
            </p>
            <p className="text-[11px] text-zinc-400">
              ဖုန်း သို့မဟုတ် မည်သည့် Browser တွင်မဆို အောက်ပါ PIN နံပါတ် ရိုက်ထည့်၍ Admin Mode ဖွင့်နိုင်ပါသည်။ (မူလ PIN: <code className="text-amber-400 font-bold">1234</code>)
            </p>

            <div className="relative">
              <input
                id="input-admin-pin"
                type={showPin ? 'text' : 'password'}
                placeholder="PIN နံပါတ် ရိုက်ထည့်ပါ (ဥပမာ 1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                maxLength={10}
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

        {/* Info */}
        <div className="mt-4 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-[11px] text-zinc-500 text-center">
          💡 အခြားသူများကြည့်ရှုချိန်တွင် ပုံများကို ခုနှစ်အလိုက် ကြည့်ရုံသာ မြင်တွေ့ရမည်ဖြစ်ပြီး Upload နှင့် Delete ခလုတ်များ အလိုအလျောက် ပျောက်ကွယ်နေမည် ဖြစ်ပါသည်။
        </div>
      </div>
    </div>
  );
};
