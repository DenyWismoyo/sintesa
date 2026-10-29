// Lokasi file: functions/src/callables/authEmails.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { emailService } from "../services/emailService";
import {
  renderWelcomeVerificationEmail,
  renderPasswordResetEmail,
} from "../templates/emailTemplates";

function ensureAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

function getDb() {
  ensureAdmin();
  return admin.firestore();
}

function getAuth() {
  ensureAdmin();
  return admin.auth();
}

function getPortalOrigin(): string {
  const raw = (process.env.PUBLIC_PORTAL_URL || "https://katalog.solotechnopark.id").trim();
  return raw.replace(/\/portal\/?$/, "").replace(/\/$/, "");
}

const ROLE_LABELS_MAP: Record<string, string> = {
  public: "Pengguna Umum",
  alumni: "Alumni Terverifikasi STP / RSKB",
  industri: "Mitra Industri Resmi",
  tenant: "Tenant Startup",
  pegawai: "Pegawai Solo Technopark",
  admin: "Administrator Sistem",
  super_admin: "Super Administrator",
};

/**
 * Cloud Function v2 Callable: Pengiriman Email Autentikasi & Diagnostik SMTP Resmi
 * Mendukung aksi:
 * - WELCOME_VERIFICATION (terautentikasi): Kirim email selamat datang + link verifikasi Firebase Auth
 * - PASSWORD_RESET (publik dgn rate-limit): Kirim email reset sandi ber-branding Solo Technopark
 * - ADMIN_TEST_SMTP (khusus admin/super_admin via Custom Claims): Cek kesehatan Hostinger SMTP & kirim uji coba
 */
