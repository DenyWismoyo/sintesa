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
  }
};