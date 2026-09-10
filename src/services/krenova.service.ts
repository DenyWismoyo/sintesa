import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KrenovaContent, KrenovaContentSchema } from '@/types';

// Standalone collection khusus untuk Explore KRENOVA
const COLLECTION_NAME = 'krenova_contents';

export const krenovaService = {
  // Mengambil semua video
  getContents: async (): Promise<KrenovaContent[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const contents: KrenovaContent[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        const parsed = KrenovaContentSchema.safeParse(data);
        if (parsed.success) {
          contents.push(parsed.data);
        } else {
          console.warn(`Data Krenova Content Corrupt (ID: ${docSnap.id}):`, parsed.error);
        }
      });
      return contents;
    } catch (error) {
      console.error("Error fetching Krenova contents:", error);
      return []; // Return array kosong jika gagal/koleksi belum ada
    }
  },

  // (Opsional) Fungsi tambahan untuk Admin Dashboard nanti
  addContent: async (data: Omit<KrenovaContent, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), { ...data, createdAt: Date.now() });
  },

  updateContent: async (id: string, data: Partial<KrenovaContent>) => {
    return await updateDoc(doc(db, COLLECTION_NAME, id), data);
  },

  deleteContent: async (id: string) => {
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  }
};