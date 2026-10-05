import { PresensiRecord, LKHRecord, UserProfile, PermohonanRevisiPresensi, PengajuanIzinItem, LemburRecord } from "@/types/presensi";
import { STP_CREDENTIALS_LIST } from "./stpUsers";
import { KANTOR_SOLO_TECHNOPARK } from "./masterKantor";

// In-memory dev stores dengan singleton globalThis agar persist antar Hot-Reload Next.js
const globalAny = globalThis as any;

const devPresensiStore: Map<string, PresensiRecord> = globalAny._devPresensiStore || new Map();
const devLKHStore: Map<string, LKHRecord> = globalAny._devLKHStore || new Map();
const devUserStore: Map<string, UserProfile> = globalAny._devUserStore || new Map();
const devRevisiStore: Map<string, PermohonanRevisiPresensi> = globalAny._devRevisiStore || new Map();
const devIzinStore: Map<string, PengajuanIzinItem> = globalAny._devIzinStore || new Map();
const devLemburStore: Map<string, LemburRecord> = globalAny._devLemburStore || new Map();

if (process.env.NODE_ENV !== "production") {
  globalAny._devPresensiStore = devPresensiStore;
  globalAny._devLKHStore = devLKHStore;
  globalAny._devUserStore = devUserStore;
  globalAny._devRevisiStore = devRevisiStore;
  globalAny._devIzinStore = devIzinStore;
  globalAny._devLemburStore = devLemburStore;
}

// Inisialisasi seed permohonan revisi awal realistis
const seedRevisi1: PermohonanRevisiPresensi = {
  id: "rev-seed-001",
  presensiId: "stp-user-stp-1002_2026-10-02",
  userId: "stp-user-stp-1002",
  nip: "STP-1002",
  nama: "RINA WIDYASTUTI, S.KOM.",
  orgId: "solotechnopark",
  kantorId: KANTOR_SOLO_TECHNOPARK.id,
  namaKantor: KANTOR_SOLO_TECHNOPARK.namaKantor,
  tanggal: "2026-10-02",
  jenisRevisi: "koreksi_jam_pulang",
  statusSemula: "hadir",
  statusDiajukan: "hadir",
  jamMasukSemula: "07:22",
  jamMasukDiajukan: "07:22",
  jamPulangSemula: "-",
  jamPulangDiajukan: "16:45",
  alasan: "Lupa melakukan check-out presensi karena mendampingi kunjungan delegasi industri di Gedung Solo Trade Center hingga pukul 17:00 WIB.",
  status: "menunggu",
  createdAt: "2026-10-02T17:15:00.000Z",
  updatedAt: "2026-10-02T17:15:00.000Z",
};

const seedRevisi2: PermohonanRevisiPresensi = {
  id: "rev-seed-002",
  presensiId: "stp-user-stp-1005_2026-10-01",
  userId: "stp-user-stp-1005",
  nip: "STP-1005",
  nama: "AGUS SETIAWAN, A.MD.",
  orgId: "solotechnopark",
  kantorId: KANTOR_SOLO_TECHNOPARK.id,
  namaKantor: KANTOR_SOLO_TECHNOPARK.namaKantor,
  tanggal: "2026-10-01",
  jenisRevisi: "koreksi_status",
  statusSemula: "alpa",
  statusDiajukan: "dinas",
  jamMasukSemula: "-",
  jamMasukDiajukan: "08:00",
  jamPulangSemula: "-",
  jamPulangDiajukan: "16:00",
  alasan: "Penugasan mendadak Dinas Luar di Balai Kota Surakarta terkait koordinasi Festival Inovasi. Surat tugas telah ditandatangani.",
  status: "menunggu",
  createdAt: "2026-10-02T08:30:00.000Z",
  updatedAt: "2026-10-02T08:30:00.000Z",
};

devRevisiStore.set(seedRevisi1.id, seedRevisi1);
devRevisiStore.set(seedRevisi2.id, seedRevisi2);

export function getDevRevisiStore() {
  return devRevisiStore;
}

export function getDevPresensiStore() {
  return devPresensiStore;
}

export function getDevLKHStore() {
  return devLKHStore;
}

export function getDevUserStore() {
  return devUserStore;
}

export function getDevIzinStore() {
  return devIzinStore;
}

export function getDevLemburStore() {
  return devLemburStore;
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
