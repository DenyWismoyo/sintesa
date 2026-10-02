import { collection, collectionGroup, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, getDoc, where, limit, startAfter, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAppId } from '@/lib/appId';
import { storageService } from '@/services/storage.service';
import { Training, TrainingSchema } from '@/types';

const COLLECTION_NAME = 'trainings';

export const trainingService = {
  // P5: Master Cache 1-Read Pattern untuk halaman publik & admin
  getAllTrainingsCached: async (): Promise<Training[]> => {
    try {
      const appId = getAppId();
      // 1. Baca dari cache master
      const cacheRef = doc(db, `artifacts/${appId}/public/data/cache_trainings`, 'master');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        if (cacheData && Array.isArray(cacheData.data)) {
          return cacheData.data as Training[];
        }
      }

      // 2. Fallback jika cache belum terbentuk
      console.warn("[TRAINING CACHE] Cache master belum terbentuk, fallback ke Full Fetch.");
      return await trainingService.getTrainings(100);
    } catch (error) {
      console.error("Error fetching cached trainings:", error);
      return await trainingService.getTrainings(100);
    }
  },

  getTrainings: async (maxLimit: number = 100): Promise<Training[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);
    const trainings: Training[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const parsed = TrainingSchema.safeParse(data);
      if (parsed.success) trainings.push(parsed.data);
    });
    return trainings;
  },

  getPaginatedTrainings: async (maxLimit: number = 20, lastCreatedAt?: number) => {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(maxLimit));
    if (lastCreatedAt) {
      q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), startAfter(lastCreatedAt), limit(maxLimit));
    }
    const snapshot = await getDocs(q);
    const trainings: Training[] = [];
    snapshot.forEach((docSnap) => {
      const parsed = TrainingSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
      if (parsed.success) trainings.push(parsed.data);
    });
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].data().createdAt : null;
    return { trainings, lastVisible };
  },

  addTraining: async (data: Omit<Training, 'id' | 'registeredCount'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), { ...data, registeredCount: 0, createdAt: Date.now() });
  },

  updateTraining: async (id: string, data: Partial<Training>) => {
    return await updateDoc(doc(db, COLLECTION_NAME, id), data);
  },

  deleteTraining: async (id: string) => {
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  registerForTraining: async (trainingId: string, registrationData: any) => {
    const regRef = doc(collection(db, COLLECTION_NAME, trainingId, 'registrations'));
    
    const finalStatus = registrationData.paymentStatus === 'FREE' ? 'CONFIRMED' : (registrationData.status || 'PENDING');
    
    await setDoc(regRef, { 
      ...registrationData, 
      status: finalStatus, 
      id: regRef.id, 
      createdAt: Date.now() 
    });
    
    await updateDoc(doc(db, COLLECTION_NAME, trainingId), { registeredCount: increment(1) });
    return { success: true, registrationId: regRef.id };
  },

  uploadImage: async (file: File): Promise<string> => {
    return await storageService.uploadImage(file, 'trainings');
  },

  generateInstructorCode: async (trainingId: string) => {
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newCode = `KST-${randomStr}`;
    
    await updateDoc(doc(db, COLLECTION_NAME, trainingId), { instructorAccessCode: newCode });
    return newCode;
  },

  // Optimalisasi R-029: 1 Single collectionGroup Query untuk pendaftaran user (Bebas N+1 query loop)
  getMyEnrolledCourses: async (email: string) => {
    const regQuery = query(
      collectionGroup(db, 'registrations'),
      where('email', '==', email)
    );
    const regSnap = await getDocs(regQuery);
    
    const coursesData: { registration: any; training: any }[] = [];
    const trainingCache = new Map<string, any>();

    for (const docSnap of regSnap.docs) {
      const regData = { id: docSnap.id, ...docSnap.data() };
      const parentTrainingRef = docSnap.ref.parent.parent;
      if (!parentTrainingRef) continue;
      
      const trainingId = parentTrainingRef.id;
      let trainingData = trainingCache.get(trainingId);
      if (!trainingData) {
        const tSnap = await getDoc(parentTrainingRef);
        if (tSnap.exists()) {
          trainingData = { id: tSnap.id, ...tSnap.data() };
          trainingCache.set(trainingId, trainingData);
        }
      }

      if (trainingData) {
        coursesData.push({
          registration: regData,
          training: trainingData
        });
      }
    }

    coursesData.sort((a, b) => {
      const statusA = a.registration?.status || '';
      const statusB = b.registration?.status || '';
      const timeA = a.registration?.createdAt || 0;
      const timeB = b.registration?.createdAt || 0;

      if (statusA === 'CONFIRMED' && statusB !== 'CONFIRMED') return -1;
      if (statusA !== 'CONFIRMED' && statusB === 'CONFIRMED') return 1;
      return timeB - timeA;
    });

    return coursesData;
  },
};