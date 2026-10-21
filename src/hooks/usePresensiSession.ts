// src/hooks/usePresensiSession.ts
"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { presensiAuth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { APP_ROLES, isInternalStaff } from "@/config/roles";
import { PRESENSI_COOKIE_NAME, PRESENSI_ROLE_COOKIE_NAME } from "@/lib/presensi/constants";

export interface PresensiSessionState {
  isPegawaiLoggedIn: boolean;
  pegawaiName: string | null;
  pegawaiEmail: string | null;
  pegawaiRole: string | null;
  isLoading: boolean;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3]) : null;
}

function parseJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    // Verifikasi exp
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Hook universal untuk mendeteksi apakah pengguna yang sedang membuka portal publik
 * adalah Pegawai STP yang sedang memiliki sesi presensi aktif (Techno Sign)
 * atau akun pegawai/internal staff aktif di portal utama.
 */
export function usePresensiSession(): PresensiSessionState {
  const { user: mainUser, role: mainRole, loading: mainAuthLoading } = useAuth();
  const [state, setState] = useState<PresensiSessionState>({
    isPegawaiLoggedIn: false,
    pegawaiName: null,
    pegawaiEmail: null,
    pegawaiRole: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const evaluateSession = (presensiFbUser: FirebaseUser | null) => {
      // 1. Cek dari Cookie Presensi Mandiri (techno_sign_session)
      const sessionToken = getCookie(PRESENSI_COOKIE_NAME);
      const cookieRole = getCookie(PRESENSI_ROLE_COOKIE_NAME);
      const cookieName = getCookie("techno_sign_name");

      let hasValidCookie = false;
      let tokenPayload: any = null;

      if (sessionToken) {
        tokenPayload = parseJwt(sessionToken);
        if (tokenPayload) {
          hasValidCookie = true;
        }
      }

      // 2. Cek dari Firebase Auth Instance Khusus Presensi (presensiAuth)
      const hasPresensiFbUser = Boolean(presensiFbUser);

      // 3. Cek dari Sesi Utama Katalog (useAuth) jika role pegawai / internal staff
      const isMainPegawai =
        Boolean(mainUser) &&
        (mainRole === APP_ROLES.PEGAWAI ||
          isInternalStaff(mainRole) ||
          (typeof mainUser?.email === "string" &&
            mainUser.email.endsWith("@solotechnopark.id")));

      const isLoggedIn = hasValidCookie || hasPresensiFbUser || isMainPegawai;

      if (isLoggedIn) {
        // Ambil nama terbaik yang tersedia
        const name =
          cookieName ||
          presensiFbUser?.displayName ||
          tokenPayload?.name ||
          mainUser?.displayName ||
          (presensiFbUser?.email ? presensiFbUser.email.split("@")[0] : null) ||
          (tokenPayload?.email ? tokenPayload.email.split("@")[0] : null) ||
          (mainUser?.email ? mainUser.email.split("@")[0] : null) ||
          "Pegawai STP";

        const email =
          presensiFbUser?.email ||
          tokenPayload?.email ||
          mainUser?.email ||
          null;

        const role =
          cookieRole ||
          tokenPayload?.presensiRole ||
          tokenPayload?.role ||
          mainRole ||
          "pegawai";

        if (isMounted) {
          setState({
            isPegawaiLoggedIn: true,
            pegawaiName: name,
            pegawaiEmail: email,
            pegawaiRole: role,
            isLoading: false,
          });
        }
      } else {
        if (isMounted) {
          setState({
            isPegawaiLoggedIn: false,
            pegawaiName: null,
            pegawaiEmail: null,
            pegawaiRole: null,
            isLoading: false,
          });
        }
      }
    };

    // Dengarkan perubahan state autentikasi presensi
    const unsubscribe = onAuthStateChanged(presensiAuth, (fbUser) => {
      evaluateSession(fbUser);
    });

    // Inisiasi awal
    evaluateSession(presensiAuth.currentUser);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [mainUser, mainRole, mainAuthLoading]);

  return state;
}
