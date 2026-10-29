import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc, limit, startAfter, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { ProductCatalog, ProductCatalogSchema, Tenant, StartupProduct } from '@/types';

const COLLECTION_NAME = 'catalogs';

export const catalogService = {
  getProducts: async (maxLimit: number = 100): Promise<ProductCatalog[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);
    const products: ProductCatalog[] = [];

    snapshot.forEach((docSnap) => {
      const parsed = ProductCatalogSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) {
        products.push(parsed.data);
      } else {
        console.warn(`Data Catalog Corrupt (ID: ${docSnap.id}):`, parsed.error);
      }
    });
    return products;
  },

  getAllCatalogsCached: async (): Promise<any[]> => {
    try {
      const appId = getAppId();
      // 1. Coba baca dari Cache Tunggal (1 Read)
      const cacheRef = doc(db, `artifacts/${appId}/public/data/cache_catalogs`, 'master');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        if (cacheData && Array.isArray(cacheData.data)) {
          // Format kembali coverImage menjadi array images jika images kosong agar UI tidak error
          return cacheData.data.map((item: any) => ({
            ...item,
            images: Array.isArray(item.images) && item.images.length > 0 
              ? item.images 
              : (item.coverImage ? [item.coverImage] : [])
          }));
        }
      }

      // 2. FALLBACK (N Reads) jika cache belum terbentuk atau terhapus
      console.warn("[OPTIMASI] Cache Katalog belum terbentuk, Fallback ke Full Fetch.");
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error: any) {
      console.error("Error fetching cached catalogs:", error);
      return [];
    }
  },

  getPaginatedProducts: async (maxLimit: number = 20, lastCreatedAt?: number) => {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(maxLimit));
    if (lastCreatedAt) {
      q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), startAfter(lastCreatedAt), limit(maxLimit));
    }

    const snapshot = await getDocs(q);
    const products: ProductCatalog[] = [];

    snapshot.forEach((docSnap) => {
      const parsed = ProductCatalogSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) products.push(parsed.data);
    });

    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].data().createdAt : null;
    return { products, lastVisible };
  },

  getProductById: async (id: string): Promise<ProductCatalog | null> => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...(docSnap.data() || {}) } as any;
        const parsed = ProductCatalogSchema.safeParse(raw);
        if (parsed.success) return parsed.data;

        console.warn(`[CATALOG] safeParse warning for ID ${id}, using normalized fallback:`, parsed.error);
        return {
          id: docSnap.id,
          name: raw.name || '',
          category: raw.category || 'Umum',
          shortDescription: raw.shortDescription || '',
          price: Number(raw.price) || 0,
          pricingType: raw.pricingType || 'Tetap',
          isNegotiable: Boolean(raw.isNegotiable),
          description: raw.description || '',
          highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
          specifications: Array.isArray(raw.specifications) ? raw.specifications : [],
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          images: Array.isArray(raw.images) ? raw.images : [],
          coverImage: raw.coverImage || (Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : null),
          ownerType: raw.ownerType || 'INTERNAL',
          tenantId: raw.tenantId || undefined,
          tenantName: raw.tenantName || '',
          sourceProductId: raw.sourceProductId || undefined,
          ctaType: raw.ctaType || 'WHATSAPP',
          ctaLink: raw.ctaLink || '',
          ctaText: raw.ctaText || 'Hubungi Kami',
          isPublished: raw.isPublished !== false,
          createdAt: raw.createdAt || 0,
        } as ProductCatalog;
      }

      // Fallback: Jika tidak ditemukan di dokumen root, periksa master cache
      const cached = await catalogService.getAllCatalogsCached();
      const found = cached.find((item: any) => item.id === id);
      if (found) {
        return found as ProductCatalog;
      }

      return null;
    } catch (error) {
      console.error(`[CATALOG] Error in getProductById for ID ${id}:`, error);
      try {
        const cached = await catalogService.getAllCatalogsCached();
        const found = cached.find((item: any) => item.id === id);
        if (found) return found as ProductCatalog;
      } catch (cacheErr) {
        // Abaikan error cache
      }
      return null;
    }
  },

  createProduct: async (data: Omit<ProductCatalog, 'id'>) => {
    const payload = { ...data, createdAt: Date.now() };
    return await addDoc(collection(db, COLLECTION_NAME), payload);
  },

  updateProduct: async (id: string, data: Partial<ProductCatalog>) => {
    return await updateDoc(doc(db, COLLECTION_NAME, id), data);
  },

  promoteTenantProductToCatalog: async (tenant: Tenant, product: StartupProduct, price: number = 0) => {
    // Cek apakah sudah pernah dipromosikan berdasarkan sourceProductId
    if (product.id) {
      const qExist = query(collection(db, COLLECTION_NAME), where('sourceProductId', '==', product.id), limit(1));
      const snapExist = await getDocs(qExist);
      const images = Array.isArray(product.images) ? product.images : [];
      const payload: Omit<ProductCatalog, 'id'> = {
        name: product.name,
        category: product.category || tenant.sector || 'Paket Binaan',
        shortDescription: (product.description || '').slice(0, 155),
        description: product.description || `Produk terkurasi milik ${tenant.name} (Mitra Binaan Solo Technopark).`,
        ownerType: 'TENANT',
        tenantId: tenant.id,
        tenantName: tenant.name,
        sourceProductId: product.id,
        price: price || 0,
        pricingType: 'Per Unit / Paket',
        isNegotiable: price <= 0,
        highlights: [
          `Lulus Kurasi STP (${product.curation?.readinessLevel || 'Terverifikasi'})`,
          `Skor Kualitas Kurasi: ${product.curation?.totalScore || 80}/100`,
          `Diproduksi oleh ${tenant.name}`
        ],
        specifications: [
          { label: 'Produsen / Tenant', value: tenant.name },
          { label: 'Sektor Industri', value: tenant.sector || 'Inovasi Binaan' },
          { label: 'Level Kesiapan', value: product.curation?.readinessLevel || 'Market Ready' }
        ],
        tags: [tenant.sector || 'UMKM', 'Produk Binaan', 'Terkurasi'],
        images,
        coverImage: images[0] || tenant.logoUrl || null,
        ctaType: price > 0 ? 'INVOICE' : 'WHATSAPP',
        ctaLink: tenant.contact ? tenant.contact.replace(/^0/, '62') : '',
        ctaText: price > 0 ? 'Pesan Sekarang' : 'Hubungi Tenant',
        isPublished: true,
        productType: 'SINGLE',
        bundleItems: [],
        isPriceCalculated: false,
        createdAt: Date.now()
      };

      if (!snapExist.empty) {
        const existingId = snapExist.docs[0].id;
        await updateDoc(doc(db, COLLECTION_NAME, existingId), payload as any);
        return { id: existingId, updated: true };
      }
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      return { id: docRef.id, updated: false };
    }
    throw new Error('ID Produk Tenant tidak ditemukan.');
  },

  deleteProduct: async (id: string) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const urlsToDelete = new Set<string>();

        if (data.imageUrl) urlsToDelete.add(data.imageUrl);
        if (data.coverImage) urlsToDelete.add(data.coverImage);
        if (Array.isArray(data.images)) {
          data.images.forEach((img: any) => { if (typeof img === 'string' && img) urlsToDelete.add(img); });
        }
        if (Array.isArray(data.galleryImages)) {
          data.galleryImages.forEach((img: any) => { if (typeof img === 'string' && img) urlsToDelete.add(img); });
        }

        for (const imgUrl of urlsToDelete) {
          try {
            await storageService.deleteFile(imgUrl);
          } catch (delErr) {
            console.warn(`[STORAGE] Gagal menghapus file ${imgUrl}:`, delErr);
          }
        }
      }
    } catch (error) {
      console.warn('[STORAGE] Gagal membersihkan gambar katalog:', error);
    }
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  uploadImage: async (file: File): Promise<string> => {
    return await storageService.uploadImage(file, 'catalogs');
  },

  deleteImage: async (imageUrl: string) => {
    return await storageService.deleteFile(imageUrl);
  }
};
