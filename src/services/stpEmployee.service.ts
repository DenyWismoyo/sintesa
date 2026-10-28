// Lokasi file: src/services/stpEmployee.service.ts
import { STP_CREDENTIALS_LIST } from '@/data/presensi/stpUsers';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

export interface StpEmployeeSigner {
  id: string;
  nama: string;
  jabatan: string;
  departmentName: string;
  email: string;
  nip?: string;
  rankLevel?: number;
}

export interface DefaultSignerConfig {
  issuerName: string;
  issuerRole: string;
  issuerNip: string;
  technicianName: string;
  technicianRole: string;
  city: string;
}

const STORAGE_KEY = 'stp_production_default_signers';

export const stpEmployeeService = {
  /**
   * Mengambil daftar pegawai Solo Technopark untuk keperluan penandatanganan dokumen resmi.
   * Sumber primer: database presensi/users (jika ada), dengan fallback lengkap ke data master STP_CREDENTIALS_LIST (46 pegawai).
   */
  async getEmployees(): Promise<StpEmployeeSigner[]> {
    const listMap = new Map<string, StpEmployeeSigner>();

    // 1. Muat dari master data pegawai presensi STP
    STP_CREDENTIALS_LIST.forEach((user, idx) => {
      const key = user.nama.toLowerCase().trim();
      listMap.set(key, {
        id: `stp-pegawai-${idx + 1}`,
        nama: user.nama,
        jabatan: user.jabatan,
        departmentName: user.departmentName,
        email: user.email,
        nip: user.accessCode ? `STP/${user.accessCode.replace('STP-', '')}` : undefined,
        rankLevel: user.rankLevel
      });
    });

    // 2. Coba sinkronisasi dengan database Firestore presensi / users
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
      usersSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.nama || data.displayName || data.name) {
          const nama = (data.nama || data.displayName || data.name).trim();
          const key = nama.toLowerCase();
          const existing = listMap.get(key);
          listMap.set(key, {
            id: docSnap.id,
            nama,
            jabatan: data.jabatan || existing?.jabatan || data.role || 'Staf Solo Technopark',
            departmentName: data.departmentName || existing?.departmentName || 'Solo Technopark',
            email: data.email || existing?.email || '',
            nip: data.nip || data.accessCode || existing?.nip,
            rankLevel: data.rankLevel || existing?.rankLevel
          });
        }
      });
    } catch {
      // Jika firestore offline atau permission denied, tetap gunakan data master STP_CREDENTIALS_LIST
    }

    // Urutkan berdasarkan level jabatan (Pimpinan / Kepala Divisi terlebih dahulu)
    return Array.from(listMap.values()).sort((a, b) => (a.rankLevel || 99) - (b.rankLevel || 99));
  },

  /**
   * Mengambil konfigurasi default penandatangan dokumen produksi yang tersimpan
   */
  getDefaultSigners(): DefaultSignerConfig {
    if (typeof window === 'undefined') {
      return {
        issuerName: 'Agus Jatmiko, S.Kom',
        issuerRole: 'Kepala Divisi Layanan Manufaktur & Jasa Produksi',
        issuerNip: '19850715 201001 1 012',
        technicianName: 'Agus Santoso, S.T.',
        technicianRole: 'Penanggung Jawab Teknis Workshop STP',
        city: 'Surakarta'
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      /* abaikan */
    }

    return {
      issuerName: 'Agus Jatmiko, S.Kom',
      issuerRole: 'Kepala Divisi Layanan Manufaktur & Jasa Produksi',
      issuerNip: '19850715 201001 1 012',
      technicianName: 'Agus Santoso, S.T.',
      technicianRole: 'Penanggung Jawab Teknis Workshop STP',
      city: 'Surakarta'
    };
  },

  /**
   * Menyimpan konfigurasi default penandatangan dokumen produksi ke local storage
   */
  saveDefaultSigners(config: DefaultSignerConfig): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Gagal menyimpan konfigurasi penandatangan:', e);
    }
  }
};
