// Lokasi file: src/services/hub.service.ts
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs, where, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HubThread, HubThreadResponse } from '@/types';

const COLLECTION_NAME = 'hub_threads';
const RESPONSES_COLLECTION = 'hub_responses';

export const hubService = {
  getHubThreads: async (roleFilter?: string, typeFilter?: string): Promise<HubThread[]> => {
    let q = collection(db, COLLECTION_NAME);
    let queryConstraints: any[] = [orderBy('createdAt', 'desc')];

    if (roleFilter && roleFilter !== 'All') {
      queryConstraints.push(where('authorRole', '==', roleFilter));
    }
    if (typeFilter && typeFilter !== 'All') {
      queryConstraints.push(where('type', '==', typeFilter));
    }

    const finalQuery = query(q, ...queryConstraints);
    const snapshot = await getDocs(finalQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HubThread));
  },

  getThreadById: async (id: string): Promise<HubThread | null> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as HubThread;
  },

  createThread: async (data: Omit<HubThread, 'id' | 'createdAt' | 'responsesCount'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      responsesCount: 0,
      createdAt: Date.now()
    });
  },

  updateThread: async (id: string, data: Partial<HubThread>) => {
    return await updateDoc(doc(db, COLLECTION_NAME, id), {
      ...data,
      updatedAt: Date.now()
    });
  },

  deleteThread: async (id: string) => {
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  getThreadResponses: async (threadId: string): Promise<HubThreadResponse[]> => {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HubThreadResponse));
  },

  addThreadResponse: async (threadId: string, data: Omit<HubThreadResponse, 'id' | 'createdAt' | 'threadId'>) => {
    // Kita gunakan Transaction agar nilai responsesCount tetap konsisten dihindari *race condition*
    const threadRef = doc(db, COLLECTION_NAME, threadId);
    const responseRef = doc(collection(db, RESPONSES_COLLECTION));

    await runTransaction(db, async (transaction) => {
      const threadDoc = await transaction.get(threadRef);
      if (!threadDoc.exists()) throw new Error("Thread not ditemukan.");

      const newCount = (threadDoc.data().responsesCount || 0) + 1;

      // Set Document Response baru
      transaction.set(responseRef, {
        ...data,
        threadId,
        createdAt: Date.now()
      });

      // Update counter di Thread utama
      transaction.update(threadRef, { responsesCount: newCount });
    });

    return responseRef.id;
  }
};