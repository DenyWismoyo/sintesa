// src/lib/presensi/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfileFromFirestore,
  loginWithNipOrEmail,
  loginWithGoogle,
  logoutUser,
} from "./auth-helpers";
import { UserProfile } from "@/types/presensi";
import { PRESENSI_COOKIE_NAME, PRESENSI_MAX_AGE_SECONDS } from "./constants";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  loginWithCredentials: (nipOrEmail: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<{ user: FirebaseUser; profile: UserProfile | null }>;
  syncWithEmployeeProfile: (nipOrCode: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  consumeStorage: (bytes: number) => boolean;
  releaseStorage: (bytes: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function persistTokenToCookie(fbUser: FirebaseUser): Promise<void> {
  try {
    const idToken = await getIdToken(fbUser, false);
    const maxAge = PRESENSI_MAX_AGE_SECONDS;
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${PRESENSI_COOKIE_NAME}=${idToken}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  } catch (err) {
    console.warn("[Presensi Auth] Gagal menyimpan token cookie:", err);
  }
}

function clearTokenCookie(): void {
  document.cookie = `${PRESENSI_COOKIE_NAME}=; Path=/; Max-Age=0`;
}

async function enrichProfileWithCatalogAccess(fbUser: FirebaseUser, profile: UserProfile | null): Promise<UserProfile | null> {
  if (!profile) return null;
  try {
    const idTokenResult = await fbUser.getIdTokenResult();
    const catalogRole = idTokenResult.claims.role as string | undefined;
    const canAccess = catalogRole === "admin" || catalogRole === "super_admin";
    return { ...profile, canAccessCatalogAdmin: canAccess };
  } catch {
    return profile;
  }
}

export function PresensiAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const fbUser = auth.currentUser;
    setFirebaseUser(fbUser);
    if (fbUser) {
      const profile = await getUserProfileFromFirestore(fbUser.uid, fbUser.email);
      const enriched = await enrichProfileWithCatalogAccess(fbUser, profile);
      setUser(enriched);
      await persistTokenToCookie(fbUser);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await getUserProfileFromFirestore(fbUser.uid, fbUser.email);
        if (profile) {
          const enriched = await enrichProfileWithCatalogAccess(fbUser, profile);
          setUser(enriched);
          await persistTokenToCookie(fbUser);
        } else {
          setUser(null);
        }
      } else {
        clearTokenCookie();
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = useCallback(async (nipOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: fbUser, profile } = await loginWithNipOrEmail(nipOrEmail, password);
      setFirebaseUser(fbUser);
      const enriched = await enrichProfileWithCatalogAccess(fbUser, profile);
      setUser(enriched);
      await persistTokenToCookie(fbUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: fbUser, profile } = await loginWithGoogle();
      setFirebaseUser(fbUser);
      const enriched = await enrichProfileWithCatalogAccess(fbUser, profile);
      setUser(enriched);
      await persistTokenToCookie(fbUser);
      return { user: fbUser, profile: enriched };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithEmployeeProfile = useCallback(async (nipOrCode: string, password: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      throw new Error("Sesi Google tidak ditemukan. Silakan login dengan Google terlebih dahulu.");
    }
    const { validateAndSyncGooglePresensi } = await import("@/actions/presensi/auth");
    const result = await validateAndSyncGooglePresensi({
      googleUid: fbUser.uid,
      googleEmail: fbUser.email,
      googleDisplayName: fbUser.displayName || undefined,
      googlePhotoURL: fbUser.photoURL || undefined,
      nipOrCode,
      password,
    });

    if (!result.success || !result.profile) {
      throw new Error(result.message || "Gagal menyatukan akun pegawai.");
    }

    // Refresh token Google auth agar custom claim presensiRole termuat di client
    await fbUser.getIdToken(true);
    const enriched = await enrichProfileWithCatalogAccess(fbUser, result.profile);
    setUser(enriched);
    await persistTokenToCookie(fbUser);

    return enriched!;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      clearTokenCookie();
      setFirebaseUser(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const consumeStorage = useCallback((bytes: number) => {
    if (!user) return false;
    const newUsed = (user.storageUsedBytes || 0) + bytes;
    if (newUsed > (user.storageLimitBytes || 1073741824)) {
      return false;
    }
    setUser({ ...user, storageUsedBytes: newUsed });
    return true;
  }, [user]);

  const releaseStorage = useCallback((bytes: number) => {
    if (!user) return;
    const newUsed = Math.max(0, (user.storageUsedBytes || 0) - bytes);
    setUser({ ...user, storageUsedBytes: newUsed });
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isLoading,
        loginWithCredentials,
        loginGoogle,
        syncWithEmployeeProfile,
        logout,
        refreshProfile,
        consumeStorage,
        releaseStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function usePresensiAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("usePresensiAuth harus digunakan di dalam PresensiAuthProvider");
  }
  return context;
}
