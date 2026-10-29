// Lokasi file: src/services/auth.service.ts
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  signInAnonymously,
  signInWithEmailAndPassword,
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface LoginResult {
  user: User;
  role: string;
  isNewUser: boolean;
}

/**
 * Service terpusat untuk otentikasi Solo Technopark.
 * Menangani login Google via Popup, login Kode Akses Tenant, dan sinkronisasi sesi.
 */
export const authService = {
  /**
   * Login menggunakan Google via Pop-up tanpa berpindah halaman.
   * Otomatis memeriksa sinkronisasi data user di Firestore dan matching ke koleksi tenants.
   */
  async loginWithGoogle(): Promise<LoginResult> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let role = 'public';
    let isNewUser = false;

    if (!userSnap.exists()) {
      isNewUser = true;
      let tenantId: string | null = null;

      // Cek apakah email user cocok dengan pendiri/founder salah satu tenant
      if (user.email) {
        try {
          const tenantsRef = collection(db, 'tenants');
          const qTenant = query(tenantsRef, where('email', '==', user.email), limit(1));
          const tenantSnap = await getDocs(qTenant);

          if (!tenantSnap.empty) {
            role = 'tenant';
            tenantId = tenantSnap.docs[0].id;
          }
        } catch (tenantErr) {
          console.warn('Gagal memverifikasi kecocokan tenant:', tenantErr);
        }
      }

      const newUserData: Record<string, any> = {
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'Pengguna Solo Technopark',
        photoURL: user.photoURL || null,
        role: role,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };

      if (tenantId) {
        newUserData.tenantId = tenantId;
      }

      await setDoc(userRef, newUserData);
    } else {
      const existingData = userSnap.data();
      role = existingData?.role || 'public';

      // Jika masih public tetapi email terdaftar di tenants, update role-nya
      if (role === 'public' && user.email) {
        try {
          const tenantsRef = collection(db, 'tenants');
          const qTenant = query(tenantsRef, where('email', '==', user.email), limit(1));
          const tenantSnap = await getDocs(qTenant);

          if (!tenantSnap.empty) {
            role = 'tenant';
            await updateDoc(userRef, {
              role: 'tenant',
              tenantId: tenantSnap.docs[0].id,
              lastLoginAt: Date.now()
            });
          } else {
            await updateDoc(userRef, { lastLoginAt: Date.now() });
          }
        } catch (e) {
          await updateDoc(userRef, { lastLoginAt: Date.now() });
        }
      } else {
        await updateDoc(userRef, { lastLoginAt: Date.now() });
      }
    }

    // Refresh token untuk memastikan claims terbaru dan sinkronkan cookie sesi
    try {
      const idTokenResult = await user.getIdTokenResult(true);
      const token = idTokenResult.token;

      document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Strict`;
    } catch (tokenErr) {
      console.warn('Gagal me-refresh token claims:', tokenErr);
      document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Strict`;
    }

    return { user, role, isNewUser };
  },

  /**
   * Login khusus Tenant Startup menggunakan Kode Akses Unik.
   */
  async loginWithTenantAccessCode(accessCode: string): Promise<{ user: User; role: string; tenantName: string }> {
    const code = accessCode.trim().toUpperCase();
    if (!code) {
      throw new Error('Kode akses tidak boleh kosong.');
    }

    const q = query(collection(db, 'tenants'), where('accessCode', '==', code), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error('Kode Akses tidak valid. Pastikan mengetik kode dengan benar.');
    }

    const tenantDoc = snap.docs[0];
    const tenantData = tenantDoc.data();

    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      role: 'tenant',
      tenantId: tenantDoc.id,
      name: `Tim ${tenantData.name || 'Tenant'}`,
      authMethod: 'access_code',
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    });

    const idTokenResult = await user.getIdTokenResult(true);
    document.cookie = `userRole=tenant; path=/; max-age=86400; SameSite=Strict`;
    document.cookie = `__session=${idTokenResult.token}; path=/; max-age=3600; SameSite=Strict`;

    return { user, role: 'tenant', tenantName: tenantData.name || 'Tenant' };
  },

  /**
   * Login khusus PIC Mitra Resmi Industri (/mitra) menggunakan Email & Password onboarding.
   */
  async loginWithPartnerCredentials(email: string, password: string): Promise<{ user: User; role: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Email dan kata sandi Mitra wajib diisi.');
    }

    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;
    const idTokenResult = await user.getIdTokenResult(true);

    let role = (idTokenResult.claims?.role as string) || '';
    if (!role) {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      role = userSnap.exists() ? (userSnap.data()?.role || 'public') : 'public';
    }

    document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Strict`;
    document.cookie = `__session=${idTokenResult.token}; path=/; max-age=3600; SameSite=Strict`;

    return { user, role };
  },

  /**
   * Mengakhiri sesi pengguna dan membersihkan cookie otorisasi.
   */
  async logout(): Promise<void> {
    await firebaseSignOut(auth);
    document.cookie = 'userRole=; path=/; max-age=0;';
    document.cookie = '__session=; path=/; max-age=0;';
  }
};
