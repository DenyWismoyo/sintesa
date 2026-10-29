import { describe, it, expect } from 'vitest';
import { getPostLoginRedirect, mapFirebaseAuthError } from '@/services/auth.service';
import { APP_ROLES } from '@/config/roles';

describe('Auth Lifecycle Navigation & Security Helpers', () => {
  describe('getPostLoginRedirect', () => {
    it('mengarahkan setiap role ke portal/dashboard utamanya secara presisi', () => {
      expect(getPostLoginRedirect(APP_ROLES.PUBLIC)).toBe('/portal');
      expect(getPostLoginRedirect(APP_ROLES.ALUMNI)).toBe('/alumni-portal');
      expect(getPostLoginRedirect(APP_ROLES.INDUSTRI)).toBe('/mitra/dashboard');
      expect(getPostLoginRedirect(APP_ROLES.TENANT)).toBe('/tenant/dashboard');
      expect(getPostLoginRedirect(APP_ROLES.PEGAWAI)).toBe('/presensi');
      expect(getPostLoginRedirect(APP_ROLES.SUPER_ADMIN)).toBe('/dashboard');
      expect(getPostLoginRedirect(APP_ROLES.ADMIN)).toBe('/dashboard');
      expect(getPostLoginRedirect(APP_ROLES.ADMIN_PELATIHAN)).toBe('/dashboard');
      expect(getPostLoginRedirect(APP_ROLES.KASIR)).toBe('/dashboard');
      expect(getPostLoginRedirect(APP_ROLES.INVESTOR)).toBe('/ekosistem');
      expect(getPostLoginRedirect(APP_ROLES.KAMPUS)).toBe('/ekosistem');
    });

    it('menghormati customRedirect internal yang valid', () => {
      expect(getPostLoginRedirect(APP_ROLES.PUBLIC, '/layanan/manufaktur')).toBe('/layanan/manufaktur');
      expect(getPostLoginRedirect(APP_ROLES.ALUMNI, '/karir')).toBe('/karir');
    });

    it('memblokir open-redirect eksternal dan loop ke /login atau /daftar', () => {
      expect(getPostLoginRedirect(APP_ROLES.PUBLIC, '//malicious.example.com')).toBe('/portal');
      expect(getPostLoginRedirect(APP_ROLES.PUBLIC, 'https://malicious.example.com')).toBe('/portal');
      expect(getPostLoginRedirect(APP_ROLES.ALUMNI, '/login')).toBe('/alumni-portal');
      expect(getPostLoginRedirect(APP_ROLES.INDUSTRI, '/daftar?tab=register')).toBe('/mitra/dashboard');
    });
  });

  describe('mapFirebaseAuthError', () => {
    it('memberikan pesan Bahasa Indonesia yang jelas untuk kode error umum', () => {
      expect(mapFirebaseAuthError({ code: 'auth/email-already-in-use' })).toContain('sudah terdaftar');
      expect(mapFirebaseAuthError({ code: 'auth/invalid-credential' })).toContain('Email atau kata sandi');
      expect(mapFirebaseAuthError({ code: 'auth/weak-password' })).toContain('minimal 6 karakter');
      expect(mapFirebaseAuthError({ code: 'auth/too-many-requests' })).toContain('Terlalu banyak percobaan');
    });
  });
});

