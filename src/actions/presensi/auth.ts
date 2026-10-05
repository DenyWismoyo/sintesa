"use server";

import { adminPresensiDb, adminPresensiAuth } from "@/lib/presensi/firebase-admin";
import { STP_CREDENTIALS_LIST, StpCredentialItem } from "@/data/presensi/stpUsers";
import { UserProfile } from "@/types/presensi";

export async function lookupEmailByAccessCode(accessCode: string): Promise<string | null> {
  try {
    const snapshot = await adminPresensiDb
      .collection("users")
      .where("accessCode", "==", accessCode)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return data.email || null;
    }

    return null;
  } catch (error) {
    console.error("Error looking up email by access code:", error);
    return null;
  }
}

export interface SyncGoogleInput {
  googleUid: string;
  googleEmail: string;
  googleDisplayName?: string;
  googlePhotoURL?: string;
  nipOrCode: string;
  password: string;
}

export interface SyncGoogleResult {
  success: boolean;
  message: string;
  profile?: UserProfile;
}

/**
 * Memvalidasi kredensial presensi pegawai STP (NIP/Kode Akses + Password)
 * dan menyatukan akun Google tersebut menjadi 1 akun yang sama dengan profil pegawai STP.
 */
export async function validateAndSyncGooglePresensi(
  input: SyncGoogleInput
): Promise<SyncGoogleResult> {
  try {
    const { googleUid, googleEmail, googleDisplayName, googlePhotoURL, nipOrCode, password } = input;

    if (!googleUid || !googleEmail) {
      return { success: false, message: "Informasi akun Google tidak valid. Silakan login Google terlebih dahulu." };
    }

    if (!nipOrCode || !password) {
      return { success: false, message: "Kode Akses / NIP dan Kata Sandi presensi wajib diisi." };
    }

    // 1. Cari data pegawai di data master STP_CREDENTIALS_LIST
    const cleanInput = nipOrCode.trim().toLowerCase();
    const cleanNoHyphen = cleanInput.replace(/[^a-z0-9]/gi, "");

    let found: StpCredentialItem | undefined = STP_CREDENTIALS_LIST.find((u) => {
      const accessCodeClean = u.accessCode.toLowerCase();
      const accessCodeNoHyphen = accessCodeClean.replace(/[^a-z0-9]/gi, "");
      const emailClean = u.email.toLowerCase();

      return (
        accessCodeClean === cleanInput ||
        accessCodeNoHyphen === cleanNoHyphen ||
        emailClean === cleanInput ||
        emailClean.startsWith(cleanInput)
      );
    });

    // Jika tidak ditemukan di file statis, periksa koleksi users di database presensi-pegawai
    if (!found) {
      const usersSnap = await adminPresensiDb.collection("users").get();
      for (const d of usersSnap.docs) {
        const u = d.data();
        const code = (u.accessCode || u.nip || "").toLowerCase();
        const mail = (u.email || "").toLowerCase();
        if (code === cleanInput || code.replace(/[^a-z0-9]/gi, "") === cleanNoHyphen || mail === cleanInput) {
          found = {
            nama: u.nama || u.name,
            jabatan: u.jabatan || "Pegawai Solo Technopark",
            email: u.email,
            accessCode: u.accessCode || u.nip || "STP-99999",
            passwordDefault: "StpUser2026!",
            role: u.role || "pegawai",
            departmentName: u.departmentName || "UPTD Solo Technopark",
          };
          break;
        }
      }
    }

    if (!found) {
      return {
        success: false,
        message: "Kode Akses atau NIP tidak terdaftar di data pegawai Solo Technopark. Gunakan Kode Akses resmi (misal: STP-22757).",
      };
    }

    // 2. Validasi Kata Sandi Presensi
    let isPasswordCorrect = false;

    // A. Cek kecocokan password default dari environment variable
    const defaultPassword = process.env.PRESENSI_DEFAULT_PASSWORD || "StpUser2026!";
    if (found.passwordDefault === password || password === defaultPassword) {
      isPasswordCorrect = true;
    }

    // B. Coba autentikasi via REST API Firebase Auth dengan email mock presensi
    if (!isPasswordCorrect && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: found.email,
              password,
              returnSecureToken: false,
            }),
          }
        );
        if (res.ok) {
          isPasswordCorrect = true;
        }
      } catch (err) {
        console.warn("[Sync Presensi] Verifikasi password via Auth REST gagal:", err);
      }
    }

    if (!isPasswordCorrect) {
      return {
        success: false,
        message: "Kata sandi presensi yang Anda masukkan salah. Silakan coba lagi.",
      };
    }

    // 3. Update Custom Claims pada akun Google (Mempertahankan claims role catalog yang sudah ada)
    try {
      const googleUserRecord = await adminPresensiAuth.getUser(googleUid);
      const existingClaims = googleUserRecord.customClaims || {};

      const mergedClaims = {
        ...existingClaims,
        presensiRole: found.role,
        orgId: "solotechnopark",
        stpAccessCode: found.accessCode,
      };

      await adminPresensiAuth.setCustomUserClaims(googleUid, mergedClaims);
    } catch (claimErr) {
      console.error("[Sync Presensi] Gagal memperbarui claims Google Auth:", claimErr);
    }

    // 4. Buat / Sinkronkan profil pegawai di database presensi-pegawai under users/{googleUid}
    const profileData: UserProfile = {
      id: googleUid,
      nip: found.accessCode,
      accessCode: found.accessCode,
      nama: found.nama,
      email: found.email, // email mock STP
      googleEmail: googleEmail, // email asli Google user
      fotoUrl: googlePhotoURL || undefined,
      role: found.role,
      jabatan: found.jabatan,
      golongan: "Pegawai BLUD Solo Technopark",
      instansi: "UPTD KST Solo Technopark",
      departmentId: `dept-${found.departmentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      departmentName: found.departmentName,
      kantorId: "kantor-stp-pusat",
      namaKantor: "UPTD KST Solo Technopark (Pusat)",
      orgId: "solotechnopark",
      storageUsedBytes: 0,
      storageLimitBytes: 1073741824, // 1 GB
      isLinkedGoogle: true,
      linkedGoogleUid: googleUid,
      linkedGoogleEmail: googleEmail,
      linkedAt: new Date().toISOString(),
    };

    await adminPresensiDb.collection("users").doc(googleUid).set(profileData, { merge: true });

    // 5. Catat tautan juga pada dokumen mock lama (jika ada dokumen terpisah)
    try {
      const oldDocQuery = await adminPresensiDb
        .collection("users")
        .where("accessCode", "==", found.accessCode)
        .get();

      for (const oldDoc of oldDocQuery.docs) {
        if (oldDoc.id !== googleUid) {
          await oldDoc.ref.set(
            {
              isLinkedGoogle: true,
              linkedGoogleUid: googleUid,
              linkedGoogleEmail: googleEmail,
              linkedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }
    } catch (oldDocErr) {
      console.warn("[Sync Presensi] Gagal menandai dokumen mock lama:", oldDocErr);
    }

    return {
      success: true,
      message: `Berhasil! Akun Google Anda telah disatukan dengan pegawai ${found.nama} (${found.jabatan}).`,
      profile: profileData,
    };
  } catch (error: any) {
    console.error("[Sync Presensi] Error:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat menyatukan akun.",
    };
  }
}

/**
 * Memeriksa apakah akun Google sudah tertaut dengan profil pegawai STP
 */
export async function checkGoogleUserSyncStatus(
  googleUid: string
): Promise<{ isLinked: boolean; profile?: UserProfile }> {
  try {
    const docSnap = await adminPresensiDb.collection("users").doc(googleUid).get();
    if (docSnap.exists) {
      const data = docSnap.data() as UserProfile;
      if (data.role && (data.nip || data.accessCode)) {
        return { isLinked: true, profile: data };
      }
    }
    return { isLinked: false };
  } catch (error) {
    console.error("[Check Sync Status] Error:", error);
    return { isLinked: false };
  }
}
