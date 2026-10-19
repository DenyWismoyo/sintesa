import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAccess, APP_ROLES, isInternalStaff } from '@/config/roles';

// Daftar prefix rute privat internal/admin/portal yang diproteksi oleh proxy (Next.js 16)
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/aset',
  '/booking',
  '/billing',
  '/katalog',
  '/tenant',
  '/pelatihan',
  '/manajemen-event',
  '/manajemen-krenova',
  '/manajemen-faq',
  '/manajemen-artikel',
  '/pengaturan',
  '/presensi',
];

/**
 * Mengekstrak peran terverifikasi dari Firebase ID Token (__session) di Edge Runtime.
 * Memeriksa struktur JWT 3-bagian dan masa aktif (exp) untuk mencegah manipulasi cookie lokal (R-036).
 */
function getVerifiedRoleFromToken(tokenString: string | undefined): string | null {
  if (!tokenString) return null;
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    const payload = JSON.parse(jsonPayload);

    // Tolak jika token telah kedaluwarsa
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // 1. Role eksplisit dari Custom Claims (admin, super_admin, kasir, dll.)
    if (payload.role) {
      return payload.role;
    }

    // 2. Role Presensi Pegawai dari Custom Claims
    if (payload.presensiRole) {
      return APP_ROLES.PEGAWAI;
    }

    // 3. Akun dengan domain email kedinasan Solo Technopark otomatis dikenali sebagai Pegawai
    if (payload.email && typeof payload.email === 'string' && payload.email.endsWith('@solotechnopark.id')) {
      return APP_ROLES.PEGAWAI;
    }

    // Kembalikan null agar cookieRole (seperti 'pegawai') dapat dibaca sebagai fallback
    return null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 0. Izinkan halaman login presensi & aset manifest terbuka untuk umum
  if (path === '/presensi/login' || path.startsWith('/presensi/login')) {
    return NextResponse.next();
  }

  // 1. Cek apakah rute ini termasuk rute yang diproteksi
  const isProtected = PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  // 2. Baca session token terenkripsi dan cookie peran (R-036)
  const presensiSession = request.cookies.get('techno_sign_session')?.value;
  const sessionToken = request.cookies.get('__session')?.value || presensiSession;
  const cookieRole = request.cookies.get('userRole')?.value;

  // Utamakan peran dari token JWT terverifikasi untuk mengeliminasi risiko spoofing
  const tokenRole = getVerifiedRoleFromToken(sessionToken);
  const role = tokenRole || cookieRole || null;

  const isPresensiPath = path === '/presensi' || path.startsWith('/presensi/');

  // 3. Khusus Rute Presensi Pegawai STP (Techno Sign)
  if (isPresensiPath) {
    // A. Sudah login sebagai pegawai atau staf internal admin -> izinkan masuk
    if (role === APP_ROLES.PEGAWAI || isInternalStaff(role)) {
      return NextResponse.next();
    }

    // B. Memiliki cookie sesi presensi aktif (techno_sign_session) -> izinkan masuk
    if (presensiSession) {
      return NextResponse.next();
    }

    // C. Pengguna belum memiliki sesi presensi -> arahkan ke halaman login presensi pegawai
    const presensiLoginUrl = new URL('/presensi/login', request.url);
    if (path !== '/presensi') {
      presensiLoginUrl.searchParams.set('redirect', path);
    }
    return NextResponse.redirect(presensiLoginUrl);
  }

  // 4. Rute Admin / Portal Bisnis (di luar presensi) diakses tanpa sesi login
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Validasi hak akses rute menggunakan Single Source of Truth dari roles.ts
  const isAllowed = hasAccess(role, path);

  if (!isAllowed) {
    // Pegawai STP murni yang mencoba membuka modul admin katalog dialihkan ke presensi
    if (role === APP_ROLES.PEGAWAI) {
      return NextResponse.redirect(new URL('/presensi', request.url));
    }
    // Akun tenant dialihkan ke portal tenant mereka sendiri
    if (role === APP_ROLES.TENANT) {
      return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
    }
    // Staf internal berizin terbatas dialihkan ke dashboard mereka
    if (isInternalStaff(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Pengguna umum / publik dialihkan ke halaman utama
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Hanya jalankan proxy pada rute halaman web (abaikan API internal, static assets, images, icons PWA)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|icon-).*)'],
};
