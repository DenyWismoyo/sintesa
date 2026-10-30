// src/components/common/DocumentPreviewDrawer.tsx
'use client';

import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Maximize2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fileUrl: string | null;
  fileType?: 'pdf' | 'image' | 'auto';
  uploaderName?: string;
  uploadDate?: string;
}

export default function DocumentPreviewDrawer({
  isOpen,
  onClose,
  title = 'Pratinjau Dokumen Lampiran',
  fileUrl,
  fileType = 'auto',
  uploaderName,
  uploadDate,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen || !fileUrl) return null;

  // Deteksi tipe file
  const isPdf =
    fileType === 'pdf' ||
    fileUrl.toLowerCase().includes('.pdf') ||
    fileUrl.toLowerCase().includes('application/pdf');

  const isImage =
    fileType === 'image' ||
    /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(fileUrl) ||
    fileUrl.startsWith('data:image/');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Drawer Panel */}
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header Bar */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 truncate">
                {uploaderName ? `Diunggah oleh: ${uploaderName}` : 'Dokumen Terverifikasi STP'}
                {uploadDate ? ` • ${uploadDate}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Buka di Tab Baru"
            >
              <ExternalLink size={16} />
            </a>
            <a
              href={fileUrl}
              download
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Unduh File Asli"
            >
              <Download size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar Interaksi untuk Gambar */}
        {isImage && (
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-7 px-2 text-slate-700"
                title="Perbesar"
              >
                <ZoomIn size={14} className="mr-1" /> Zoom +
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-7 px-2 text-slate-700"
                title="Perkecil"
              >
                <ZoomOut size={14} className="mr-1" /> Zoom -
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="h-7 px-2 text-slate-700"
                title="Putar 90 Derajat"
              >
                <RotateCw size={14} className="mr-1" /> Putar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-slate-500"
              >
                Reset
              </Button>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-bold">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950/5 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {isPdf ? (
            <iframe
              src={fileUrl}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner"
              title="Pratinjau PDF"
            />
          ) : isImage ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4 custom-scrollbar">
              <img
                src={fileUrl}
                alt={title}
                onLoad={() => setIsLoading(false)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-md cursor-grab active:cursor-grabbing"
              />
            </div>
          ) : (
            <div className="text-center p-8 space-y-4">
              <FileText size={48} className="text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">
                Format Berkas Tidak Mendukung Pratinjau Langsung
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Berkas ini dapat Anda buka langsung di tab baru atau unduh ke perangkat lokal Anda.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink size={14} /> Buka Berkas
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="p-3 px-6 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            Dokumen terenkripsi & tersimpan aman di Cloud Storage UPTD Solo Technopark.
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs font-bold">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

