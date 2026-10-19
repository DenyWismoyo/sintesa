// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Redam log verbose / unhandled internal stream reconnect dari Firebase SDK di Node.js / dev server
setLogLevel('error');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyANnKv_e3rr1n03t3RVNrWkJ3yt6zUE5s4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "katalog-solo-technopark.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "katalog-solo-technopark",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "katalog-solo-technopark.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "154366018751",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:154366018751:web:01be834a899e07bd87f20a",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ESPXTW90XV",
};

// Pola Singleton untuk mencegah inisialisasi ganda di Next.js (Hot Reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'katalog-solo-technopark.firebasestorage.app';
const bucketUrl = storageBucket.startsWith('gs://') ? storageBucket : `gs://${storageBucket}`;

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app, bucketUrl);
// Menggunakan region 'asia-southeast2' (Jakarta) sesuai konfigurasi backend Cloud Functions
const functions = getFunctions(app, 'asia-southeast2');

// --- ISOLASI FIREBASE AUTH KHUSUS PRESENSI PEGAWAI (IndexedDB / LocalStorage Terpisah) ---
const presensiApp = !getApps().some(a => a.name === 'presensi')
  ? initializeApp(firebaseConfig, 'presensi')
  : getApp('presensi');

const presensiAuth = getAuth(presensiApp);

// --- ISOLASI DATABASE & STORAGE PRESENSI PEGAWAI SOLO TECHNOPARK ---
const presensiDatabaseId = process.env.NEXT_PUBLIC_PRESENSI_DATABASE_ID || 'presensi-pegawai';
const presensiBucket = process.env.NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET || 'presensi-solo-technopark';
const presensiBucketUrl = presensiBucket.startsWith('gs://') ? presensiBucket : `gs://${presensiBucket}`;

// Database Firestore terpisah: 'presensi-pegawai'
const presensiDb = getFirestore(app, presensiDatabaseId);

// Cloud Storage bucket terpisah: 'gs://presensi-solo-technopark'
// PENTING: Gunakan presensiApp agar Firebase Storage SDK membawa auth token pegawai presensiAuth!
const presensiStorage = getStorage(presensiApp, presensiBucketUrl);
// Fallback storage bucket default jika bucket sekunder belum aktif
const presensiDefaultStorage = getStorage(presensiApp, bucketUrl);

export {
  app,
  auth,
  db,
  storage,
  functions,
  presensiDb,
  presensiStorage,
  presensiDefaultStorage,
  presensiApp,
  presensiAuth,
};

