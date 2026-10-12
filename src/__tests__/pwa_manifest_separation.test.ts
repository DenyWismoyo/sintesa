import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import manifest from '@/app/manifest';

describe('PWA Manifest & Icon Separation Suite', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const katalogIconsDir = path.join(publicDir, 'icons', 'katalog');
  const presensiIconsDir = path.join(publicDir, 'icons', 'presensi');

  it('1. manifest.ts harus menghasilkan konfigurasi resmi PWA Katalog STP', () => {
    const m = manifest();
    expect(m.name).toContain('Katalog Solo Technopark');
    expect(m.short_name).toBe('Katalog STP');
    expect(m.start_url).toBe('/');
    expect(m.scope).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#ffffff');
    expect(m.background_color).toBe('#ffffff');

    // Memastikan icons katalog terdaftar
    const iconSrcs = m.icons?.map(i => i.src) || [];
    expect(iconSrcs).toContain('/icons/katalog/icon-192x192.png');
    expect(iconSrcs).toContain('/icons/katalog/icon-512x512.png');
    expect(iconSrcs).toContain('/icons/katalog/icon-maskable.png');
    expect(iconSrcs).toContain('/icons/katalog/apple-touch-icon.png');
    expect(iconSrcs).toContain('/icons/katalog/icon.svg');
    expect(iconSrcs).toContain('/icon-192x192.png');
    expect(iconSrcs).toContain('/icon-512x512.png');

    // Memastikan TIDAK menggunakan icon presensi
    const hasPresensiIcon = iconSrcs.some(src => src.includes('presensi'));
    expect(hasPresensiIcon).toBe(false);
  });

  it('2. Seluruh file icon katalog harus tersedia di public/icons/katalog/', () => {
    expect(fs.existsSync(path.join(katalogIconsDir, 'icon-192x192.png'))).toBe(true);
    expect(fs.existsSync(path.join(katalogIconsDir, 'icon-512x512.png'))).toBe(true);
    expect(fs.existsSync(path.join(katalogIconsDir, 'icon-maskable.png'))).toBe(true);
    expect(fs.existsSync(path.join(katalogIconsDir, 'apple-touch-icon.png'))).toBe(true);
    expect(fs.existsSync(path.join(katalogIconsDir, 'icon.svg'))).toBe(true);
  });

  it('3. Icon root public/icon-192x192.png harus berbeda dari icon presensi (tidak tertukar)', () => {
    const rootIconBuf = fs.readFileSync(path.join(publicDir, 'icon-192x192.png'));
    const presensiIconBuf = fs.readFileSync(path.join(presensiIconsDir, 'icon-192x192.png'));

    // File buffer harus berbeda karena icon katalog menggunakan roda gigi STP, bukan perisai sidik jari
    expect(rootIconBuf.equals(presensiIconBuf)).toBe(false);
  });

  it('4. Icon presensi tetap aman di public/icons/presensi/', () => {
    expect(fs.existsSync(path.join(presensiIconsDir, 'icon-192x192.png'))).toBe(true);
    expect(fs.existsSync(path.join(presensiIconsDir, 'icon-512x512.png'))).toBe(true);
    expect(fs.existsSync(path.join(presensiIconsDir, 'icon-maskable.png'))).toBe(true);
  });
});
