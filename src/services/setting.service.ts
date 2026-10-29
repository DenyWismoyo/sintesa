// Lokasi file: src/services/setting.service.ts

import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface InstitutionProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  logoUrl: string;
  updatedAt?: number;
}

export interface BankAccountSetting {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface FinanceSetting {
  taxRate: number; // Persentase pajak default (misal 11)
  invoicePrefix: string; // Misal: INV/SEWA/
  defaultDueDays: number; // Misal: 7 hari
  bankAccounts: BankAccountSetting[];
  updatedAt?: number;
}

export interface SystemConfigSetting {
  // 1. Global Announcement Banner
  isAnnouncementActive: boolean;
  announcementText: string;
  announcementLinkText?: string;
  announcementLinkUrl?: string;

  // 2. Operasional Fasilitas & Booking
  operatingHours: string;
  minBookingDaysInAdvance: number;
  maxBookingDaysInAdvance: number;

  // 3. Kontak Pusat & Helpdesk
  helpdeskWhatsApp: string;
  helpdeskEmail: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;

  updatedAt?: number;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfigSetting = {
  isAnnouncementActive: true,
  announcementText: 'Pendaftaran Program Pelatihan Vokasi Batch Baru & Rumah Siap Kerja Bersama (RSKB) telah dibuka!',
  announcementLinkText: 'Lihat Program',
  announcementLinkUrl: '/program-pelatihan',
  operatingHours: '08:00 - 17:00 WIB (Senin - Jumat)',
  minBookingDaysInAdvance: 1,
  maxBookingDaysInAdvance: 30,
  helpdeskWhatsApp: '08112634567',
  helpdeskEmail: 'marketing@solotechnopark.id',
  instagramUrl: 'https://instagram.com/solotechnopark_official',
  linkedinUrl: 'https://linkedin.com/company/solo-technopark',
  youtubeUrl: 'https://youtube.com/@solotechnopark',
};

export const settingService = {
  // ==========================================
  // MODUL 1: PROFIL INSTANSI
  // ==========================================
  getProfile: async (): Promise<InstitutionProfile | null> => {
    const appId = getAppId();
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'profile');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as InstitutionProfile;
    return null;
  },

  updateProfile: async (data: Partial<InstitutionProfile>) => {
    const appId = getAppId();
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'profile');
    await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
  },

  uploadLogo: async (file: File): Promise<string> => {
    const appId = getAppId();
    return await storageService.uploadImage(file, `artifacts/${appId}/public/logos`);
  },

  // ==========================================
  // MODUL 2: PENGATURAN KEUANGAN & BILLING
  // ==========================================
  getFinanceSettings: async (): Promise<FinanceSetting | null> => {
    const appId = getAppId();
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'finance');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data() as FinanceSetting;
    return null;
  },

  updateFinanceSettings: async (data: Partial<FinanceSetting>) => {
    const appId = getAppId();
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'finance');
    await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
  },

  // ==========================================
  // MODUL 3: KONFIGURASI SISTEM GLOBAL
  // ==========================================
  getSystemConfig: async (): Promise<SystemConfigSetting> => {
    try {
      const appId = getAppId();
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'system_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_SYSTEM_CONFIG, ...(snap.data() as Partial<SystemConfigSetting>) };
      }
      return DEFAULT_SYSTEM_CONFIG;
    } catch (err) {
      console.warn('[settingService.getSystemConfig] Fallback to default config:', err);
      return DEFAULT_SYSTEM_CONFIG;
    }
  },

  updateSystemConfig: async (data: Partial<SystemConfigSetting>) => {
    const appId = getAppId();
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'system_config');
    await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
  },
};
