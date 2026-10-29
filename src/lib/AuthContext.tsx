// src/lib/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';

// Menentukan struktur data Context kita
interface AuthContextType {
  user: User | null;
  role: string | null;
  isInstructor: boolean; // FITUR BARU: Kartu Pas untuk Instruktur
  loading: boolean;
  partnerId: string | null;
  tenantId: string | null;
  alumniId: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isInstructor: false,
  loading: true,
  partnerId: null,
  tenantId: null,
  alumniId: null,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [alumniId, setAlumniId] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return;
    try {
      await current.getIdToken(true);
    } catch (err) {
      console.error('Gagal menyegarkan token autentikasi:', err);
    }
  }, []);

  useEffect(() => {
    // Fungsi ini akan terus memantau perubahan status login dari Firebase
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // 1. Ambil Custom Claims dari JWT Firebase Auth (Cepat, aman, tanpa Firestore read)
          const idTokenResult = await currentUser.getIdTokenResult();
          const claimsRole = idTokenResult.claims.role as string | undefined;
          const claimsInstructor = idTokenResult.claims.isInstructor as boolean | undefined;
          let resolvedPartnerId = (idTokenResult.claims.partnerId as string | undefined) || null;
          let resolvedTenantId = (idTokenResult.claims.tenantId as string | undefined) || null;
          let resolvedAlumniId = (idTokenResult.claims.alumniId as string | undefined) || null;

          let currentRole = claimsRole || 'public';

          // Fallback ke Firestore hanya jika custom claims belum aktif/belum ada (R-006)
          if (!claimsRole || (!resolvedPartnerId && claimsRole === 'industri') || (!resolvedTenantId && claimsRole === 'tenant')) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              currentRole = userDoc.data().role || currentRole || 'public';
              if (!resolvedPartnerId && userDoc.data().partnerId) resolvedPartnerId = userDoc.data().partnerId;
              if (!resolvedTenantId && userDoc.data().tenantId) resolvedTenantId = userDoc.data().tenantId;
              if (!resolvedAlumniId && userDoc.data().alumniId) resolvedAlumniId = userDoc.data().alumniId;
            }
          }
          setRole(currentRole);
          setPartnerId(resolvedPartnerId);
          setTenantId(resolvedTenantId);
          setAlumniId(resolvedAlumniId);

          // 2. Cek Status Instruktur Eksternal (Prioritas Custom Claims)
          if (typeof claimsInstructor === 'boolean') {
            setIsInstructor(claimsInstructor);
          } else {
            const instructorQuery = query(
              collection(db, 'trainings'), 
              where('authorizedInstructorIds', 'array-contains', currentUser.uid),
              limit(1)
            );
            const instSnap = await getDocs(instructorQuery);
            setIsInstructor(!instSnap.empty);
          }

          // 3. Sinkronisasi cookie userRole dan __session (JWT) untuk Portal Admin & Katalog (Edge Proxy R-036)
          const token = idTokenResult.token;
          document.cookie = `userRole=${currentRole}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `__session=${token}; path=/; max-age=86400; SameSite=Lax`;

        } catch (error) {
          console.error("Gagal memeriksa otorisasi:", error);
          setRole('public');
          setIsInstructor(false);
        setPartnerId(null);
        setTenantId(null);
        setAlumniId(null);
          document.cookie = `userRole=public; path=/; max-age=86400; SameSite=Lax`;
        }
      } else {
        setRole(null);
        setIsInstructor(false);
        setPartnerId(null);
        setTenantId(null);
        setAlumniId(null);
        // Hapus cookie sesi saat user logout / tidak ada user aktif di portal utama
        document.cookie = 'userRole=; path=/; max-age=0;';
        document.cookie = '__session=; path=/; max-age=0;';
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isInstructor, loading, partnerId, tenantId, alumniId, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook kustom agar kita bisa pakai fungsi useAuth() di halaman manapun
export const useAuth = () => useContext(AuthContext);