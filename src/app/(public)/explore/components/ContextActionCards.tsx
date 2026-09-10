"use client";

import React, { useState } from "react";
import { Play, Building2, Rocket, GraduationCap, Trophy, X, Info } from "lucide-react";
import { KrenovaContent } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ContextActionCardsProps {
  recommendedVideos: KrenovaContent[];
}

const FEATURED_SERVICES = [
  {
    title: "Sewa Auditorium & Ruang",
    desc: "Kapasitas hingga 1.000 orang, full AC, sound system 20.000W & videotron.",
    icon: Building2,
    href: "/fasilitas",
    badge: "Fasilitas BLUD",
    color: "from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-200",
  },
  {
    title: "Inkubasi Bisnis & Startup",
    desc: "Mentoring intensif, seed grant, cloud credits, dan kurasi investor.",
    icon: Rocket,
    href: "/curation",
    badge: "Program Inkubasi",
    color: "from-indigo-500/10 to-violet-500/10 text-indigo-600 border-indigo-200",
  },
  {
    title: "Akademi Digital & Vokasi",
    desc: "Pelatihan coding web, AI, las bawah air, dan sertifikasi BNSP.",
    icon: GraduationCap,
    href: "/program-pelatihan",
    badge: "Diklat Vokasi",
    color: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200",
  },
  {
    title: "Pameran Inovasi Krenova",
    desc: "Karya inovasi teknologi tepat guna karya inovator dan talenta muda Solo.",
    icon: Trophy,
    href: "/explore",
    badge: "Kreativitas & Inovasi",
    color: "from-fuchsia-500/10 to-pink-500/10 text-fuchsia-600 border-fuchsia-200",
  },
];

export default function ContextActionCards({ recommendedVideos }: ContextActionCardsProps) {
  const [activeVideo, setActiveVideo] = useState<KrenovaContent | null>(null);

  return (
    <div className="w-full mt-10 pt-8 border-t border-slate-200/80">
      {/* Jika ada rekomendasi video Krenova dari AI */}
      {recommendedVideos && recommendedVideos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-600" />
            Video Inovasi Krenova yang Relevan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendedVideos.map((video, idx) => (
              <div
                key={video.id || `rec-vid-${idx}`}
                onClick={() => setActiveVideo(video)}
                className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white/50">
                      <Play className="w-8 h-8 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
                    {video.type}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jelajahi Layanan Utama Kawasan */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Layanan Utama Kawasan Solo Technopark
          </h3>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Akses langsung informasi resmi
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURED_SERVICES.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <Link
                key={`srv-${idx}`}
                href={srv.href}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${srv.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {srv.badge}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-0.5 mb-1">
                    {srv.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-3">
                  Buka Menu →
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          >
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <button
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="aspect-video w-full bg-black">
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-6 text-white">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                  <Info className="w-3.5 h-3.5" /> KRENOVA {activeVideo.type}
                </div>
                <h3 className="text-xl font-black">{activeVideo.title}</h3>
                <p className="text-sm text-slate-300 mt-2">{activeVideo.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
