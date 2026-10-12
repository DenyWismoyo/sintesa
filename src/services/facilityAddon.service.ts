// src/services/facilityAddon.service.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { FacilityAddon, FacilityAddonSchema, DEFAULT_FACILITY_ADDONS } from '@/types/facilityAddon.types';
export { DEFAULT_FACILITY_ADDONS };

const getBasePath = () => `artifacts/${getAppId()}/public/data/facility_addons`;

export const facilityAddonService = {
  /**
   * Mengambil semua fasilitas teknis & add-ons (untuk Admin)
   */
  async getAllAddons(): Promise<FacilityAddon[]> {
    try {
      const q = query(collection(db, getBasePath()));
      const snap = await getDocs(q);
      const items: FacilityAddon[] = [];

      snap.docs.forEach((docSnap) => {
        const parsed = FacilityAddonSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          items.push(parsed.data);
        } else {
          items.push({ id: docSnap.id, ...docSnap.data() } as FacilityAddon);
        }
      });

      // Urutkan berdasarkan waktu buat / nama
      return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.error('Gagal mengambil data facility addons:', err);
      return [];
    }
  },

  /**
   * Mengambil fasilitas teknis yang aktif dan siap disewa (untuk Halaman Publik / Kalkulator)
   */
  async getActiveAddons(): Promise<FacilityAddon[]> {
    try {
      const items = await this.getAllAddons();
      const activeItems = items.filter((item) => item.isAvailable);

      // Jika di Firestore belum ada data sama sekali, fallback ke data default
      if (activeItems.length === 0) {
        return DEFAULT_FACILITY_ADDONS.map((d, index) => ({
          id: `addon-default-${index + 1}`,
          ...d,
        }));
      }

      return activeItems;
    } catch (err) {
      console.error('Gagal mengambil active addons:', err);
      return DEFAULT_FACILITY_ADDONS.map((d, index) => ({
        id: `addon-default-${index + 1}`,
        ...d,
      }));
    }
  },

  /**
   * Membuat perlengkapan teknis baru
   */
  async createAddon(data: Omit<FacilityAddon, 'id'>): Promise<string> {
    const validated = FacilityAddonSchema.omit({ id: true }).parse(data);
    const docRef = doc(collection(db, getBasePath()));
    const now = Date.now();
    await setDoc(docRef, {
      ...validated,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  /**
   * Memperbarui perlengkapan teknis
   */
  async updateAddon(id: string, data: Partial<FacilityAddon>): Promise<void> {
    const docRef = doc(db, getBasePath(), id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Menghapus perlengkapan teknis
   */
  async deleteAddon(id: string): Promise<void> {
    const docRef = doc(db, getBasePath(), id);
    await deleteDoc(docRef);
  },

  /**
   * Inisialisasi awal paket perlengkapan standar kawasan UPT Solo Technopark
   */
  async seedDefaultAddons(): Promise<number> {
    let count = 0;
    for (const addon of DEFAULT_FACILITY_ADDONS) {
      const docRef = doc(collection(db, getBasePath()));
      await setDoc(docRef, addon);
      count++;
    }
    return count;
  },
};
