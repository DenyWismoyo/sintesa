// functions/src/callables/alumniClaim.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

const INTERNAL_STAFF_ROLES = new Set([
  "super_admin",
  "admin",
  "admin_keuangan",
  "kasir",
  "kasir_pengeluaran",
  "admin_aset",
  "operator_aset",
  "admin_tenant",
  "operator_tenant",
  "admin_pelatihan",
  "operator_pelatihan",
  "admin_produksi",
  "operator_produksi",
  "pegawai",
]);

/**
 * Cloud Function v2 Callable: Klaim Akun Alumni Terverifikasi (STP & RSKB Kota Surakarta)
 * Memvalidasi kode unik AL-YYYY-XXXXXX / RSKB-YYYY-XXXXXX secara atomik di server,
 * menghubungkan dokumen alumnis/{id} dengan users/{uid}, dan menyematkan Custom Claims
 * { role: 'alumni', alumniId, isAlumni: true } secara instan tanpa perlu relogin.
 */
export const claimAlumniAccount = onCall(async (request) => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan untuk mengklaim akun alumni.");
  }

  const uid = request.auth.uid;
  const authEmail = request.auth.token?.email || "";
  const rawCode = typeof request.data?.registrationCode === "string"
    ? request.data.registrationCode
    : "";
  const cleanCode = rawCode.trim().toUpperCase();
  const appId = process.env.APP_ID || request.data?.appId || "blud-app-dev";

  if (!cleanCode || cleanCode.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Format kode klaim tidak valid. Masukkan kode resmi seperti AL-2026-XXXXXX atau RSKB-2026-XXXXXX."
    );
  }

  // 2. Cari dokumen alumni berdasarkan registrationCode
  const db = getDb();
  const snap = await db
    .collection("alumnis")
    .where("registrationCode", "==", cleanCode)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new HttpsError(
      "not-found",
      "Kode registrasi tidak ditemukan. Pastikan penulisan kode sesuai dengan yang diberikan oleh Admin Pelatihan / RSKB."
    );
  }

  const alumniDoc = snap.docs[0];
  const alumniId = alumniDoc.id;
  const alumniData = alumniDoc.data();

  if (
    alumniData.status === "CLAIMED" &&
    alumniData.claimedByUserId &&
    alumniData.claimedByUserId !== uid
  ) {
    throw new HttpsError(
      "already-exists",
      "Kode registrasi ini sudah diklaim oleh akun lain. Hubungi Admin Pelatihan STP jika terjadi kesalahan."
    );
  }

  const now = Date.now();
  let targetRole = "alumni";

  // 3. Transaksi Atomik: Update alumnis/{alumniId} + users/{uid}
  await db.runTransaction(async (tx) => {
    const freshAlumniSnap = await tx.get(alumniDoc.ref);
    if (!freshAlumniSnap.exists) {
      throw new HttpsError("not-found", "Data alumni tidak ditemukan.");
    }

    const freshAlumni = freshAlumniSnap.data()!;
    if (
      freshAlumni.status === "CLAIMED" &&
      freshAlumni.claimedByUserId &&
      freshAlumni.claimedByUserId !== uid
    ) {
      throw new HttpsError("already-exists", "Kode registrasi baru saja diklaim oleh akun lain.");
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await tx.get(userRef);
    const existingRole = userSnap.exists ? (userSnap.data()?.role as string | undefined) : undefined;

    // Jangan menimpa role staf internal, tenant, atau mitra industri yang sudah aktif
    if (
      existingRole &&
      (INTERNAL_STAFF_ROLES.has(existingRole) ||
        existingRole === "tenant" ||
        existingRole === "industri" ||
        existingRole === "investor" ||
        existingRole === "kampus")
    ) {
      targetRole = existingRole;
    } else {
      targetRole = "alumni";
    }

    const alumniUpdates: Record<string, any> = {
      status: "CLAIMED",
      claimedByUserId: uid,
      claimedAt: freshAlumni.claimedAt || now,
      isVerified: true,
    };

    if (!freshAlumni.email && authEmail) {
      alumniUpdates.email = authEmail;
    }

    tx.update(alumniDoc.ref, alumniUpdates);

    tx.set(
      userRef,
      {
        role: targetRole,
        alumniId,
        isAlumni: true,
        alumniOrigin: freshAlumni.originSource || "STP_VOKASI",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  // 4. Sematkan Custom Claims langsung ke Firebase Auth agar getIdToken(true) di client instan
  try {
    const userRecord = await admin.auth().getUser(uid);
    const existingClaims = userRecord.customClaims || {};
    await admin.auth().setCustomUserClaims(uid, {
      ...existingClaims,
      role: targetRole,
      alumniId,
      isAlumni: true,
    });
  } catch (claimErr) {
    console.error(`[ALUMNI CLAIM] Gagal memperbarui Custom Claims untuk UID ${uid}:`, claimErr);
  }

  // 5. Sinkronisasi status di cache_alumnis/master secara best-effort
  try {
    const cacheRef = db.collection(`artifacts/${appId}/public/data/cache_alumnis`).doc("master");
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data();
      if (cacheData && Array.isArray(cacheData.data)) {
        const updatedList = cacheData.data.map((item: any) =>
          item.id === alumniId
            ? { ...item, status: "CLAIMED", isVerified: true }
            : item
        );
        await cacheRef.update({
          data: updatedList,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  } catch (cacheErr) {
    console.warn("[ALUMNI CLAIM] Lewati sinkronisasi parsial cache_alumnis:", cacheErr);
  }

  // 6. Enqueue email konfirmasi klaim status alumni secara best-effort
  const recipientEmail = (authEmail || alumniData.email || "").trim().toLowerCase();
  if (recipientEmail && recipientEmail.includes("@")) {
    try {
      const originLabels: Record<string, string> = {
        STP_VOKASI: "Diklat Vokasi Solo Technopark",
        RSKB_SURAKARTA: "Rumah Siap Kerja Bersama (RSKB) Surakarta",
        PEMKOT_PROGRAM: "Program Ketenagakerjaan Pemkot Surakarta",
        MITRA_KAMPUS: "Kolaborasi Kampus & Akademi",
      };
      const originKey = String(alumniData.originSource || "STP_VOKASI");
      await db.collection("mail_queue").add({
        to: recipientEmail,
        template: "ALUMNI_CLAIMED",
        subject: "Selamat! Status Alumni Terverifikasi Anda Telah Aktif - Solo Technopark",
        payload: {
          userName: alumniData.name || request.auth.token?.name || "Alumni",
          programTaken: alumniData.programTaken || "Program Pelatihan Vokasi",
          originLabel: originLabels[originKey] || "Alumni Terverifikasi Solo Technopark",
          registrationCode: cleanCode,
        },
        status: "QUEUED",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (mailErr) {
      console.warn("[ALUMNI CLAIM] Gagal menjadwalkan email konfirmasi alumni:", mailErr);
    }
  }

  return {
    success: true,
    alumniId,
    role: targetRole,
    name: alumniData.name || "",
    originSource: alumniData.originSource || "STP_VOKASI",
    programTaken: alumniData.programTaken || "",
  };
});

