'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

// Melengkapi definisi tipe (types) untuk props komponen
interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Menggunakan useState agar QueryClient tidak dibuat ulang setiap kali komponen render ulang
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap "fresh" selama 5 menit. 
            // Selama rentang waktu ini, pindah halaman tidak akan men-trigger read/baca ke Firebase!
            staleTime: 5 * 60 * 1000, 
            // Jangan fetch ulang otomatis hanya karena user berpindah/kembali ke tab browser ini
            refetchOnWindowFocus: false, 
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}