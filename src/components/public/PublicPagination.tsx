'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ArrowDown } from 'lucide-react';

export interface PublicPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  mode?: 'pages' | 'load_more' | 'hybrid';
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
  showItemCount?: boolean;
  className?: string;
}

export function PublicPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
  mode = 'hybrid',
  onLoadMore,
  isLoadingMore = false,
  scrollTargetRef,
  showItemCount = true,
  className = '',
}: PublicPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const remainingItems = Math.max(0, totalItems - endItem);

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    if (scrollTargetRef && scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoadMoreClick = () => {
    if (onLoadMore) {
      onLoadMore();
    } else if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate pagination range with ellipsis
  const paginationRange = useMemo(() => {
    const delta = 1;
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  if (totalItems <= 0) return null;

  return (
    <div className={`w-full flex flex-col gap-3 pt-6 pb-2 ${className}`}>
      {/* ─── Mode 1: LOAD MORE (Aktif di mobile jika mode="hybrid" atau mode="load_more") ─── */}
      {(mode === 'load_more' || mode === 'hybrid') && (
        <div className={`w-full flex flex-col items-center justify-center gap-2 ${mode === 'hybrid' ? 'sm:hidden' : ''}`}>
          {remainingItems > 0 ? (
            <button
              type="button"
              onClick={handleLoadMoreClick}
              disabled={isLoadingMore}
              className="w-full sm:w-auto min-w-[220px] h-12 px-6 rounded-2xl bg-white border border-slate-200/90 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                  <span>Memuat Data...</span>
                </>
              ) : (
                <>
                  <ArrowDown size={15} className="text-slate-500" />
                  <span>Muat Lebih Banyak ({remainingItems} tersisa)</span>
                </>
              )}
            </button>
          ) : (
            <div className="py-2 text-center text-xs font-semibold text-slate-400">
              Semua {totalItems} item telah ditampilkan
            </div>
          )}

          {showItemCount && (
            <div className="text-[11px] font-medium text-slate-400">
              Menampilkan {endItem} dari {totalItems} hasil
            </div>
          )}
        </div>
      )}

      {/* ─── Mode 2: NUMERIC PAGINATION (Desktop & Tablet atau saat mode="pages") ─── */}
      <div
        className={`w-full flex flex-col sm:flex-row items-center justify-between gap-4 ${
          mode === 'hybrid' ? 'hidden sm:flex' : mode === 'load_more' ? 'hidden' : 'flex'
        }`}
      >
        {/* Info Counter & Page Size Selector */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {showItemCount && (
            <span className="font-medium">
              Menampilkan <span className="font-bold text-slate-800">{startItem}–{endItem}</span> dari{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> data
            </span>
          )}

          {onPageSizeChange && pageSizeOptions.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
              <span className="text-[11px] text-slate-400">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
                aria-label="Pilih jumlah data per halaman"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Numeric Button Controls */}
        {totalPages > 1 && (
          <nav aria-label="Navigasi Halaman" className="flex items-center gap-1.5">
            {/* Tombol Sebelumnya */}
            <button
              type="button"
              onClick={() => handlePageSelect(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-slate-600 shadow-2xs transition-all active:scale-95"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Nomor Halaman */}
            <div className="flex items-center gap-1">
              {paginationRange.map((page, idx) => {
                if (typeof page === 'string') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 h-9 flex items-center justify-center text-slate-400 text-xs font-bold select-none"
                    >
                      ...
                    </span>
                  );
                }

                const isActive = page === currentPage;
                return (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => handlePageSelect(page)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`h-9 min-w-[2.25rem] px-2.5 rounded-xl text-xs font-black transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs scale-100'
                        : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Tombol Selanjutnya */}
            <button
              type="button"
              onClick={() => handlePageSelect(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-slate-600 shadow-2xs transition-all active:scale-95"
              aria-label="Halaman selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default PublicPagination;

