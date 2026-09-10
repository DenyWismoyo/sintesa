import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Utilitas kompresi gambar klien sebelum diunggah ke Firebase Storage.
 * Mengurangi ukuran file foto kamera/smartphone dari 5-15MB menjadi < 1MB
 * sehingga proses upload cepat, hemat kuota user, dan hemat penyimpanan cloud.
 */
export const compressImage = async (
  file: File,
  customOptions?: CompressionOptions
): Promise<File> => {
  // Jika bukan gambar atau file berupa SVG/GIF (yang animasi tidak boleh di-resize statis)
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  const defaultOptions: CompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    ...customOptions,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.warn('[IMAGE COMPRESSION] Gagal mengompres gambar, menggunakan file asli:', error);
    return file;
  }
};

/**
 * Membersihkan nama file dari karakter ilegal, spasi, dan simbol berbahaya
 * untuk mencegah broken URL dan encoding error di Firebase Storage.
 */
export const sanitizeFileName = (fileName: string): string => {
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const name = parts.join('.');

  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeExt = ext ? ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';

  return safeExt ? `${safeName}.${safeExt}` : safeName;
};
