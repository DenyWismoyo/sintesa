'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchProps {
  query: string;
  status?: string; 
  internalStatus?: string; 
  isLookingForJob?: boolean;
  perPage?: number;
}

export function useAlumniSearch({ query: searchQuery, status, internalStatus, isLookingForJob, perPage = 20 }: SearchProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHits, setTotalHits] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Reset page ke 1 jika filter berubah
  useEffect(() => {
    setPage(1); 
  }, [searchQuery, status, internalStatus, isLookingForJob]);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        let q = collection(db, 'alumnis');
        let firestoreConditions: any[] = [];

        // 1. FILTER EXACT MATCH DI FIREBASE
        if (status) firestoreConditions.push(where('status', '==', status));
        if (internalStatus && internalStatus !== 'ALL') firestoreConditions.push(where('internalStatus', '==', internalStatus));
        if (isLookingForJob !== undefined) firestoreConditions.push(where('isLookingForJob', '==', isLookingForJob));

        const finalQuery = query(q, ...firestoreConditions);
        const snapshot = await getDocs(finalQuery);
        
        let fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. TEXT SEARCH DI JAVASCRIPT
        if (searchQuery.trim() !== '') {
          const lowerQ = searchQuery.toLowerCase();
          fetchedData = fetchedData.filter((item: any) => {
            const combined = `${item.name||''} ${item.email||''} ${item.phone||''} ${item.registrationCode||''} ${item.currentJob||''} ${item.company||''} ${item.skills?.join(' ')||''} ${item.industry||''} ${item.education||''} ${item.major||''}`.toLowerCase();
            return combined.includes(lowerQ);
          });
        }

        // Urutkan berdasarkan waktu pendaftaran (terbaru di atas)
        fetchedData.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        
        setTotalHits(fetchedData.length);

        // 3. PAGINATION MANUAL (Slice Array)
        const startIndex = 0; 
        const endIndex = page * perPage;
        const paginatedData = fetchedData.slice(startIndex, endIndex);

        setResults(paginatedData);
        setHasNextPage(endIndex < fetchedData.length);

      } catch (err: any) {
        console.error("Firebase Alumni Search Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => search(), 300);
    return () => clearTimeout(timer);
    
  }, [searchQuery, status, internalStatus, isLookingForJob, page, perPage]);

  const loadMore = () => {
    if (hasNextPage && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return { results, totalHits, loading, hasNextPage, loadMore };
}