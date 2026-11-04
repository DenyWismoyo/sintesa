import { describe, it, expect } from 'vitest';
import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';

function createMockRequest(url: string, cookies: Record<string, string> = {}, method: string = 'GET'): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
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
      const req = createMockRequest('http://localhost:3000/billing', {
        techno_sign_session: 'mock-presensi-session'
      });
      const res = proxy(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fbilling');
    });

    it('harus menolak akses admin jika penyerang hanya memalsukan cookie userRole=super_admin tanpa __session valid (VULN-02)', () => {
      const req = createMockRequest('http://localhost:3000/billing', {
        userRole: 'super_admin',
      });
      const res = proxy(req);

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

    it('harus menyertakan header X-Robots-Tag: noindex, nofollow pada rute terproteksi', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ role: 'super_admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const mockToken = `${header}.${payload}.signature`;

      const req = createMockRequest('http://localhost:3000/dashboard', {
        __session: mockToken
      });
      const res = proxy(req);

      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
    });
  });

  describe('Fortis Scanner Hardening (URI Fuzzing, Method Tampering & Static Asset Guards)', () => {
    it('harus memblokir HTTP verb tampering (TRACE, TRACK, DEBUG) dengan 405 Method Not Allowed', () => {
      const reqTrace = createMockRequest('http://localhost:3000/');
      Object.defineProperty(reqTrace, 'method', { value: 'TRACE' });
      const resTrace = proxy(reqTrace);
      expect(resTrace.status).toBe(405);

      const reqTrack = createMockRequest('http://localhost:3000/fasilitas');
      Object.defineProperty(reqTrack, 'method', { value: 'TRACK' });
      const resTrack = proxy(reqTrack);
      expect(resTrack.status).toBe(405);
    });

    it('harus memblokir fuzzing Windows drive colon path traversal (seperti /c:/) dengan 404 Not Found', () => {
      const req = createMockRequest('http://localhost:3000/c:/');
      const res = proxy(req);
      expect(res.status).toBe(404);
    });

    it('harus memblokir fuzzing directory traversal (..) dan dotfiles (.git, .env) dengan 404 Not Found', () => {
      const reqGit = createMockRequest('http://localhost:3000/.git/HEAD');
      const resGit = proxy(reqGit);
      expect(resGit.status).toBe(404);

      const reqEnv = createMockRequest('http://localhost:3000/.env');
      const resEnv = proxy(reqEnv);
      expect(resEnv.status).toBe(404);
    });

    it('harus menolak request selain GET/HEAD ke static media (POST ke font woff2) dengan 405', () => {
      const reqPostFont = createMockRequest(
        'http://localhost:3000/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2',
        {},
        'POST'
      );
      const resPostFont = proxy(reqPostFont);
      expect(resPostFont.status).toBe(405);
      expect(resPostFont.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
    });

    it('harus mengizinkan request GET normal ke static media / assets', () => {
      const reqGetFont = createMockRequest(
        'http://localhost:3000/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2',
        {},
        'GET'
      );
      const resGetFont = proxy(reqGetFont);
      expect(resGetFont.status).toBe(200);
    });
  });
});
