// src/lib/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';

// Menentukan struktur data Context kita
interface AuthContextType {
  user: User | null;
  role: string | null;
  isInstructor: boolean; // FITUR BARU: Kartu Pas untuk Instruktur
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isInstructor: false,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fungsi ini akan terus memantau perubahan status login dari Firebase
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // 1. Ambil Custom Claims dari JWT Firebase Auth (Cepat, aman, tanpa Firestore read)
          const idTokenResult = await currentUser.getIdTokenResult();
          const claimsRole = idTokenResult.claims.role as string | undefined;
          const claimsInstructor = idTokenResult.claims.isInstructor as boolean | undefined;

          let currentRole = claimsRole || 'public';

          // Fallback ke Firestore hanya jika custom claims belum aktif/belum ada (R-006)
          if (!claimsRole) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              currentRole = userDoc.data().role || 'public';
            }
          }
          setRole(currentRole);

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

          // 3. Sinkronisasi cookie userRole dan __session (JWT) untuk validasi Edge Proxy (R-036)
          const token = idTokenResult.token;
          document.cookie = `userRole=${currentRole}; path=/; max-age=86400; SameSite=Strict`;
          document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`;

        } catch (error) {
          console.error("Gagal memeriksa otorisasi:", error);
          setRole('public');
          setIsInstructor(false);
          document.cookie = `userRole=public; path=/; max-age=86400; SameSite=Strict`;
        }
      } else {
        setRole(null);
        setIsInstructor(false);
        // Hapus cookie sesi saat user logout / tidak ada user aktif
        document.cookie = 'userRole=; path=/; max-age=0;';
        document.cookie = '__session=; path=/; max-age=0;';
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isInstructor, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook kustom agar kita bisa pakai fungsi useAuth() di halaman manapun
export const useAuth = () => useContext(AuthContext);