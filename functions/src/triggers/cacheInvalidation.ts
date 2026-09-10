import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const DEFAULT_APP_ID = process.env.APP_ID || 'blud-app-dev';

/**
 * Trigger otomatis saat ada dokumen tenant yang dibuat, diubah, atau dihapus.
 * Menjamin master cache selalu sinkron tanpa perlu pemanggilan manual dari frontend.
 */
export const onTenantWrittenInvalidateCache = onDocumentWritten("tenants/{tenantId}", async (event) => {
  try {
    const snapshot = await db.collection('tenants').orderBy('createdAt', 'desc').get();
    const compressedTenants: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      compressedTenants.push({
        id: doc.id,
        name: data.name || '',
        ownerName: data.ownerName || '',
        email: data.email || '',
        contact: data.contact || '',
        sector: data.sector || 'Lainnya',
        segment: data.segment || 'StartUp',
        status: data.status || 'Aktif',
        pipelineStage: data.pipelineStage || 'Pra-Inkubasi',
        currentHealthScore: data.currentHealthScore || 'Unknown',
        logoUrl: data.logoUrl || '',
        coverImageUrl: data.coverImageUrl || '',
        elevatorPitch: data.elevatorPitch || '',
        isRaising: data.isRaising || false,
        fundingStage: data.fundingStage || 'Bootstrapped',
        isVerified: data.isVerified || false,
        createdAt: data.createdAt || 0
      });
    });

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_tenants`).doc('master').set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedTenants.length,
      data: compressedTenants 
    });

    console.log(`[AUTO CACHE TENANT] Master cache berhasil di-update secara otomatis (${compressedTenants.length} tenants).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE TENANT ERROR]", error);
    return false;
  }
});

/**
 * Trigger otomatis saat ada dokumen aset yang dibuat, diubah, atau dihapus.
 * Menjamin master cache fasilitas selalu sinkron dan ter-normalisasi.
 */
export const onAssetWrittenInvalidateCache = onDocumentWritten("assets/{assetId}", async (event) => {
  try {
    const snapshot = await db.collection('assets').orderBy('createdAt', 'desc').get();
    const compressedAssets: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      let normalizedCategory = data.category || 'Lainnya';
      const catLower = normalizedCategory.toLowerCase();
      if (catLower.includes('ruang') || catLower.includes('gedung')) {
        normalizedCategory = 'Ruangan';
      }
      
      compressedAssets.push({
        id: doc.id,
        name: data.name || '',
        inventoryNumber: data.inventoryNumber || '',
        registerNumber: data.registerNumber || '',
        category: normalizedCategory,
        assetType: data.assetType || '-',
        brandType: data.brandType || '-',
        location: data.location || '-',
        condition: data.condition || 'Baik',
        status: data.status || 'Tersedia',
        isRentable: data.isRentable || false,
        picName: data.picName || '',
        priceValue: data.priceValue || 0,
        pricingType: data.pricingType || 'Hari',
        capacity: data.capacity || 0,
        layout: data.layout || '',
        facilities: data.facilities || '',
        imageUrl: data.imageUrl || null, 
        unresolvedReportsCount: data.unresolvedReportsCount || 0,
        createdAt: data.createdAt || 0
      });
    });

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_assets`).doc('master').set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedAssets.length,
      data: compressedAssets
    });

    console.log(`[AUTO CACHE ASSET] Master cache aset berhasil di-update secara otomatis (${compressedAssets.length} assets).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE ASSET ERROR]", error);
    return false;
  }
});
