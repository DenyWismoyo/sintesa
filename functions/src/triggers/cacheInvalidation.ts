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

/**
 * P16: Trigger otomatis saat ada dokumen alumni yang dibuat, diubah, atau dihapus (Yudisium Batch / Smart Import).
 * Menjamin master cache alumni (/cache_alumnis/master) selalu sinkron tanpa N-Reads di frontend.
 */
export const onAlumniWrittenInvalidateCache = onDocumentWritten("alumnis/{alumniId}", async (event) => {
  try {
    const snapshot = await db.collection('alumnis').orderBy('createdAt', 'desc').get();
    const compressedAlumnis: any[] = [];
    const sanitizedTalentPool: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      compressedAlumnis.push({
        id: doc.id,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        programTaken: data.programTaken || '',
        trainingYear: data.trainingYear || data.graduationYear || '',
        batch: data.batch || '',
        status: data.status || 'DORMANT',
        registrationCode: data.registrationCode || '',
        employmentStatus: (!data.employmentStatus || data.employmentStatus === 'Belum Bekerja') ? 'Proses Verifikasi' : data.employmentStatus,
        company: data.company || '',
        currentJob: data.currentJob || '',
        birthInfo: data.birthInfo || '',
        address: data.address || '',
        district: data.district || '',
        originSource: data.originSource || 'STP_VOKASI',
        originInstitution: data.originInstitution || '',
        isVerified: Boolean(data.isVerified),
        isLookingForJob: Boolean(data.isLookingForJob),
        internalStatus: data.internalStatus || 'AVAILABLE',
        skills: Array.isArray(data.skills) ? data.skills : [],
        certificationResult: data.certificationResult || '',
        createdAt: data.createdAt || 0
      });

      // Cache khusus Talent Pool terverifikasi (TANPA PII sensitif seperti alamat rumah, NIK, atau kode registrasi)
      if (data.status === 'CLAIMED' && data.isLookingForJob === true) {
        sanitizedTalentPool.push({
          id: doc.id,
          name: data.name || '',
          photoUrl: data.photoUrl || '',
          originSource: data.originSource || 'STP_VOKASI',
          originInstitution: data.originInstitution || '',
          district: data.district || '',
          programTaken: data.programTaken || '',
          batch: data.batch || '',
          trainingYear: data.trainingYear || data.graduationYear || '',
          bio: data.bio || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
          tools: Array.isArray(data.tools) ? data.tools : [],
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          projects: Array.isArray(data.projects) ? data.projects.slice(0, 4) : [],
          experienceLevel: data.experienceLevel || 'Fresh Graduate / Alumni Pelatihan',
          workSetup: data.workSetup || 'Fleksibel',
          education: data.education || '',
          major: data.major || '',
          portfolioUrl: data.portfolioUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          githubUrl: data.githubUrl || '',
          internalStatus: data.internalStatus || 'AVAILABLE',
          forumReputationScore: Number(data.forumReputationScore) || 0,
          acceptedSolutionsCount: Number(data.acceptedSolutionsCount) || 0,
          isLookingForJob: true,
          isVerified: true,
          createdAt: data.createdAt || 0,
        });
      }
    });

    const cachePayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedAlumnis.length,
      data: compressedAlumnis
    };

    guardDocumentSize('cache_alumnis/master', cachePayload);

    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_alumnis`).doc('master').set(cachePayload);

    const talentPayload = {
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: sanitizedTalentPool.length,
      data: sanitizedTalentPool,
    };
    guardDocumentSize('cache_talent_pool/master', talentPayload);
    await db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_talent_pool`).doc('master').set(talentPayload);

    console.log(`[AUTO CACHE ALUMNI] Master cache alumni berhasil di-update secara otomatis (${compressedAlumnis.length} alumni).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE ALUMNI ERROR]", error);
    return false;
  }
});

/**
 * P17: Trigger otomatis saat ada dokumen lowongan kerja dibuat, diubah, atau dihapus di root 'jobs/{jobId}'.
 * Menjamin master cache bursa karir (/cache_jobs/master) selalu sinkron dengan chunked caching otomatis.
 */
export const onJobWrittenInvalidateCache = onDocumentWritten("jobs/{jobId}", async (event) => {
  try {
    const snapshot = await db.collection('jobs').orderBy('postedAt', 'desc').limit(1000).get();
    const compressedJobs: any[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      compressedJobs.push({
        id: docSnap.id,
        slug: data.slug || docSnap.id,
        title: data.title || '',
        company: data.company || '',
        companyLogo: data.companyLogo || null,
        companyWebsite: data.companyWebsite || null,
        companyType: data.companyType || 'Startup / Industri',
        category: data.category || 'IT & Rekayasa Perangkat Lunak',
        location: data.location || 'Indonesia',
        city: data.city || '',
        workType: data.workType || 'Full-time',
        workSetup: data.workSetup || 'On-site',
        experienceLevel: data.experienceLevel || 'Fresh Graduate / Alumni Pelatihan',
        salary: data.salary || { currency: 'IDR', period: 'Bulan', isNegotiable: true, isDisclosed: false },
        description: data.description ? data.description.substring(0, 800) : '',
        responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.slice(0, 3) : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        relevantTrainingPrograms: Array.isArray(data.relevantTrainingPrograms) ? data.relevantTrainingPrograms : [],
        applicationUrl: data.applicationUrl || null,
        applicationEmail: data.applicationEmail || null,
        applySource: data.applySource || 'STP Career Portal',
        source: data.source || 'jsearch_realtime',
        isStpPartner: Boolean(data.isStpPartner),
        isFeatured: Boolean(data.isFeatured),
        postedAt: data.postedAt || Date.now(),
        deadlineAt: data.deadlineAt || (Date.now() + 30 * 24 * 60 * 60 * 1000),
        firstSeenAt: data.firstSeenAt || data.postedAt || Date.now(),
        lastSeenAt: data.lastSeenAt || Date.now(),
        isActive: data.isActive !== false,
        partnerId: data.partnerId || undefined,
        tenantId: data.tenantId || undefined,
        submittedByUid: data.submittedByUid || undefined,
        approvalStatus: data.approvalStatus || 'APPROVED',
        rejectionReason: data.rejectionReason || undefined,
        linkedForumThreadId: data.linkedForumThreadId || undefined,
      });
    });

    const CHUNK_SIZE = 80;
    const cacheColRef = db.collection(`artifacts/${DEFAULT_APP_ID}/public/data/cache_jobs`);
    const masterDocRef = cacheColRef.doc('master');

    if (compressedJobs.length <= CHUNK_SIZE) {
      await masterDocRef.set({
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        count: compressedJobs.length,
        isChunked: false,
        data: compressedJobs,
      }, { merge: true });
    } else {
      const totalChunks = Math.ceil(compressedJobs.length / CHUNK_SIZE);
      const chunkIds: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkId = `chunk_${i}`;
        chunkIds.push(chunkId);
        const chunkData = compressedJobs.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await cacheColRef.doc(chunkId).set({
          index: i,
          count: chunkData.length,
          data: chunkData,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      await masterDocRef.set({
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        count: compressedJobs.length,
        isChunked: true,
        totalChunks,
        chunkIds,
      }, { merge: true });
    }

    console.log(`[AUTO CACHE JOBS] Master cache lowongan karir berhasil di-update secara otomatis (${compressedJobs.length} loker).`);
    return true;
  } catch (error) {
    console.error("[AUTO CACHE JOBS ERROR]", error);
    return false;
  }
});
