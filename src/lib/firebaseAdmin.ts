// src/lib/firebaseAdmin.ts
import { NextRequest } from 'next/server';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/presensi/firebase-admin';

let defaultAdminDb: Firestore | null = null;

/**
 * Mengambil instance Firestore Admin untuk database utama (default) proyek katalog-solo-technopark.
 */
export function getAdminDefaultDb(): Firestore {
  if (defaultAdminDb) return defaultAdminDb;
  const app = getAdminApp();
  defaultAdminDb = getFirestore(app);
  try {
    defaultAdminDb.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Settings sudah pernah diinisialisasi
  }
  return defaultAdminDb;
}

/**
 * Mengambil instance Firebase Auth Admin.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export interface VerifiedApiUser {
  uid: string;
  email?: string;
  role: string;
  partnerId?: string;
  tenantId?: string;
  alumniId?: string;
  token: DecodedIdToken;
}

/**
 * Memverifikasi token autentikasi Firebase pada Next.js API Route Handler
 * (mendukung header Authorization: Bearer <token> maupun cookie __session).
 */
export async function verifyApiRequestAuth(request: NextRequest): Promise<VerifiedApiUser | null> {
  try {
    let idToken = '';
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.slice(7).trim();
    } else {
      idToken = request.cookies.get('__session')?.value?.trim() || '';
    }

    if (!idToken) return null;

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    let role = (decoded.role as string | undefined) || '';
    let partnerId = decoded.partnerId as string | undefined;
    let tenantId = decoded.tenantId as string | undefined;
    let alumniId = decoded.alumniId as string | undefined;

    // Fallback Dual-Lookup ke koleksi users/{uid} apabila Custom Claims belum tersinkronisasi
    if (!role || (!partnerId && role === 'industri') || (!tenantId && role === 'tenant')) {
      try {
        const userSnap = await getAdminDefaultDb().collection('users').doc(decoded.uid).get();
        if (userSnap.exists) {
          const uData = userSnap.data();
          if (!role && uData?.role) role = uData.role;
          if (!partnerId && uData?.partnerId) partnerId = uData.partnerId;
          if (!tenantId && uData?.tenantId) tenantId = uData.tenantId;
          if (!alumniId && uData?.alumniId) alumniId = uData.alumniId;
        }
      } catch {
        // Fallback aman ke klaim token
      }
    }

    return {
      uid: decoded.uid,
      email: decoded.email,
      role: role || 'public',
      partnerId,
      tenantId,
      alumniId,
      token: decoded,
    };
  } catch {
    return null;
  }
}

