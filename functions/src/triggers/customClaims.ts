// Lokasi file: src/triggers/customClaims.ts
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  // lazy admin init handled inside handler
}

/**
 * Trigger ini mendengarkan perubahan pada koleksi 'users'.
 * Jika Super Admin merubah role seseorang (misal dari 'public' ke 'kasir'),
 * server akan otomatis menanamkan Custom Claim 'role: kasir' ke dalam token Auth user tersebut.
 */
export const syncUserRoleToClaims = onDocumentWritten("users/{userId}", async (event) => {
  if (!admin.apps.length) { admin.initializeApp(); }
  const snapshotBefore = event.data?.before;
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
    if (
      currentClaims.role !== newRole ||
      (userData?.partnerId && currentClaims.partnerId !== userData.partnerId) ||
      (userData?.tenantId && currentClaims.tenantId !== userData.tenantId) ||
      (userData?.alumniId && currentClaims.alumniId !== userData.alumniId)
    ) {
      await admin.auth().setCustomUserClaims(userId, {
        ...currentClaims,
        role: newRole,
        ...(userData?.partnerId ? { partnerId: userData.partnerId } : {}),
        ...(userData?.tenantId ? { tenantId: userData.tenantId } : {}),
        ...(userData?.alumniId ? { alumniId: userData.alumniId, isAlumni: true } : {}),
      });
      console.log(`[CUSTOM CLAIMS] Role untuk UID ${userId} berhasil diupdate menjadi: ${newRole}`);
    }

    const ROLE_DISPLAY_NAMES: Record<string, { label: string; path: string }> = {
      super_admin: { label: "Super Administrator", path: "/dashboard" },
      admin: { label: "Administrator Sistem", path: "/dashboard" },
      admin_keuangan: { label: "Admin Keuangan & Billing", path: "/billing" },
      kasir: { label: "Kasir Pendapatan (POS)", path: "/billing" },
      kasir_pengeluaran: { label: "Kasir Pengeluaran (AP)", path: "/billing" },
      admin_aset: { label: "Admin Aset & Booking", path: "/aset" },
      operator_aset: { label: "Operator Aset", path: "/aset" },
      admin_tenant: { label: "Admin Ekosistem Tenant", path: "/tenant" },
      operator_tenant: { label: "Operator Tenant", path: "/tenant" },
      admin_pelatihan: { label: "Admin Pelatihan (LMS)", path: "/pelatihan" },
      operator_pelatihan: { label: "Operator Pelatihan", path: "/pelatihan" },
      admin_produksi: { label: "Admin Layanan Jasa Produksi", path: "/jasa-produksi" },
      operator_produksi: { label: "Operator Bengkel & Produksi", path: "/jasa-produksi" },
      pegawai: { label: "Pegawai Solo Technopark", path: "/presensi" },
      tenant: { label: "Akun Tenant Startup", path: "/tenant/dashboard" },
      investor: { label: "Mitra Investor / VC", path: "/ekosistem" },
      kampus: { label: "Mitra Perguruan Tinggi", path: "/ekosistem" },
    };
    const beforeData = snapshotBefore?.exists ? snapshotBefore.data() : null;
    const beforeRole = beforeData?.role || null;
    const roleMeta = ROLE_DISPLAY_NAMES[newRole];
    const targetEmail = String(userData?.email || userRecord.email || "").trim().toLowerCase();

    if (
      snapshotBefore?.exists &&
      beforeRole !== newRole &&
      roleMeta &&
      targetEmail &&
      targetEmail.includes("@")
    ) {
      await admin.firestore().collection("mail_queue").add({
        to: targetEmail,
        template: "ROLE_PROMOTED",
        subject: `Pembaruan Hak Akses Akun (${roleMeta.label}) - Solo Technopark`,
        payload: {
          userName: userData?.name || userRecord.displayName || "Pengguna",
          email: targetEmail,
          newRoleLabel: roleMeta.label,
          dashboardPath: roleMeta.path,
        },
        status: "QUEUED",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // end role promotion mail
    }

  } catch (error) {
    console.error(`[CUSTOM CLAIMS ERROR] Gagal mengupdate klaim untuk UID ${userId}:`, error);
  }
});
