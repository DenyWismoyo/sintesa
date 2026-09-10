// Lokasi file: src/triggers/customClaims.ts
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Trigger ini mendengarkan perubahan pada koleksi 'users'.
 * Jika Super Admin merubah role seseorang (misal dari 'public' ke 'kasir'),
 * server akan otomatis menanamkan Custom Claim 'role: kasir' ke dalam token Auth user tersebut.
 */
export const syncUserRoleToClaims = onDocumentWritten("users/{userId}", async (event) => {
  const snapshotAfter = event.data?.after;
  const userId = event.params.userId;

  try {
    // Jika akun dihapus dari database
    if (!snapshotAfter?.exists) {
      // Cabut semua hak akses
      await admin.auth().setCustomUserClaims(userId, { role: null });
      return;
    }

    const userData = snapshotAfter.data();
    const newRole = userData?.role || 'public';

    // Dapatkan klaim user saat ini
    const userRecord = await admin.auth().getUser(userId);
    const currentClaims = userRecord.customClaims || {};

    // Jika rolenya berbeda dengan klaim saat ini, perbarui klaimnya
    if (currentClaims.role !== newRole) {
      await admin.auth().setCustomUserClaims(userId, {
        ...currentClaims,
        role: newRole
      });
      console.log(`[CUSTOM CLAIMS] Role untuk UID ${userId} berhasil diupdate menjadi: ${newRole}`);
    }

  } catch (error) {
    console.error(`[CUSTOM CLAIMS ERROR] Gagal mengupdate klaim untuk UID ${userId}:`, error);
  }
});