export const sendAuthLifecycleEmail = onCall(async (request) => {
  const action = typeof request.data?.action === "string"
    ? request.data.action.trim().toUpperCase()
    : "";

  if (!action) {
    throw new HttpsError("invalid-argument", "Parameter action wajib disertakan.");
  }

  const db = getDb();
  const auth = getAuth();
  const portalOrigin = getPortalOrigin();
  const now = Date.now();

  // =========================================================================
  // 1. WELCOME & VERIFICATION EMAIL (Untuk Pendaftaran Baru / Kirim Ulang)
  // =========================================================================
  if (action === "WELCOME_VERIFICATION") {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login diperlukan untuk mengirim email verifikasi.");
    }

    const uid = request.auth.uid;
    const userRecord = await auth.getUser(uid);
    const email = (userRecord.email || "").trim().toLowerCase();

    if (!email) {
      throw new HttpsError("failed-precondition", "Akun ini tidak memiliki alamat email aktif.");
    }

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};

    // Cooldown 60 detik agar tidak memicu spam berulang
    const lastSent = Number(userData?.lastVerificationEmailAt || 0);
    if (now - lastSent < 60_000) {
      return {
        success: true,
        throttled: true,
        alreadyVerified: userRecord.emailVerified,
        message: "Email konfirmasi baru saja dikirim. Silakan periksa kotak masuk atau folder Spam Anda.",
      };
    }

    const isGoogleAuth = userRecord.providerData.some((p) => p.providerId === "google.com");
    let verificationUrl: string | undefined;

    if (!userRecord.emailVerified) {
      try {
        verificationUrl = await auth.generateEmailVerificationLink(email, {
          url: `${portalOrigin}/profil?verified=1`,
        });
      } catch {
        try {
          verificationUrl = await auth.generateEmailVerificationLink(email);
        } catch (fallbackErr) {
          console.warn("[AuthEmails] Gagal generateEmailVerificationLink:", fallbackErr);
        }
      }
    }

    const currentRole = (userData?.role as string) || (request.auth.token?.role as string) || "public";
    const userName =
      userData?.name ||
      userRecord.displayName ||
      email.split("@")[0] ||
      "Pengguna Solo Technopark";

    const subject = userRecord.emailVerified
      ? "Selamat Datang di Ekosistem Digital Solo Technopark"
      : "Konfirmasi Pendaftaran & Verifikasi Email - Solo Technopark";

    const html = renderWelcomeVerificationEmail({
      userName,
      email,
      verificationUrl,
      roleLabel: ROLE_LABELS_MAP[currentRole] || "Pengguna Portal",
      isGoogleAuth,
    });

    const mailRes = await emailService.sendEmail({
      to: email,
      subject,
      html,
    });

    await userRef.set(
      {
        lastVerificationEmailAt: now,
      },
      { merge: true }
    );

    await db.collection("mail_queue").add({
      to: email,
      template: "WELCOME_VERIFICATION",
      subject,
      status: mailRes.success ? "SENT" : "FAILED",
      messageId: mailRes.messageId || null,
      simulated: Boolean(mailRes.simulated),
      error: mailRes.error || null,
      uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: mailRes.success,
      simulated: Boolean(mailRes.simulated),
      alreadyVerified: userRecord.emailVerified,
    };
  }

  // =========================================================================
  // 2. PASSWORD RESET EMAIL (Lupa Kata Sandi Ber-Branding Resmi STP)
  // =========================================================================
  if (action === "PASSWORD_RESET") {
    const rawEmail = typeof request.data?.email === "string" ? request.data.email : "";
    const cleanEmail = rawEmail.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new HttpsError("invalid-argument", "Masukkan format alamat email yang valid.");
    }

    // Rate-limit per email (1x per 60 detik) untuk mencegah penyalahgunaan publik
    const emailHash = crypto.createHash("sha256").update(cleanEmail).digest("hex").slice(0, 32);
    const throttleRef = db.collection("auth_mail_throttles").doc(emailHash);
    const throttleSnap = await throttleRef.get();

    if (throttleSnap.exists) {
      const lastResetAt = Number(throttleSnap.data()?.lastResetAt || 0);
      if (now - lastResetAt < 60_000) {
        return {
          success: true,
          throttled: true,
        };
      }
    }

    await throttleRef.set({ email: cleanEmail, lastResetAt: now }, { merge: true });

    let userRecord: admin.auth.UserRecord | null = null;
    try {
      userRecord = await auth.getUserByEmail(cleanEmail);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        // Anti-enumeration: tetap kembalikan sukses tanpa membocorkan eksistensi email
        return { success: true };
      }
      throw new HttpsError("internal", "Gagal memproses permintaan pengaturan ulang sandi.");
    }

    let resetUrl: string;
    try {
      resetUrl = await auth.generatePasswordResetLink(cleanEmail, {
        url: `${portalOrigin}/login?reset=1`,
      });
    } catch {
      resetUrl = await auth.generatePasswordResetLink(cleanEmail);
    }

    const userName = userRecord.displayName || cleanEmail.split("@")[0] || "Pengguna";
    const subject = "Instruksi Atur Ulang Kata Sandi - Solo Technopark";
    const html = renderPasswordResetEmail({
      userName,
      email: cleanEmail,
      resetUrl,
    });

    const mailRes = await emailService.sendEmail({
      to: cleanEmail,
      subject,
      html,
    });

    await db.collection("mail_queue").add({
      to: cleanEmail,
      template: "PASSWORD_RESET",
      subject,
      status: mailRes.success ? "SENT" : "FAILED",
      messageId: mailRes.messageId || null,
      simulated: Boolean(mailRes.simulated),
      error: mailRes.error || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: mailRes.success,
    };
  }

  // =========================================================================
  // 3. ADMIN SMTP DIAGNOSTICS & TEST EMAIL (Khusus Admin / Super Admin)
  // =========================================================================
  if (action === "ADMIN_TEST_SMTP") {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login diperlukan.");
    }

    const callerRole = request.auth.token?.role as string | undefined;
    if (!callerRole || !["super_admin", "admin"].includes(callerRole)) {
      throw new HttpsError("permission-denied", "Hanya Administrator yang diizinkan menguji konfigurasi SMTP.");
    }

    const diagnostics = await emailService.verifyConnection();
    const sendTestMail = Boolean(request.data?.sendTestMail);

    if (!sendTestMail) {
      return {
        success: diagnostics.verified,
        diagnostics,
      };
    }

    const targetEmail = (
      typeof request.data?.targetEmail === "string" && request.data.targetEmail.trim()
        ? request.data.targetEmail.trim().toLowerCase()
        : request.auth.token?.email || ""
    );

    if (!targetEmail || !targetEmail.includes("@")) {
      throw new HttpsError("invalid-argument", "Alamat email tujuan uji coba tidak valid.");
    }

    const testSubject = "✅ Uji Coba Sistem Email Resmi - Solo Technopark";
    const testHtml = renderWelcomeVerificationEmail({
      userName: "Administrator Solo Technopark",
      email: targetEmail,
      roleLabel: "Pengujian Konfigurasi Hostinger SMTP",
      isGoogleAuth: true,
    });

    const mailRes = await emailService.sendEmail({
      to: targetEmail,
      subject: testSubject,
      html: testHtml,
    });

    await db.collection("mail_queue").add({
      to: targetEmail,
      template: "ADMIN_TEST_SMTP",
      subject: testSubject,
      status: mailRes.success ? "SENT" : "FAILED",
      messageId: mailRes.messageId || null,
      simulated: Boolean(mailRes.simulated),
      error: mailRes.error || null,
      triggeredByUid: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: mailRes.success,
      diagnostics,
      messageId: mailRes.messageId || null,
      simulated: Boolean(mailRes.simulated),
      error: mailRes.error || diagnostics.error || null,
    };
  }

  throw new HttpsError("invalid-argument", `Action '${action}' tidak dikenali.`);
});

