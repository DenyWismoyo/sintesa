import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storageService } from '@/services/storage.service';
import { AppEvent, EventSchema, EventRegistration, EventRegistrationSchema } from '@/types';

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
  },

  /**
   * Pendaftaran peserta event resmi (Tiket Masuk & QR Code)
   */
  registerEvent: async (eventId: string, registrationData: Omit<EventRegistration, 'id' | 'eventId' | 'ticketCode' | 'registeredAt'>) => {
    try {
      const regRef = doc(collection(db, COLLECTION_NAME, eventId, 'registrations'));
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ticketCode = `TKT-EVT-${randomSuffix}`;

      const finalRecord: EventRegistration = {
        ...registrationData,
        id: regRef.id,
        eventId,
        ticketCode,
        registeredAt: Date.now()
      };

      await setDoc(regRef, finalRecord);

      return {
        success: true,
        registrationId: regRef.id,
        ticketCode,
        record: finalRecord
      };
    } catch (error: any) {
      console.error('Error registerEvent:', error);
      return { success: false, error: error.message || 'Gagal mendaftar event.' };
    }
  },

  /**
   * Mengambil seluruh daftar pendaftar tiket event (untuk panel admin)
   */
  getEventRegistrations: async (eventId: string): Promise<EventRegistration[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME, eventId, 'registrations'), orderBy('registeredAt', 'desc'));
      const snap = await getDocs(q);
      const list: EventRegistration[] = [];
      snap.forEach(d => {
        const parsed = EventRegistrationSchema.safeParse({ id: d.id, ...d.data() });
        if (parsed.success) list.push(parsed.data);
      });
      return list;
    } catch (error) {
      console.error('Error getEventRegistrations:', error);
      return [];
    }
  },

  /**
   * Verifikasi kehadiran peserta event (Check-in di lokasi)
   */
  verifyAttendance: async (eventId: string, ticketCode: string) => {
    try {
      const registrations = await eventService.getEventRegistrations(eventId);
      const matched = registrations.find(r => r.ticketCode === ticketCode.trim().toUpperCase());
      if (!matched || !matched.id) {
        return { success: false, error: 'Kode tiket tidak ditemukan untuk event ini.' };
      }
      if (matched.status === 'ATTENDED') {
        return { success: false, error: 'Tiket ini sudah pernah digunakan untuk check-in.' };
      }

      await updateDoc(doc(db, COLLECTION_NAME, eventId, 'registrations', matched.id), {
        status: 'ATTENDED',
        attendedAt: Date.now()
      });

      return { success: true, registration: { ...matched, status: 'ATTENDED' as const, attendedAt: Date.now() } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal memverifikasi kehadiran.' };
    }
  }
};
