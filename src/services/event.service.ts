import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storageService } from '@/services/storage.service';
import { AppEvent, EventSchema } from '@/types';

const COLLECTION_NAME = 'events';

export const eventService = {
  getEvents: async (): Promise<AppEvent[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const events: AppEvent[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const parsed = EventSchema.safeParse(data);
      if (parsed.success) events.push(parsed.data);
    });
    return events;
  },

  createEvent: async (data: Omit<AppEvent, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), { ...data, createdAt: Date.now() });
  },

  updateEvent: async (id: string, data: Partial<AppEvent>) => {
    return await updateDoc(doc(db, COLLECTION_NAME, id), data);
  },

  deleteEvent: async (id: string) => {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        const data = snap.data();
        if (data.bannerUrl) await storageService.deleteFile(data.bannerUrl);
        if (data.imageUrl) await storageService.deleteFile(data.imageUrl);
      }
    } catch (error) {
      console.warn('[STORAGE] Gagal membersihkan gambar event:', error);
    }
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  uploadImage: async (file: File): Promise<string> => {
    return await storageService.uploadImage(file, 'events');
  }
};