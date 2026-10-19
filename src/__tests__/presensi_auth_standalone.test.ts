// src/__tests__/presensi_auth_standalone.test.ts
import { describe, it, expect } from 'vitest';
import { APP_ROLES, hasAccess, isInternalStaff, canAccessCareer } from '@/config/roles';

describe('Presensi Pegawai STP Standalone & Role Separation', () => {
  describe('1. Hak Akses Pegawai Internal Solo Technopark', () => {
    it('harus mengizinkan pegawai biasa (role: pegawai) mengakses seluruh rute presensi tanpa role admin', () => {
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi')).toBe(true);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi/scan')).toBe(true);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi/laporan')).toBe(true);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi/izin')).toBe(true);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi/lembur')).toBe(true);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi/revisi')).toBe(true);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/presensi/profil')).toBe(true);
    });

    it('harus mengidentifikasi pegawai sebagai internal staff Solo Technopark', () => {
      expect(isInternalStaff(APP_ROLES.PEGAWAI)).toBe(true);
      expect(canAccessCareer(APP_ROLES.PEGAWAI)).toBe(true);
    });
  });

  describe('2. Prinsip Least Privilege: Isolasi Modul Admin Katalog dari Pegawai Biasa', () => {
    it('harus secara mutlak MENOLAK akses pegawai biasa ke modul admin katalog & backoffice BLUD', () => {
      expect(hasAccess(APP_ROLES.PEGAWAI, '/dashboard')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/billing')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/aset')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/katalog')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/tenant')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/pengaturan')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/manajemen-event')).toBe(false);
      expect(hasAccess(APP_ROLES.PEGAWAI, '/manajemen-krenova')).toBe(false);
    });
  });

  describe('3. Akses Ganda untuk Admin Katalog yang Juga Pegawai STP', () => {
    it('seluruh role admin katalog tetap memiliki akses penuh ke sistem presensi', () => {
      const adminRoles = [
        APP_ROLES.SUPER_ADMIN,
        APP_ROLES.ADMIN,
        APP_ROLES.ADMIN_KEUANGAN,
        APP_ROLES.KASIR,
        APP_ROLES.KASIR_PENGELUARAN,
        APP_ROLES.ADMIN_ASET,
        APP_ROLES.OPERATOR_ASET,
        APP_ROLES.ADMIN_TENANT,
        APP_ROLES.OPERATOR_TENANT,
        APP_ROLES.ADMIN_PELATIHAN,
        APP_ROLES.OPERATOR_PELATIHAN,
      ];

      adminRoles.forEach((role) => {
        expect(hasAccess(role, '/presensi')).toBe(true);
        expect(hasAccess(role, '/presensi/scan')).toBe(true);
      });
    });
  });

  describe('4. Proteksi Rute Presensi dari Publik dan Pengguna Eksternal', () => {
    it('harus menolak role non-pegawai dan publik mengakses rute presensi', () => {
      const nonStaffRoles = [
        APP_ROLES.PUBLIC,
        APP_ROLES.TENANT,
        APP_ROLES.ALUMNI,
        APP_ROLES.INVESTOR,
        APP_ROLES.KAMPUS,
        APP_ROLES.INDUSTRI,
        null,
      ];

      nonStaffRoles.forEach((role) => {
        expect(hasAccess(role, '/presensi')).toBe(false);
        expect(hasAccess(role, '/presensi/scan')).toBe(false);
      });
    });
  });
});
