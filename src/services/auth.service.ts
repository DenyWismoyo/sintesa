// Lokasi file: src/services/auth.service.ts
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
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
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import { APP_ROLES, isInternalStaff } from '@/config/roles';
import { getAppId } from '@/lib/appId';

export interface LoginResult {
  user: User;
  role: string;
  isNewUser: boolean;
  alumniClaimed?: boolean;
  alumniClaimError?: string;
}

export interface RegisterEmailPayload {
  name: string;
  email: string;
  phone?: string;
  agency?: string;
  password: string;
  alumniCode?: string;
}

/**
 * Menentukan rute tujuan terbaik pasca-login berdasarkan Role pengguna
 * dengan pengaman anti-Open-Redirect pada parameter customRedirect.
 */
export function getPostLoginRedirect(role: string | null | undefined, customRedirect?: string | null): string {
  if (
    customRedirect &&
    customRedirect.startsWith('/') &&
    !customRedirect.startsWith('//') &&
    !customRedirect.startsWith('/login') &&
    !customRedirect.startsWith('/daftar')
  ) {
    return customRedirect;
  }

  const normalizedRole = role || APP_ROLES.PUBLIC;

  if (normalizedRole === APP_ROLES.PEGAWAI) {
    return '/presensi';
  }
  if (isInternalStaff(normalizedRole)) {
    return '/dashboard';
  }
  if (normalizedRole === APP_ROLES.INDUSTRI) {
    return '/mitra/dashboard';
  }
  if (normalizedRole === APP_ROLES.TENANT) {
    return '/tenant/dashboard';
  }
  if (normalizedRole === APP_ROLES.ALUMNI) {
    return '/alumni-portal';
  }
  if (normalizedRole === APP_ROLES.INVESTOR || normalizedRole === APP_ROLES.KAMPUS) {
    return '/ekosistem';
  }

  return '/portal';
}

/**
 * Menerjemahkan kode galat Firebase Auth ke pesan Bahasa Indonesia yang ramah pengguna.
 */
export function mapFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar. Silakan masuk atau gunakan fitur Lupa Kata Sandi.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid. Periksa kembali penulisan email Anda.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau kata sandi belum sesuai. Jika sebelumnya daftar menggunakan Google, silakan klik tombol Masuk dengan Google.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf dan angka.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan dalam waktu singkat. Silakan tunggu sekitar 1 menit lalu coba kembali.';
    case 'auth/popup-closed-by-user':
      return 'Jendela login Google ditutup sebelum proses selesai.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan login sedang diproses. Mohon tunggu sejenak.';
    default:
      return err?.message || 'Terjadi kendala saat memproses autentikasi. Silakan coba kembali.';
  }
}

