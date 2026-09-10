// Lokasi file: src/lib/imageUtils.ts

/**
 * Fungsi utilitas untuk mendapatkan URL thumbnail dari URL Firebase Storage asli.
 * Berguna untuk menampilkan gambar di daftar/grid agar load aplikasi sangat cepat.
 * @param originalUrl URL Firebase Storage asli (yang dihasilkan oleh getDownloadURL)
 * @returns URL yang mengarah ke file thumbnail (jika ada)
 */
export const getThumbnailUrl = (originalUrl: string | undefined | null): string => {
  if (!originalUrl) return '/placeholder-image.jpg'; // Ganti dengan path placeholder Anda
  
  // Pastikan ini adalah URL dari Firebase Storage
  if (!originalUrl.includes('firebasestorage.googleapis.com')) {
    return originalUrl;
  }

  try {
    // Firebase URL structure:
    // https://firebasestorage.googleapis.com/v0/b/.../o/folder%2Ffilename.jpg?alt=media&token=...
    
    // 1. Pisahkan URL dasar dengan parameternya (?alt=media...)
    const [baseUrl, queryParams] = originalUrl.split('?');
    
    // 2. Ambil bagian path file terakhir (setelah %2F terakhir jika ada)
    const pathSegments = baseUrl.split('%2F');
    const fileName = pathSegments.pop(); // Ambil elemen terakhir (nama file)
    
    if (!fileName) return originalUrl;

    // 3. Tambahkan prefix 'thumb_' dan ganti ekstensi menjadi .webp (karena sharp kita set ke webp)
    // Menghapus ekstensi lama (misal .jpg/.png) dan mengganti ke .webp
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const thumbFileName = `thumb_${fileNameWithoutExt}.webp`;
    
    // 4. Gabungkan kembali
    pathSegments.push(thumbFileName);
    const newBaseUrl = pathSegments.join('%2F');
    
    // 5. Kembalikan URL lengkap dengan query params
    return queryParams ? `${newBaseUrl}?${queryParams}` : newBaseUrl;

  } catch (error) {
    console.error("Error parsing thumbnail URL:", error);
    return originalUrl; // Fallback ke gambar asli jika gagal parse
  }
};

/**
 * Fungsi utilitas untuk mendapatkan URL thumbnail khusus untuk keperluan penghapusan (Deletion).
 * Secara default backend (Cloud Functions) akan menghapus otomatis, 
 * namun fungsi ini dapat digunakan jika butuh force delete dari sisi klien.
 * @param originalUrl URL Firebase Storage asli
 * @returns URL yang mengarah ke file thumbnail
 */
export const getThumbnailUrlForDeletion = (originalUrl: string): string | null => {
  if (!originalUrl || !originalUrl.includes('firebasestorage.googleapis.com')) {
    return null;
  }
  return getThumbnailUrl(originalUrl);
};