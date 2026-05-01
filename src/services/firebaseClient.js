import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

function normalizeStorageBucket(bucket, projectId) {
  if (!bucket) {
    return projectId ? `${projectId}.appspot.com` : bucket;
  }

  if (bucket.endsWith('.firebasestorage.app')) {
    return `${bucket.replace(/\.firebasestorage\.app$/, '')}.appspot.com`;
  }

  return bucket;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: normalizeStorageBucket(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredFirebaseValues.every(Boolean);

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  console.warn(
    'Firebase is not configured. Add your NEXT_PUBLIC_FIREBASE_* environment variables.'
  );
}

const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const app = firebaseApp;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const database = firebaseApp ? getDatabase(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

export function assertFirebaseConfigured() {
  if (!app || !auth || !database || !storage) {
    throw new Error(
      'Firebase is not configured. Add your NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }
}