function syncSessionCookies(role: string, token?: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `userRole=${role}; path=/; max-age=86400; SameSite=Lax`;
  if (token) {
    document.cookie = `__session=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
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
      const resolvedRole = (idTokenResult.claims?.role as string) || role;
      role = resolvedRole;
      syncSessionCookies(role, idTokenResult.token);
    } catch (tokenErr) {
      console.warn('Gagal me-refresh token claims:', tokenErr);
      syncSessionCookies(role);
    }

    // Jika pendaftar baru Google, kirimkan email sambutan resmi secara non-blocking
    if (isNewUser) {
      this.sendWelcomeVerificationEmail().catch((err) => {
        console.warn('Gagal menjadwalkan email sambutan Google:', err);
      });
    }

    return { user, role, isNewUser };
  },

  /**
   * Pendaftaran akun baru standar menggunakan Email & Kata Sandi.
   * Mendukung klaim kode Alumni STP / RSKB langsung dalam 1 langkah pendaftaran!
   */
  async registerWithEmailPassword(payload: RegisterEmailPayload): Promise<LoginResult> {
    const cleanName = payload.name.trim();
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPhone = (payload.phone || '').trim();
    const cleanAgency = (payload.agency || '').trim();
    const cleanAlumniCode = (payload.alumniCode || '').trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Nama lengkap wajib diisi minimal 2 karakter.');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Masukkan alamat email yang valid.');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new Error('Kata sandi wajib terdiri dari minimal 6 karakter.');
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
    const user = cred.user;

    await updateProfile(user, { displayName: cleanName });

    // Cek apakah email founder terdaftar sebagai tenant inkubasi
    let role: string = APP_ROLES.PUBLIC;
    let tenantId: string | null = null;
    try {
      const qTenant = query(collection(db, 'tenants'), where('email', '==', cleanEmail), limit(1));
      const tenantSnap = await getDocs(qTenant);
      if (!tenantSnap.empty) {
        role = APP_ROLES.TENANT;
        tenantId = tenantSnap.docs[0].id;
      }
    } catch {
      // Abaikan jika gagal cek koleksi tenants
    }

    const now = Date.now();
    const userDocPayload: Record<string, any> = {
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      agency: cleanAgency,
      photoURL: null,
      role,
      authMethod: 'email',
      createdAt: now,
      lastLoginAt: now,
    };

    if (tenantId) {
      userDocPayload.tenantId = tenantId;
    }

    await setDoc(doc(db, 'users', user.uid), userDocPayload);

    // Jika pengguna memasukkan Kode Registrasi Alumni saat daftar, klaim otomatis di server!
    let alumniClaimed = false;
    let alumniClaimError: string | undefined;

    if (cleanAlumniCode) {
      try {
        const claimFn = httpsCallable<
          { registrationCode: string; appId: string },
          { success: boolean; role?: string }
        >(functions, 'claimAlumniAccount');
        const claimRes = await claimFn({
          registrationCode: cleanAlumniCode,
          appId: getAppId(),
        });
        if (claimRes.data?.success) {
          alumniClaimed = true;
          role = claimRes.data.role || APP_ROLES.ALUMNI;
        }
      } catch (claimErr: any) {
        alumniClaimError =
          claimErr?.message?.replace(/^FirebaseError:\s*/i, '') ||
          'Kode alumni belum berhasil diklaim. Anda tetap dapat mengklaimnya nanti melalui menu Profil Saya.';
      }
    }

    // Refresh token untuk menarik Custom Claims terbaru & set cookie sesi
    try {
      const idTokenResult = await user.getIdTokenResult(true);
      role = (idTokenResult.claims?.role as string) || role;
      syncSessionCookies(role, idTokenResult.token);
    } catch {
      syncSessionCookies(role);
    }

    // Kirim email sambutan & tautan konfirmasi verifikasi dari marketing@solotechnopark.id
    this.sendWelcomeVerificationEmail().catch((mailErr) => {
      console.warn('Gagal memicu email verifikasi pendaftaran:', mailErr);
    });

    return {
      user,
      role,
      isNewUser: true,
      alumniClaimed,
      alumniClaimError,
    };
  },

  /**
   * Login universal menggunakan Email & Kata Sandi (untuk Pengguna Umum, Alumni, Mitra Industri, Tenant, maupun Admin).
   */
  async loginWithEmailPassword(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Alamat email dan kata sandi wajib diisi.');
    }

    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    const idTokenResult = await user.getIdTokenResult(true);
    let role = (idTokenResult.claims?.role as string) || '';

    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (!role) {
          role = data?.role || APP_ROLES.PUBLIC;
        }
        await updateDoc(userRef, { lastLoginAt: Date.now() }).catch(() => {});
      } else {
        const safeInitialRole =
          role === APP_ROLES.TENANT || role === APP_ROLES.PEGAWAI ? role : APP_ROLES.PUBLIC;
        if (!role) role = safeInitialRole;
        if (['public', 'tenant', 'pegawai'].includes(role)) {
          await setDoc(userRef, {
            email: cleanEmail,
            name: user.displayName || cleanEmail.split('@')[0] || 'Pengguna Solo Technopark',
            role: safeInitialRole,
            authMethod: 'email',
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          }).catch(() => {});
        }
      }
    } catch {
      if (!role) role = APP_ROLES.PUBLIC;
    }

    const finalRole = role || APP_ROLES.PUBLIC;
    syncSessionCookies(finalRole, idTokenResult.token);

    return {
      user,
      role: finalRole,
      isNewUser: false,
    };
  },

  /**
   * Mengirimkan (atau mengirim ulang) email sambutan & tautan konfirmasi verifikasi via Hostinger SMTP resmi.
   */
  async sendWelcomeVerificationEmail(): Promise<{ success: boolean; throttled?: boolean; alreadyVerified?: boolean }> {
    try {
      const fn = httpsCallable<
        { action: string },
        { success: boolean; throttled?: boolean; alreadyVerified?: boolean }
      >(functions, 'sendAuthLifecycleEmail');
      const res = await fn({ action: 'WELCOME_VERIFICATION' });
      return res.data;
    } catch (err) {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      throw err;
    }
  },

  /**
   * Meminta pengiriman tautan Atur Ulang Kata Sandi ber-branding Solo Technopark ke email pengguna.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Masukkan alamat email yang valid untuk mengatur ulang kata sandi.');
    }

    try {
      const fn = httpsCallable<{ action: string; email: string }, { success: boolean }>(
        functions,
        'sendAuthLifecycleEmail'
      );
      const res = await fn({ action: 'PASSWORD_RESET', email: cleanEmail });
      return res.data;
    } catch {
      // Fallback ke Firebase Auth client reset jika callable belum terjangkau
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true };
    }
  },

  /**
   * Diagnostik & pengiriman email uji coba SMTP Hostinger dari panel Pengaturan Admin.
   */
  async testSmtpConfiguration(opts?: { sendTestMail?: boolean; targetEmail?: string }) {
    const fn = httpsCallable<
      { action: string; sendTestMail?: boolean; targetEmail?: string },
      {
        success: boolean;
        diagnostics: {
          configured: boolean;
          verified: boolean;
          host: string;
          port: number;
          user: string;
          fromAddress: string;
          error?: string;
        };
        messageId?: string | null;
        simulated?: boolean;
        error?: string | null;
      }
    >(functions, 'sendAuthLifecycleEmail');
    const res = await fn({
      action: 'ADMIN_TEST_SMTP',
      sendTestMail: Boolean(opts?.sendTestMail),
      targetEmail: opts?.targetEmail,
    });
    return res.data;
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
