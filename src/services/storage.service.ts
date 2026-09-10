import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressImage, sanitizeFileName } from '@/lib/imageCompression';

export const storageService = {
  /**
   * Mengunggah gambar ke Firebase Storage (dengan kompresi klien otomatis).
   * @param file File gambar fisik
   * @param folderPath Path folder (contoh: 'assets', 'tenants/123/logos')
   * @returns URL download publik
   */
  uploadImage: async (file: File, folderPath: string): Promise<string> => {
    try {
      const compressedFile = await compressImage(file);
      const safeName = sanitizeFileName(file.name);
      const fullPath = `${folderPath}/${Date.now()}_${safeName}`;
      
      const storageRef = ref(storage, fullPath);
      const uploadTask = await uploadBytesResumable(storageRef, compressedFile, {
        contentType: compressedFile.type,
      });

      return await getDownloadURL(uploadTask.ref);
    } catch (error) {
      console.error('[STORAGE SERVICE] Gagal mengunggah gambar:', error);
      throw new Error('Gagal mengunggah gambar. Silakan coba lagi.');
    }
  },

  /**
   * Mengunggah dokumen/file umum (PDF, Video, dll) ke Firebase Storage.
   * @param file File fisik
   * @param folderPath Path folder tujuan
   * @returns URL download publik
   */
  uploadFile: async (file: File, folderPath: string): Promise<string> => {
    try {
      const safeName = sanitizeFileName(file.name);
      const fullPath = `${folderPath}/${Date.now()}_${safeName}`;
      
      const storageRef = ref(storage, fullPath);
      const uploadTask = await uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      return await getDownloadURL(uploadTask.ref);
    } catch (error) {
      console.error('[STORAGE SERVICE] Gagal mengunggah file:', error);
      throw new Error('Gagal mengunggah file. Silakan coba lagi.');
    }
  },

  /**
   * Menghapus file dari Firebase Storage untuk mencegah penumpukan file sampah (orphaned files).
   * @param fileUrl URL download publik file
   */
  deleteFile: async (fileUrl: string | undefined | null): Promise<void> => {
    try {
      if (!fileUrl) return;
      // Validasi URL Firebase Storage
      if (!fileUrl.includes('firebasestorage.googleapis.com') && !fileUrl.startsWith('gs://')) {
        return;
      }

      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      console.log(`[STORAGE] Berhasil menghapus file: ${fileUrl}`);
    } catch (error: any) {
      // Jika file sudah tidak ada (404 / object-not-found), jangan melempar error
      if (error?.code === 'storage/object-not-found') {
        return;
      }
      console.warn('[STORAGE] Gagal menghapus file (bukan error fatal):', error);
    }
  }
};