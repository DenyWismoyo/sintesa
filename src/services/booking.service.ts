// Lokasi file: src/services/booking.service.ts

import { collection, doc, getDocs, query, updateDoc, where, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { Booking, BookingSchema } from '@/types';

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
    const q = query(collection(db, getBasePath()), orderBy('createdAt', 'desc'), limit(maxLimit));
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
  }
};