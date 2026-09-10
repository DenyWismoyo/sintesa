// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Pola Singleton untuk mencegah inisialisasi ganda di Next.js (Hot Reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gs://sintesa';
const bucketUrl = storageBucket.startsWith('gs://') ? storageBucket : `gs://${storageBucket}`;

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app, bucketUrl);
// Menggunakan region 'asia-southeast2' (Jakarta) sesuai konfigurasi backend Cloud Functions
const functions = getFunctions(app, 'asia-southeast2');

export { app, auth, db, storage, functions };
