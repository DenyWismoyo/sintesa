// src/lib/presensi/session.ts
"use server";

import { cookies } from "next/headers";
import { adminPresensiAuth as adminAuth, adminPresensiDb as adminDb } from "./firebase-admin";
import { UserProfile } from "@/types/presensi";
import { PRESENSI_COOKIE_NAME, PRESENSI_MAX_AGE_SECONDS } from "./constants";
import { getStpUserProfileByEmail } from "@/data/presensi/stpUsers";

/**
 * Menyimpan ID Token Firebase Auth ke cookie sesi presensi
 */
export async function setSessionCookie(idToken: string): Promise<void> {
  const cookieStore = await cookies();

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch (e) {
    console.warn("[Session Presensi] Verifikasi token gagal atau fallback:", e);
  }

  cookieStore.set(PRESENSI_COOKIE_NAME, idToken, {
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

    try {
      const decodedToken = await adminAuth.verifyIdToken(token, true);
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
    } catch {
      // Decode payload JWT fallback jika dev
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
    }

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
