"use client";

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  totalItems?: number;
  mode?: 'pages' | 'load_more';
  isLoading?: boolean;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  mode = 'pages',
  isLoading = false,
}: AdminPaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  // Rentang item yang sedang ditampilkan
  const startItem = totalItems ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : pageSize;

  if (mode === 'load_more') {
    const hasMore = currentPage < totalPages;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Menampilkan <span className="font-bold text-slate-800">{endItem}</span> dari{' '}
          <span className="font-bold text-slate-800">{totalItems || 'banyak'}</span> data
        </div>

        {hasMore && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
            Muat Lebih Banyak
          </button>
        )}
      </div>
    );
  }

  // Menghitung nomor halaman yang ditampilkan
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-150 text-xs text-slate-500">
      {/* Kiri: Info Jumlah Data & Pilihan Limit */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <span className="text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800">{startItem}–{endItem}</span> dari{' '}
            <span className="font-bold text-slate-800">{totalItems}</span>
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="hidden md:inline text-slate-400">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none font-medium cursor-pointer shadow-2xs hover:border-slate-300"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} baris
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanan: Navigasi Tombol Halaman */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(1)}
          className="hidden sm:flex p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Nomor Halaman */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(Number(p))}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(totalPages)}
          className="hidden sm:flex p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

