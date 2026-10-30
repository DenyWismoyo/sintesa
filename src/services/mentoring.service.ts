// src/services/mentoring.service.ts
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import {
  IncubationMentoringSession,
  IncubationMentoringSessionSchema,
  DealRoomAccess,
  DealRoomAccessSchema,
  TenantSubsidyVoucher,
  TenantSubsidyVoucherSchema,
} from '@/types/incubationMentoring.types';

const getMentoringBasePath = () =>
  `artifacts/${getAppId()}/public/data/mentoring_sessions`;

const getDealRoomBasePath = () =>
  `artifacts/${getAppId()}/public/data/deal_room_access`;

const getSubsidyVoucherBasePath = () =>
  `artifacts/${getAppId()}/public/data/tenant_subsidy_vouchers`;

export const mentoringService = {
  // ==================== MENTORING SESSIONS ====================
  async getAllMentoringSessions(maxLimit: number = 200): Promise<IncubationMentoringSession[]> {
    try {
      const q = query(collection(db, getMentoringBasePath()), orderBy('scheduledAt', 'desc'), limit(maxLimit));
      const snap = await getDocs(q);
      const list: IncubationMentoringSession[] = [];
      snap.docs.forEach((d) => {
        const parsed = IncubationMentoringSessionSchema.safeParse({ id: d.id, ...d.data() });
        list.push(parsed.success ? parsed.data : ({ id: d.id, ...d.data() } as IncubationMentoringSession));
      });
      return list;
    } catch (err) {
      console.warn('[mentoringService] Error getAllMentoringSessions:', err);
      return [];
    }
  },

  async getTenantMentoringSessions(tenantId: string): Promise<IncubationMentoringSession[]> {
    try {
      const q = query(
        collection(db, getMentoringBasePath()),
        where('tenantId', '==', tenantId),
        limit(100)
      );
      const snap = await getDocs(q);
      const list: IncubationMentoringSession[] = [];
      snap.docs.forEach((d) => {
        const parsed = IncubationMentoringSessionSchema.safeParse({ id: d.id, ...d.data() });
        list.push(parsed.success ? parsed.data : ({ id: d.id, ...d.data() } as IncubationMentoringSession));
      });
      return list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    } catch (err) {
      console.warn('[mentoringService] Error getTenantMentoringSessions:', err);
      return [];
    }
  },

  async createMentoringSession(data: Omit<IncubationMentoringSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getMentoringBasePath());
      const newDocRef = doc(colRef);
      const now = Date.now();
      const payload: IncubationMentoringSession = {
        ...data,
        id: newDocRef.id,
        createdAt: now,
        updatedAt: now,
      };
      const parsed = IncubationMentoringSessionSchema.safeParse(payload);
      if (!parsed.success) {
        return { success: false, error: 'Format data mentoring tidak valid' };
      }
      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[mentoringService] Error createMentoringSession:', err);
      return { success: false, error: err.message || 'Gagal membuat sesi mentoring' };
    }
  },

  async updateMentoringSession(id: string, data: Partial<IncubationMentoringSession>): Promise<boolean> {
    try {
      const docRef = doc(db, getMentoringBasePath(), id);
      await updateDoc(docRef, { ...data, updatedAt: Date.now() });
      return true;
    } catch (err) {
      console.error('[mentoringService] Error updateMentoringSession:', err);
      return false;
    }
  },

  // ==================== VIRTUAL DEAL ROOM ====================
  async getAllDealRoomRequests(maxLimit: number = 200): Promise<DealRoomAccess[]> {
    try {
      const q = query(collection(db, getDealRoomBasePath()), orderBy('createdAt', 'desc'), limit(maxLimit));
      const snap = await getDocs(q);
      const list: DealRoomAccess[] = [];
      snap.docs.forEach((d) => {
        const parsed = DealRoomAccessSchema.safeParse({ id: d.id, ...d.data() });
        list.push(parsed.success ? parsed.data : ({ id: d.id, ...d.data() } as DealRoomAccess));
      });
      return list;
    } catch (err) {
      console.warn('[mentoringService] Error getAllDealRoomRequests:', err);
      return [];
    }
  },

  async requestDealRoomAccess(params: {
    investorUid: string;
    investorName: string;
    investorOrg: string;
    investorEmail: string;
    tenantId: string;
    tenantName: string;
    ndaAccepted: boolean;
    ndaSignedName: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const colRef = collection(db, getDealRoomBasePath());
      const newDocRef = doc(colRef);
      const now = Date.now();
      const payload: DealRoomAccess = {
        ...params,
        id: newDocRef.id,
        ndaAcceptedAt: now,
        status: 'ACTIVE_ACCESS',
        createdAt: now,
        updatedAt: now,
      };
      const parsed = DealRoomAccessSchema.safeParse(payload);
      if (!parsed.success) {
        return { success: false, error: 'Data pengajuan Deal Room tidak valid' };
      }
      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[mentoringService] Error requestDealRoomAccess:', err);
      return { success: false, error: err.message };
    }
  },

  async updateDealRoomStatus(id: string, status: DealRoomAccess['status'], notes?: string): Promise<boolean> {
    try {
      const docRef = doc(db, getDealRoomBasePath(), id);
      await updateDoc(docRef, { status, loiNotes: notes || '', updatedAt: Date.now() });
      return true;
    } catch (err) {
      console.error('[mentoringService] Error updateDealRoomStatus:', err);
      return false;
    }
  },

  // ==================== SUBSIDY VOUCHERS ====================
  async getTenantVouchers(tenantId: string): Promise<TenantSubsidyVoucher[]> {
    try {
      const q = query(
        collection(db, getSubsidyVoucherBasePath()),
        where('tenantId', '==', tenantId),
        limit(20)
      );
      const snap = await getDocs(q);
      const list: TenantSubsidyVoucher[] = [];
      snap.docs.forEach((d) => {
        const parsed = TenantSubsidyVoucherSchema.safeParse({ id: d.id, ...d.data() });
        list.push(parsed.success ? parsed.data : ({ id: d.id, ...d.data() } as TenantSubsidyVoucher));
      });
      return list;
    } catch (err) {
      console.warn('[mentoringService] Error getTenantVouchers:', err);
      return [];
    }
  },

  async createSubsidyVoucher(data: Omit<TenantSubsidyVoucher, 'id' | 'createdAt'>): Promise<{
    success: boolean;
    id?: string;
  }> {
    try {
      const colRef = collection(db, getSubsidyVoucherBasePath());
      const newDocRef = doc(colRef);
      const payload: TenantSubsidyVoucher = {
        ...data,
        id: newDocRef.id,
        createdAt: Date.now(),
      };
      await setDoc(newDocRef, payload);
      return { success: true, id: newDocRef.id };
    } catch (err) {
      console.error('[mentoringService] Error createSubsidyVoucher:', err);
      return { success: false };
    }
  },
};

