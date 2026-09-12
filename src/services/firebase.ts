import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.setCustomParameters({ prompt: 'select_account' });

const TOKEN_KEY = 'mp_drive_access_token';
let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

// Clear token on expiry
export const clearCachedAccessToken = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Keep user logged in even if token needs refresh
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      } catch {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive access token could not be obtained. ကျေးဇူးပြု၍ Drive permissions များကို ခွင့်ပြုပေးပါ။');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem(TOKEN_KEY, cachedAccessToken);
      sessionStorage.setItem(TOKEN_KEY, cachedAccessToken);
    } catch {}

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    const code = error?.code || '';
    if (code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'Netlify';
      throw new Error(
        `Firebase Unauthorized Domain Error: လက်ရှိ domain "${currentHost}" ကို Firebase Console -> Authentication -> Settings -> Authorized domains တွင် ထည့်သွင်းပေးရန် လိုအပ်ပါသည်ခင်ဗျာ။`
      );
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Browser မှ Pop-up ကို ပိတ်ထားသဖြင့် Google Login ဖွင့်၍မရပါ။ ကျေးဇူးပြု၍ Pop-up ခွင့်ပြုပေးပါ။');
    }
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google Sign-In Pop-up ကို ပိတ်လိုက်သဖြင့် မအောင်မြင်ခဲ့ပါ။ ပြန်လည်ကြိုးစားပေးပါ။');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  clearCachedAccessToken();
};
