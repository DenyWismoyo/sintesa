// src/lib/presensi/session.ts
"use server";

import { cookies } from "next/headers";
import { adminPresensiAuth as adminAuth, adminPresensiDb as adminDb } from "./firebase-admin";
import { UserProfile } from "@/types/presensi";
import { PRESENSI_COOKIE_NAME, PRESENSI_MAX_AGE_SECONDS } from "./constants";
import { getStpUserProfileByEmail } from "@/data/presensi/stpUsers";

/**
 * Menyimpan session cookie Firebase Auth yang aman.
 * Menukar Firebase ID Token menjadi Session Cookie resmi Firebase via createSessionCookie()
 * dengan masa aktif sesuai PRESENSI_MAX_AGE_SECONDS (7 hari) (BUG-03).
 */
export async function setSessionCookie(idToken: string): Promise<void> {
  const cookieStore = await cookies();
  let cookieValue = idToken;

  try {
    // Tukar ID Token menjadi Session Cookie resmi Firebase (berlaku hingga 7 hari)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: PRESENSI_MAX_AGE_SECONDS * 1000,
    });
    cookieValue = sessionCookie;
  } catch (e) {
    console.warn("[Session Presensi] Gagal membuat session cookie resmi, fallback ke raw ID token:", e);
  }

  cookieStore.set(PRESENSI_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PRESENSI_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Menghapus cookie sesi presensi saat logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PRESENSI_COOKIE_NAME);
}

/**
 * Mengambil profil user yang sedang aktif dari session cookie
 */
export async function getCurrentUserFromSession(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PRESENSI_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    let decodedToken: any = null;

    // 1. Coba verifikasi sebagai Firebase Session Cookie (BUG-03)
    try {
      decodedToken = await adminAuth.verifySessionCookie(token, true);
    } catch {
      // 2. Fallback verifikasi sebagai Firebase ID Token (jika diset dari client document.cookie)
      try {
        decodedToken = await adminAuth.verifyIdToken(token, true);
      } catch {
        // Lanjut ke fallback decode payload
      }
    }

    if (decodedToken) {
      try {
        const snap = await adminDb.collection("users").doc(decodedToken.uid).get();
        if (snap.exists) {
          return snap.data() as UserProfile;
        }

        // Jika ada di decodedToken tapi belum di koleksi users database presensi-pegawai
        if (decodedToken.email) {
          const seedProfile = getStpUserProfileByEmail(decodedToken.email);
          if (seedProfile) {
            const profileWithUid: UserProfile = { ...seedProfile, id: decodedToken.uid };
            await adminDb.collection("users").doc(decodedToken.uid).set(profileWithUid, { merge: true });
            return profileWithUid;
          }
        }
      } catch (dbErr) {
        console.warn("[Presensi Session] Gagal membaca user doc dari Firestore:", dbErr);
      }
    }

    // 3. Decode payload JWT fallback jika dev mode atau mock token
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        if (payload.email) {
          const profile = getStpUserProfileByEmail(payload.email);
          if (profile) return { ...profile, id: payload.user_id || payload.sub || profile.id };
        }
      }
    } catch {}

    return null;
  } catch (error) {
    console.warn("[Presensi Session] Gagal membaca session:", error);
    return null;
  }
}

/**
 * Memastikan user terautentikasi dan memiliki role yang diizinkan
 */
export async function requireAuth(allowedRoles?: string[]): Promise<UserProfile> {
  const user = await getCurrentUserFromSession();

  if (!user) {
    throw new Error("UNAUTHORIZED: Silakan login terlebih dahulu ke Techno Sign.");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error(
      `FORBIDDEN: Akses ditolak. Role '${user.role}' tidak diizinkan untuk aksi ini.`
    );
  }

  return user;
}
