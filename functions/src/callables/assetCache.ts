import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const rebuildAssetMasterCache = onCall(async (request) => {
  // 1. Keamanan: Pastikan yang memanggil adalah admin yang login
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Akses Ditolak: Anda harus login.');
  }

  const role = request.auth.token?.role as string | undefined;
  const allowedRoles = ['super_admin', 'admin_aset'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses tidak mencukupi untuk memperbarui cache aset.');
  }

  const appId = request.data.appId || 'blud-app-dev';

  try {
    // 2. Baca seluruh data aset dari koleksi utama
    const snapshot = await db.collection('assets').orderBy('createdAt', 'desc').get();
    
    const compressedAssets: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // PERBAIKAN: Normalisasi Kategori Paksa di Server
      // Mengubah variasi tulisan 'ruang', 'gedung', 'Ruangan / Gedung' menjadi murni 'Ruangan'
      let normalizedCategory = data.category || 'Lainnya';
      const catLower = normalizedCategory.toLowerCase();
      if (catLower.includes('ruang') || catLower.includes('gedung')) {
        normalizedCategory = 'Ruangan';
      }
      
      // 3. Kompresi Payload
      compressedAssets.push({
        id: doc.id,
        name: data.name || '',
        inventoryNumber: data.inventoryNumber || '',
        registerNumber: data.registerNumber || '',
        category: normalizedCategory, // <-- Gunakan kategori yang sudah dinormalisasi
        assetType: data.assetType || '-',
        brandType: data.brandType || '-',
        location: data.location || '-',
        condition: data.condition || 'Baik',
        status: data.status || 'Tersedia',
        isRentable: data.isRentable || false,
        picName: data.picName || '',
        
        // --- PERBAIKAN: TAMBAHAN WAJIB UNTUK MENU BOOKING ---
        priceValue: data.priceValue || 0,
        pricingType: data.pricingType || 'Hari',
        capacity: data.capacity || 0,
        layout: data.layout || '',
        facilities: data.facilities || '',
        // ---------------------------------------------------

        // Bawa data krusial untuk indikator UI
        imageUrl: data.imageUrl || null, 
        unresolvedReportsCount: data.unresolvedReportsCount || 0,
        createdAt: data.createdAt || 0
      });
    });

    // 4. Simpan ke dalam SATU dokumen tunggal (Aggregated Document)
    await db.collection(`artifacts/${appId}/public/data/cache_assets`).doc('master').set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedAssets.length,
      data: compressedAssets // Array seluruh aset ringkas
    });

    console.log(`[ASSET CACHE] Berhasil mengkompresi ${compressedAssets.length} aset menjadi 1 dokumen cache.`);

    return { success: true, count: compressedAssets.length };

  } catch (error: any) {
    console.error("[ASSET CACHE ERROR] Gagal membangun ulang cache aset:", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache aset: ' + error.message);
  }
});