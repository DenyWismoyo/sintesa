'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Interfaces dan SEARCH_CONFIGS biarkan sama seperti file asli
export interface SearchResult {
  dataType: "asset" | "event" | "catalog" | "training" | "tenant";
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

export interface GroupedResults {
  [key: string]: { label: string; items: SearchResult[]; total: number; };
}

export const SEARCH_CONFIGS = [
  { collection: 'assets', dataType: 'asset', label: 'Ruangan & Fasilitas' },
  { collection: 'events', dataType: 'event', label: 'Event' },
  { collection: 'trainings', dataType: 'training', label: 'Pelatihan' },
  { collection: 'tenants', dataType: 'tenant', label: 'Tenant & Startup' },
  { collection: 'catalogs', dataType: 'catalog', label: 'Produk & Layanan' }
];

const CACHE_KEY = 'sintesa_explore_state';

export function useUniversalSearch() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("semua");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const hasSearchedRef = useRef(false);
  
  const [isAiMode, setIsAiMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  
  const [flatResults, setFlatResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({});
  const [totalHits, setTotalHits] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const prevQuery = useRef(query);
  const prevTab = useRef(activeTab);

  // Efek Restore & Auto Save Cache biarkan sama...
  // (Masukkan kembali useEffect cache dari file asli Anda ke sini)

  // FUNGSI 1: PENCARIAN FIREBASE MURNI
  const performSearch = useCallback(async (searchQuery: string, targetTab: string, targetPage: number) => {
    if (!searchQuery.trim() && !hasSearchedRef.current) return;

    setIsLoading(true);
    setHasSearched(true);
    hasSearchedRef.current = true;
    setIsAiMode(false);
    setAiMessage(null);

    try {
      const lowerQuery = searchQuery.toLowerCase();
      const isSemua = targetTab === 'semua';
      const perPage = isSemua ? 4 : 12;

      const collectionsToFetch = SEARCH_CONFIGS.filter(conf => isSemua || targetTab === conf.collection);

      const fetchPromises = collectionsToFetch.map(async (conf) => {
        // Ambil semua data (Catatan: ini aman jika data per koleksi < 2000 dokumen)
        const snap = await getDocs(collection(db, conf.collection));
        const data = snap.docs.map(doc => ({ id: doc.id, dataType: conf.dataType, ...doc.data() } as any));
        
        // Filter menggunakan JavaScript
        const filteredData = data.filter(item => {
           const textToSearch = `${item.name || ''} ${item.title || ''} ${item.description || ''} ${item.shortDescription || ''} ${item.tags?.join(' ') || ''}`.toLowerCase();
           return textToSearch.includes(lowerQuery);
        });

        // Urutkan dari yang terbaru
        filteredData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return { config: conf, results: filteredData };
      });

      const rawResults = await Promise.all(fetchPromises);
      let newTotalHits = 0;

      if (isSemua) {
        const newGrouped: GroupedResults = {};
        rawResults.forEach(res => {
          if (res.results.length > 0) {
            newGrouped[res.config.collection] = {
              label: res.config.label,
              items: res.results.slice(0, perPage),
              total: res.results.length
            };
            newTotalHits += res.results.length;
          }
        });
        setGroupedResults(newGrouped);
        setFlatResults([]);
        setHasMore(false);
      } else {
        const res = rawResults[0].results;
        newTotalHits = res.length;
        
        const startIndex = (targetPage - 1) * perPage;
        const paginatedData = res.slice(startIndex, startIndex + perPage);
        
        setFlatResults(prev => targetPage === 1 ? paginatedData : [...prev, ...paginatedData]);
        setHasMore(startIndex + perPage < newTotalHits);
        setGroupedResults({});
      }

      setTotalHits(newTotalHits);

    } catch (error) {
      console.error("Firebase Universal Search Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FUNGSI 2: PENCARIAN AI (Tetap sama seperti aslinya)
  const performAiSearch = useCallback(async (searchQuery: string) => {
    // Paste isi dari fungsi performAiSearch yang ada di file asli Anda
  }, []);

  // Efek Debounce & Render (Tetap sama seperti aslinya)
  // ...

  const handleQueryChange = (val: string) => { setQuery(val); if (isAiMode) setIsAiMode(false); };
  const handleInitialSearch = (e?: React.FormEvent, presetQuery?: string) => { /* logic lama */ };
  const loadMore = () => { if (!isLoading && hasMore && !isAiMode) setPage(prev => prev + 1); };

  return {
    query, handleQueryChange, activeTab, setActiveTab,
    isLoading, isAiLoading, hasSearched, isAiMode, aiMessage,
    flatResults, groupedResults, totalHits, hasMore, loadMore,
    handleInitialSearch, performAiSearch
  };
}