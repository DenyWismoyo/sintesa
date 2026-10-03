// src/data/presensi/stpUsers.ts
import { UserProfile, UserRole } from "@/types/presensi";

export interface StpCredentialItem {
  nama: string;
  jabatan: string;
  email: string;
  accessCode: string;
  passwordDefault: string;
  role: UserRole;
  departmentName: string;
}

export const STP_CREDENTIALS_LIST: StpCredentialItem[] = [
  {
    nama: "Yudit Cahyantoro Nyoto Saputro, S.T., M.T.",
    jabatan: "Pemimpin BLUD",
    email: "yudit.cahyantoro@solotechnopark.id",
    accessCode: "STP-22757",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Pimpinan BLUD",
  },
  {
    nama: "Ariyani Oktaviana Rakhmawati, SE.",
    jabatan: "Kepala Divisi Akuntansi",
    email: "ariyani.oktaviana@solotechnopark.id",
    accessCode: "STP-17789",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Akuntansi",
  },
  {
    nama: "Salsa Bella Radifa, S.Ak.",
    jabatan: "Staf Keuangan",
    email: "salsa.bella@solotechnopark.id",
    accessCode: "STP-83915",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Akuntansi",
  },
  {
    nama: "Anang Handyka Pratama, S.Akun",
    jabatan: "Kepala Divisi Anggaran",
    email: "anang.handyka@solotechnopark.id",
    accessCode: "STP-87081",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Anggaran",
  },
  {
    nama: "Budiharto, ST.",
    jabatan: "Kepala Divisi Pemasaran dan Marketing",
    email: "budiharto@solotechnopark.id",
    accessCode: "STP-43334",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Pemasaran dan Marketing",
  },
  {
    nama: "Untung Priyohananto, S.E.",
    jabatan: "Pejabat Teknis Umum",
    email: "untung.priyohananto@solotechnopark.id",
    accessCode: "STP-44486",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Pejabat Teknis",
  },
  {
    nama: "Ani Anggraeni, SE.",
    jabatan: "Kepala Divisi Administrasi dan Kepegawaian",
    email: "ani.anggraeni@solotechnopark.id",
    accessCode: "STP-68417",
    passwordDefault: "StpUser2026!",
    role: "admin",
    departmentName: "Divisi Administrasi dan Kepegawaian",
  },
  {
    nama: "Renny Widyaningsih, S.Ak.",
    jabatan: "Staf Kesekretariatan",
    email: "renny.widyaningsih@solotechnopark.id",
    accessCode: "STP-11421",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Administrasi dan Kepegawaian",
  },
  {
    nama: "Oktafianto Nugroho, ST.",
    jabatan: "Kepala Divisi Logistik",
    email: "oktafianto.nugroho@solotechnopark.id",
    accessCode: "STP-97793",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Logistik",
  },
  {
    nama: "Nanang Dwi Setiawan",
    jabatan: "Driver",
    email: "nanang.dwi@solotechnopark.id",
    accessCode: "STP-38799",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Logistik",
  },
  {
    nama: "Agus Jatmiko, S.Kom",
    jabatan: "Kepala Divisi Information Technology",
    email: "agus.jatmiko@solotechnopark.id",
    accessCode: "STP-91377",
    passwordDefault: "StpUser2026!",
    role: "admin",
    departmentName: "Divisi Information Technology",
  },
  {
    nama: "Muhammad Restu Choiri, A.Md",
    jabatan: "Staf Information Technology",
    email: "restu.choiri@solotechnopark.id",
    accessCode: "STP-34311",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Information Technology",
  },
  {
    nama: "Danang Cahyono",
    jabatan: "Kepala Divisi Pemberdayaan Kawasan",
    email: "danang.cahyono@solotechnopark.id",
    accessCode: "STP-29693",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Pemberdayaan Kawasan",
  },
  {
    nama: "Lucia Citra Hirawati, SE.",
    jabatan: "Kepala Divisi Public Relation",
    email: "lucia.citra@solotechnopark.id",
    accessCode: "STP-62041",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Public Relation",
  },
  {
    nama: "Tegar Pinatar, SE.",
    jabatan: "Staf Pemberdayaan Kawasan 1",
    email: "tegar.pinatar@solotechnopark.id",
    accessCode: "STP-10911",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Pemberdayaan Kawasan",
  },
  {
    nama: "Rika Dewi Savitri, ST.",
    jabatan: "Marketing Pemberdayaan Kawasan",
    email: "rika.dewi@solotechnopark.id",
    accessCode: "STP-97738",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Pemberdayaan Kawasan",
  },
  {
    nama: "Anang Tri Ruwiyanto, ST.",
    jabatan: "Staff Maintenance 1",
    email: "anang.tri@solotechnopark.id",
    accessCode: "STP-47261",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Pemeliharaan",
  },
  {
    nama: "Susilo Budi Arianto, S.T.",
    jabatan: "Manager Dukungan Bisnis Pelayanan dan Pengembangan",
    email: "susilo.budi@solotechnopark.id",
    accessCode: "STP-64199",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Dukungan Bisnis",
  },
  {
    nama: "Abednego Danu Setyawan, A.Md",
    jabatan: "Kepala Divisi Riset dan Inkubator",
    email: "abednego.danu@solotechnopark.id",
    accessCode: "STP-50120",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Riset dan Inkubator",
  },
  {
    nama: "Ridho Adi Prabowo, SE.",
    jabatan: "Staf Riset dan Inkubator 1",
    email: "ridho.adi@solotechnopark.id",
    accessCode: "STP-48762",
    passwordDefault: "StpUser2026!",
    role: "pegawai",
    departmentName: "Divisi Riset dan Inkubator",
  },
  {
    nama: "Arief Wibowo",
    jabatan: "Kepala Divisi Diklat",
    email: "arief.wibowo@solotechnopark.id",
    accessCode: "STP-17980",
    passwordDefault: "StpUser2026!",
    role: "atasan",
    departmentName: "Divisi Diklat",
  },
  {
    nama: "Admin BLUD Solo Technopark",
    jabatan: "Administrator Sistem BLUD",
    email: "admin.blud@solotechnopark.id",
    accessCode: "STP-53851",
    passwordDefault: "StpUser2026!",
    role: "admin",
    departmentName: "Pusat Kendali Sistem",
  },
];

/**
 * Konversi list kredensial menjadi map UserProfile untuk seed / lookup cepat
 */
export function getStpUserProfileByEmail(email: string): UserProfile | null {
  const normalized = email.trim().toLowerCase();
  const found = STP_CREDENTIALS_LIST.find((u) => u.email.toLowerCase() === normalized);
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
    kantorId: "kantor-stp-pusat",
    namaKantor: "UPTD KST Solo Technopark (Pusat)",
    orgId: "solotechnopark",
    storageUsedBytes: 0,
    storageLimitBytes: 1073741824, // 1 GB
  };
}
