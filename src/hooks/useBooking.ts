// Lokasi file: hooks/useBooking.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { Booking } from '@/types'; 
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';

export function useBooking(mode: 'admin' | 'public' = 'public') {
  const queryClient = useQueryClient();

  // Query untuk mengambil data jadwal (Read Data)
  const { 
    data: bookings = [], 
    isLoading: loading, 
    error: queryError 
  } = useQuery({
    queryKey: ['bookings', mode],
    queryFn: async () => {
      // Publik tidak diizinkan menarik seluruh data booking mentah demi privasi
      if (mode === 'public') return []; 
      return await bookingService.getAllBookingsData();
    },
    enabled: mode === 'admin',
    staleTime: 1000 * 30, // Cegah refetch berlebihan saat ganti tab (R-016)
    refetchInterval: mode === 'admin' ? 30000 : false, // Polling wajar 30 detik
    refetchOnWindowFocus: true
  });

  const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);

  // --- MUTASI (Tulis Data Publik via Cloud Function) ---
  const submitMutation = useMutation({
    mutationFn: async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'> | any) => {
      const result = await bookingService.submitBooking(bookingData);
      if (!result.success) {
        throw new Error(result.error || 'Terjadi kesalahan saat memproses pengajuan.');
      }
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status, notes }: { bookingId: string, status: 'pending' | 'approved' | 'rejected' | 'completed', notes?: string }) => 
      bookingService.updateBookingStatus(bookingId, status, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });

  // --- FASE 2: MUTASI KHUSUS ADMIN (Bypass Cloud Function) ---
  const adminDirectBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const appId = getAppId();
      
      // Admin menulis langsung ke koleksi bookings.
      // Status sudah ditentukan di komponen (bisa 'completed' untuk internal, 'approved' untuk eksternal)
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), {
        ...bookingData,
        createdAt: Date.now(),
        adminNotes: 'Diinput secara manual oleh Admin melalui Kalender Master'
      });
      return docRef.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] })
  });


  // --- WRAPPER FUNGSI UNTUK DIPANGGIL DI UI (COMPONENTS) ---

  const submitBooking = async (bookingData: any) => {
    try {
      await submitMutation.mutateAsync(bookingData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const trackBooking = async (email: string) => {
    try {
      const results = await bookingService.trackBookingsByEmail(email);
      return { success: true, data: results };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const approveBooking = async (bookingId: string, notes?: string) => {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status: 'approved', notes });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const rejectBooking = async (bookingId: string, notes?: string) => {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status: 'rejected', notes });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const adminCreateBooking = async (bookingData: any) => {
    try {
      const newId = await adminDirectBookingMutation.mutateAsync(bookingData);
      return { success: true, bookingId: newId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    bookings,
    loading,
    error,
    submitBooking,
    trackBooking,
    approveBooking,
    rejectBooking,
    adminCreateBooking // Export fungsi baru ini
  };
}