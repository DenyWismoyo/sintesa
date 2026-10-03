// src/actions/presensi/seed.ts
"use server";

import { adminPresensiDb, adminPresensiAuth } from "@/lib/presensi/firebase-admin";
import { KANTOR_SOLO_TECHNOPARK } from "@/data/presensi/masterKantor";
import { STP_CREDENTIALS_LIST } from "@/data/presensi/stpUsers";
import { UserProfile } from "@/types/presensi";

/**
 * Menyuntikkan seluruh master kantor Solo Technopark dan akun pegawai STP ke database 'presensi-pegawai'
 */
export async function seedStpDatabaseAction(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    // 1. Simpan Master Kantor Solo Technopark
    await adminPresensiDb
      .collection("kantor")
      .doc(KANTOR_SOLO_TECHNOPARK.id)
      .set(KANTOR_SOLO_TECHNOPARK, { merge: true });

    let count = 0;

    // 2. Provisioning Akun Pegawai STP
    for (const cred of STP_CREDENTIALS_LIST) {
      let uid = `stp-user-${cred.accessCode.toLowerCase()}`;

      // Cek apakah user sudah ada di Firebase Auth
      try {
        const existingAuthUser = await adminPresensiAuth.getUserByEmail(cred.email);
        uid = existingAuthUser.uid;
      } catch {
        // Buat user di Firebase Auth jika belum ada
        try {
          const newAuthUser = await adminPresensiAuth.createUser({
            email: cred.email,
            password: cred.passwordDefault,
            displayName: cred.nama,
          });
          uid = newAuthUser.uid;
        } catch (createErr) {
          console.warn(`[Seed] Lewati create Auth untuk ${cred.email}:`, createErr);
        }
      }

      const profile: UserProfile = {
        id: uid,
        nip: cred.accessCode,
        accessCode: cred.accessCode,
        nama: cred.nama,
        email: cred.email,
        role: cred.role,
        jabatan: cred.jabatan,
        golongan: "Pegawai BLUD Solo Technopark",
        instansi: "UPTD KST Solo Technopark",
        departmentId: `dept-${cred.departmentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        departmentName: cred.departmentName,
        kantorId: KANTOR_SOLO_TECHNOPARK.id,
        namaKantor: KANTOR_SOLO_TECHNOPARK.namaKantor,
        orgId: "solotechnopark",
        storageUsedBytes: 0,
        storageLimitBytes: 1073741824, // 1 GB
      };

      await adminPresensiDb.collection("users").doc(uid).set(profile, { merge: true });
      count++;
    }

    return {
      success: true,
      count,
      message: `Berhasil inisialisasi kantor Solo Technopark dan ${count} akun pegawai ke database presensi-pegawai.`,
    };
  } catch (error) {
    console.error("[Seed STP] Gagal inisialisasi:", error);
    return {
      success: false,
      count: 0,
      message: "Gagal inisialisasi database presensi: " + (error as Error).message,
    };
  }
}

export const seedDatabaseAction = seedStpDatabaseAction;

