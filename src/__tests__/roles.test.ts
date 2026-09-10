import { describe, it, expect } from 'vitest';
import { hasAccess, isInternalStaff, canPerformAction, PERMISSIONS, APP_ROLES } from '@/config/roles';

describe('Role-Based Access Control (RBAC) System', () => {
  describe('Super Admin Access', () => {
    it('should allow super_admin to access all routes (* wildcard)', () => {
      expect(hasAccess(APP_ROLES.SUPER_ADMIN, '/dashboard')).toBe(true);
      expect(hasAccess(APP_ROLES.SUPER_ADMIN, '/billing')).toBe(true);
      expect(hasAccess(APP_ROLES.SUPER_ADMIN, '/aset')).toBe(true);
      expect(hasAccess(APP_ROLES.SUPER_ADMIN, '/tenant')).toBe(true);
      expect(hasAccess(APP_ROLES.SUPER_ADMIN, '/pengaturan')).toBe(true);
      expect(hasAccess(APP_ROLES.SUPER_ADMIN, '/any-random-path')).toBe(true);
    });

    it('should allow super_admin to perform any action', () => {
      expect(canPerformAction(APP_ROLES.SUPER_ADMIN, PERMISSIONS.DELETE_INVOICE)).toBe(true);
      expect(canPerformAction(APP_ROLES.SUPER_ADMIN, PERMISSIONS.APPROVE_BOOKING)).toBe(true);
      expect(canPerformAction(APP_ROLES.SUPER_ADMIN, PERMISSIONS.APPROVE_TENANT)).toBe(true);
    });
  });

  describe('Internal Staff Access', () => {
    it('should grant admin_keuangan access to finance and billing routes', () => {
      expect(hasAccess(APP_ROLES.ADMIN_KEUANGAN, '/dashboard')).toBe(true);
      expect(hasAccess(APP_ROLES.ADMIN_KEUANGAN, '/billing')).toBe(true);
      expect(hasAccess(APP_ROLES.ADMIN_KEUANGAN, '/billing/invoice/123')).toBe(true);
      expect(hasAccess(APP_ROLES.ADMIN_KEUANGAN, '/aset')).toBe(false);
      expect(hasAccess(APP_ROLES.ADMIN_KEUANGAN, '/tenant')).toBe(false);
    });

    it('should grant kasir access only to billing and dashboard', () => {
      expect(hasAccess(APP_ROLES.KASIR, '/billing')).toBe(true);
      expect(hasAccess(APP_ROLES.KASIR, '/dashboard')).toBe(true);
      expect(hasAccess(APP_ROLES.KASIR, '/tenant')).toBe(false);
      expect(hasAccess(APP_ROLES.KASIR, '/aset')).toBe(false);
    });

    it('should grant admin_aset access to asset and booking management', () => {
      expect(hasAccess(APP_ROLES.ADMIN_ASET, '/aset')).toBe(true);
      expect(hasAccess(APP_ROLES.ADMIN_ASET, '/booking')).toBe(true);
      expect(hasAccess(APP_ROLES.ADMIN_ASET, '/billing')).toBe(false);
    });

    it('should accurately identify internal staff roles', () => {
      expect(isInternalStaff(APP_ROLES.SUPER_ADMIN)).toBe(true);
      expect(isInternalStaff(APP_ROLES.ADMIN)).toBe(true);
      expect(isInternalStaff(APP_ROLES.ADMIN_KEUANGAN)).toBe(true);
      expect(isInternalStaff(APP_ROLES.KASIR)).toBe(true);
      expect(isInternalStaff(APP_ROLES.ADMIN_ASET)).toBe(true);
      expect(isInternalStaff(APP_ROLES.PUBLIC)).toBe(false);
      expect(isInternalStaff(APP_ROLES.TENANT)).toBe(false);
      expect(isInternalStaff(APP_ROLES.ALUMNI)).toBe(false);
    });
  });

  describe('Public and Partner Access', () => {
    it('should deny public role from accessing admin routes', () => {
      expect(hasAccess(APP_ROLES.PUBLIC, '/dashboard')).toBe(false);
      expect(hasAccess(APP_ROLES.PUBLIC, '/billing')).toBe(false);
      expect(hasAccess(APP_ROLES.PUBLIC, '/aset')).toBe(false);
    });

    it('should allow partner roles to access their portal routes', () => {
      expect(hasAccess(APP_ROLES.TENANT, '/tenant/profil')).toBe(true);
      expect(hasAccess(APP_ROLES.TENANT, '/tenant')).toBe(false);
      expect(hasAccess(APP_ROLES.INVESTOR, '/ekosistem/threads')).toBe(true);
      expect(hasAccess(APP_ROLES.KAMPUS, '/ekosistem/threads')).toBe(true);
      expect(hasAccess(APP_ROLES.INDUSTRI, '/ekosistem/threads')).toBe(true);
    });
  });
});
