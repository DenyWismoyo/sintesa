import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Inisialisasi admin jika belum
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const getPublicStats = onCall(async (request) => {
  try {
    // 1. Jalankan semua perhitungan agregasi dasar secara paralel
    const [
      tenantCount,
      alumniCount,
      trainingAgg,
      eventCount,
      catalogCount,
      roomCount
    ] = await Promise.all([
      db.collection('tenants').count().get(),
      db.collection('alumnis').count().get(),
      db.collection('trainings').aggregate({ totalParticipants: admin.firestore.AggregateField.sum('registeredCount') }).get(),
      db.collection('events').count().get(),
      db.collection('catalogs').where('isPublished', '==', true).count().get(),
      db.collection('assets').where('category', '==', 'Ruangan').count().get()
    ]);

    // 2. Ambil data spesifik Alumni untuk Diagram 
    // Kita tambahkan 'programTaken' ke dalam select()
    const alumniSnapshot = await db.collection('alumnis').select('graduationYear', 'employmentStatus', 'programTaken').get();
    
    const alumniByYear: Record<string, number> = {};
    const alumniByStatus: Record<string, number> = {};
    const alumniByProgram: Record<string, number> = {}; // Menyimpan data program

    alumniSnapshot.forEach(doc => {
       const data = doc.data();
       const year = data.graduationYear?.toString().trim() || 'Lainnya';
       
       // MAPPING STATUS KERJA: Ubah "Belum Bekerja" / Kosong menjadi "Proses Verifikasi"
       let status = data.employmentStatus?.trim() || 'Proses Verifikasi';
       if (status === 'Belum Bekerja') {
         status = 'Proses Verifikasi';
       }

       // MAPPING PROGRAM
       const program = data.programTaken?.trim() || 'Lainnya';

       alumniByYear[year] = (alumniByYear[year] || 0) + 1;
       alumniByStatus[status] = (alumniByStatus[status] || 0) + 1;
       alumniByProgram[program] = (alumniByProgram[program] || 0) + 1;
    });

    // Format Data Tahun (Ambil 6 tahun terakhir yang valid)
    const yearData = Object.keys(alumniByYear)
        .filter(y => y !== 'Lainnya' && y.length === 4) 
        .sort((a,b) => parseInt(a) - parseInt(b)) 
        .slice(-6) 
        .map(year => ({ year, count: alumniByYear[year] }));

    // Format Data Status
    const statusData = Object.keys(alumniByStatus)
        .map(status => ({ status, count: alumniByStatus[status] }))
        .sort((a,b) => b.count - a.count);

    // Format Data Program (Ambil top 5 program yang paling banyak diminati)
    const programData = Object.keys(alumniByProgram)
        .filter(p => p !== 'Lainnya')
        .map(program => ({ program, count: alumniByProgram[program] }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);

    return {
      success: true,
      data: {
        tenants: tenantCount.data().count,
        alumnis: alumniCount.data().count,
        trainingParticipants: trainingAgg.data().totalParticipants || 0,
        events: eventCount.data().count,
        catalogs: catalogCount.data().count,
        rooms: roomCount.data().count,
        // Data untuk digambar oleh Landing Page
        alumniCharts: {
            byYear: yearData,
            byStatus: statusData,
            byProgram: programData
        }
      }
    };
  } catch (error: any) {
    console.error("Gagal mengambil statistik publik:", error);
    throw new HttpsError('internal', 'Gagal memuat data statistik dari server.');
  }
});