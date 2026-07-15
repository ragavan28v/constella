import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, getRedirectResult, signInWithRedirect, signInWithPopup, onAuthStateChanged, type Auth, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyChWZL6bOiNHR6lxAWF5sH-i8GQg0ACUh0',
  authDomain: 'constella-d48fe.firebaseapp.com',
  projectId: 'constella-d48fe',
  storageBucket: 'constella-d48fe.firebasestorage.app',
  messagingSenderId: '749077304227',
  appId: '1:749077304227:web:4c9e195abdaaf1cbaa4016'
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleAccessToken: string | null = null;
const DRIVE_ACCESS_TOKEN_KEY = 'constella_drive_access_token';

const loadStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Try sessionStorage but don't fail if blocked by Tracking Prevention
  try {
    const token = window.sessionStorage.getItem(DRIVE_ACCESS_TOKEN_KEY);
    if (token) {
      console.log('[Firebase] Token loaded from sessionStorage');
      return token;
    }
  } catch (e) {
    console.warn('[Firebase] sessionStorage blocked by browser, using in-memory token');
  }
  return null;
};

const persistAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  // Try sessionStorage but don't fail if blocked
  try {
    if (token) {
      window.sessionStorage.setItem(DRIVE_ACCESS_TOKEN_KEY, token);
      console.log('[Firebase] Token persisted to sessionStorage');
    } else {
      window.sessionStorage.removeItem(DRIVE_ACCESS_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('[Firebase] sessionStorage blocked, token kept in memory only');
  }
};

export const initializeCloudApp = async () => {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
  }

  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }

  const storedToken = loadStoredAccessToken();
  if (storedToken) {
    googleAccessToken = storedToken;
  }

  return {
    app: appInstance,
    auth: authInstance,
    message: 'Cloud environment initialized. Continue by signing in with Google to authenticate your workspace.'
  };
};

export const handleRedirectSignIn = async () => {
  const { auth } = await initializeCloudApp();
  
  console.log('[Firebase] handleRedirectSignIn called');
  console.log('[Firebase] window.location.href:', window.location.href);
  console.log('[Firebase] window.location.search:', window.location.search);
  console.log('[Firebase] window.location.hash:', window.location.hash);
  
  // Check if Google sent back an error
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  if (error) {
    console.error('[Firebase] Google OAuth returned error:', {
      error: error,
      error_description: params.get('error_description'),
      error_uri: params.get('error_uri')
    });
  }
  
  console.log('[Firebase] URL has auth code:', window.location.search.includes('code'));
  console.log('[Firebase] auth.currentUser before getRedirectResult:', auth.currentUser?.email || 'none');
  
  // Always call getRedirectResult() - Firebase clears it after first successful call
  // Multiple calls will just return null after the first one
  try {
    const result = await getRedirectResult(auth);
    
    console.log('[Firebase] getRedirectResult() completed');
    console.log('[Firebase] getRedirectResult() returned:', result ? 'YES (result object)' : 'NO (null)');
    console.log('[Firebase] auth.currentUser after getRedirectResult:', auth.currentUser?.email || 'none');
    
    if (result?.user) {
      console.log('[Firebase] Result contains user:', result.user.email);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log('[Firebase] Credential extracted:', credential ? 'YES' : 'NO');
      
      if (credential?.accessToken) {
        console.log('[Firebase] Access token found, storing in memory');
        googleAccessToken = credential.accessToken;
        persistAccessToken(credential.accessToken);
      } else {
        console.warn('[Firebase] Credential extracted but no accessToken present');
      }
      return result.user;
    }
    
    // If getRedirectResult didn't have a result, check if currentUser is set
    // (Firebase may have already set it internally)
    if (auth.currentUser) {
      console.log('[Firebase] No redirect result, but auth.currentUser is set:', auth.currentUser.email);
      return auth.currentUser;
    }

    console.log('[Firebase] No redirect result and no currentUser');
    return null;
  } catch (error) {
    console.error('[Firebase] getRedirectResult() threw error:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const { auth } = await initializeCloudApp();
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    console.log('[Firebase] Initiating popup sign-in...');
    const result = await signInWithPopup(auth, provider);
    console.log('[Firebase] Popup sign-in completed successfully');
    
    if (result?.user) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        console.log('[Firebase] Access token found from popup, storing');
        googleAccessToken = credential.accessToken;
        persistAccessToken(credential.accessToken);
      }
      return result.user;
    }
    return null;
  } catch (popupError: any) {
    console.error('[Firebase] signInWithPopup failed or was blocked:', popupError);
    throw popupError;
  }
};

export const getCurrentUser = () => {
  if (!authInstance) {
    return null;
  }

  return authInstance.currentUser;
};

export const getAuthInstance = () => authInstance;

export const getAuthenticatedUser = async () => {
  const { auth } = await initializeCloudApp();
  return auth.currentUser;
};

export const getGoogleAccessToken = async () => {
  await initializeCloudApp();
  return googleAccessToken;
};

export const signOutUser = async () => {
  const { auth } = await initializeCloudApp();
  if (auth.currentUser) {
    await auth.signOut();
  }
  googleAccessToken = null;
  persistAccessToken(null);
};

export const subscribeAuthState = async (listener: (user: User | null) => void) => {
  const { auth } = await initializeCloudApp();
  return onAuthStateChanged(auth, listener);
};

export type { User };
