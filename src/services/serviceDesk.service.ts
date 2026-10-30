// src/services/serviceDesk.service.ts
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { WorkOrder, WorkOrderSchema } from '@/types/serviceDesk.types';

const getWorkOrderBasePath = () =>
  `artifacts/${getAppId()}/public/data/work_orders`;

export const serviceDeskService = {
  /**
   * Menghasilkan nomor SPK otomatis (SPK-YYYYMM-XXXX)
   */
  generateSpkNumber(): string {
    const d = new Date();
    const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    return `SPK-${yearMonth}-${randomHex}`;
  },

  /**
   * Mengambil seluruh Work Order / SPK
   */
  async getAllWorkOrders(maxLimit: number = 200): Promise<WorkOrder[]> {
    try {
      const q = query(
        collection(db, getWorkOrderBasePath()),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      const list: WorkOrder[] = [];

      snap.docs.forEach((docSnap) => {
        const parsed = WorkOrderSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          list.push(parsed.data);
        } else {
          list.push({ id: docSnap.id, ...docSnap.data() } as WorkOrder);
        }
      });

      return list;
    } catch (err) {
      console.warn('[serviceDeskService] Error getAllWorkOrders:', err);
      return [];
    }
  },

  /**
   * Mengambil Work Order berdasarkan ID
   */
  async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    try {
      const docRef = doc(db, getWorkOrderBasePath(), id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const parsed = WorkOrderSchema.safeParse({ id: snap.id, ...snap.data() });
      return parsed.success ? parsed.data : ({ id: snap.id, ...snap.data() } as WorkOrder);
    } catch (err) {
      console.error('[serviceDeskService] Error getWorkOrderById:', err);
      return null;
    }
  },

  /**
   * Menerbitkan SPK / Work Order baru
   */
  async createWorkOrder(data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {
    try {
      const colRef = collection(db, getWorkOrderBasePath());
      const newDocRef = doc(colRef);
      const now = Date.now();

      const payload: WorkOrder = {
        ...data,
        id: newDocRef.id,
        spkNumber: data.spkNumber || this.generateSpkNumber(),
        createdAt: now,
        updatedAt: now,
      };

      const parsed = WorkOrderSchema.safeParse(payload);
      if (!parsed.success) {
        return {
          success: false,
          error: 'Format SPK tidak valid: ' + parsed.error.issues.map((i) => i.message).join(', '),
        };
      }

      await setDoc(newDocRef, parsed.data);
      return { success: true, id: newDocRef.id };
    } catch (err: any) {
      console.error('[serviceDeskService] Error createWorkOrder:', err);
      return { success: false, error: err.message || 'Gagal menerbitkan SPK.' };
    }
  },

  /**
   * Memperbarui data Work Order / SPK
   */
  async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<boolean> {
    try {
      const docRef = doc(db, getWorkOrderBasePath(), id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error('[serviceDeskService] Error updateWorkOrder:', err);
      return false;
    }
  },

  /**
   * Menugaskan Teknisi ke Work Order
   */
  async assignTechnician(
    id: string,
    technicianName: string,
    technicianPhone: string,
    priority: WorkOrder['priority'],
    targetCompletionDate?: string
  ): Promise<boolean> {
    return this.updateWorkOrder(id, {
      technicianName,
      technicianPhone,
      priority,
      status: 'ASSIGNED',
      targetCompletionDate,
    });
  },

  /**
   * Menyelesaikan Work Order dengan BAST
   */
  async resolveWorkOrder(
    id: string,
    params: {
      completionNotes: string;
      actualCost: number;
      afterPhotoUrl?: string;
      bastSignedDate?: string;
    }
  ): Promise<boolean> {
    return this.updateWorkOrder(id, {
      ...params,
      status: 'RESOLVED',
      bastSignedDate: params.bastSignedDate || new Date().toISOString().split('T')[0],
    });
  },

  /**
   * Menghapus Work Order
   */
  async deleteWorkOrder(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, getWorkOrderBasePath(), id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error('[serviceDeskService] Error deleteWorkOrder:', err);
      return false;
    }
  },
};

