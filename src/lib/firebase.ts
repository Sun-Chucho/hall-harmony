import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA08M8_yfVofSgG4xnNghAbObQaxLeYKVQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'kuringehallsdatabase.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'kuringehallsdatabase',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'kuringehallsdatabase.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '449466711430',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:449466711430:web:947979d6e5b2edeaa0c007',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-8T01M0MG32',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

if (typeof window !== 'undefined') {
  void setPersistence(auth, browserLocalPersistence).catch(() => {
    // Keep default persistence fallback if explicit local persistence fails.
  });

  void enableIndexedDbPersistence(db).catch(() => {
    // Ignore when another tab already has persistence lock or when unsupported.
  });

  void isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(firebaseApp);
      }
    })
    .catch(() => {
      // Ignore analytics initialization errors.
    });
}
