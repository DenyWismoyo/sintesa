"use client";

import React, { useState } from "react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import ExploreHero, { AIMode } from "./components/ExploreHero";
import PromptSuggestions from "./components/PromptSuggestions";
import ChatInterface, { ChatMessage } from "./components/ChatInterface";
import ContextActionCards from "./components/ContextActionCards";
import { KrenovaContent } from "@/types";

export default function ExploreAIPage() {
  const [activeMode, setActiveMode] = useState<AIMode>("knowledge");
  const [activeTopic, setActiveTopic] = useState("all");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recommendedVideos, setRecommendedVideos] = useState<KrenovaContent[]>([]);

  // Riwayat Pesan Awal
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Halo! Saya **Sintesa**, asisten AI resmi Solo Technopark.\n\nSaya dapat membantu Anda mengeksplorasi **layanan sewa fasilitas & auditorium**, informasi **inkubasi startup/UMKM**, jadwal **pelatihan talenta digital & vokasi**, serta karya inovasi pameran **KRENOVA** berbasis arsip resmi kawasan.\n\nAnda juga dapat beralih ke **Mode Bebas (General AI)** di bagian atas jika ingin berdiskusi, brainstorming ide, atau bertanya topik apapun di luar arsip kawasan. Apa yang ingin Anda ketahui hari ini?",
      sources: ["01-profil-kawasan.md"],
      quickActions: [
        { label: "Sewa Fasilitas", href: "/fasilitas", type: "link" },
        { label: "Inkubasi Startup", href: "/curation", type: "link" },
        { label: "Jadwal Pelatihan", href: "/program-pelatihan", type: "link" },
      ],
    },
  ]);

  // Mengubah Mode AI
  const handleModeChange = (mode: AIMode) => {
    setActiveMode(mode);
    setActiveTopic("all");
  };

  // Mengirim Pertanyaan ke API /api/ask-ai
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isAiLoading) return;

    const previousHistory = [...messages];
    const newMessages: ChatMessage[] = [
      ...previousHistory,
      { role: "user", text: userText },
    ];

    setMessages(newMessages);
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userText,
          mode: activeMode,
          history: previousHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: data.message,
            sources: data.sources || [],
            quickActions: data.quickActions || [],
          },
        ]);

        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendedVideos(data.recommendations);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: data.message || "Maaf, Sintesa sedang tidak dapat memproses jawaban.",
          },
        ]);
      }
    } catch (error) {
      console.error("[Explore AI Error]:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Maaf, terjadi kendala jaringan saat menghubungi layanan AI. Silakan coba kembali.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <SectionContainer
      accent={activeMode === "free" ? "violet" : "indigo"}
      width="narrow"
      className="min-h-screen py-6 sm:py-10 transition-colors duration-500"
    >
      <div className="w-full flex flex-col items-center">
        {/* 1. Header & Mode Switcher */}
        <ExploreHero
          activeMode={activeMode}
          onSelectMode={handleModeChange}
          activeTopic={activeTopic}
          onSelectTopic={(topic) => setActiveTopic(topic)}
        />

        {/* 2. Quick Prompt Suggestions */}
        <PromptSuggestions
          activeMode={activeMode}
          activeTopic={activeTopic}
          onSelectPrompt={(promptText) => handleSendMessage(promptText)}
        />

        {/* 3. Main Chat Interface */}
        <ChatInterface
          messages={messages}
          isAiLoading={isAiLoading}
          activeMode={activeMode}
          onSendMessage={handleSendMessage}
        />

        {/* 4. Contextual Cards (Videos & Services) */}
        <ContextActionCards recommendedVideos={recommendedVideos} />
      </div>
    </SectionContainer>
  );
}