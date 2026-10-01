"use client";

import React from "react";
import { MessageSquarePlus, Sparkles } from "lucide-react";
import { AIMode } from "./ExploreHero";

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  activeTopic?: string;
  activeMode?: AIMode;
}

const KNOWLEDGE_PROMPTS: Record<string, string[]> = {
  all: [
    "Bagaimana prosedur dan tarif sewa Auditorium Solo Technopark?",
    "Apa syarat dan alur pendaftaran inkubasi startup Solo Technopark?",
    "Apa saja pilihan program pelatihan talenta digital & vokasi?",
    "Bagaimana cara berkunjung atau studi banding ke kawasan?",
  ],
  fasilitas: [
    "Berapa kapasitas Auditorium dan fasilitas yang disediakan?",
    "Berapa tarif harian dan bulanan coworking space di STK?",
    "Bagaimana alur pembayaran sewa via Virtual Account BLUD?",
  ],
  inkubasi: [
    "Apa perbedaan Track Startup dan Track UMKM di inkubator?",
    "Benefit apa saja yang didapat tenant binaan Solo Technopark?",
    "Kapan jadwal Demo Day dan kurasi investor diadakan?",
  ],
  pelatihan: [
    "Apakah ada pelatihan coding web & AI bersertifikasi BNSP?",
    "Berapa lama durasi pelatihan pengelasan las bawah air?",
    "Bagaimana penyaluran kerja setelah lulus pelatihan?",
  ],
  krenova: [
    "Apa saja kategori inovasi yang dilombakan di KRENOVA?",
    "Kapan batas pengumpulan proposal dan demonstrasi produk?",
    "Apa keuntungan bagi inovator pemenang pameran KRENOVA?",
  ],
};

const FREE_PROMPTS: Record<string, string[]> = {
  all: [
    "Bantu buatkan 3 ide startup teknologi AI untuk sektor agrikultur",
    "Tuliskan draft pitch deck elevator pitch 60 detik untuk investor",
    "Bagaimana tren perkembangan smart city dan IoT di Indonesia 2026?",
    "Rancang kurikulum belajar intensif Fullstack AI Engineer dalam 3 bulan",
  ],
  "startup-ideas": [
    "Bagaimana cara melakukan riset validasi masalah sebelum membangun MVP?",
    "Rancang model monetisasi freemium vs subscription untuk SaaS B2B",
    "Apa metrik traksi terpenting yang dicari venture capital saat seed round?",
  ],
  "tech-coding": [
    "Jelaskan arsitektur microservices vs monolith untuk startup skala awal",
    "Bagaimana cara mengoptimalkan prompt LLM untuk structured JSON output?",
    "Apa saja best practice keamanan auth JWT dan custom claims Firebase?",
  ],
  copywriting: [
    "Tuliskan caption media sosial yang memikat untuk peluncuran produk inovasi",
    "Buatkan naskah siaran pers resmi kerja sama strategis technopark",
    "Tuliskan email penawaran kerja sama B2B yang persuasif dan sopan",
  ],
};

export default function PromptSuggestions({
  onSelectPrompt,
  activeTopic = "all",
  activeMode = "knowledge",
}: PromptSuggestionsProps) {
  const isFree = activeMode === "free";
  const promptDict = isFree ? FREE_PROMPTS : KNOWLEDGE_PROMPTS;
  const prompts = promptDict[activeTopic] || promptDict.all;

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-2 mb-3">
        {isFree ? (
          <Sparkles className="w-4 h-4 text-fuchsia-600" />
        ) : (
          <MessageSquarePlus className="w-4 h-4 text-indigo-600" />
        )}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isFree ? "Inspirasi Topik Diskusi Bebas" : "Pertanyaan Populer Arsip Kawasan"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {prompts.map((text, idx) => (
          <button
            key={`prompt-${idx}`}
            onClick={() => onSelectPrompt(text)}
            className={`text-left p-3 rounded-xl bg-white border border-slate-200/80 text-xs sm:text-sm text-slate-700 transition-all duration-200 shadow-2xs group flex items-start justify-between gap-2 cursor-pointer ${
              isFree
                ? "hover:border-fuchsia-300 hover:bg-fuchsia-50/40 hover:text-fuchsia-950"
                : "hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-950"
            }`}
          >
            <span className="font-medium line-clamp-2">{text}</span>
            <span
              className={`transition-all text-xs shrink-0 mt-0.5 group-hover:translate-x-0.5 ${
                isFree
                  ? "text-slate-300 group-hover:text-fuchsia-600"
                  : "text-slate-300 group-hover:text-indigo-600"
              }`}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
