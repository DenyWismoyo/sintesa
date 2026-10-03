// src/lib/presensi/firebase-admin.ts
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

let adminApp: App;

function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. Coba load dari service-account-katalog.json di root project
  const saLocalPath = path.resolve(process.cwd(), "service-account-katalog.json");
  if (fs.existsSync(saLocalPath)) {
    try {
      const saRaw = fs.readFileSync(saLocalPath, "utf-8");
      const sa = JSON.parse(saRaw);
      adminApp = initializeApp({
        credential: cert(sa),
        storageBucket: process.env.NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET || "presensi-solo-technopark",
      });
      return adminApp;
    } catch (e) {
      console.warn("[Firebase Admin Presensi] Gagal memuat service-account-katalog.json, mencoba fallback ke ENV:", e);
    }
  }

  // 2. Fallback ke Environment Variables
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET || "presensi-solo-technopark",
    });
    return adminApp;
  }

  // 3. Fallback default credentials (GCP Cloud Run / App Engine environment)
  adminApp = initializeApp({
    projectId: projectId || "katalog-solo-technopark",
    storageBucket: process.env.NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET || "presensi-solo-technopark",
  });
  return adminApp;
}

export function isFirebaseAdminConfigured(): boolean {
  return true;
}

export function getAdminApp(): App {
  return initAdminApp();
}

const presensiDatabaseId = process.env.NEXT_PUBLIC_PRESENSI_DATABASE_ID || "presensi-pegawai";

// Export lazy Proxy untuk Admin Firestore agar terisolasi ke database 'presensi-pegawai'
export const adminPresensiDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const app = initAdminApp();
    const db = getFirestore(app, presensiDatabaseId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (db as any)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});

// Export lazy Proxy untuk Admin Auth
export const adminPresensiAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const app = initAdminApp();
    const auth = getAuth(app);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (auth as any)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});

// Export lazy Proxy untuk Admin Storage terisolasi ke bucket 'presensi-solo-technopark'
export const adminPresensiStorageBucket = () => {
  const app = initAdminApp();
  const bucketName = process.env.NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET || "presensi-solo-technopark";
  return getStorage(app).bucket(bucketName);
};
