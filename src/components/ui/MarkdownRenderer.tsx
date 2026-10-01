// Lokasi file: src/components/ui/MarkdownRenderer.tsx

'use client';

import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Parse markdown ke HTML menggunakan konfigurasi GFM (GitHub Flavored Markdown)
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      // Konfigurasi marked untuk GFM
      marked.setOptions({
        gfm: true,
        breaks: true,
      });

      return marked.parse(content) as string;
    } catch (err) {
      console.error("[MARKDOWN RENDERER] Error parsing markdown:", err);
      return `<p>${content}</p>`;
    }
  }, [content]);

  return (
    <div 
      className={`github-markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
