import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { ProductCatalog, ProductCatalogSchema } from '@/types';

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
      if (!docSnap.exists()) return null;
      
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
        tenantName: raw.tenantName || '',
        ctaType: raw.ctaType || 'WHATSAPP',
        ctaLink: raw.ctaLink || '',
        ctaText: raw.ctaText || 'Hubungi Kami',
        isPublished: raw.isPublished !== false,
        createdAt: raw.createdAt || 0,
      } as ProductCatalog;
    } catch (error) {
      console.error(`[CATALOG] Error in getProductById for ID ${id}:`, error);
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

  deleteProduct: async (id: string) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const urlsToDelete = new Set<string>();

        // Ambil URL dari seluruh field gambar yang mungkin ada
        if (data.imageUrl) urlsToDelete.add(data.imageUrl);
        if (data.coverImage) urlsToDelete.add(data.coverImage);
        if (Array.isArray(data.images)) {
          data.images.forEach((img: any) => { if (typeof img === 'string' && img) urlsToDelete.add(img); });
        }
        if (Array.isArray(data.galleryImages)) {
          data.galleryImages.forEach((img: any) => { if (typeof img === 'string' && img) urlsToDelete.add(img); });
        }

        // Hapus berkas dari Cloud Storage
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