// src/services/financing.service.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  FinancingScheme,
  FinancingSchemeInput,
  FinancingSchemeSchema,
  FinancingApplication,
  FinancingApplicationSchema,
  FinancingApplicationStatus,
} from '@/types/partnership.types';

const getSchemesPath = () =>
  `artifacts/${getAppId()}/public/data/financing_schemes`;

const getApplicationsPath = () =>
  `artifacts/${getAppId()}/public/data/financing_applications`;

// Mock initial data untuk showcase jika database masih kosong
export const INITIAL_FINANCING_SCHEMES: FinancingScheme[] = [
  {
    id: 'scheme-bpd-jateng-kur',
    partnerId: 'bank-bpd-jateng',
    partnerName: 'Bank Jateng',
    partnerLogo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=120&auto=format&fit=crop&q=80',
    schemeType: 'KUR_BANK',
    title: 'KUR Vokasi Unggulan Bank Jateng',
    description: 'Fasilitas pembiayaan lunak dengan bunga bersubsidi khusus peserta pelatihan manufaktur presisi dan pengelasan Solo Technopark.',
    maxAmount: 25000000,
    tenorMonths: 12,
    interestRate: 3.0,
    eligiblePrograms: ['Manufaktur CNC Presisi', 'Underwater & GTAW Welding', 'Otomasi Industri Mechatronics'],
    eligibilityCriteria: 'Warga Jawa Tengah, usia min 18 tahun, memiliki surat rekomendasi lolos seleksi Solo Technopark.',
    contactPerson: 'Unit Kredit Mikro BPD Cabang Surakarta',
    contactPhone: '0271-714422',
    quotaTotal: 100,
    quotaUsed: 42,
    isActive: true,
    isFeatured: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'scheme-bsi-cicilan-0',
    partnerId: 'bank-bsi',
    partnerName: 'Bank Syariah Indonesia (BSI)',
    partnerLogo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=120&auto=format&fit=crop&q=80',
    schemeType: 'CICILAN_0_PERSEN',
    title: 'Mitra Edukasi Syariah Cicilan 0%',
    description: 'Skema pembiayaan akad murabahah tanpa bunga bagi talenta digital & AI Solo Technopark dengan tenor hingga 9 bulan.',
    maxAmount: 15000000,
    tenorMonths: 9,
    interestRate: 0,
    eligiblePrograms: ['Akademi Kecerdasan Buatan (AI)', 'Cyber Security Defense Specialist', 'Fullstack Web & Cloud Engineering'],
    eligibilityCriteria: 'KTP Nasional, komitmen menyelesaikan portofolio capstone project, menyertakan wali/penjamin.',
    contactPerson: 'Consumer Banking BSI Solo Slamet Riyadi',
    contactPhone: '0812-2555-8900',
    quotaTotal: 75,
    quotaUsed: 31,
    isActive: true,
    isFeatured: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'scheme-astra-scholarship',
    partnerId: 'partner-astra-holding',
    partnerName: 'Yayasan Astra Bina Ilmu',
    partnerLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
    schemeType: 'BEASISWA_PENUH',
    title: 'Beasiswa Penuh Ikatan Kerja Astra Tech',
    description: 'Pemberian biaya diklat 100% ditambah uang saku bulanan dan jaminan penyaluran kerja langsung di rantai pasok industri otomotif.',
    maxAmount: 18000000,
    tenorMonths: 0,
    interestRate: 0,
    eligiblePrograms: ['Manufaktur CNC Presisi', 'Mekatronika & Robotika Industri'],
    eligibilityCriteria: 'Lulusan SMK/D3 teknik, IPK/Nilai min 7.8, lolos tes psikotes dan wawancara gabungan Astra-STP.',
    contactPerson: 'Talent Acquisition Team PT Astra',
    contactPhone: '021-65304956',
    quotaTotal: 30,
    quotaUsed: 26,
    isActive: true,
    isFeatured: true,
    startDate: '2026-02-01',
    endDate: '2026-11-30',
  },
  {
    id: 'scheme-rskb-surakarta',
    partnerId: 'pemkot-surakarta-rskb',
    partnerName: 'Pemerintah Kota Surakarta (RSKB)',
    partnerLogo: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=120&auto=format&fit=crop&q=80',
    schemeType: 'VOUCHER_PELATIHAN',
    title: 'Subsidi Voucher Vokasi RSKB Surakarta',
    description: 'Voucher stimulus pelatihan kerja dari Pemerintah Kota Surakarta melalui platform Rumah Siap Kerja Bersama (RSKB).',
    maxAmount: 8500000,
    tenorMonths: 0,
    interestRate: 0,
    eligiblePrograms: ['Digital Marketing & Content Creator', 'Desain Grafis & Motion Media', 'Teknisi Pengelasan Dasar'],
    eligibilityCriteria: 'Wajib KTP Kota Surakarta (Solo), terdaftar di DTKS atau pencari kerja aktif Disnaker Solo.',
    contactPerson: 'Sekretariat RSKB Solo Technopark',
    contactPhone: '0271-666628',
    quotaTotal: 150,
    quotaUsed: 110,
    isActive: true,
    isFeatured: false,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
];

export const financingService = {
  /**
   * Mengambil seluruh skema pembiayaan aktif untuk publik
   */
  async getActiveSchemes(): Promise<FinancingScheme[]> {
    try {
      const q = query(
        collection(db, getSchemesPath()),
        where('isActive', '==', true),
        limit(50)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return INITIAL_FINANCING_SCHEMES;
      }

      const list: FinancingScheme[] = [];
      snap.docs.forEach((docSnap) => {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const parsed = FinancingSchemeSchema.safeParse(raw);
        if (parsed.success) {
          list.push(parsed.data);
        } else {
          list.push(raw as FinancingScheme);
        }
      });

      return list.length > 0 ? list : INITIAL_FINANCING_SCHEMES;
    } catch (err) {
      console.warn('[financingService] Fallback getActiveSchemes to initial data:', err);
      return INITIAL_FINANCING_SCHEMES;
    }
  },

  /**
   * Mengambil semua skema untuk Admin & Mitra Perbankan
   */
  async getAllSchemes(partnerId?: string): Promise<FinancingScheme[]> {
    try {
      let q = query(collection(db, getSchemesPath()), orderBy('createdAt', 'desc'), limit(100));
      if (partnerId) {
        q = query(
          collection(db, getSchemesPath()),
          where('partnerId', '==', partnerId),
          limit(100)
        );
      }
      const snap = await getDocs(q);

      if (snap.empty && !partnerId) {
        return INITIAL_FINANCING_SCHEMES;
      }

      return snap.docs.map((docSnap) => {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const parsed = FinancingSchemeSchema.safeParse(raw);
        return parsed.success ? parsed.data : (raw as FinancingScheme);
      });
    } catch (err) {
      console.warn('[financingService] Fallback getAllSchemes:', err);
      return partnerId ? [] : INITIAL_FINANCING_SCHEMES;
    }
  },

  /**
   * Menambah skema pembiayaan baru (Admin STP / Mitra Bank)
   */
  async createScheme(data: Omit<FinancingSchemeInput, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getSchemesPath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload = {
        ...data,
        id: newDocRef.id,
        createdAt: now,
        updatedAt: now,
      };

      const parsed = FinancingSchemeSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Validasi skema gagal: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[financingService] Error createScheme:', err);
      return { success: false, error: err.message || 'Gagal membuat skema pembiayaan.' };
    }
  },

  /**
   * Update skema pembiayaan
   */
  async updateScheme(id: string, data: Partial<FinancingScheme>): Promise<boolean> {
    try {
      const docRef = doc(db, getSchemesPath(), id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[financingService] Error updateScheme:', err);
      return false;
    }
  },

  /**
   * Hapus skema
   */
  async deleteScheme(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, getSchemesPath(), id));
      return true;
    } catch (err) {
      console.error('[financingService] Error deleteScheme:', err);
      return false;
    }
  },

  /**
   * Mengajukan formulir pembiayaan / kredit pelatihan oleh calon peserta (Publik)
   */
  async submitApplication(
    data: Omit<FinancingApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getApplicationsPath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload: FinancingApplication = {
        ...data,
        id: newDocRef.id,
        status: 'SUBMITTED',
        createdAt: now,
        updatedAt: now,
      };

      const parsed = FinancingApplicationSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Format pengajuan tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[financingService] Error submitApplication:', err);
      return { success: false, error: err.message || 'Gagal mengajukan fasilitas pembiayaan.' };
    }
  },

  /**
   * Mengambil daftar aplikasi pembiayaan untuk Admin atau Mitra Bank
   */
  async getApplications(params?: {
    partnerId?: string;
    schemeId?: string;
    status?: FinancingApplicationStatus;
  }): Promise<FinancingApplication[]> {
    try {
      let q = query(
        collection(db, getApplicationsPath()),
        orderBy('createdAt', 'desc'),
        limit(150)
      );

      if (params?.partnerId) {
        q = query(
          collection(db, getApplicationsPath()),
          where('partnerId', '==', params.partnerId),
          limit(150)
        );
      }

      const snap = await getDocs(q);
      const list: FinancingApplication[] = [];

      snap.docs.forEach((d) => {
        const raw = { id: d.id, ...d.data() };
        const parsed = FinancingApplicationSchema.safeParse(raw);
        if (parsed.success) {
          list.push(parsed.data);
        } else {
          list.push(raw as FinancingApplication);
        }
      });

      return list;
    } catch (err) {
      console.warn('[financingService] Fallback getApplications:', err);
      return [];
    }
  },

  /**
   * Update status aplikasi pembiayaan (Admin STP verifikasi awal / Bank persetujuan)
   */
  async updateApplicationStatus(
    id: string,
    status: FinancingApplicationStatus,
    notes?: { stpReviewNotes?: string; bankReviewNotes?: string; approvedAmount?: number; approvedTenor?: number }
  ): Promise<boolean> {
    try {
      const docRef = doc(db, getApplicationsPath(), id);
      await updateDoc(docRef, {
        status,
        ...(notes || {}),
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[financingService] Error updateApplicationStatus:', err);
      return false;
    }
  },
};

