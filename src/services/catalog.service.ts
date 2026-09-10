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
          // Format kembali coverImage menjadi array images agar UI tidak error saat me-render Card
          return cacheData.data.map((item: any) => ({
            ...item,
            images: item.coverImage ? [item.coverImage] : []
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
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (docSnap.exists()) {
      const parsed = ProductCatalogSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      return parsed.success ? parsed.data : null;
    }
    return null;
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
        if (data.imageUrl) await storageService.deleteFile(data.imageUrl);
        if (Array.isArray(data.galleryImages)) {
          for (const imgUrl of data.galleryImages) {
            await storageService.deleteFile(imgUrl);
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