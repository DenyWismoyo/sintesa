import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingDetailKatalog() {
  return (
    <div className="bg-white min-h-screen pb-32 lg:pb-24 selection:bg-emerald-100 selection:text-emerald-900 animate-pulse">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-slate-100" />
            <Skeleton className="h-5 w-48 rounded-full bg-slate-100" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full bg-slate-100" />
        </div>

        {/* Title Skeleton */}
        <div className="mb-6 lg:mb-8 space-y-3">
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-xl rounded-2xl bg-slate-100" />
          <Skeleton className="h-5 w-1/3 max-w-xs rounded-full bg-slate-100" />
        </div>

        {/* Hero Gallery Skeleton (Standardized 16:9 Aspect Ratio) */}
        <div className="w-full mb-8 sm:mb-12">
          <Skeleton className="w-full aspect-video rounded-2xl sm:rounded-3xl bg-slate-200/80" />
          <div className="mt-3 sm:mt-4 flex gap-2.5 sm:gap-3 overflow-hidden">
            <Skeleton className="w-20 sm:w-28 md:w-32 aspect-video rounded-xl sm:rounded-2xl bg-slate-200/60 shrink-0" />
            <Skeleton className="w-20 sm:w-28 md:w-32 aspect-video rounded-xl sm:rounded-2xl bg-slate-200/60 shrink-0" />
            <Skeleton className="w-20 sm:w-28 md:w-32 aspect-video rounded-xl sm:rounded-2xl bg-slate-200/60 shrink-0" />
          </div>
        </div>

        {/* Content Layout (60/40 Split) */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Left Column (60%) */}
          <div className="w-full lg:w-[60%] space-y-8">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-7 w-32 rounded-xl bg-slate-100" />
              <Skeleton className="h-7 w-20 rounded-xl bg-slate-100" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-5 w-full rounded-lg bg-slate-100" />
              <Skeleton className="h-5 w-5/6 rounded-lg bg-slate-100" />
              <Skeleton className="h-5 w-4/6 rounded-lg bg-slate-100" />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-6">
              <div className="flex gap-6 border-b border-slate-100 pb-3">
                <Skeleton className="h-6 w-32 rounded bg-slate-100" />
                <Skeleton className="h-6 w-28 rounded bg-slate-100" />
                <Skeleton className="h-6 w-36 rounded bg-slate-100" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full rounded bg-slate-100" />
                <Skeleton className="h-4 w-full rounded bg-slate-100" />
                <Skeleton className="h-4 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          </div>

          {/* Right Column (40%) Sticky Box Skeleton */}
          <div className="hidden lg:block w-[40%]">
            <div className="border border-slate-200 rounded-[2rem] p-8 space-y-6 bg-slate-50/50">
              <Skeleton className="h-4 w-28 rounded bg-slate-200/70" />
              <Skeleton className="h-12 w-48 rounded-xl bg-slate-200" />
              <Skeleton className="h-14 w-full rounded-2xl bg-emerald-100/70" />
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <Skeleton className="h-4 w-full rounded bg-slate-200/60" />
                <Skeleton className="h-4 w-3/4 rounded bg-slate-200/60" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
