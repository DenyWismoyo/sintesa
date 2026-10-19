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

describe('Edge Proxy Routing & Authentication Guard (Isolated Sessions)', () => {
  describe('Presensi Route Protection (/presensi)', () => {
    it('harus mengarahkan pengguna yang belum login presensi ke /presensi/login saat mengakses /presensi', () => {
      const req = createMockRequest('http://localhost:3000/presensi');
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/presensi/login');
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

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('harus mengizinkan pegawai dengan cookie techno_sign_session aktif masuk ke /presensi', () => {
      const req = createMockRequest('http://localhost:3000/presensi', {
        techno_sign_session: 'mock-presensi-token'
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('harus mengizinkan super_admin katalog menginspeksi modul presensi via sessionToken', () => {
      // Mock valid unexpired token payload dengan role super_admin
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ role: 'super_admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const mockToken = `${header}.${payload}.signature`;

      const req = createMockRequest('http://localhost:3000/presensi', {
        __session: mockToken
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Admin and Business Module Protection (Isolated from Presensi)', () => {
    it('harus mengarahkan pengguna belum login yang mengakses /billing ke /login?redirect=/billing', () => {
      const req = createMockRequest('http://localhost:3000/billing');
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fbilling');
    });

    it('tidak boleh mengizinkan akses rute admin hanya dengan modal techno_sign_session (sesi terisolasi)', () => {
      // Membuka /billing dengan HANYA cookie presensi (tanpa cookie katalog/admin)
      const req = createMockRequest('http://localhost:3000/billing', {
        techno_sign_session: 'mock-presensi-session'
      });
      const res = proxy(req);

      // Harus dialihkan ke /login katalog, bukan bocor ke billing
      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fbilling');
    });

    it('harus mengizinkan akses admin ke /billing jika memiliki cookie katalog __session yang valid', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ role: 'admin_keuangan', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const mockToken = `${header}.${payload}.signature`;

      const req = createMockRequest('http://localhost:3000/billing', {
        __session: mockToken
      });
      const res = proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });
});
