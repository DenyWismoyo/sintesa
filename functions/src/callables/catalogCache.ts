import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const rebuildCatalogMasterCache = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Akses Ditolak.');

  const role = request.auth.token?.role as string | undefined;
  const allowedRoles = ['super_admin', 'admin_tenant'];
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'Akses Ditolak: Hak akses tidak mencukupi untuk memperbarui cache katalog.');
  }

  const appId = request.data.appId || 'blud-app-dev';

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
        isPublished: data.isPublished || false,
        ctaType: data.ctaType || 'WHATSAPP',
        ctaLink: data.ctaLink || '',
        ctaText: data.ctaText || 'Hubungi Kami',
        coverImage: data.images && data.images.length > 0 ? data.images[0] : (data.coverImage || null), 
        images: Array.isArray(data.images) ? data.images : [],
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.createdAt || 0
      });
    });

    await db.collection(`artifacts/${appId}/public/data/cache_catalogs`).doc('master').set({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      count: compressedCatalogs.length,
      data: compressedCatalogs 
    });

    console.log(`[CATALOG CACHE] Berhasil kompresi ${compressedCatalogs.length} katalog.`);
    return { success: true, count: compressedCatalogs.length };
  } catch (error: any) {
    console.error("[CATALOG CACHE ERROR]", error);
    throw new HttpsError('internal', 'Gagal mem-build ulang cache katalog');
  }
});