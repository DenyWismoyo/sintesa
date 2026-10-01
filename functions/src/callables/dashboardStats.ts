import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const getDashboardStats = onCall(async (request) => {
  // --- 1. GUARD: CEK AUTENTIKASI ---
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Akses Ditolak: Anda harus login untuk mengakses data statistik.');
  }

  // --- 2. GUARD: CEK OTORISASI (ROLE VIA CUSTOM CLAIMS) ---
  const role = request.auth.token?.role as string | undefined;
  const allowedRoles = ['super_admin', 'admin_keuangan', 'admin_aset', 'admin_tenant', 'admin_pelatihan'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses Anda tidak mencukupi untuk memuat data ini.');
  }

  // --- 3. EKSEKUSI DATA OPERASIONAL ---
  const data = request.data;
  const appId = data.appId || 'blud-app-dev';
  
  const filterMonth = data.month !== undefined ? data.month : new Date().getMonth();
  const filterYear = data.year !== undefined ? data.year : new Date().getFullYear();

  const startDate = new Date(filterYear, filterMonth, 1).getTime();
  const endDate = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59).getTime();

  try {
    // 1. DATA AKUMULATIF (GLOBAL & OPERASIONAL)
    const assetRef = db.collection('assets');
    const assetCountP = assetRef.count().get();
    const assetRentedP = assetRef.where('status', '==', 'Disewa').count().get();
    const openReportsP = db.collection('asset_reports').where('status', '==', 'Open').count().get();

    const tenantRef = db.collection('tenants');
    const tenantCountP = tenantRef.count().get();
    const activeTenantP = tenantRef.where('status', '==', 'Aktif').count().get();
    
    const usersP = db.collection('users').count().get();
    const trainingRef = db.collection('trainings');
    const trainingCountP = trainingRef.count().get();
    const trainingRegistrantsP = trainingRef.aggregate({ 
        totalRegistrants: admin.firestore.AggregateField.sum('registeredCount') 
    }).get();
    const catalogCountP = db.collection('catalogs').count().get();

    // 2. DATA TRANSAKSIONAL BOOKING (BULANAN)
    const bookingRef = db.collection(`artifacts/${appId}/public/data/bookings`);

    const bookingTotalP = bookingRef.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).count().get();
    const bookingPendingP = bookingRef.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).where('status', '==', 'pending').count().get();
    const bookingApprovedP = bookingRef.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).where('status', '==', 'approved').count().get();
    const bookingRejectedP = bookingRef.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).where('status', '==', 'rejected').count().get();
    const bookingCompletedP = bookingRef.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).where('status', '==', 'completed').count().get();

    // 3. DATA GRAFIK (TREN BOOKING 6 BULAN TERAKHIR)
    // Menggantikan tren pendapatan menjadi tren operasional peminjaman
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const chartPromises = [];
    const chartLabels = [];
    
    for (let i = 5; i >= 0; i--) {
      const dStart = new Date();
      dStart.setMonth(dStart.getMonth() - i);
      dStart.setDate(1);
      dStart.setHours(0, 0, 0, 0);

      const dEnd = new Date(dStart);
      dEnd.setMonth(dEnd.getMonth() + 1);
      dEnd.setDate(0);
      dEnd.setHours(23, 59, 59, 999);

      const label = `${monthNames[dStart.getMonth()]} ${dStart.getFullYear().toString().slice(2)}`;
      chartLabels.push(label);

      // Hitung jumlah pengajuan booking di bulan tersebut
      const agg = bookingRef.where('createdAt', '>=', dStart.getTime()).where('createdAt', '<=', dEnd.getTime()).count().get();
      chartPromises.push(agg);
    }

    const [
      assetCount, assetRented, openReports,
      tenantCount, activeTenant, trainingCount, trainingRegistrants, usersCount, catalogCount,
      bookingTotal, bookingPending, bookingApproved, bookingRejected, bookingCompleted,
      ...chartResults
    ] = await Promise.all([
      assetCountP, assetRentedP, openReportsP,
      tenantCountP, activeTenantP, trainingCountP, trainingRegistrantsP, usersP, catalogCountP,
      bookingTotalP, bookingPendingP, bookingApprovedP, bookingRejectedP, bookingCompletedP,
      ...chartPromises
    ]);

    const chartsBookings = chartLabels.map((month, index) => ({
      month,
      count: chartResults[index].data().count || 0
    }));

    return {
      success: true,
      period: { month: monthNames[filterMonth], year: filterYear },
      stats: {
        users: { total: usersCount.data().count },
        assets: { total: assetCount.data().count, rented: assetRented.data().count, openReports: openReports.data().count },
        tenants: { total: tenantCount.data().count, active: activeTenant.data().count, products: catalogCount.data().count },
        training: { totalEvents: trainingCount.data().count, totalRegistrants: trainingRegistrants.data().totalRegistrants || 0 },
        bookings: { 
          total: bookingTotal.data().count, 
          pending: bookingPending.data().count, 
          approved: bookingApproved.data().count, 
          rejected: bookingRejected.data().count, 
          completed: bookingCompleted.data().count 
        },
        charts: { bookings6Months: chartsBookings }
      }
    };

  } catch (error: any) {
    throw new HttpsError('internal', 'Gagal memuat statistik dari server: ' + error.message);
  }
});