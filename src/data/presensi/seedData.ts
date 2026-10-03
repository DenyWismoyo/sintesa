// src/data/presensi/seedData.ts
import { PresensiRecord, LKHRecord, UserProfile } from "@/types/presensi";
import { STP_CREDENTIALS_LIST } from "./stpUsers";
import { KANTOR_SOLO_TECHNOPARK } from "./masterKantor";

// In-memory dev stores
const devPresensiStore = new Map<string, PresensiRecord>();
const devLKHStore = new Map<string, LKHRecord>();
const devUserStore = new Map<string, UserProfile>();

export function getDevPresensiStore() {
  return devPresensiStore;
}

export function getDevLKHStore() {
  return devLKHStore;
}

export function getDevUserStore() {
  return devUserStore;
}

export const getDevUsersStore = getDevUserStore;

export function addDevUser(user: UserProfile) {
  devUserStore.set(user.id, user);
}

export function deleteDevUser(userId: string) {
  devUserStore.delete(userId);
}

export function getDevUserProfile(emailOrUid: string): UserProfile | null {
  const found = STP_CREDENTIALS_LIST.find(
    (u) =>
      u.email.toLowerCase() === emailOrUid.toLowerCase() ||
      u.accessCode.toLowerCase() === emailOrUid.toLowerCase()
  );
  if (!found) return null;

  return {
    id: `stp-user-${found.accessCode.toLowerCase()}`,
    nip: found.accessCode,
    accessCode: found.accessCode,
    nama: found.nama,
    email: found.email,
    role: found.role,
    jabatan: found.jabatan,
    golongan: "Pegawai BLUD Solo Technopark",
    instansi: "UPTD KST Solo Technopark",
    departmentId: `dept-${found.departmentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    departmentName: found.departmentName,
    kantorId: KANTOR_SOLO_TECHNOPARK.id,
    namaKantor: KANTOR_SOLO_TECHNOPARK.namaKantor,
    orgId: "solotechnopark",
    storageUsedBytes: 0,
    storageLimitBytes: 1073741824,
  };
}

export const SEED_FIREBASE_UIDS = {
  admin: "stp-admin-blud",
  atasan: "stp-pemimpin-blud",
  pegawai: "stp-staf-it",
};
