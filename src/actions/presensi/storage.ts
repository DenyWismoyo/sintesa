"use server";

import crypto from "crypto";
import { adminPresensiStorageBucket, adminDefaultStorageBucket, isFirebaseAdminConfigured } from "@/lib/presensi/firebase-admin";
import { UploadedFileMetadata } from "@/types/presensi";

export interface ServerUploadPayload {
  base64Data: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  userId: string;
  orgId: string;
  type: "foto" | "dokumen";
  kegiatanId?: string;
  kegiatanDeskripsi?: string;
}

export interface ServerUploadResult {
  success: boolean;
  metadata?: UploadedFileMetadata;
  error?: string;
}

/**
 * Server Action: Mengunggah file atau swafoto presensi ke Google Cloud Storage via Firebase Admin SDK.
 * Solusi 100% bebas dari batasan CORS browser dan Storage Rules client.
 */
export async function uploadAsnFileServerAction(
  payload: ServerUploadPayload
): Promise<ServerUploadResult> {
  try {
    const {
      base64Data,
      fileName,
      storagePath,
      mimeType,
      userId,
      orgId,
      type,
      kegiatanId,
      kegiatanDeskripsi,
    } = payload;

    if (!base64Data) {
      return { success: false, error: "Data file base64 tidak boleh kosong." };
    }

    // Bersihkan prefix data URL jika ada
    const cleanBase64 = base64Data.includes(",")
      ? base64Data.split(",")[1]
      : base64Data;

    const buffer = Buffer.from(cleanBase64, "base64");
    const downloadToken = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    let targetBucketName = process.env.NEXT_PUBLIC_PRESENSI_STORAGE_BUCKET || "presensi-solo-technopark";
    let bucket = adminPresensiStorageBucket();

    // 1. Coba simpan ke bucket sekunder (presensi-solo-technopark)
    try {
      const fileRef = bucket.file(storagePath);
      await fileRef.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            orgId,
            type,
          },
        },
      });
    } catch (bucketErr) {
      console.warn(
        `[Storage Server Action] Gagal mengunggah ke bucket '${targetBucketName}', mencoba fallback ke default bucket:`,
        bucketErr
      );
      // 2. Fallback ke bucket default proyek katalog-solo-technopark
      bucket = adminDefaultStorageBucket();
      targetBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "katalog-solo-technopark.firebasestorage.app";

      const fileRef = bucket.file(storagePath);
      await fileRef.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            userId,
            orgId,
            type,
          },
        },
      });
    }

    // Bentuk URL download resmi Firebase Storage yang valid dan langsung dapat diakses
    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
      targetBucketName
    )}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    const metadata: UploadedFileMetadata = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: fileName,
      sizeBytes: buffer.length,
      mimeType,
      url: downloadUrl,
      uploadedAt: nowIso,
      kegiatanId,
      kegiatanDeskripsi,
      type,
    };

    return {
      success: true,
      metadata,
    };
  } catch (err) {
    const error = err as Error;
    console.error("[uploadAsnFileServerAction] Error upload:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan internal saat mengunggah berkas via server.",
    };
  }
}
