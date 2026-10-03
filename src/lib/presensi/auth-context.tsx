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
  isLoading: boolean;
  loginWithCredentials: (nipOrEmail: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
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

export function PresensiAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      const profile = await getUserProfileFromFirestore(fbUser.uid, fbUser.email);
      setUser(profile);
      await persistTokenToCookie(fbUser);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile = await getUserProfileFromFirestore(fbUser.uid, fbUser.email);
        if (profile) {
          setUser(profile);
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
      setUser(profile);
      await persistTokenToCookie(fbUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: fbUser, profile } = await loginWithGoogle();
      setUser(profile);
      await persistTokenToCookie(fbUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      clearTokenCookie();
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
        isLoading,
        loginWithCredentials,
        loginGoogle,
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
