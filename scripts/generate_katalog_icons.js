// scratch/generate_katalog_icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Definisikan SVG Icon Katalog Solo Technopark
// Menggunakan identitas resmi Solo Technopark:
// Dua roda gigi bertaut (Merah dan Abu-abu Metalik) dengan tipografi modern & badge KATALOG
const katalogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Deep Midnight Slate Technopark -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Subtle Radial Glow in Center -->
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Red Gear Gradient (Warna Resmi STP Merah) -->
    <linearGradient id="redGearGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ff4d4f" />
      <stop offset="40%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>

    <!-- Silver/Slate Gear Gradient (Warna Resmi STP Abu-abu) -->
    <linearGradient id="silverGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1f5f9" />
      <stop offset="50%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#64748b" />
    </linearGradient>

    <!-- Badge Pill Gradient -->
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5" />
    </filter>

    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0284c7" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- 1. Background Rounded Canvas -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="112" fill="url(#centerGlow)" />
  
  <!-- Subtle Border Rim -->
  <rect x="2" y="2" width="508" height="508" rx="110" fill="none" stroke="#334155" stroke-width="2.5" stroke-opacity="0.6" />

  <!-- Inner Soft Ring -->
  <circle cx="256" cy="225" r="170" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="4 6" opacity="0.6" />

  <!-- 2. Dual Gears Assembly (Solo Technopark Official Symbolism) -->
  <g filter="url(#gearShadow)">
    
    <!-- A. RODA GIGI ABU-ABU / SILVER (Posisi Kanan Bawah) -->
    <g transform="translate(295, 255)">
      <!-- 10 Teeth Cogwheel Path -->
      <path d="
        M 0,-85 L 16,-85 L 21,-65 L 43,-73 L 57,-58 L 50,-37 L 70,-26 L 81,-42 L 95,-32 L 85,-11 
        L 100,5 L 105,-9 L 118,5 L 104,22 L 113,42 L 95,50 L 98,72 L 78,76 L 68,96 L 48,93 
        L 32,110 L 15,100 L -3,113 L -16,98 L -37,105 L -47,88 L -68,88 L -73,69 L -92,62 L -90,42 
        L -106,30 L -98,12 L -108,-6 L -94,-20 L -98,-40 L -80,-50 L -78,-70 L -58,-72 L -50,-90 L -30,-85 
        Z"
        fill="url(#silverGearGrad)" />
      <!-- Gear Center Hole -->
      <circle cx="5" cy="10" r="42" fill="#0f172a" />
      <circle cx="5" cy="10" r="42" fill="none" stroke="#64748b" stroke-width="3" opacity="0.5" />
      <circle cx="5" cy="10" r="20" fill="url(#silverGearGrad)" opacity="0.9" />
    </g>

    <!-- B. RODA GIGI MERAH (Posisi Kiri Atas - Prime Focus) -->
    <g transform="translate(210, 185)">
      <!-- 8 Teeth Bold Cogwheel Path -->
      <path d="
        M -24,-92 L 24,-92 L 32,-68 L 60,-60 L 82,-78 L 110,-50 L 92,-28 L 100,0 
        L 124,8 L 124,56 L 100,64 L 92,92 L 110,114 L 82,142 L 60,124 L 32,132 
        L 24,156 L -24,156 L -32,132 L -60,124 L -82,142 L -110,114 L -92,92 L -100,64 
        L -124,56 L -124,8 L -100,0 L -92,-28 L -110,-50 L -82,-78 L -60,-60 L -32,-68 
        Z"
        fill="url(#redGearGrad)" />
      <!-- Gear Center Hole with Inner Glow -->
      <circle cx="0" cy="32" r="46" fill="#0f172a" />
      <circle cx="0" cy="32" r="46" fill="none" stroke="#ef4444" stroke-width="3" opacity="0.6" />
      <!-- Small Center Core Pin -->
      <circle cx="0" cy="32" r="22" fill="url(#redGearGrad)" />
    </g>

  </g>

  <!-- 3. Dynamic Curved Accent Flow (Melambangkan 'S' Solo & Inovasi Hijau/Cyan) -->
  <path d="M 130 260 C 120 310, 160 340, 205 320 C 235 305, 220 280, 200 285 C 180 290, 170 310, 190 315" 
        fill="none" stroke="#22c55e" stroke-width="5" stroke-linecap="round" opacity="0.95" />

  <!-- 4. Banner Brand Label: SOLO TECHNOPARK -->
  <g transform="translate(256, 395)">
    <!-- Pill Background Container -->
    <rect x="-140" y="-22" width="280" height="44" rx="22" fill="url(#badgeGrad)" filter="url(#badgeShadow)" />
    <rect x="-139" y="-21" width="278" height="42" rx="21" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.3" />
    
    <!-- Text KATALOG STP -->
    <text x="0" y="7" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-size="18" 
          font-weight="900" 
          letter-spacing="4" 
          fill="#ffffff" 
          text-anchor="middle">
      KATALOG STP
    </text>
  </g>

  <!-- 5. Subtitle Tagline: OFFICIAL TECHNOPARK -->
  <text x="256" y="445" 
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        font-size="11" 
        font-weight="700" 
        letter-spacing="3" 
        fill="#94a3b8" 
        text-anchor="middle"
        opacity="0.85">
    SOLO TECHNOPARK
  </text>
</svg>
`;

async function main() {
  const katalogDir = path.join(__dirname, '..', 'public', 'icons', 'katalog');
  if (!fs.existsSync(katalogDir)) {
    fs.mkdirSync(katalogDir, { recursive: true });
  }

  // 1. Simpan SVG
  const svgPath = path.join(katalogDir, 'icon.svg');
  fs.writeFileSync(svgPath, katalogSvg.trim());
  console.log('✓ icon.svg created at:', svgPath);

  const svgBuffer = Buffer.from(katalogSvg);

  // 2. Render icon 512x512
  const p512 = path.join(katalogDir, 'icon-512x512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile(p512);
  console.log('✓ icon-512x512.png created');

  // 3. Render icon-maskable 512x512 (dengan padding aman 10%)
  const maskableSvg = katalogSvg.replace('width="512" height="512"', 'width="430" height="430"');
  const maskableInner = await sharp(Buffer.from(maskableSvg)).resize(430, 430).png().toBuffer();
  const pMaskable = path.join(katalogDir, 'icon-maskable.png');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
  .composite([{ input: maskableInner, gravity: 'center' }])
  .png()
  .toFile(pMaskable);
  console.log('✓ icon-maskable.png created');

  // 4. Render icon 192x192
  const p192 = path.join(katalogDir, 'icon-192x192.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(p192);
  console.log('✓ icon-192x192.png created');

  // 5. Render apple-touch-icon 180x180
  const p180 = path.join(katalogDir, 'apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(p180);
  console.log('✓ apple-touch-icon.png created');

  // 6. OVERWRITE ROOT ICONS:
  // public/icon-192x192.png dan public/icon-512x512.png
  // agar main aplikasi TIDAK LAGI menggunakan icon presensi!
  const root192 = path.join(__dirname, '..', 'public', 'icon-192x192.png');
  const root512 = path.join(__dirname, '..', 'public', 'icon-512x512.png');
  await sharp(svgBuffer).resize(192, 192).png().toFile(root192);
  await sharp(svgBuffer).resize(512, 512).png().toFile(root512);
  console.log('✓ Overwrote public/icon-192x192.png & public/icon-512x512.png with KATALOG icon!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
