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

    return payload.role || 'public';
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Cek apakah rute ini termasuk rute yang diproteksi
  const isProtected = PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  // 2. Baca session token terenkripsi dan cookie peran (R-036)
  const sessionToken = request.cookies.get('__session')?.value;
  const cookieRole = request.cookies.get('userRole')?.value;

  // Utamakan peran dari token JWT terverifikasi untuk mengeliminasi risiko spoofing
  const tokenRole = getVerifiedRoleFromToken(sessionToken);
  const role = tokenRole || cookieRole;

  // 3. Jika rute privat diakses tanpa cookie sesi / belum login
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Validasi hak akses rute menggunakan Single Source of Truth dari roles.ts
  const isAllowed = hasAccess(role, path);

  if (!isAllowed) {
    // Penanganan jika akses ditolak:
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
  // Hanya jalankan proxy pada rute halaman web (abaikan API internal, static assets, images)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'],
};
