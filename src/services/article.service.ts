// Lokasi file: src/services/article.service.ts

import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Article, ArticleSchema } from '@/types';

const COLLECTION_NAME = 'articles';

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, '')    // Hapus karakter non-word
    .replace(/\-\-+/g, '-')      // Ganti multiple - dengan single -
    .replace(/^-+/, '')          // Trim - di awal
    .replace(/-+$/, '');         // Trim - di akhir
};

export const articleService = {
  /**
   * Mengambil daftar artikel dengan filter opsional
   */
  getArticles: async (options?: { 
    publishedOnly?: boolean; 
    category?: string; 
    maxLimit?: number 
  }): Promise<Article[]> => {
    try {
      const constraints: any[] = [];

      if (options?.publishedOnly) {
        constraints.push(where('isPublished', '==', true));
      }

      if (options?.category && options.category !== 'Semua') {
        constraints.push(where('category', '==', options.category));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (options?.maxLimit) {
        constraints.push(limit(options.maxLimit));
      }

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const snapshot = await getDocs(q);

      const articles: Article[] = [];
      snapshot.forEach(docSnap => {
        const rawData = { id: docSnap.id, ...docSnap.data() };
        const parsed = ArticleSchema.safeParse(rawData);
        if (parsed.success) {
          articles.push(parsed.data);
        } else {
          console.warn(`[ARTICLE SERVICE] Corrupt Article ID ${docSnap.id}:`, parsed.error);
        }
      });

      return articles;
    } catch (error) {
      console.error("[ARTICLE SERVICE] Error fetching articles:", error);
      // Fallback query tanpa multiple where jika index komposit belum ready
      try {
        const fallbackQ = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(50));
        const fallbackSnap = await getDocs(fallbackQ);
        let fallbackArticles: Article[] = [];
        fallbackSnap.forEach(d => {
          const parsed = ArticleSchema.safeParse({ id: d.id, ...d.data() });
          if (parsed.success) fallbackArticles.push(parsed.data);
        });

        if (options?.publishedOnly) {
          fallbackArticles = fallbackArticles.filter(a => a.isPublished);
        }
        if (options?.category && options.category !== 'Semua') {
          fallbackArticles = fallbackArticles.filter(a => a.category === options.category);
        }
        return fallbackArticles;
      } catch (fbError) {
        console.error("[ARTICLE SERVICE] Fallback fetch failed:", fbError);
        return [];
      }
    }
  },

  /**
   * Mengambil detail artikel berdasarkan Document ID
   */
  getArticleById: async (id: string): Promise<Article | null> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const parsed = ArticleSchema.safeParse({ id: snap.id, ...snap.data() });
      if (parsed.success) {
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error(`[ARTICLE SERVICE] Error fetching article by ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Mengambil detail artikel berdasarkan Slug URL
   */
  getArticleBySlug: async (slug: string): Promise<Article | null> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;

      const firstDoc = snap.docs[0];
      const parsed = ArticleSchema.safeParse({ id: firstDoc.id, ...firstDoc.data() });
      return parsed.success ? parsed.data : null;
    } catch (error) {
      console.error(`[ARTICLE SERVICE] Error fetching article by slug ${slug}:`, error);
      return null;
    }
  },

  /**
   * Membuat artikel baru
   */
  createArticle: async (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<string> => {
    const now = Date.now();
    const finalSlug = data.slug ? slugify(data.slug) : slugify(data.title);

    const docData = {
      ...data,
      slug: finalSlug,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.isPublished ? (data.publishedAt || now) : null,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    return docRef.id;
  },

  /**
   * Memperbarui artikel yang sudah ada
   */
  updateArticle: async (id: string, updates: Partial<Article>): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const now = Date.now();

    const cleanUpdates: Record<string, any> = {
      ...updates,
      updatedAt: now,
    };

    if (updates.title && !updates.slug) {
      cleanUpdates.slug = slugify(updates.title);
    } else if (updates.slug) {
      cleanUpdates.slug = slugify(updates.slug);
    }

    if (updates.isPublished === true && !updates.publishedAt) {
      cleanUpdates.publishedAt = now;
    }

    delete cleanUpdates.id; // Jangan simpan id di dalam document fields
    await updateDoc(docRef, cleanUpdates);
  },

  /**
   * Menghapus artikel
   */
  deleteArticle: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  /**
   * Menambah view count secara atomik saat artikel dibaca
   */
  incrementViewCount: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { viewCount: increment(1) });
    } catch (error) {
      console.warn(`[ARTICLE SERVICE] Gagal menambah view count artikel ${id}:`, error);
    }
  }
};
