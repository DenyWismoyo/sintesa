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
  '/mitra',
  '/pelatihan',
  '/manajemen-karir',
  '/manajemen-event',
  '/manajemen-krenova',
  '/manajemen-faq',
  '/manajemen-artikel',
  '/pengaturan',
  '/presensi',
  '/jasa-produksi',
  '/afiliasi',
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

/**
 * Membubuhkan header perlindungan privasi (X-Robots-Tag) pada seluruh rute privat internal
 */
function withProtectedHeaders(response: NextResponse, isProtected: boolean): NextResponse {
  if (isProtected) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // --- HARDENING FORTIS (LANGKAH 2): EARLY EDGE GUARDS ---

  // 1. Tolak HTTP Verb Tampering yang tidak aman (TRACE, TRACK, DEBUG)
  if (['TRACE', 'TRACK', 'DEBUG'].includes(method)) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // 2. Blokir URI Traversal, Windows Drive Colon, Null Bytes, & Sensitive Dotfiles
  // Menghindari 500 Internal Server Error (Envoy unhandled exception) saat security scanner melakukan fuzzing
  const rawUrl = request.url || '';
  const isMalformedPath = 
    /(?:^|\/)[a-zA-Z]:/i.test(path) ||               // Windows drive colon (e.g. /c:/, /c:/windows)
    path.includes('..') ||                           // Path traversal /..
    rawUrl.includes('%2e%2e') || rawUrl.includes('%2E%2E') ||
    rawUrl.includes('%00') || path.includes('\0') || // Null bytes
    /(?:^|\/)\.(git|env|svn|hg|bzr)(?:\/|$)/i.test(path); // Hidden VCS/Config repos

  if (isMalformedPath) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 3. Static Files & Media Assets: Method Guard
  // Fuzzing Fortis: POST /_next/static/media/*.woff2 memicu HTTP 500 jika tidak difilter
  const isStaticAsset = 
    path.startsWith('/_next/static/') ||
    /\.(woff2?|ttf|otf|eot|png|jpe?g|gif|webp|svg|ico|css|js|map|webmanifest)$/i.test(path);

  if (isStaticAsset) {
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      return new NextResponse('Method Not Allowed', { 
        status: 405, 
        headers: { Allow: 'GET, HEAD, OPTIONS' } 
      });
    }
    return NextResponse.next();
  }

  // 4. Izinkan halaman login presensi & aset manifest terbuka untuk umum
  if (path === '/presensi/login' || path.startsWith('/presensi/login')) {
    return NextResponse.next();
  }

  // 5. Cek apakah rute ini termasuk rute yang diproteksi
  const isProtected = PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  if (!isProtected) {
    return NextResponse.next();
  }

  const isPresensiPath = path === '/presensi' || path.startsWith('/presensi/');

  // 6. Khusus Rute Presensi Pegawai STP (Techno Sign)
  // Menggunakan sesi terisolasi (techno_sign_session) tanpa mencampuri sesi Admin/Katalog
  if (isPresensiPath) {
    const presensiSession = request.cookies.get('techno_sign_session')?.value;

    // A. Memiliki cookie sesi presensi aktif & belum kedaluwarsa -> izinkan masuk
    if (presensiSession) {
      try {
        const parts = presensiSession.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          // Tolak jika token presensi terbukti sudah kedaluwarsa
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            // Lanjut ke pengalihan login (expired)
          } else {
            return withProtectedHeaders(NextResponse.next(), true);
          }
        } else {
          return withProtectedHeaders(NextResponse.next(), true);
        }
      } catch {
        return withProtectedHeaders(NextResponse.next(), true);
      }
    }

    // B. Fallback: Admin / Super Admin utama di portal katalog yang ingin menginspeksi modul presensi
    const adminSession = request.cookies.get('__session')?.value;
    if (adminSession) {
      const adminRole = getVerifiedRoleFromToken(adminSession);
      if (adminRole === APP_ROLES.SUPER_ADMIN || adminRole === APP_ROLES.ADMIN) {
        return withProtectedHeaders(NextResponse.next(), true);
      }
    }

    // C. Pengguna belum memiliki sesi presensi -> arahkan ke halaman login presensi pegawai
    const presensiLoginUrl = new URL('/presensi/login', request.url);
    if (path !== '/presensi') {
      presensiLoginUrl.searchParams.set('redirect', path);
    }
    return withProtectedHeaders(NextResponse.redirect(presensiLoginUrl), true);
  }

  // 7. Rute Admin / Portal Bisnis (di luar presensi)
  // Hanya membaca cookie sesi katalog (__session), terisolasi dari sesi presensi
  // KEAMANAN (VULN-02): Role WAJIB diekstrak dari JWT token bertanda tangan valid (tokenRole).
  // Jangan gunakan cookieRole mentah dari browser sebagai fallback untuk mencegah cookie role spoofing.
  const sessionToken = request.cookies.get('__session')?.value;
  const role = getVerifiedRoleFromToken(sessionToken);

  // Rute Admin diakses tanpa sesi login katalog
  if (!role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return withProtectedHeaders(NextResponse.redirect(loginUrl), true);
  }

  // 8. Validasi hak akses rute menggunakan Single Source of Truth dari roles.ts
  const isAllowed = hasAccess(role, path);

  if (!isAllowed) {
    // Akun tenant dialihkan ke portal tenant mereka sendiri
    if (role === APP_ROLES.TENANT) {
      return withProtectedHeaders(NextResponse.redirect(new URL('/tenant/dashboard', request.url)), true);
    }
    // Akun mitra industri dialihkan ke portal mitra resmi
    if (role === APP_ROLES.INDUSTRI) {
      return withProtectedHeaders(NextResponse.redirect(new URL('/mitra/dashboard', request.url)), true);
    }
    // Staf internal berizin terbatas dialihkan ke dashboard mereka
    if (isInternalStaff(role)) {
      return withProtectedHeaders(NextResponse.redirect(new URL('/dashboard', request.url)), true);
    }
    // Pengguna umum / publik dialihkan ke halaman utama
    return withProtectedHeaders(NextResponse.redirect(new URL('/', request.url)), true);
  }

  return withProtectedHeaders(NextResponse.next(), true);
}

export const config = {
  // Jalankan proxy pada rute halaman web dan aset statis untuk memvalidasi method & fuzzing
  matcher: ['/((?!api|_next/image).*)'],
};
