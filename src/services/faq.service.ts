import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FAQ, FAQSchema } from '@/types';

const COLLECTION_NAME = 'faqs';

export const faqService = {
  getFaqs: async (): Promise<FAQ[]> => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const faqs: FAQ[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const parsed = FAQSchema.safeParse(data);
      if (parsed.success) faqs.push(parsed.data);
    });
    return faqs;
  },

  createFaq: async (data: Omit<FAQ, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), { ...data, createdAt: Date.now() });
  },

  updateFaq: async (id: string, data: Partial<FAQ>) => {
    return await updateDoc(doc(db, COLLECTION_NAME, id), data);
  },

  deleteFaq: async (id: string) => {
    return await deleteDoc(doc(db, COLLECTION_NAME, id));
  }
};