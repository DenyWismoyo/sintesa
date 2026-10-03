import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const DEFAULT_APP_ID = process.env.APP_ID || 'blud-app-dev';

/**
 * P12: Document Size Guard Helper
 * Memastikan payload dokumen cache tidak melebihi batasan 1MB Firestore (1,048,576 bytes)
 */
function guardDocumentSize(name: string, payload: any): void {
  try {
    const jsonStr = JSON.stringify(payload);
    const sizeKB = Buffer.byteLength(jsonStr, 'utf8') / 1024;
    if (sizeKB > 850) {
      console.warn(`[CACHE SIZE WARNING] Dokumen cache '${name}' berukuran ${sizeKB.toFixed(1)} KB (mendekati batas 1MB).`);
    }
  } catch (err) {
    console.error(`[CACHE SIZE CHECK ERROR] Gagal memeriksa ukuran '${name}':`, err);
  }
}

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

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedTenants.length,
      data: compressedTenants 
    };

    guardDocumentSize('cache_tenants/master', cachePayload);

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_tenants`).doc('master').set(cachePayload);

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
        galleryUrls: Array.isArray(data.galleryUrls) ? data.galleryUrls : [],
        description: data.description || '',
        unresolvedReportsCount: data.unresolvedReportsCount || 0,
        createdAt: data.createdAt || 0
      });
    });

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedAssets.length,
      data: compressedAssets
    };

    guardDocumentSize('cache_assets/master', cachePayload);

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_assets`).doc('master').set(cachePayload);

    console.log(`[AUTO CACHE ASSET] Master cache aset berhasil di-update secara otomatis (${compressedAssets.length} assets).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE ASSET ERROR]", error);
    return false;
  }
});

/**
 * P1: Trigger otomatis saat ada dokumen katalog/produk yang dibuat, diubah, atau dihapus.
 * Mengeliminasi gap sinkronisasi jika admin mengubah produk dari Console atau script.
 */
export const onCatalogWrittenInvalidateCache = onDocumentWritten("catalogs/{catalogId}", async (event) => {
  try {
    const snapshot = await db.collection('catalogs').orderBy('createdAt', 'desc').get();
    const compressedCatalogs: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      compressedCatalogs.push({
        id: doc.id,
        name: data.name || '',
        category: data.category || '',
        shortDescription: data.shortDescription || data.description?.substring(0, 120) || '',
        description: data.description || '',
        specifications: Array.isArray(data.specifications) ? data.specifications : [],
        price: data.price || 0,
        pricingType: data.pricingType || '',
        isNegotiable: data.isNegotiable || false,
        ownerType: data.ownerType || 'INTERNAL',
        tenantName: data.tenantName || '',
        isPublished: data.isPublished ?? false,
        ctaType: data.ctaType || 'WHATSAPP',
        ctaLink: data.ctaLink || '',
        ctaText: data.ctaText || 'Hubungi Kami',
        coverImage: Array.isArray(data.images) && data.images.length > 0
          ? data.images[0] : (data.coverImage || null),
        images: Array.isArray(data.images) ? data.images : [],
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.createdAt || 0
      });
    });

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedCatalogs.length,
      data: compressedCatalogs
    };

    guardDocumentSize('cache_catalogs/master', cachePayload);

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_catalogs`).doc('master').set(cachePayload);

    console.log(`[AUTO CACHE CATALOG] Master cache katalog berhasil di-update secara otomatis (${compressedCatalogs.length} produk).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE CATALOG ERROR]", error);
    return false;
  }
});

/**
 * P5: Trigger otomatis saat ada dokumen pelatihan yang dibuat, diubah, atau dihapus.
 * Menyediakan master cache tunggal (1 Read) untuk seluruh halaman pelatihan publik.
 */
export const onTrainingWrittenInvalidateCache = onDocumentWritten("trainings/{trainingId}", async (event) => {
  try {
    const snapshot = await db.collection('trainings').orderBy('createdAt', 'desc').get();
    const compressedTrainings: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      compressedTrainings.push({
        id: doc.id,
        title: data.title || '',
        slug: data.slug || '',
        category: data.category || '',
        shortDescription: data.shortDescription || data.description?.substring(0, 150) || '',
        description: data.description || '',
        posterUrl: data.posterUrl || data.imageUrl || null,
        imageUrl: data.imageUrl || data.posterUrl || null,
        price: Number(data.price) || 0,
        pricingType: data.pricingType || (data.isFree ? 'GRATIS' : 'BERBAYAR'),
        isFree: Boolean(data.isFree),
        level: data.level || 'Semua Tingkat',
        type: data.type || 'Offline',
        status: data.status || 'Published',
        schedule: data.schedule || '',
        scheduleDetails: data.scheduleDetails || '',
        durationDisplay: data.durationDisplay || '',
        certificationType: data.certificationType || 'Sertifikat Resmi STP',
        quota: Number(data.quota) || 0,
        registeredCount: Number(data.registeredCount) || 0,
        isPublished: data.isPublished ?? true,
        instructorName: data.instructorName || (Array.isArray(data.instructors) && data.instructors[0]?.name) || '',
        instructorTitle: data.instructorTitle || (Array.isArray(data.instructors) && data.instructors[0]?.title) || '',
        instructors: Array.isArray(data.instructors) ? data.instructors : [],
        date: data.date || '',
        endDate: data.endDate || '',
        createdAt: data.createdAt || 0
      });
    });

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedTrainings.length,
      data: compressedTrainings
    };

    guardDocumentSize('cache_trainings/master', cachePayload);

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_trainings`).doc('master').set(cachePayload);

    console.log(`[AUTO CACHE TRAINING] Master cache pelatihan berhasil di-update secara otomatis (${compressedTrainings.length} program).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE TRAINING ERROR]", error);
    return false;
  }
});
