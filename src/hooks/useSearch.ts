'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchProps {
  collection: string;
  query: string;
  queryBy: string;
  filterBy?: string;
  sortBy?: string;
  perPage?: number;
}

export function useSearch<T>({ collection: collectionName, query: searchQuery, queryBy, perPage = 50 }: SearchProps) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const snap = await getDocs(collection(db, collectionName));
        let fetchedData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Jika ada query pencarian teks
        if (searchQuery && searchQuery.trim() !== '' && searchQuery !== '*') {
          const lowerQ = searchQuery.toLowerCase();
          // Pecah parameter queryBy (misal: "title,description,tags")
          const fieldsToSearch = queryBy.split(',').map(f => f.trim());

          fetchedData = fetchedData.filter(item => {
            let combinedText = '';
            fieldsToSearch.forEach(field => {
              if (item[field]) {
                // Gabungkan teks biasa atau Array of string menjadi satu teks utuh
                combinedText += ` ${Array.isArray(item[field]) ? item[field].join(' ') : item[field]}`;
              }
            });
            return combinedText.toLowerCase().includes(lowerQ);
          });
        }

        // Urutkan selalu dari yang terbaru (Default)
        fetchedData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Potong jumlah hasil sesuai batas perPage
        setResults(fetchedData.slice(0, perPage) as T[]);
        
      } catch (err: any) {
        console.error("Firebase Generic Search Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => search(), 300);
    return () => clearTimeout(timer);
    
  }, [collectionName, searchQuery, queryBy, perPage]);

  return { results, loading, error };
}