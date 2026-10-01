import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingDetailEkosistem() {
  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-pulse">
      {/* Banner / Cover Skeleton */}
      <div className="h-64 sm:h-80 w-full bg-slate-800 relative">
        <div className="max-w-[1300px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-700 border-4 border-slate-800" />
            <div className="space-y-3">
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 rounded-xl bg-slate-700" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full bg-slate-700" />
                <Skeleton className="h-6 w-24 rounded-full bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <Skeleton className="h-6 w-36 rounded bg-slate-100" />
              <Skeleton className="h-4 w-full rounded bg-slate-100" />
              <Skeleton className="h-4 w-full rounded bg-slate-100" />
              <Skeleton className="h-4 w-3/4 rounded bg-slate-100" />
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <Skeleton className="h-6 w-40 rounded bg-slate-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-2xl bg-slate-50 border border-slate-100" />
                <Skeleton className="h-28 rounded-2xl bg-slate-50 border border-slate-100" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <Skeleton className="h-5 w-28 rounded bg-slate-100" />
              <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
              <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
