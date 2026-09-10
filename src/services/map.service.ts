import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { MapSettings, MapHotspot, MapHotspotSchema } from '@/types';

export const mapService = {
  // --- 1. PENGATURAN PETA UTAMA ---
  getSettingsRef: () => doc(db, 'artifacts', getAppId(), 'public', 'data', 'map_settings', 'main'),
  
  getMapSettings: async (): Promise<MapSettings | null> => {
    const docSnap = await getDoc(mapService.getSettingsRef());
    if (docSnap.exists()) {
      return docSnap.data() as MapSettings;
    }
    return null;
  },

  updateMapSettings: async (data: Partial<MapSettings>) => {
    const docRef = mapService.getSettingsRef();
    await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
  },

  uploadBaseMapImage: async (file: File): Promise<string> => {
    const appId = getAppId();
    return await storageService.uploadImage(file, `artifacts/${appId}/public/map`);
  },

  uploadHotspotImage: async (file: File): Promise<string> => {
    const appId = getAppId();
    return await storageService.uploadImage(file, `artifacts/${appId}/public/map_hotspots`);
  },

  // --- 2. MANAJEMEN HOTSPOT (PIN LOKASI) ---
  getHotspotsRef: () => collection(db, 'artifacts', getAppId(), 'public', 'data', 'map_hotspots'),
  
  getHotspots: async (): Promise<MapHotspot[]> => {
    const q = query(mapService.getHotspotsRef(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const hotspots: MapHotspot[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const parsed = MapHotspotSchema.safeParse(data);
      if (parsed.success) {
        hotspots.push(parsed.data);
      } else {
        console.warn(`Data Hotspot Corrupt (ID: ${docSnap.id}):`, parsed.error);
        // Fallback aman agar UI tidak crash
        hotspots.push(data as MapHotspot); 
      }
    });
    
    return hotspots;
  },

  addHotspot: async (data: Omit<MapHotspot, 'id' | 'createdAt'>) => {
    const payload = { ...data, createdAt: Date.now() };
    const docRef = await addDoc(mapService.getHotspotsRef(), payload);
    return docRef.id;
  },

  updateHotspot: async (id: string, data: Partial<MapHotspot>) => {
    const docRef = doc(db, 'artifacts', getAppId(), 'public', 'data', 'map_hotspots', id);
    await updateDoc(docRef, data);
  },

  deleteHotspot: async (id: string) => {
    const docRef = doc(db, 'artifacts', getAppId(), 'public', 'data', 'map_hotspots', id);
    await deleteDoc(docRef);
  }
};