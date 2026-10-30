// src/services/partnership.service.ts
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { PartnershipInquiry, PartnershipInquirySchema, MouContract, MouContractSchema } from '@/types/partnership.types';

const getPartnershipBasePath = () =>
  `artifacts/${getAppId()}/public/data/partnership_inquiries`;

const getMouBasePath = () =>
  `artifacts/${getAppId()}/public/data/mou_contracts`;

export const partnershipService = {
  /**
   * Mengajukan formulir kemitraan strategis baru dari publik / calon mitra industri
   */
  async submitInquiry(data: Omit<PartnershipInquiry, 'id' | 'status' | 'createdAt'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getPartnershipBasePath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload: PartnershipInquiry = {
        ...data,
        id: newDocRef.id,
        status: 'PENDING',
        createdAt: now,
      };

      const parsed = PartnershipInquirySchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Format data tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[partnershipService] Error submitInquiry:', err);
      return {
        success: false,
        error: err.message || 'Gagal mengirimkan permohonan kemitraan.',
      };
    }
  },

  /**
   * Mengambil seluruh pengajuan kemitraan untuk Dashboard Admin
   */
  async getAllInquiries(maxLimit: number = 200): Promise<PartnershipInquiry[]> {
    try {
      const q = query(
        collection(db, getPartnershipBasePath()),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      const list: PartnershipInquiry[] = [];

      snap.docs.forEach((docSnap) => {
        const parsed = PartnershipInquirySchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          list.push(parsed.data);
        } else {
          list.push({ id: docSnap.id, ...docSnap.data() } as PartnershipInquiry);
        }
      });

      return list;
    } catch (err) {
      console.warn('[partnershipService] Fallback getAllInquiries:', err);
      return [];
    }
  },

  /**
   * Memperbarui status penanganan kemitraan oleh Tim Admin STP
   */
  async updateInquiryStatus(
    id: string,
    status: PartnershipInquiry['status'],
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, getPartnershipBasePath(), id);
      await updateDoc(docRef, {
        status,
        ...(adminNotes ? { adminNotes } : {}),
      });
      return true;
    } catch (err) {
      console.error('[partnershipService] Gagal update status:', err);
      return false;
    }
  },

  /**
   * Mengambil semua data MoU / PKS
   */
  async getAllMouContracts(maxLimit: number = 200): Promise<MouContract[]> {
    try {
      const q = query(
        collection(db, getMouBasePath()),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      const list: MouContract[] = [];

      snap.docs.forEach((docSnap) => {
        const parsed = MouContractSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          list.push(parsed.data);
        } else {
          list.push({ id: docSnap.id, ...docSnap.data() } as MouContract);
        }
      });

      return list;
    } catch (err) {
      console.warn('[partnershipService] Error getAllMouContracts:', err);
      return [];
    }
  },

  /**
   * Menambahkan MoU / PKS Baru
   */
  async createMouContract(data: Omit<MouContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getMouBasePath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload: MouContract = {
        ...data,
        id: newDocRef.id,
        createdAt: now,
        updatedAt: now,
      };

      const parsed = MouContractSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Format dokumen MoU tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[partnershipService] Error createMouContract:', err);
      return { success: false, error: err.message || 'Gagal menyimpan MoU/PKS.' };
    }
  },

  /**
   * Memperbarui dokumen MoU / PKS
   */
  async updateMouContract(id: string, data: Partial<MouContract>): Promise<boolean> {
    try {
      const docRef = doc(db, getMouBasePath(), id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[partnershipService] Error updateMouContract:', err);
      return false;
    }
  },

  /**
   * Menghapus dokumen MoU / PKS
   */
  async deleteMouContract(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, getMouBasePath(), id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error('[partnershipService] Error deleteMouContract:', err);
      return false;
    }
  },
};
