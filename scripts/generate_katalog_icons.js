// scripts/generate_katalog_icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const katalogDir = path.join(publicDir, 'icons', 'katalog');

  if (!fs.existsSync(katalogDir)) {
    fs.mkdirSync(katalogDir, { recursive: true });
  }

  const logoSourcePath = path.join(publicDir, 'logo-stp.png');
  if (!fs.existsSync(logoSourcePath)) {
    throw new Error('File public/logo-stp.png tidak ditemukan!');
  }

  console.log('Menggunakan sumber logo:', logoSourcePath);

  // Helper function untuk membuat kanvas putih persegi dengan logo di tengah
  async function createSquareIcon({ size, logoWidth, outputPath }) {
    // 1. Resize logo sesuai logoWidth, pertahankan rasio aspek
    const resizedLogo = await sharp(logoSourcePath)
      .resize({ width: logoWidth, fit: 'inside' })
      .toBuffer();

    // 2. Buat kanvas putih murni (#ffffff)
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // Pure White #ffffff
      },
    })
      .composite([
        {
          input: resizedLogo,
          gravity: 'center',
        },
      ])
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`✓ Icon dibuat: ${path.basename(outputPath)} (${size}x${size})`);
  }

  // 1. icon-512x512.png (Ukuran 512x512, logo lebar 440px di tengah)
  await createSquareIcon({
    size: 512,
    logoWidth: 440,
    outputPath: path.join(katalogDir, 'icon-512x512.png'),
  });

  // 2. icon-maskable.png (Ukuran 512x512, logo di dalam safe zone maskable 380px)
  await createSquareIcon({
    size: 512,
    logoWidth: 380,
    outputPath: path.join(katalogDir, 'icon-maskable.png'),
  });

  // 3. icon-192x192.png (Ukuran 192x192, logo lebar 165px di tengah)
  await createSquareIcon({
    size: 192,
    logoWidth: 165,
    outputPath: path.join(katalogDir, 'icon-192x192.png'),
  });

  // 4. apple-touch-icon.png (Ukuran 180x180, logo lebar 155px di tengah)
  await createSquareIcon({
    size: 180,
    logoWidth: 155,
    outputPath: path.join(katalogDir, 'apple-touch-icon.png'),
  });

  // 5. Overwrite root icon-192x192.png & icon-512x512.png
  await createSquareIcon({
    size: 512,
    logoWidth: 440,
    outputPath: path.join(publicDir, 'icon-512x512.png'),
  });

  await createSquareIcon({
    size: 192,
    logoWidth: 165,
    outputPath: path.join(publicDir, 'icon-192x192.png'),
  });

  // 6. Buat icon.svg dengan kanvas putih dan embedded logo resolusi tinggi
  const logoBuffer = fs.readFileSync(logoSourcePath);
  const base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background Pure White -->
  <rect width="512" height="512" fill="#ffffff" rx="108" />
  
  <!-- Logo Solo Technopark Resmi di Tengah Kanvas -->
  <image 
    x="36" 
    y="134" 
    width="440" 
    height="243" 
    xlink:href="${base64Logo}" 
    preserveAspectRatio="xMidYMid meet" 
  />
</svg>
`;

  fs.writeFileSync(path.join(katalogDir, 'icon.svg'), svgContent.trim());
  console.log('✓ icon.svg dibuat di public/icons/katalog/icon.svg');

  console.log('=== SEMUA ICON PWA KATALOG BERLATAR PUTIH BERHASIL DIGENERATE ===');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
