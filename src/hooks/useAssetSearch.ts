'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assetService } from '@/services/asset.service';

interface SearchProps {
  query: string;
  category: string;
  type: string;
  condition: string;
  location: string;
  tab: 'Semua' | 'Komersial' | 'Inventaris';
  page: number;
  perPage?: number;
}

export function useAssetSearch({ query: searchQuery, category, type, condition, location, tab, page, perPage = 20 }: SearchProps) {
  // Fetch data dari cache hanya sekali (1-Read Concept) menggunakan React Query
  const { data: masterData = [], isLoading, error: queryError } = useQuery({
    queryKey: ['asset_master_cache'],
    queryFn: () => assetService.getAssetCache(),
    staleTime: 1000 * 60 * 30, // Berlaku 30 Menit, jika tidak ada mutasi baru
    refetchOnWindowFocus: false,
  });

  const [results, setResults] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [facets, setFacets] = useState({
    categories: [] as string[],
    types: [] as string[],
    locations: [] as string[],
    conditions: [] as string[]
  });

  useEffect(() => {
    if (isLoading) return;

    let filtered = [...masterData];

    // 1. FILTER EXACT MATCH LOKAL (Sangat Cepat, Tidak Kena Biaya Firestore)
    if (category !== 'Semua') filtered = filtered.filter(item => item.category === category);
    if (type !== 'Semua') filtered = filtered.filter(item => item.assetType === type);
    if (condition !== 'Semua') filtered = filtered.filter(item => item.condition === condition);
    if (location !== 'Semua') filtered = filtered.filter(item => item.location === location);
    if (tab === 'Komersial') filtered = filtered.filter(item => item.isRentable === true);
    if (tab === 'Inventaris') filtered = filtered.filter(item => item.isRentable === false);

    // 2. TEXT SEARCH LOKAL
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter((item: any) => {
        const combinedText = `${item.name || ''} ${item.inventoryNumber || ''} ${item.registerNumber || ''} ${item.brandType || ''} ${item.picName || ''}`.toLowerCase();
        return combinedText.includes(lowerQ);
      });
    }

    // Ekstraksi Options untuk Dropdown (Berbasis Master Data agar menu dropdown tidak hilang)
    const uniqueCategories = Array.from(new Set(masterData.map((d: any) => d.category).filter(Boolean)));
    const uniqueTypes = Array.from(new Set(masterData.map((d: any) => d.assetType).filter(Boolean)));
    const uniqueLocations = Array.from(new Set(masterData.map((d: any) => d.location).filter(Boolean)));
    const uniqueConditions = Array.from(new Set(masterData.map((d: any) => d.condition).filter(Boolean)));

    setFacets({
      categories: uniqueCategories,
      types: uniqueTypes,
      locations: uniqueLocations,
      conditions: uniqueConditions
    });

    // 3. PAGINATION LOKAL
    setTotalHits(filtered.length);
    setTotalPages(Math.ceil(filtered.length / perPage) || 1);

    const startIndex = (page - 1) * perPage;
    const paginatedData = filtered.slice(startIndex, startIndex + perPage);

    setResults(paginatedData);

  }, [searchQuery, category, type, condition, location, tab, page, perPage, masterData, isLoading]);

  return { 
    results, 
    totalHits, 
    totalPages, 
    loading: isLoading, 
    error: queryError ? queryError.message : null, 
    facets 
  };
}