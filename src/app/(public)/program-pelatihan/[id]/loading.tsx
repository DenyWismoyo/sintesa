import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingDetailPelatihan() {
  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 animate-pulse">
      {/* Hero Header Area */}
      <div className="bg-slate-900 text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1300px] mx-auto space-y-6">
          <Skeleton className="h-5 w-40 rounded-full bg-slate-800" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full bg-slate-800" />
            <Skeleton className="h-6 w-32 rounded-full bg-slate-800" />
          </div>
          <Skeleton className="h-12 w-3/4 max-w-2xl rounded-2xl bg-slate-800" />
          <Skeleton className="h-6 w-1/2 max-w-lg rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (2 cols) */}
          <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex gap-4 border-b border-slate-100 pb-4">
              <Skeleton className="h-7 w-28 rounded bg-slate-100" />
              <Skeleton className="h-7 w-28 rounded bg-slate-100" />
              <Skeleton className="h-7 w-28 rounded bg-slate-100" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-5 w-full rounded bg-slate-100" />
              <Skeleton className="h-5 w-full rounded bg-slate-100" />
              <Skeleton className="h-5 w-4/5 rounded bg-slate-100" />
              <Skeleton className="h-5 w-3/5 rounded bg-slate-100" />
            </div>

            <div className="pt-6 space-y-3">
              <Skeleton className="h-8 w-48 rounded-xl bg-slate-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-2xl bg-slate-50 border border-slate-100" />
                <Skeleton className="h-20 rounded-2xl bg-slate-50 border border-slate-100" />
              </div>
            </div>
          </div>

          {/* Right Column (1 col) Card */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl bg-slate-100" />
              <Skeleton className="h-10 w-40 rounded-xl bg-slate-100" />
              <Skeleton className="h-12 w-full rounded-2xl bg-amber-100" />
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <Skeleton className="h-4 w-full rounded bg-slate-100" />
                <Skeleton className="h-4 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
