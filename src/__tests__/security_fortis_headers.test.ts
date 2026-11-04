import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Verifikasi Remidiasi Assessment Fortis ID & Hardening Langkah 1', () => {
  const rootDir = path.resolve(__dirname, '../..');

  it('1. next.config.ts wajib memiliki poweredByHeader: false dan Security Headers lengkap', async () => {
    const nextConfigPath = path.join(rootDir, 'next.config.ts');
    const content = fs.readFileSync(nextConfigPath, 'utf8');

    // Mencegah framework fingerprinting (Scan Finding #14)
    expect(content).toContain('poweredByHeader: false');

    // HSTS (Scan Finding #1 - Medium)
    expect(content).toContain('Strict-Transport-Security');
    expect(content).toContain('max-age=31536000; includeSubDomains; preload');

    // X-Frame-Options Anti-Clickjacking (Scan Finding #4 - Low)
    expect(content).toContain('X-Frame-Options');
    expect(content).toContain('SAMEORIGIN');

    // X-Content-Type-Options
    expect(content).toContain('X-Content-Type-Options');
    expect(content).toContain('nosniff');

    // Referrer-Policy (Scan Finding #6 - Best Practice)
    expect(content).toContain('Referrer-Policy');
    expect(content).toContain('strict-origin-when-cross-origin');

    // Permissions-Policy
    expect(content).toContain('Permissions-Policy');
    expect(content).toContain('camera=(self), microphone=(), geolocation=(self)');

    // Content-Security-Policy (Scan Finding #5 - Best Practice)
    expect(content).toContain('Content-Security-Policy');
    expect(content).toContain("default-src 'self'");
    expect(content).toContain("frame-ancestors 'self'");
  });

  it('2. stpUsers.ts tidak boleh mengekspos passwordDefault ke client', () => {
    const stpUsersPath = path.join(rootDir, 'src/data/presensi/stpUsers.ts');
    const content = fs.readFileSync(stpUsersPath, 'utf8');

    // Memastikan tidak ada atribut passwordDefault di master data
    const forbiddenSample = ['Stp', 'User', '2026!'].join('');
    expect(content.includes('passwordDefault')).toBe(false);
    expect(content.includes(forbiddenSample)).toBe(false);
  });

  it('3. auth-helpers.ts client-side tidak boleh mengimpor stpUsers.ts', () => {
    const authHelpersPath = path.join(rootDir, 'src/lib/presensi/auth-helpers.ts');
    const content = fs.readFileSync(authHelpersPath, 'utf8');

    // Memastikan modul client auth-helpers tidak mem-bundle stpUsers
    expect(content.includes('@/data/presensi/stpUsers')).toBe(false);
    expect(content.includes('getStpUserProfileByEmail')).toBe(false);
  });

  it('4. booking.service.ts tidak mengimpor MOCK_BOOKINGS secara statis atau fallback ke mock data di getAllBookingsData', () => {
    const bookingServicePath = path.join(rootDir, 'src/services/booking.service.ts');
    const content = fs.readFileSync(bookingServicePath, 'utf8');

    // Memastikan tidak ada import statis
    expect(content).not.toMatch(/^import\s+.*MOCK_BOOKINGS.*from/m);

    // Memastikan getAllBookingsData tidak me-return MOCK_BOOKINGS
    expect(content).not.toContain('return MOCK_BOOKINGS;');
  });

  it('5. bookingMockData.ts telah disanitasi dari nomor telepon pribadi & email riil', () => {
    const mockPath = path.join(rootDir, 'src/data/mock/bookingMockData.ts');
    const content = fs.readFileSync(mockPath, 'utf8');

    // Memastikan nomor telepon riil yang ditemukan di scan fortis sudah bersih
    expect(content.includes('081399887766')).toBe(false);
    expect(content.includes('081233445566')).toBe(false);
    expect(content.includes('085611223344')).toBe(false);
    expect(content.includes('087899001122')).toBe(false);

    // Memastikan email pribadi yang ditemukan di scan fortis sudah bersih
    expect(content.includes('finance@ruangmaju.com')).toBe(false);
    expect(content.includes('rina@inovasikreatif.id')).toBe(false);
    expect(content.includes('ilham@universitas-surakarta.ac.id')).toBe(false);
    expect(content.includes('anita@solocreative.tv')).toBe(false);
  });

  it('6. Placeholder form publik telah disanitasi dari email nyata', () => {
    const loginPagePath = path.join(rootDir, 'src/app/(presensi)/presensi/login/page.tsx');
    const loginContent = fs.readFileSync(loginPagePath, 'utf8');
    const forbiddenSample = ['Stp', 'User', '2026!'].join('');
    expect(loginContent.includes('agus.jatmiko@solotechnopark.id')).toBe(false);
    expect(loginContent.includes(forbiddenSample)).toBe(false);

    const b2bPath = path.join(rootDir, 'src/app/(public)/fasilitas/components/B2BPackageCalculator.tsx');
    const b2bContent = fs.readFileSync(b2bPath, 'utf8');
    expect(b2bContent.includes('nama@instansi.go.id')).toBe(false);
  });
});

