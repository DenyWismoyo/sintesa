// functions/src/callables/partnerOnboarding.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

const ALLOWED_ADMIN_ROLES = [
  "super_admin",
  "admin",
  "admin_pelatihan",
  "admin_tenant",
  "admin_aset",
];

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
 * Cloud Function v2 Callable: Konversi Pengajuan Calon Mitra (/kemitraan) menjadi Akun Mitra Resmi (/mitra)
 * Hanya dapat dipanggil oleh Admin berwenang (validasi via Custom Claims).
 */
export const convertInquiryToPartner = onCall(async (request) => {
  // 1. Auth Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login diperlukan.");
  }

  // 2. Role Check via Custom Claims (sesuai standar keamanan Sintesa)
  const callerRole = request.auth.token?.role as string | undefined;
  if (!callerRole || !ALLOWED_ADMIN_ROLES.includes(callerRole)) {
    throw new HttpsError(
      "permission-denied",
      "Hak akses tidak mencukupi untuk mengaktifkan akun Mitra Resmi."
    );
  }

  // 3. Input Validation
  const inquiryId = typeof request.data?.inquiryId === "string" ? request.data.inquiryId.trim() : "";
  if (!inquiryId) {
    throw new HttpsError("invalid-argument", "ID pengajuan kemitraan (inquiryId) wajib disertakan.");
  }

  const appId = process.env.APP_ID || request.data?.appId || "blud-app-dev";
  const requestedTier = request.data?.tier || "HIRING_PARTNER";
  const industrySector = request.data?.industrySector || "Teknologi & Industri";
  const location = request.data?.location || "Surakarta, Jawa Tengah";

  const db = getDb();
  const inquiryRef = db
    .collection(`artifacts/${appId}/public/data/partnership_inquiries`)
    .doc(inquiryId);
  const inquirySnap = await inquiryRef.get();

  if (!inquirySnap.exists) {
    throw new HttpsError("not-found", "Dokumen pengajuan kemitraan tidak ditemukan.");
  }

  const inquiry = inquirySnap.data()!;
  const cleanEmail = String(inquiry.picEmail || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new HttpsError("invalid-argument", "Email PIC pada pengajuan kemitraan tidak valid.");
  }

  // Idempotency: jika sudah pernah dikonversi sebelumnya
  if (inquiry.convertedPartnerId) {
    const existingPartnerSnap = await db.collection("partners").doc(inquiry.convertedPartnerId).get();
    if (existingPartnerSnap.exists) {
      return {
        success: true,
        alreadyConverted: true,
        partnerId: inquiry.convertedPartnerId,
        picEmail: cleanEmail,
        isNewAccount: false,
        tempPassword: null,
      };
    }
  }

  // 4. Cari atau Buat Akun Firebase Auth untuk PIC Mitra
  let userRecord: admin.auth.UserRecord;
  let isNewAccount = false;
  let tempPassword: string | null = null;

  try {
    userRecord = await admin.auth().getUserByEmail(cleanEmail);
  } catch (err: any) {
    if (err?.code === "auth/user-not-found") {
      tempPassword = `MitraSTP@${Math.random().toString(36).slice(-6).toUpperCase()}9`;
      userRecord = await admin.auth().createUser({
        email: cleanEmail,
        password: tempPassword,
        displayName: inquiry.picName || inquiry.agencyName || "Mitra Industri STP",
      });
      isNewAccount = true;
    } else {
      throw new HttpsError("internal", "Gagal memeriksa akun autentikasi PIC: " + err.message);
    }
  }

  const now = Date.now();
  const partnerRef = db.collection("partners").doc();
  const partnerId = partnerRef.id;

  const userRef = db.collection("users").doc(userRecord.uid);
  const existingUserSnap = await userRef.get();
  const existingUserRole = existingUserSnap.exists
    ? (existingUserSnap.data()?.role as string | undefined)
    : undefined;

  // Jangan menurunkan hak akses jika email kebetulan milik staf internal
  const targetRole =
    existingUserRole && INTERNAL_STAFF_ROLES.has(existingUserRole)
      ? existingUserRole
      : "industri";

  // 5. Batch Write Atomik: partners/{partnerId} + users/{uid} + partnership_inquiries/{inquiryId}
  const batch = db.batch();

  batch.set(partnerRef, {
    inquiryId,
    companyName: inquiry.agencyName || "Mitra Industri STP",
    agencyType: inquiry.agencyType || "Perusahaan Swasta / Multinasional",
    industrySector,
    location,
    description: inquiry.proposalSummary || "",
    picName: inquiry.picName || "",
    picPosition: inquiry.picPosition || "",
    picEmail: cleanEmail,
    picPhone: inquiry.picPhone || "",
    picUserId: userRecord.uid,
    tier: requestedTier,
    isVerified: true,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  batch.set(
    userRef,
    {
      email: cleanEmail,
      name: inquiry.picName || inquiry.agencyName || "PIC Mitra",
      role: targetRole,
      partnerId,
      companyName: inquiry.agencyName || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.update(inquiryRef, {
    status: "CLOSED",
    convertedPartnerId: partnerId,
    convertedAt: now,
    adminNotes: inquiry.adminNotes
      ? `${inquiry.adminNotes}\n[Sistem] Dikonversi menjadi Akun Mitra Resmi (${partnerId})`
      : `[Sistem] Dikonversi menjadi Akun Mitra Resmi (${partnerId})`,
  });

  await batch.commit();

  // 6. Sematkan Custom Claims agar login PIC langsung mengenali role 'industri' & partnerId
  try {
    const existingClaims = userRecord.customClaims || {};
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      ...existingClaims,
      role: targetRole,
      partnerId,
    });
  } catch (claimErr) {
    console.error(`[PARTNER ONBOARDING] Gagal setCustomUserClaims untuk ${userRecord.uid}:`, claimErr);
  }

  // 7. Enqueue email aktivasi akun Mitra Resmi ke PIC perusahaan secara otomatis
  try {
    const tierLabels: Record<string, string> = {
      STRATEGIC_PARTNER: "Strategic Partner Kawasan",
      HIRING_PARTNER: "Hiring Partner Resmi",
      RESEARCH_PARTNER: "Research & Innovation Partner",
    };
    await db.collection("mail_queue").add({
      to: cleanEmail,
      template: "PARTNER_ONBOARDED",
      subject: `Aktivasi Akun Mitra Resmi: ${inquiry.agencyName || "Mitra Industri"} - Solo Technopark`,
      payload: {
        picName: inquiry.picName || inquiry.agencyName || "Bapak/Ibu PIC",
        companyName: inquiry.agencyName || "Mitra Industri STP",
        tierLabel: tierLabels[requestedTier] || "Hiring Partner Resmi",
        picEmail: cleanEmail,
        tempPassword,
        isNewAccount,
      },
      status: "QUEUED",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (mailErr) {
    console.warn("[PARTNER ONBOARDING] Gagal menjadwalkan email onboarding mitra:", mailErr);
  }

  return {
    success: true,
    alreadyConverted: false,
    partnerId,
    picUid: userRecord.uid,
    picEmail: cleanEmail,
    companyName: inquiry.agencyName || "",
    isNewAccount,
    tempPassword,
  };
});

