"use client";

import React from "react";
import { Sparkles, Bot, Compass, BookOpen, MessageSquareCode } from "lucide-react";

export type AIMode = "knowledge" | "free";

interface ExploreHeroProps {
  activeMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
  activeTopic: string;
  onSelectTopic: (topic: string) => void;
}

const KNOWLEDGE_TOPICS = [
  { id: "all", label: "Semua Topik", icon: Compass },
  { id: "fasilitas", label: "Fasilitas & Sewa", icon: Sparkles },
  { id: "inkubasi", label: "Inkubasi Startup", icon: Bot },
  { id: "pelatihan", label: "Pelatihan Vokasi", icon: Sparkles },
  { id: "krenova", label: "Inovasi Krenova", icon: Compass },
];

const FREE_TOPICS = [
  { id: "all", label: "Eksplorasi Umum", icon: Sparkles },
  { id: "startup-ideas", label: "Ide Bisnis & Inovasi", icon: Bot },
  { id: "tech-coding", label: "Teknologi & AI", icon: MessageSquareCode },
  { id: "copywriting", label: "Penulisan Kreatif", icon: Sparkles },
];

export default function ExploreHero({
  activeMode,
  onSelectMode,
  activeTopic,
  onSelectTopic,
}: ExploreHeroProps) {
  const isFree = activeMode === "free";
  const currentTopics = isFree ? FREE_TOPICS : KNOWLEDGE_TOPICS;

  return (
    <div className="w-full flex flex-col items-center text-center mb-8 relative">
      {/* Ambient Radial Glow */}
      <div
        className={`absolute top-[-60px] left-1/2 -translate-x-1/2 w-96 h-48 blur-3xl rounded-full pointer-events-none -z-10 transition-all duration-700 ${
          isFree
            ? "bg-gradient-to-r from-fuchsia-500/25 via-pink-500/25 to-rose-500/25"
            : "bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20"
        }`}
      />

      {/* Online Status Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 shadow-xs mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
          STP AI Assistant • Powered by Clario
        </span>
      </div>

      {/* Mode Switcher / Version Toggle */}
      <div className="flex p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm mb-5 gap-1">
        <button
          type="button"
          onClick={() => onSelectMode("knowledge")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            !isFree
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mode Arsip (.md)</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode("free")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
            isFree
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-fuchsia-600/30"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Mode Bebas (General AI)</span>
        </button>
      </div>

      {/* Headline Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
        {isFree ? (
          <>
            Percakapan Terbuka dengan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">
              Solo Technopark AI
            </span>
          </>
        ) : (
          <>
            Eksplorasi Resmi bersama{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
              Asisten AI Kawasan
            </span>
          </>
        )}
      </h1>

      <p className="text-slate-600 font-medium max-w-2xl text-sm sm:text-base mb-6 leading-relaxed">
        {isFree ? (
          <span>
            Mode terbuka tanpa batasan arsip. Diskusikan ide startup, solusi teknologi,
            penulisan konten, strategi bisnis, atau topik bebas lainnya dengan kecerdasan Clario AI.
          </span>
        ) : (
          <span>
            Pemandu cerdas berbasis dokumen resmi kawasan Solo Technopark. Jawaban tervalidasi
            terkait tarif sewa gedung, inkubasi bisnis, pelatihan, dan pameran Krenova.
          </span>
        )}
      </p>

      {/* Topic Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {currentTopics.map((topic) => {
          const isActive = activeTopic === topic.id;
          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? isFree
                    ? "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-600/30 scale-105"
                    : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 scale-105"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50"
              }`}
            >
              <topic.icon className="w-3.5 h-3.5" />
              <span>{topic.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
