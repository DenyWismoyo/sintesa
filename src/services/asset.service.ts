import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where, increment, arrayUnion, getDoc, getDocs, limit, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { Asset, MaintenanceRecord, AssetSchema } from '@/types';

const ASSET_COLLECTION = 'assets';
const REPORT_COLLECTION = 'asset_reports';

export const assetService = {
  // 1. Mengambil Master Cache (Metode 1-Read)
  getAssetCache: async (): Promise<any[]> => {
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/cache_assets`, 'master');
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data().data || [];
    }
    return [];
  },

  // 2. Memanggil Cloud Function untuk menyusun ulang Cache
  rebuildAssetCache: async () => {
    try {
      const rebuildFn = httpsCallable(functions, 'rebuildAssetMasterCache');
      const appId = getAppId();
      await rebuildFn({ appId });
      console.log("Master Cache Aset berhasil di-rebuild.");
    } catch (error) {
      console.error("Gagal melakukan rebuild cache aset:", error);
    }
  },

  getAssets: async (maxLimit: number = 100): Promise<Asset[]> => {
    const q = query(collection(db, ASSET_COLLECTION), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snap = await getDocs(q);
    const assets: Asset[] = [];
    
    snap.forEach((docSnap) => {
      const parsed = AssetSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) {
        assets.push(parsed.data);
      } else {
        console.warn(`Data Asset Corrupt (Diabaikan) ID ${docSnap.id}:`, parsed.error);
      }
    });
    
    return assets;
  },

  getPaginatedAssets: async (maxLimit: number = 20, lastCreatedAt?: number) => {
    let q = query(collection(db, ASSET_COLLECTION), orderBy('createdAt', 'desc'), limit(maxLimit));
    
    if (lastCreatedAt) {
      q = query(collection(db, ASSET_COLLECTION), orderBy('createdAt', 'desc'), startAfter(lastCreatedAt), limit(maxLimit));
    }
    
    const snap = await getDocs(q);
    const results: Asset[] = [];
    snap.forEach((docSnap) => {
      const parsed = AssetSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) results.push(parsed.data);
    });
    
    const lastVisible = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].data().createdAt : null;
    return { results, lastVisible };
  },

  getRoomsOnly: async (): Promise<Asset[]> => {
    const q = query(collection(db, ASSET_COLLECTION), where('category', '==', 'Ruangan'));
    const snap = await getDocs(q);
    const assets: Asset[] = [];
    
    snap.forEach((docSnap) => {
      const parsed = AssetSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) {
        assets.push(parsed.data);
      }
    });
    
    return assets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  getOpenReports: async (maxLimit: number = 100) => {
    const q = query(collection(db, REPORT_COLLECTION), where('status', '==', 'Open'), limit(maxLimit));
    const snap = await getDocs(q);
    const reports: any[] = [];
    
    snap.forEach((docSnap) => reports.push({ id: docSnap.id, ...docSnap.data() }));
    return reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  getAssetById: async (id: string) => {
    const docSnap = await getDoc(doc(db, ASSET_COLLECTION, id));
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Asset;
    return null;
  },

  createAsset: async (data: Partial<Asset>) => {
    return await addDoc(collection(db, ASSET_COLLECTION), data);
  },
  
  updateAsset: async (id: string, data: Partial<Asset> | any) => {
    return await updateDoc(doc(db, ASSET_COLLECTION, id), data);
  },
  
  deleteAsset: async (id: string) => {
    try {
      const assetSnap = await getDoc(doc(db, ASSET_COLLECTION, id));
      if (assetSnap.exists()) {
        const assetData = assetSnap.data();
        if (assetData.imageUrl) {
          await storageService.deleteFile(assetData.imageUrl);
        }
      }
    } catch (error) {
      console.warn('[STORAGE] Gagal menghapus file gambar aset:', error);
    }
    return await deleteDoc(doc(db, ASSET_COLLECTION, id));
  },

  uploadImage: async (file: File) => {
    return await storageService.uploadImage(file, 'assets');
  },

  createReport: async (reportData: any) => {
    return await addDoc(collection(db, REPORT_COLLECTION), reportData);
  },
  
  addMaintenance: async (assetId: string, record: MaintenanceRecord) => {
    return await updateDoc(doc(db, ASSET_COLLECTION, assetId), {
      maintenanceHistory: arrayUnion(record),
      status: 'Tersedia', 
      condition: 'Baik'   
    });
  },
  
  resolveReport: async (reportId: string, assetId: string) => {
    await updateDoc(doc(db, REPORT_COLLECTION, reportId), {
      status: 'Resolved',
      resolvedAt: Date.now()
    });
    await updateDoc(doc(db, ASSET_COLLECTION, assetId), {
      unresolvedReportsCount: increment(-1)
    });
  }
};