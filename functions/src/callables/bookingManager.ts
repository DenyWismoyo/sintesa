import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Keamanan Tambahan: Pastikan admin diinisialisasi (Jika belum di-handle oleh index.ts)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Format path standar aplikasi (mendukung multi-tenant / dynamic appId)
const getBookingCollectionPath = (appId: string) => `artifacts/${appId}/public/data/bookings`;

export const submitBooking = onCall(async (request) => {
  // KEAMANAN (VULN-04): Wajibkan autentikasi pengguna untuk mencegah pemesanan spam anonim
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus login terlebih dahulu untuk mengajukan peminjaman ruangan.');
  }

  const authUid = request.auth.uid;
  const authEmail = request.auth.token?.email || '';

  const data = request.data || {};
  const appId = data.appId || 'blud-app-dev'; 

  const { assetId, startDate, endDate, startTime, endTime } = data;

  if (!assetId || !startDate || !endDate || !startTime || !endTime) {
    throw new HttpsError('invalid-argument', 'Data peminjaman tidak lengkap.');
  }

  const bookingCollectionRef = db.collection(getBookingCollectionPath(appId));

  try {
    // Memulai Transaksi Database: Mengunci data agar tidak ada Race Condition (Booking bersamaan)
    const result = await db.runTransaction(async (transaction) => {
      
      // PERBAIKAN UTAMA:
      // Kita HANYA mencari berdasarkan assetId. Kita menghindari penggunaan multiple .where()
      // untuk mencegah error 500 (Missing Composite Index) dari Firestore.
      const clashQuery = bookingCollectionRef.where('assetId', '==', assetId);
      const clashSnapshot = await transaction.get(clashQuery);
      
      let isClashing = false;
      
      // Penyaringan (Filtering) bentrok jadwal dilakukan di dalam memori
      clashSnapshot.forEach((doc) => {
        const existing = doc.data();
        
        // 1. Hanya perdulikan jadwal yang statusnya sudah disetujui / lunas
        if (existing.status === 'approved' || existing.status === 'completed') {
            
            // 2. Cek Irisan Tanggal (Date Overlap)
            // Rumus: Start Baru <= End Lama DAN End Baru >= Start Lama
            const isDateOverlap = startDate <= existing.endDate && endDate >= existing.startDate;

            if (isDateOverlap) {
                // 3. Cek Irisan Jam (Time Overlap) jika tanggalnya ternyata bersinggungan
                // Rumus: Waktu Mulai Baru < Waktu Selesai Lama DAN Waktu Selesai Baru > Waktu Mulai Lama
                const isTimeOverlap = startTime < existing.endTime && endTime > existing.startTime;
                
                if (isTimeOverlap) {
                    isClashing = true; // Terdeteksi bentrok!
                }
            }
        }
      });

      if (isClashing) {
        // Melempar status "already-exists" agar ditangkap rapi oleh frontend tanpa memunculkan error 500
        throw new HttpsError('already-exists', 'Maaf, Ruangan sudah dipesan pada tanggal dan jam tersebut. Silakan pilih waktu lain.');
      }

      // 4. Jika aman (tidak bentrok), buat referensi ID dokumen baru
      const newBookingRef = bookingCollectionRef.doc();
      
      // Sanitasi atribut peminjaman untuk mencegah injeksi field berlebih
      const newBookingData = {
        id: newBookingRef.id,
        appId,
        assetId: String(assetId),
        assetName: typeof data.assetName === 'string' ? data.assetName : '',
        userId: authUid,
        userEmail: authEmail || (typeof data.userEmail === 'string' ? data.userEmail : ''),
        userName: typeof data.userName === 'string' ? data.userName : '',
        userPhone: typeof data.userPhone === 'string' ? data.userPhone : '',
        organization: typeof data.organization === 'string' ? data.organization : '',
        startDate: String(startDate),
        endDate: String(endDate),
        startTime: String(startTime),
        endTime: String(endTime),
        purpose: typeof data.purpose === 'string' ? data.purpose : '',
        notes: typeof data.notes === 'string' ? data.notes : '',
        totalPrice: typeof data.totalPrice === 'number' ? data.totalPrice : 0,
        status: 'pending', // Status pengajuan awal harus selalu pending
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 5. Simpan data ke dalam transaksi
      transaction.set(newBookingRef, newBookingData);
      
      return newBookingData;
    });

    return { success: true, booking: result };

  } catch (error: any) {
    console.error("Booking Transaction Failed:", error);
    
    // Jika error ini adalah buatan kita sendiri (Ruangan Penuh / Data Kurang), teruskan pesannya ke Klien
    if (error.code === 'already-exists' || error.code === 'invalid-argument' || error.code === 'unauthenticated') {
        throw error;
    }
    
    // Jika ada error jaringan/database tak terduga, jadikan internal error (500) yang terbaca rapi
    throw new HttpsError('internal', error.message || 'Gagal memproses peminjaman ruangan pada server.');
  }
});
