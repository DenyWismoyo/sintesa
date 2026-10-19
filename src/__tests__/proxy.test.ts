import { describe, it, expect } from 'vitest';
import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';

function createMockRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    headers: {
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('; ')
    }
  });
  return req;
}

describe('Edge Proxy Routing & Authentication Guard', () => {
  describe('Presensi Route Protection (/presensi)', () => {
    it('harus mengarahkan pengguna yang belum login ke /presensi/login saat mengakses /presensi', () => {
      const req = createMockRequest('http://localhost:3000/presensi');
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/presensi/login');
      // Pastikan TIDAK dilempar ke beranda utama (/)
      expect(location).not.toBe('http://localhost:3000/');
    });

    it('harus menyertakan query redirect saat mengakses sub-rute presensi (/presensi/scan)', () => {
      const req = createMockRequest('http://localhost:3000/presensi/scan');
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/presensi/login?redirect=%2Fpresensi%2Fscan');
    });

    it('harus mengizinkan akses terbuka ke /presensi/login tanpa redirect loop', () => {
      const req = createMockRequest('http://localhost:3000/presensi/login');
      const res = proxy(req);

      // Status 200 atau NextResponse.next()
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('harus mengizinkan pegawai dengan cookie userRole=pegawai masuk ke /presensi', () => {
      const req = createMockRequest('http://localhost:3000/presensi', {
        userRole: 'pegawai'
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('harus mengizinkan pegawai dengan techno_sign_session aktif masuk ke /presensi', () => {
      const req = createMockRequest('http://localhost:3000/presensi', {
        techno_sign_session: 'mock-session-token'
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('harus mengizinkan admin/super_admin masuk ke /presensi', () => {
      const req = createMockRequest('http://localhost:3000/presensi', {
        userRole: 'super_admin'
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Admin and Business Module Protection', () => {
    it('harus mengarahkan pengguna belum login yang mengakses /billing ke /login?redirect=/billing', () => {
      const req = createMockRequest('http://localhost:3000/billing');
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fbilling');
    });

    it('harus mengalihkan akun pegawai biasa yang mencoba membuka modul admin /billing ke /presensi', () => {
      const req = createMockRequest('http://localhost:3000/billing', {
        userRole: 'pegawai'
      });
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toBe('http://localhost:3000/presensi');
    });
  });
});
