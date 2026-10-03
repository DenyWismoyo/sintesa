const sa = require('../service-account-katalog.json');
const { Firestore } = require('../functions/node_modules/@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

const presensiDb = new Firestore({
  projectId: sa.project_id,
  credentials: sa,
  databaseId: 'presensi-pegawai'
});

async function updateStpUsers() {
  const snapshot = await presensiDb.collection('users').get();
  const map = new Map();
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    if (d.email && d.email.endsWith('@solotechnopark.id')) {
      const emailLower = d.email.trim().toLowerCase();
      if (!map.has(emailLower) || doc.id.startsWith('stp-')) {
        map.set(emailLower, d);
      }
    }
  });

  const list = Array.from(map.values());
  list.sort((a,b) => (a.nama || '').localeCompare(b.nama || ''));

  const items = list.map(u => {
    const accessCode = u.accessCode || u.nip || 'STP-00000';
    return {
      nama: u.nama,
      jabatan: u.jabatan || 'Pegawai Solo Technopark',
      email: u.email.trim().toLowerCase(),
      accessCode: accessCode,
      passwordDefault: 'StpUser2026!',
      role: u.role || 'pegawai',
      departmentName: u.departmentName || 'UPTD KST Solo Technopark'
    };
  });

  const targetPath = path.join(__dirname, '../src/data/presensi/stpUsers.ts');
  const fileContent = `// src/data/presensi/stpUsers.ts
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

export const STP_CREDENTIALS_LIST: StpCredentialItem[] = ${JSON.stringify(items, null, 2)};

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
    id: \`stp-user-\${found.accessCode.toLowerCase()}\`,
    nip: found.accessCode,
    accessCode: found.accessCode,
    nama: found.nama,
    email: found.email,
    role: found.role,
    jabatan: found.jabatan,
    golongan: "Pegawai BLUD Solo Technopark",
    instansi: "UPTD KST Solo Technopark",
    departmentId: \`dept-\${found.departmentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}\`,
    departmentName: found.departmentName,
    kantorId: "kantor-stp-pusat",
    namaKantor: "UPTD KST Solo Technopark (Pusat)",
    orgId: "solotechnopark",
    storageUsedBytes: 0,
    storageLimitBytes: 1073741824, // 1 GB
  };
}
`;

  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log(`src/data/presensi/stpUsers.ts berhasil diperbarui dengan ${items.length} pegawai.`);
}

updateStpUsers().catch(console.error);
