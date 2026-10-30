// Lokasi file: src/services/booking.service.ts

import { collection, doc, getDocs, setDoc, query, updateDoc, where, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { Booking, BookingSchema } from '@/types';
import { MOCK_BOOKINGS } from '@/data/mock/bookingMockData';

const getBasePath = () => `artifacts/${getAppId()}/public/data/bookings`;

export const bookingService = {
  
  // Memanggil Cloud Function submitBooking untuk pencegahan race condition
  async submitBooking(bookingData: any) {
    try {
      const submitBookingCallable = httpsCallable(functions, 'submitBooking');
      
      const payload = {
        ...bookingData,
        appId: getAppId()
      };
      
      const result = await submitBookingCallable(payload);
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error("Booking Error (Cloud Function):", error);
      return { 
        success: false, 
        error: error.message || 'Gagal mengajukan peminjaman. Silakan coba lagi.' 
      };
    }
  },

  async getAllBookingsData(maxLimit: number = 200): Promise<Booking[]> {
    try {
      let snap;
      try {
        const q = query(collection(db, getBasePath()), orderBy('createdAt', 'desc'), limit(maxLimit));
        snap = await getDocs(q);
      } catch (err) {
        const qSimple = query(collection(db, getBasePath()), limit(maxLimit));
        snap = await getDocs(qSimple);
      }

      const bookings: Booking[] = [];
      snap.docs.forEach(docSnap => {
        const parsed = BookingSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          bookings.push(parsed.data);
        } else {
          bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        }
      });

      if (bookings.length === 0) {
        return MOCK_BOOKINGS;
      }
      return bookings;
    } catch (error) {
      console.warn("[BOOKING SERVICE] Memakai mock data booking sebagai fallback:", error);
      return MOCK_BOOKINGS;
    }
  },

  async trackBookingsByEmail(email: string): Promise<Booking[]> {
    try {
      // P8: Tambahkan orderBy createdAt desc untuk urutan pasti booking terbaru
      const q = query(
        collection(db, getBasePath()), 
        where('userEmail', '==', email),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const bookings: Booking[] = [];
      snap.docs.forEach(docSnap => {
        const parsed = BookingSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          bookings.push(parsed.data);
        } else {
          bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        }
      });
      return bookings;
    } catch (err) {
      // Fallback in-memory sorting jika Firestore composite index sedang provisioning
      console.warn("[BOOKING TRACK] Fallback to in-memory sort:", err);
      const q = query(
        collection(db, getBasePath()), 
        where('userEmail', '==', email)
      );
      const snap = await getDocs(q);
      const bookings: Booking[] = [];
      snap.docs.forEach(docSnap => {
        const parsed = BookingSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
        if (parsed.success) {
          bookings.push(parsed.data);
        } else {
          bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        }
      });
      return bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  },

  async updateBookingStatus(bookingId: string, status: 'pending' | 'approved' | 'rejected' | 'completed', notes?: string) {
    const docRef = doc(db, getBasePath(), bookingId);
    await updateDoc(docRef, { 
      status, 
      adminNotes: notes || '' 
    });
    return true;
  },

  // Optimalisasi R-001: Enkapsulasi pengambilan jadwal booking terverifikasi untuk kalender publik
  async getPublicApprovedBookings(): Promise<Booking[]> {
    const q = query(
      collection(db, getBasePath()),
      where('status', 'in', ['approved', 'completed'])
    );
    const snap = await getDocs(q);
    const bookings: Booking[] = [];
    snap.docs.forEach(docSnap => {
      const parsed = BookingSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) {
        bookings.push(parsed.data);
      } else {
        bookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
      }
    });
    return bookings;
  },

  /**
   * Mengambil slot waktu/tanggal yang sudah dipesan (Approved/Completed) untuk satu aset
   * Tanpa mengekspos data pribadi pemesan demi privasi publik.
   */
  async getOccupiedSlots(assetId: string): Promise<{ startDate: string; endDate: string; timeSlot?: string }[]> {
    try {
      const q = query(
        collection(db, getBasePath()),
        where('assetId', '==', assetId)
      );
      const snap = await getDocs(q);
      const list: { startDate: string; endDate: string; timeSlot?: string }[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (['approved', 'completed'].includes(data.status)) {
          list.push({
            startDate: data.startDate,
            endDate: data.endDate || data.startDate,
            timeSlot: data.timeSlot || `${data.startTime || '08:00'} - ${data.endTime || '17:00'}`
          });
        }
      });
      return list;
    } catch (err) {
      console.warn('Gagal membaca occupied slots:', err);
      return [];
    }
  },

  /**
   * Menyuntikkan paket mock data booking fasilitas kawasan ke Firestore untuk demo
   */
  async seedMockBookings(): Promise<number> {
    let count = 0;
    for (const b of MOCK_BOOKINGS) {
      const docRef = doc(db, getBasePath(), b.id!);
      await setDoc(docRef, b, { merge: true });
      count++;
    }
    return count;
  }
};