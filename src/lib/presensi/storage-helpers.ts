// src/lib/presensi/storage-helpers.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { presensiStorage, presensiDefaultStorage } from "@/lib/firebase";
import { uploadAsnFileServerAction } from "@/actions/presensi/storage";
import { UploadedFileMetadata } from "@/types/presensi";

export interface UploadFileOptions {
  file: File | Blob;
  fileName: string;
  userId: string;
  orgId: string;
  type: "foto" | "dokumen";
  kegiatanId?: string;
  kegiatanDeskripsi?: string;
}

/**
 * Konversi Blob atau File ke string base64 untuk fallback upload Server Action
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Membuat struktur path penyimpanan hierarkis resmi di Cloud Storage:
 * swafoto-presensi/{orgId}/{userId}/{year}/{month}/{uniqueFilename}
 */
export function generateAsnStoragePath(
  orgId: string,
  userId: string,
  fileName: string
): string {
  const rootFolder = "swafoto-presensi";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePrefix = Date.now().toString(36);
  return `${rootFolder}/${orgId}/${userId}/${year}/${month}/${uniquePrefix}_${cleanName}`;
}

/**
 * Upload file/swafoto presensi atau berkas LKH dengan mekanisme 3-Lapis Fallback:
 * 1. Client SDK (Bucket Presensi gs://presensi-solo-technopark)
 * 2. Client SDK (Default Bucket gs://katalog-solo-technopark.firebasestorage.app)
 * 3. Server Action (Firebase Admin SDK — Bypass CORS & Storage Rules 100%)
 */
export async function uploadAsnFile(
  options: UploadFileOptions
): Promise<UploadedFileMetadata> {
  const { file, fileName, userId, orgId, type, kegiatanId, kegiatanDeskripsi } = options;
  const storagePath = generateAsnStoragePath(orgId, userId, fileName);
  const mimeType = file.type || (type === "foto" ? "image/jpeg" : "application/pdf");
  const nowIso = new Date().toISOString();

  // LAPIS 1: Coba upload langsung via Client SDK ke Bucket Presensi
  try {
    const storageRef = ref(presensiStorage, storagePath);
    const snap = await uploadBytes(storageRef, file, { contentType: mimeType });
    const downloadUrl = await getDownloadURL(snap.ref);

    return {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: fileName,
      sizeBytes: file.size,
      mimeType,
      url: downloadUrl,
      uploadedAt: nowIso,
      kegiatanId,
      kegiatanDeskripsi,
      type,
    };
  } catch (clientErr) {
    console.warn(
      "[uploadAsnFile] Client SDK bucket presensi gagal (kemungkinan CORS / bucket belum aktif). Mencoba bucket default...",
      clientErr
    );

    // LAPIS 2: Coba upload ke default bucket via Client SDK
    try {
      const defaultRef = ref(presensiDefaultStorage, storagePath);
      const snap = await uploadBytes(defaultRef, file, { contentType: mimeType });
      const downloadUrl = await getDownloadURL(snap.ref);

      return {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        name: fileName,
        sizeBytes: file.size,
        mimeType,
        url: downloadUrl,
        uploadedAt: nowIso,
        kegiatanId,
        kegiatanDeskripsi,
        type,
      };
    } catch (defaultClientErr) {
      console.warn(
        "[uploadAsnFile] Client SDK default bucket juga gagal (CORS/Rules). Mengaktifkan fallback Server Action...",
        defaultClientErr
      );
    }
  }

  // LAPIS 3: Fallback ke Server Action (Firebase Admin SDK)
  // Berjalan di server backend Node.js sehingga bebas 100% dari batasan browser CORS dan client storage rules
  try {
    const base64Data = await blobToBase64(file);
    const serverResult = await uploadAsnFileServerAction({
      base64Data,
      fileName,
      storagePath,
      mimeType,
      userId,
      orgId,
      type,
      kegiatanId,
      kegiatanDeskripsi,
    });

    if (serverResult.success && serverResult.metadata) {
      return serverResult.metadata;
    }

    throw new Error(serverResult.error || "Gagal mengunggah foto via server.");
  } catch (serverErr) {
    const err = serverErr as Error;
    console.error("[uploadAsnFile] Seluruh metode upload gagal:", err);
    throw new Error(`Gagal mengunggah berkas/foto presensi: ${err.message}`);
  }
}
