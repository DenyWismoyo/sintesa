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
    "nama": "Abednego Danu Setyawan, A.Md",
    "jabatan": "Kepala Divisi Riset dan Inkubator",
    "email": "abednego.danu@solotechnopark.id",
    "accessCode": "STP-50120",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Riset dan Inkubator"
  },
  {
    "nama": "Admin BLUD Solo Technopark",
    "jabatan": "Admin BLUD Solo Technopark",
    "email": "admin.blud@solotechnopark.id",
    "accessCode": "STP-53851",
    "passwordDefault": "StpUser2026!",
    "role": "admin",
    "departmentName": "Admin BLUD Solo Technopark"
  },
  {
    "nama": "Agus Jatmiko, S.Kom",
    "jabatan": "Kepala Divisi Information Technology",
    "email": "agus.jatmiko@solotechnopark.id",
    "accessCode": "STP-91377",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Information Technology"
  },
  {
    "nama": "Agus Munaji, S.Kom",
    "jabatan": "Instruktur Welding",
    "email": "agus.munaji@solotechnopark.id",
    "accessCode": "STP-63160",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Instruktur Welding"
  },
  {
    "nama": "Agus Wahyudi",
    "jabatan": "Instruktur Kerja Bangku",
    "email": "agus.wahyudi@solotechnopark.id",
    "accessCode": "STP-56814",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Instruktur Kerja Bangku"
  },
  {
    "nama": "Alfian Sherendra Zulfa, SH.",
    "jabatan": "Staf Divisi Kerjasama dan Hukum 2",
    "email": "alfian.sherendra@solotechnopark.id",
    "accessCode": "STP-16048",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Divisi Kerjasama dan Hukum 2"
  },
  {
    "nama": "Anang Handyka Pratama, S.Akun",
    "jabatan": "Kepala Divisi Anggaran",
    "email": "anang.handyka@solotechnopark.id",
    "accessCode": "STP-87081",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Anggaran"
  },
  {
    "nama": "Anang Tri Ruwiyanto, ST.",
    "jabatan": "Staff Maintenance 1",
    "email": "anang.tri@solotechnopark.id",
    "accessCode": "STP-47261",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staff Maintenance 1"
  },
  {
    "nama": "Andre Firmansyah",
    "jabatan": "Support OGSCI",
    "email": "andre.firmansyah@solotechnopark.id",
    "accessCode": "STP-73339",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Support OGSCI"
  },
  {
    "nama": "Andreas",
    "jabatan": "Operator CNC Milling",
    "email": "andreas@solotechnopark.id",
    "accessCode": "STP-75127",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Operator CNC Milling"
  },
  {
    "nama": "Ani Anggraeni, SE.",
    "jabatan": "Kepala Divisi Administrasi dan Kepegawaian",
    "email": "ani.anggraeni@solotechnopark.id",
    "accessCode": "STP-68417",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Administrasi dan Kepegawaian"
  },
  {
    "nama": "Anton Efendi",
    "jabatan": "Instruktur Milling",
    "email": "anton.efendi@solotechnopark.id",
    "accessCode": "STP-42901",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Instruktur Milling"
  },
  {
    "nama": "Arief Wibowo",
    "jabatan": "Kepala Divisi Diklat",
    "email": "arief.wibowo@solotechnopark.id",
    "accessCode": "STP-17980",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Diklat"
  },
  {
    "nama": "Ariyani Oktaviana Rakhmawati, SE.",
    "jabatan": "Kepala Divisi Akuntansi",
    "email": "ariyani.oktaviana@solotechnopark.id",
    "accessCode": "STP-17789",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Akuntansi"
  },
  {
    "nama": "Bangun Fajar Kusnanto",
    "jabatan": "Operator Manual",
    "email": "bangun.fajar@solotechnopark.id",
    "accessCode": "STP-69265",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Operator Manual"
  },
  {
    "nama": "Budiharto, ST.",
    "jabatan": "Kepala Divisi Pemasaran dan Marketing",
    "email": "budiharto@solotechnopark.id",
    "accessCode": "STP-43334",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Pemasaran dan Marketing"
  },
  {
    "nama": "Danang Cahyono",
    "jabatan": "Kepala Divisi Pemberdayaan Kawasan",
    "email": "danang.cahyono@solotechnopark.id",
    "accessCode": "STP-29693",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Pemberdayaan Kawasan"
  },
  {
    "nama": "Erwin Sudrajat",
    "jabatan": "Kepala Divisi Welding Edukasi",
    "email": "erwin.sudrajat@solotechnopark.id",
    "accessCode": "STP-57679",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Welding Edukasi"
  },
  {
    "nama": "Eva Sofyana",
    "jabatan": "Marketing Diklat",
    "email": "eva.sofyana@solotechnopark.id",
    "accessCode": "STP-52267",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Marketing Diklat"
  },
  {
    "nama": "Farid Mahendra",
    "jabatan": "Programer CNC Milling 1",
    "email": "farid.mahendra@solotechnopark.id",
    "accessCode": "STP-48540",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Programer CNC Milling 1"
  },
  {
    "nama": "Febri Arif Purnomo, A.Md",
    "jabatan": "Kepala Divisi Produksi Dan Pemasaran",
    "email": "febri.arif@solotechnopark.id",
    "accessCode": "STP-72545",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Produksi Dan Pemasaran"
  },
  {
    "nama": "Jarot Sutono",
    "jabatan": "Programer CNC Bubut",
    "email": "jarot.sutono@solotechnopark.id",
    "accessCode": "STP-53771",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Programer CNC Bubut"
  },
  {
    "nama": "Jati Utomo",
    "jabatan": "Toolman dan Expedisi",
    "email": "jati.utomo@solotechnopark.id",
    "accessCode": "STP-90943",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Toolman dan Expedisi"
  },
  {
    "nama": "Lucia Citra Hirawati, SE.",
    "jabatan": "Kepala Divisi Public Relation",
    "email": "lucia.citra@solotechnopark.id",
    "accessCode": "STP-62041",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Public Relation"
  },
  {
    "nama": "Muhammad Restu Choiri, A.Md",
    "jabatan": "Staf Information Technology",
    "email": "restu.choiri@solotechnopark.id",
    "accessCode": "STP-34311",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Information Technology"
  },
  {
    "nama": "Mulyanto",
    "jabatan": "Instruktur Grinding",
    "email": "mulyanto@solotechnopark.id",
    "accessCode": "STP-23952",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Instruktur Grinding"
  },
  {
    "nama": "Nanang Dwi Setiawan",
    "jabatan": "Driver",
    "email": "nanang.dwi@solotechnopark.id",
    "accessCode": "STP-38799",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Driver"
  },
  {
    "nama": "Oktafianto Nugroho, ST.",
    "jabatan": "Kepala Divisi Logistik",
    "email": "oktafianto.nugroho@solotechnopark.id",
    "accessCode": "STP-97793",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Logistik"
  },
  {
    "nama": "Prasetyo Okmana Saputra, S.Sos",
    "jabatan": "Staf Riset dan Inkubator 2",
    "email": "prasetyo.okmana@solotechnopark.id",
    "accessCode": "STP-61588",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Riset dan Inkubator 2"
  },
  {
    "nama": "Putra Adi Widrajat, A.Md.",
    "jabatan": "Instruktur Bubut",
    "email": "putra.adi@solotechnopark.id",
    "accessCode": "STP-50918",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Instruktur Bubut"
  },
  {
    "nama": "Renny Widyaningsih, S.Ak.",
    "jabatan": "Staf Kesekretariatan",
    "email": "renny.widyaningsih@solotechnopark.id",
    "accessCode": "STP-11421",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Kesekretariatan"
  },
  {
    "nama": "Ridho Adi Prabowo, SE.",
    "jabatan": "Staf Riset dan Inkubator 1",
    "email": "ridho.adi@solotechnopark.id",
    "accessCode": "STP-48762",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Riset dan Inkubator 1"
  },
  {
    "nama": "Rika Dewi Savitri, ST.",
    "jabatan": "Marketing Pemberdayaan Kawasan",
    "email": "rika.dewi@solotechnopark.id",
    "accessCode": "STP-97738",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Marketing Pemberdayaan Kawasan"
  },
  {
    "nama": "Riza Kurniawan, SH.",
    "jabatan": "Kepala Divisi Kerjasama dan Hukum",
    "email": "riza.kurniawan@solotechnopark.id",
    "accessCode": "STP-65505",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Kepala Divisi Kerjasama dan Hukum"
  },
  {
    "nama": "Salsa Bella Radifa, S.Ak.",
    "jabatan": "Staf Keuangan",
    "email": "salsa.bella@solotechnopark.id",
    "accessCode": "STP-83915",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Keuangan"
  },
  {
    "nama": "Sapardi",
    "jabatan": "House Keeping",
    "email": "sapardi@solotechnopark.id",
    "accessCode": "STP-40130",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "House Keeping"
  },
  {
    "nama": "Sarino",
    "jabatan": "Staff Maintenance 3",
    "email": "sarino@solotechnopark.id",
    "accessCode": "STP-36117",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staff Maintenance 3"
  },
  {
    "nama": "Sri Hartono",
    "jabatan": "Operator Welding",
    "email": "sri.hartono@solotechnopark.id",
    "accessCode": "STP-31342",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Operator Welding"
  },
  {
    "nama": "Sri Purwanto",
    "jabatan": "Staff Maintenance 2",
    "email": "sri.purwanto@solotechnopark.id",
    "accessCode": "STP-45069",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staff Maintenance 2"
  },
  {
    "nama": "Susilo Budi Arianto, S.T.",
    "jabatan": "Manager Dukungan Bisnis Pelayanan dan Pengembangan",
    "email": "susilo.budi@solotechnopark.id",
    "accessCode": "STP-64199",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Manager Dukungan Bisnis Pelayanan dan Pengembangan"
  },
  {
    "nama": "Tegar Pinatar, SE.",
    "jabatan": "Staf Pemberdayaan Kawasan 1",
    "email": "tegar.pinatar@solotechnopark.id",
    "accessCode": "STP-10911",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Pemberdayaan Kawasan 1"
  },
  {
    "nama": "Thessa Anial John, SH.",
    "jabatan": "Marketing Officer",
    "email": "thessa.anial@solotechnopark.id",
    "accessCode": "STP-30298",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Marketing Officer"
  },
  {
    "nama": "Tommy Trisula Putra, ST.",
    "jabatan": "Instruktur Cadcam/ Gambar Teknik",
    "email": "tommy.trisula@solotechnopark.id",
    "accessCode": "STP-78003",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Instruktur Cadcam/ Gambar Teknik"
  },
  {
    "nama": "Untung Priyohananto, S.E.",
    "jabatan": "Pejabat Teknis Umum",
    "email": "untung.priyohananto@solotechnopark.id",
    "accessCode": "STP-44486",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Pejabat Teknis Umum"
  },
  {
    "nama": "Yudit Cahyantoro Nyoto Saputro, S.T., M.T.",
    "jabatan": "Pemimpin BLUD",
    "email": "yudit.cahyantoro@solotechnopark.id",
    "accessCode": "STP-22757",
    "passwordDefault": "StpUser2026!",
    "role": "atasan",
    "departmentName": "Pemimpin BLUD"
  },
  {
    "nama": "Yuli Tri Hartuti, SH.",
    "jabatan": "Staf Divisi Kerjasama dan Hukum 1",
    "email": "yuli.tri@solotechnopark.id",
    "accessCode": "STP-53681",
    "passwordDefault": "StpUser2026!",
    "role": "pegawai",
    "departmentName": "Staf Divisi Kerjasama dan Hukum 1"
  }
];

/**
 * Konversi list kredensial menjadi map UserProfile untuk seed / lookup cepat
 */
export function getStpUserProfileByEmail(emailOrCode: string): UserProfile | null {
  const normalized = emailOrCode.trim().toLowerCase();
  const found = STP_CREDENTIALS_LIST.find(
    (u) =>
      u.email.toLowerCase() === normalized ||
      u.accessCode.toLowerCase() === normalized ||
      u.accessCode.replace(/[^a-z0-9]/gi, "").toLowerCase() === normalized.replace(/[^a-z0-9]/gi, "")
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
    kantorId: "kantor-stp-pusat",
    namaKantor: "UPTD KST Solo Technopark (Pusat)",
    orgId: "solotechnopark",
    storageUsedBytes: 0,
    storageLimitBytes: 1073741824, // 1 GB
  };
}
