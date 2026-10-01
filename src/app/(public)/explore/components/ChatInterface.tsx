"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Copy, Check, FileText, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AIMode } from "./ExploreHero";

export interface ChatMessage {
  id?: string;
  role: "ai" | "user";
  text: string;
  sources?: string[];
  quickActions?: Array<{ label: string; href: string; type: string }>;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isAiLoading: boolean;
  activeMode?: AIMode;
  onSendMessage: (text: string) => void;
}

export default function ChatInterface({
  messages,
  isAiLoading,
  activeMode = "knowledge",
  onSendMessage,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isAiLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const formatMarkdown = (text: string) => {
    // Parser sederhana untuk markdown bold, list, dan baris baru
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
      .replace(/### (.*?)\n/g, '<h4 class="text-base font-bold text-indigo-900 mt-2 mb-1">$1</h4>')
      .replace(/## (.*?)\n/g, '<h3 class="text-lg font-black text-indigo-950 mt-3 mb-1">$1</h3>')
      .replace(/\n\n/g, '<p class="mb-2"></p>')
      .replace(/\n- (.*?)/g, '<li class="ml-4 list-disc text-slate-700 my-0.5">$1</li>')
      .replace(/\n\d+\. (.*?)/g, '<li class="ml-4 list-decimal text-slate-700 my-0.5">$1</li>');

    return { __html: html };
  };

  return (
    <div className="w-full flex flex-col flex-1">
      {/* Messages Scroll Area */}
      <div className="w-full flex flex-col gap-5 mb-8">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={`chat-msg-${idx}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 sm:gap-4 max-w-3xl ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs mt-1 ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/20"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-[90%]">
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm sm:text-base leading-relaxed relative group ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/20 font-medium"
                      : "bg-white border border-slate-200/90 text-slate-700 rounded-tl-none shadow-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <>
                      <div
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base"
                        dangerouslySetInnerHTML={formatMarkdown(msg.text)}
                      />

                      {/* Copy Action Button */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Sparkles className={`w-3 h-3 ${activeMode === "free" ? "text-fuchsia-500" : "text-indigo-500"}`} />
                          {activeMode === "free" ? "Solo Technopark AI • Mode Bebas" : "STP Knowledge Grounded"}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.text, idx)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Salin jawaban"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[11px] text-emerald-600 font-semibold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[11px]">Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Sources & Quick Actions (For AI Responses) */}
                {msg.role === "ai" && (
                  <div className="flex flex-col gap-2 px-1">
                    {/* Source Badges */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          Sumber:
                        </span>
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={`src-${sIdx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/80 text-slate-600 text-xs font-mono font-medium"
                          >
                            <FileText className="w-3 h-3 text-indigo-500" />
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Action Links */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {msg.quickActions.map((action, aIdx) => (
                          <Link
                            key={`act-${aIdx}`}
                            href={action.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 text-xs font-bold transition-all shadow-2xs group"
                          >
                            <span>{action.label}</span>
                            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Loading Indicator */}
          {isAiLoading && (
            <motion.div
              key="ai-typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 sm:gap-4 max-w-3xl mr-auto"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce delay-200"></span>
                <span className="text-xs font-semibold text-slate-500 ml-1">Mencari di arsip katalog & pengetahuan...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      {/* Docked Input Box */}
      <div className="sticky bottom-4 w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-lg shadow-indigo-900/5 z-30 transition-all focus-within:ring-4 focus-within:ring-indigo-500/15 focus-within:border-indigo-400">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeMode === "free"
                ? "Tanyakan ide, coding, bisnis, atau topik bebas apapun..."
                : "Tanyakan fasilitas, tarif sewa, inkubasi, atau inovasi..."
            }
            disabled={isAiLoading}
            className="flex-1 bg-transparent border-none text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal px-3 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-0 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isAiLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-sm shadow-indigo-600/20 shrink-0 cursor-pointer text-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
