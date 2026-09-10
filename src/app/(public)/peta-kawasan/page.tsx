'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Building2, MonitorPlay, Briefcase, Coffee,
  X, Navigation, Pencil, Plus, Trash2, ShieldAlert,
  ZoomIn, ZoomOut, Image as ImageIcon, Link as LinkIcon, Info, Box,
  Maximize2, Users, Maximize, CheckCircle2, ChevronRight, 
  Type, ArrowUpRight, MousePointer2, Move
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMap } from '@/hooks/useMap';
import { useAssets } from '@/hooks/useAssets';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

// --- HELPER ICONS & COLORS ---
const renderIcon = (iconType: string, className?: string) => {
  switch (iconType) {
    case 'building': return <Building2 className={className || "text-indigo-600 w-6 h-6"} />;
    case 'monitor': return <MonitorPlay className={className || "text-emerald-600 w-6 h-6"} />;
    case 'briefcase': return <Briefcase className={className || "text-orange-600 w-6 h-6"} />;
    case 'coffee': return <Coffee className={className || "text-pink-600 w-6 h-6"} />;
    default: return <MapPin className={className || "text-slate-600 w-6 h-6"} />;
  }
};

const COLOR_OPTIONS: { label: string; value: string; hex: string }[] = [
  { label: 'Emerald', value: 'bg-emerald-500', hex: '#10b981' },
  { label: 'Indigo', value: 'bg-indigo-500', hex: '#6366f1' },
  { label: 'Orange', value: 'bg-orange-500', hex: '#f97316' },
  { label: 'Pink', value: 'bg-pink-500', hex: '#ec4899' },
  { label: 'Blue', value: 'bg-blue-500', hex: '#3b82f6' },
  { label: 'Red', value: 'bg-red-500', hex: '#ef4444' },
];

const getHexColor = (bgClass: string) => COLOR_OPTIONS.find(c => c.value === bgClass)?.hex || '#6366f1';

const ICON_OPTIONS: { label: string; value: string }[] = [
  { label: 'Map Pin', value: 'default' },
  { label: 'Building', value: 'building' },
  { label: 'Monitor', value: 'monitor' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Coffee', value: 'coffee' },
];

// --- TYPE UNTUK DETAIL ANOTASI ---
export type DetailAnnotation = {
  id: string;
  type: 'pin' | 'text' | 'arrow';
  x: number;
  y: number;
  endX?: number; // Khusus Arrow
  endY?: number; // Khusus Arrow
  content: string;
  color: string;
};

export default function PetaKawasanPage() {
  const { mapSettings, hotspots, isLoading, addPoint, updatePoint, removePoint, uploadBaseMap, uploadDetailImage } = useMap();
  const { assets } = useAssets(); 
  
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  // --- STATE UI & MODE ---
  const [hasEntered, setHasEntered] = useState(false); 
  const [viewMode, setViewMode] = useState<'global' | 'detail'>('global');
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [selectedLocId, setSelectedLocId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [zoom, setZoom] = useState(1);
  const [hoveredLocId, setHoveredLocId] = useState<string | null>(null);

  // State khusus editor detail
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const detailImageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailImageInputRef = useRef<HTMLInputElement>(null);

  const selectedLoc = hotspots.find(loc => loc.id === selectedLocId);
  const linkedAssetData = selectedLoc?.linkedAssetId ? assets.find(a => a.id === selectedLoc?.linkedAssetId) : null;
  const categories = ['Semua', ...Array.from(new Set(hotspots.map(h => h.category)))];

  // Ekstrak anotasi dari data hotspot (Aman dari TS error dengan default fallback)
  const detailAnnotations: DetailAnnotation[] = (selectedLoc as any)?.detailAnnotations || [];

  // --- HANDLERS: PETA & ZOOM ---
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.4, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.4, 0.5));
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  // --- HANDLERS: EDIT HOTSPOT GLOBAL ---
  const handleDragEnd = async (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, id: string) => {
    if (!isEditMode || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    let newX = ((info.point.x - rect.left) / rect.width) * 100;
    let newY = ((info.point.y - rect.top) / rect.height) * 100;
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    await updatePoint(id, { x: newX, y: newY });
  };

  const handleAddLocation = async () => {
    const newId: any = await addPoint({
      title: 'Gedung Baru', category: 'Fasilitas Umum', description: 'Deskripsi...',
      icon: 'default', x: 50, y: 50, color: 'bg-indigo-600',
      detailAnnotations: [] // Inisialisasi
    } as any);
    
    if (newId) {
      if (typeof newId === 'string') setTimeout(() => setSelectedLocId(newId), 500);
      else if (newId.success && newId.id) setTimeout(() => setSelectedLocId(newId.id), 500);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (confirm('Hapus titik ini permanen?')) {
      await removePoint(id);
      setSelectedLocId(null);
    }
  };

  const handleUpdateField = (id: string, field: string, value: any) => {
    updatePoint(id, { [field]: value });
  };

  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedLocId) {
      const file = e.target.files[0];
      const url = await uploadDetailImage(file); 
      if (url && url.success) handleUpdateField(selectedLocId, 'detailImageUrl', url.url);
    }
  };

  // --- HANDLERS: EDITOR ANOTASI DETAIL ---
  const updateAnnotations = (newAnnotations: DetailAnnotation[]) => {
    if (selectedLocId) {
      handleUpdateField(selectedLocId, 'detailAnnotations', newAnnotations);
    }
  };

  const handleAddAnnotation = (type: 'pin' | 'text' | 'arrow') => {
    if (!selectedLocId) return;
    const newAnn: DetailAnnotation = {
      id: `ann_${Date.now()}`,
      type,
      x: 40, y: 40,
      content: type === 'text' ? 'Teks Baru' : type === 'pin' ? 'Ruang Baru' : '',
      color: 'bg-indigo-500',
      ...(type === 'arrow' ? { endX: 60, endY: 60 } : {})
    };
    updateAnnotations([...detailAnnotations, newAnn]);
    setActiveAnnotationId(newAnn.id);
  };

  const handleDragAnnotation = (id: string, info: PanInfo, pointType: 'start' | 'end' = 'start') => {
    if (!detailImageContainerRef.current) return;
    const rect = detailImageContainerRef.current.getBoundingClientRect();
    let newX = ((info.point.x - rect.left) / rect.width) * 100;
    let newY = ((info.point.y - rect.top) / rect.height) * 100;
    
    // Constraint ke area gambar
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    const updated = detailAnnotations.map(ann => {
      if (ann.id !== id) return ann;
      if (pointType === 'start') return { ...ann, x: newX, y: newY };
      return { ...ann, endX: newX, endY: newY };
    });
    updateAnnotations(updated);
  };

  const handleDeleteAnnotation = (id: string) => {
    updateAnnotations(detailAnnotations.filter(a => a.id !== id));
    setActiveAnnotationId(null);
  };

  const handleUpdateAnnotationField = (id: string, field: keyof DetailAnnotation, value: any) => {
    const updated = detailAnnotations.map(ann => ann.id === id ? { ...ann, [field]: value } : ann);
    updateAnnotations(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] w-full h-screen bg-[#F8FAFC] overflow-hidden relative font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- ELEGANT AMBIENT BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-200/40 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-sky-200/40 rounded-full blur-[150px] pointer-events-none" />
      </div>

      {/* --- WELCOME GATE OVERLAY --- */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div 
            initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }} transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-white/60 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="relative z-10 text-center flex flex-col items-center max-w-2xl px-6"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-white rounded-[2rem] flex items-center justify-center mb-8 border border-indigo-100/50 shadow-2xl shadow-indigo-500/10">
                <Box size={48} className="text-indigo-600" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">
                Kawasan <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">Virtual 3D</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl mb-12 leading-relaxed font-medium max-w-xl">
                Jelajahi fasilitas, ruangan, dan ekosistem terpadu secara imersif. Temukan informasi langsung dari peta interaktif.
              </p>
              
              <Button onClick={() => setHasEntered(true)} className="h-16 px-12 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-bold text-lg shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] group">
                Mulai Eksplorasi <ArrowLeft className="ml-4 w-6 h-6 rotate-180 transition-transform group-hover:translate-x-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER: TOP LEFT & RIGHT --- */}
      <div className="absolute top-0 left-0 right-0 z-40 p-6 flex justify-between items-start pointer-events-none">
        {/* Kiri: Back */}
        <div className="pointer-events-auto flex items-center gap-4">
          <Button onClick={() => viewMode === 'detail' ? setViewMode('global') : window.location.href = '/'} variant="outline" size="icon" className="rounded-2xl bg-white/70 backdrop-blur-xl border-white/50 hover:bg-white text-slate-700 w-14 h-14 shadow-lg shadow-slate-200/50 transition-all hover:-translate-y-1">
            <ArrowLeft size={24} />
          </Button>
          <div className="hidden md:flex flex-col">
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
               {viewMode === 'detail' && selectedLoc ? `Isolasi 3D: ${selectedLoc.title}` : 'Peta Digital'}
            </h1>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
               {viewMode === 'detail' ? 'Interactive Floorplan' : 'Interactive View'}
            </span>
          </div>
        </div>
        
        {/* Kanan: Info & Admin Tools */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {viewMode === 'detail' ? (
             <Button onClick={() => setViewMode('global')} className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/50 text-slate-900 hover:bg-slate-50 px-6 h-14 shadow-lg shadow-slate-200/50 font-bold transition-all hover:-translate-y-1">
               <ArrowLeft size={20} className="mr-3" /> Kembali ke Peta Global
             </Button>
          ) : (
            isSuperAdmin && (
              <Button 
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  if (isEditMode) setSelectedLocId(null);
                }} 
                className={`rounded-2xl h-14 px-6 text-sm font-bold uppercase tracking-widest transition-all shadow-lg hover:-translate-y-1 ${isEditMode ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20 border-transparent' : 'bg-white/90 backdrop-blur-xl text-indigo-600 hover:bg-white border-white/50 shadow-slate-200/50'}`}
              >
                {isEditMode ? 'Matikan Edit Mode' : <><ShieldAlert size={18} className="mr-2" /> Editor Peta</>}
              </Button>
            )
          )}

          {/* Floating Admin Toolbar (Kanan Bawah dari tombol) - HANYA DI MAP GLOBAL */}
          <AnimatePresence>
            {isEditMode && viewMode === 'global' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="origin-top-right bg-white/90 backdrop-blur-2xl border border-white/50 rounded-3xl p-5 flex flex-col gap-3 shadow-2xl shadow-indigo-900/10 w-64 mt-2">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center mb-1">Peralatan Admin</div>
                <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="w-full justify-start rounded-xl border-slate-200 text-slate-700 h-11 bg-white hover:bg-slate-50">
                  <ImageIcon size={16} className="mr-3 text-indigo-500" /> Ganti Base Map
                </Button>
                <input type="file" ref={fileInputRef} onChange={async (e) => { if(e.target.files?.[0]) await uploadBaseMap(e.target.files[0]) }} accept="image/*" className="hidden" />
                <Button onClick={handleAddLocation} size="sm" className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white w-full justify-start rounded-xl shadow-lg shadow-indigo-500/20 h-11">
                  <Plus size={16} className="mr-3" /> Tambah Pin Gedung
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- FLOATING BOTTOM DOCK: FILTERS & ZOOM --- */}
      {(!isEditMode || viewMode === 'detail') && (
        <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center pointer-events-none px-6">
          <div className="pointer-events-auto flex items-center gap-4 bg-white/70 backdrop-blur-2xl border border-white/50 p-2 rounded-[2rem] shadow-2xl shadow-slate-300/30">
            
            {/* Filter Pills (Hanya di Map Global) */}
            {viewMode === 'global' && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pl-2 pr-4 border-r border-slate-200">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                      activeFilter === cat 
                        ? 'bg-slate-900 text-white shadow-md scale-105' 
                        : 'text-slate-500 hover:bg-white/80 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className={`flex gap-2 ${viewMode === 'global' ? 'pr-2' : 'px-2'}`}>
              <Button onClick={handleZoomOut} variant="ghost" size="icon" className="rounded-full hover:bg-white/80 text-slate-700 w-12 h-12"><ZoomOut size={20} /></Button>
              <Button onClick={handleZoomIn} variant="ghost" size="icon" className="rounded-full hover:bg-white/80 text-slate-700 w-12 h-12"><ZoomIn size={20} /></Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAP CANVAS --- */}
      <div ref={mapContainerRef} className={`flex-1 w-full h-full relative z-10 ${isEditMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`} onWheel={handleWheel}>
        <AnimatePresence mode="wait">
          
          {/* ========================================= */}
          {/* TAMPILAN MAP GLOBAL */}
          {/* ========================================= */}
          {viewMode === 'global' && (
            <motion.div 
              key="global-map"
              initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: zoom, opacity: 1 }} exit={{ scale: 0.9, opacity: 0, filter: "blur(20px)" }}
              transition={{ type: "spring", stiffness: 150, damping: 25 }}
              drag={!isEditMode} dragConstraints={mapContainerRef} dragElastic={0.1}
              className="w-[150vw] h-[150vh] lg:w-[120vw] lg:h-[120vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center origin-center"
            >
              <div ref={imageContainerRef} className="relative w-full max-w-[1400px] aspect-[4/3]">
                {/* Image Map */}
                <img src={mapSettings?.baseImageUrl || "/image/kawasan.png"} alt="Peta Kawasan" className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-none mix-blend-darken" />

                {/* Hotspots */}
                {hotspots.map((loc) => {
                  const isVisible = activeFilter === 'Semua' || loc.category === activeFilter;
                  const isSelected = selectedLocId === loc.id;
                  const isHovered = hoveredLocId === loc.id;

                  return (
                    <motion.div
                      key={loc.id}
                      drag={isEditMode} dragMomentum={false} onDragEnd={(e, info) => handleDragEnd(e, info, loc.id!)}
                      onClick={() => isVisible && setSelectedLocId(loc.id!)}
                      onHoverStart={() => isVisible && setHoveredLocId(loc.id!)}
                      onHoverEnd={() => setHoveredLocId(null)}
                      initial={{ scale: 0 }} animate={{ scale: isVisible ? 1 : 0.5, opacity: isVisible ? 1 : 0.2, y: 0 }}
                      className={`absolute z-20 group transform -translate-x-1/2 -translate-y-full flex flex-col items-center ${isEditMode ? 'cursor-move' : (isVisible ? 'cursor-pointer' : 'cursor-default pointer-events-none')}`}
                      style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                      onPointerDownCapture={(e) => { if(isEditMode) e.stopPropagation(); }}
                    >
                      {/* Tooltip Hover */}
                      {!isEditMode && isVisible && (
                        <AnimatePresence>
                          {(isHovered || isSelected) && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.9 }}
                              className="absolute bottom-[110%] mb-2 pointer-events-none"
                            >
                              <div className="bg-slate-900/90 backdrop-blur-md text-white text-sm font-bold px-5 py-2.5 rounded-2xl whitespace-nowrap shadow-2xl border border-white/10 flex items-center gap-2">
                                {loc.title}
                                <ChevronRight size={14} className="text-slate-400" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                      
                      {/* Pin Design */}
                      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 
                        ${isSelected ? 'scale-110 z-30' : 'hover:scale-110 hover:-translate-y-1'}
                      `}>
                        <div className={`absolute inset-0 rounded-full ${loc.color} opacity-20 blur-md transition-opacity ${isSelected || isHovered ? 'opacity-50 blur-xl' : ''}`} />
                        <div className={`relative w-12 h-12 bg-white rounded-full border-2 flex items-center justify-center shadow-xl ${isSelected ? 'border-indigo-500' : 'border-white'}`}>
                          <div className={`w-9 h-9 rounded-full ${loc.color} flex items-center justify-center text-white shadow-inner bg-gradient-to-br from-white/20 to-transparent`}>
                            {renderIcon(loc.icon, "w-4 h-4 text-white")}
                          </div>
                        </div>

                        {isSelected && !isEditMode && (
                          <>
                            <span className={`absolute inset-0 rounded-full ${loc.color} opacity-30 animate-ping`} />
                            <span className={`absolute -inset-2 rounded-full border border-${loc.color.split('-')[1]}-500/50 animate-pulse`} />
                          </>
                        )}
                        
                        {isEditMode && <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ========================================= */}
          {/* TAMPILAN DETAIL (ISOLATED 3D & EDITOR ANOTASI) */}
          {/* ========================================= */}
          {viewMode === 'detail' && selectedLoc && (
            <motion.div 
              key="detail-map"
              initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }} animate={{ scale: zoom, opacity: 1, filter: "blur(0px)" }} exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              drag={!isEditMode} dragConstraints={mapContainerRef} dragElastic={0.1}
              className="w-[150vw] h-[150vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center origin-center bg-slate-100/50 backdrop-blur-3xl"
            >
               {selectedLoc.detailImageUrl ? (
                 <div ref={detailImageContainerRef} className="relative flex max-w-[80vw] max-h-[80vh] group">
                   <img src={selectedLoc.detailImageUrl} alt={selectedLoc.title} className="w-full h-full object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.2)] pointer-events-none mix-blend-darken" />
                   
                   {/* ================= OVERLAY ANOTASI (SVG ARROWS) ================= */}
                   <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                     <defs>
                       {COLOR_OPTIONS.map(c => (
                         <marker key={c.hex} id={`arrow-${c.hex.replace('#','')}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                           <polygon points="0 0, 10 3.5, 0 7" fill={c.hex} />
                         </marker>
                       ))}
                     </defs>
                     {detailAnnotations.filter(a => a.type === 'arrow').map(arr => (
                        <line 
                          key={`line-${arr.id}`}
                          x1={`${arr.x}%`} y1={`${arr.y}%`} 
                          x2={`${arr.endX}%`} y2={`${arr.endY}%`} 
                          stroke={getHexColor(arr.color)} strokeWidth="4" 
                          strokeLinecap="round"
                          strokeDasharray="8 8" // Tampilan putus-putus modern
                          markerEnd={`url(#arrow-${getHexColor(arr.color).replace('#','')})`}
                          className="drop-shadow-md transition-all duration-300"
                        />
                     ))}
                   </svg>

                   {/* ================= OVERLAY ANOTASI (PIN & TEXT & HANDLES) ================= */}
                   {detailAnnotations.map(ann => {
                     const isSelected = activeAnnotationId === ann.id;
                     
                     if (ann.type === 'arrow' && isEditMode) {
                       // Draggable Handles untuk Panah
                       return (
                         <React.Fragment key={ann.id}>
                           <motion.div
                             drag dragMomentum={false} onDragEnd={(e, info) => handleDragAnnotation(ann.id, info, 'start')}
                             onPointerDownCapture={(e) => { e.stopPropagation(); setActiveAnnotationId(ann.id); }}
                             className={`absolute z-30 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-move flex items-center justify-center ${isSelected ? 'ring-4 ring-indigo-500/50' : ''}`}
                             style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                           >
                             <div className={`w-4 h-4 rounded-full ${ann.color} border-2 border-white shadow-md`} />
                           </motion.div>
                           <motion.div
                             drag dragMomentum={false} onDragEnd={(e, info) => handleDragAnnotation(ann.id, info, 'end')}
                             onPointerDownCapture={(e) => { e.stopPropagation(); setActiveAnnotationId(ann.id); }}
                             className={`absolute z-30 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-move flex items-center justify-center ${isSelected ? 'ring-4 ring-indigo-500/50' : ''}`}
                             style={{ left: `${ann.endX}%`, top: `${ann.endY}%` }}
                           >
                             <div className={`w-4 h-4 rounded-full ${ann.color} border-2 border-white shadow-md`} />
                           </motion.div>
                         </React.Fragment>
                       );
                     }

                     if (ann.type === 'text') {
                        return (
                          <motion.div
                            key={ann.id}
                            drag={isEditMode} dragMomentum={false} onDragEnd={(e, info) => handleDragAnnotation(ann.id, info, 'start')}
                            onPointerDownCapture={(e) => { if(isEditMode) e.stopPropagation(); setActiveAnnotationId(ann.id); }}
                            className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 ${isEditMode ? 'cursor-move' : 'pointer-events-none'}`}
                            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                          >
                            <div className={`px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg border border-white/20 font-black text-sm whitespace-nowrap transition-all
                              ${ann.color} text-white
                              ${isSelected && isEditMode ? 'ring-4 ring-white/50 scale-105' : ''}
                            `}>
                              {ann.content}
                            </div>
                            {isSelected && isEditMode && <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />}
                          </motion.div>
                        );
                     }

                     if (ann.type === 'pin') {
                       return (
                         <motion.div
                            key={ann.id}
                            drag={isEditMode} dragMomentum={false} onDragEnd={(e, info) => handleDragAnnotation(ann.id, info, 'start')}
                            onPointerDownCapture={(e) => { if(isEditMode) e.stopPropagation(); setActiveAnnotationId(ann.id); }}
                            className={`absolute z-20 group transform -translate-x-1/2 -translate-y-1/2 ${isEditMode ? 'cursor-move' : 'cursor-help'}`}
                            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                         >
                            {/* Tooltip (Muncul saat hover di mode publik) */}
                            {!isEditMode && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none">
                                <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap shadow-xl border border-white/10">
                                  {ann.content}
                                </div>
                              </div>
                            )}
                            
                            <div className={`relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all ${ann.color} ${isSelected && isEditMode ? 'ring-4 ring-white/50 scale-110' : 'hover:scale-110'}`}>
                              <MapPin size={14} className="text-white drop-shadow-sm" />
                            </div>
                         </motion.div>
                       )
                     }
                     return null;
                   })}

                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center bg-white/50 backdrop-blur-xl p-20 rounded-[3rem] border border-white shadow-2xl">
                    {renderIcon(selectedLoc.icon, "w-32 h-32 text-slate-300 mb-8")}
                    <p className="text-slate-500 font-bold text-xl">Model 3D belum tersedia</p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================= */}
      {/* --- PUBLIC VIEW: ELEGANT CENTERED MODAL (GLOBAL ONLY) --- */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedLoc && !isEditMode && viewMode === 'global' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            {/* Backdrop Layer */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedLocId(null)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm pointer-events-auto"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Tutup Button */}
              <button onClick={() => setSelectedLocId(null)} className="absolute top-5 right-5 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-20">
                <X size={18} strokeWidth={3} />
              </button>

              {/* Header Image Area */}
              <div className="relative h-56 sm:h-64 bg-slate-100 shrink-0 w-full overflow-hidden">
                {linkedAssetData?.imageUrl ? (
                  <img src={linkedAssetData.imageUrl} alt={linkedAssetData.name} className="w-full h-full object-cover" />
                ) : selectedLoc.detailImageUrl ? (
                  <img src={selectedLoc.detailImageUrl} alt="Detail" className="w-full h-full object-cover scale-110 opacity-60 mix-blend-multiply" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center">
                     {renderIcon(selectedLoc.icon, "w-24 h-24 text-indigo-200")}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                
                {/* Title Overlay */}
                <div className="absolute bottom-6 left-8 right-8 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                      {selectedLoc.category}
                    </span>
                    {linkedAssetData && (
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border border-white/30
                        ${linkedAssetData.status === 'Tersedia' ? 'bg-emerald-500/80' : linkedAssetData.status === 'Disewa' ? 'bg-rose-500/80' : 'bg-orange-500/80'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {linkedAssetData.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none drop-shadow-lg">
                    {linkedAssetData ? linkedAssetData.name : selectedLoc.title}
                  </h2>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex flex-col">
                <p className="text-slate-600 text-base leading-relaxed mb-8 font-medium">
                  {selectedLoc.description || linkedAssetData?.description || "Deskripsi lokasi belum tersedia. Jelajahi fasilitas ini untuk informasi lebih lanjut."}
                </p>

                {linkedAssetData && (
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                        <Users size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block mb-0.5">Kapasitas</span>
                        <span className="text-slate-900 font-bold text-sm">{linkedAssetData.capacity || '-'} Org</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                        <Maximize size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block mb-0.5">Dimensi Luas</span>
                        <span className="text-slate-900 font-bold text-sm">{linkedAssetData.dimensions || '-'}</span>
                      </div>
                    </div>

                    {linkedAssetData.facilities && (
                      <div className="col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 block mb-2">Fasilitas Utama</span>
                        <div className="flex flex-wrap gap-2">
                          {String(linkedAssetData.facilities).split(',').map((fac: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                              <CheckCircle2 size={12} className="text-emerald-500" /> {fac.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  {selectedLoc.detailImageUrl && (
                     <Button onClick={() => setViewMode('detail')} variant="outline" className="flex-1 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-bold h-14 transition-all group">
                       <Box className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" /> Mode Isolasi 3D
                     </Button>
                  )}
                  {linkedAssetData ? (
                    <Button asChild className="flex-1 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-14 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-1">
                      <Link href={`/fasilitas/${linkedAssetData.id}`}>
                        Cek & Booking <ArrowLeft className="ml-2 w-5 h-5 rotate-180" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 rounded-2xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-14 shadow-sm transition-all">
                      Info Lanjut <Info className="ml-2 w-5 h-5 text-slate-400" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* --- ADMIN VIEW: FLOATING EDIT PANEL (Kanan) --- */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedLoc && isEditMode && (
          <motion.div
            key="edit-panel"
            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-24 right-6 w-[380px] max-h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar z-[250] bg-white/95 backdrop-blur-2xl border border-white rounded-[2rem] shadow-2xl flex flex-col"
          >
            {/* PANEL HEADER */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl"><Pencil size={18} className="text-indigo-600" /></div>
                <h3 className="text-lg font-black text-slate-900">
                  {viewMode === 'global' ? 'Edit Pin Utama' : 'Editor Isolasi 3D'}
                </h3>
              </div>
              <button onClick={() => {
                 if (viewMode === 'detail') setViewMode('global'); 
                 else setSelectedLocId(null);
                 setActiveAnnotationId(null);
              }} className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              
              {/* ===================================== */}
              {/* MODE GLOBAL: EDIT PROPERTI PIN UTAMA */}
              {/* ===================================== */}
              {viewMode === 'global' && (
                <>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <LinkIcon size={14} className="text-indigo-500"/> Sinkronisasi Database Aset
                    </label>
                    <select value={selectedLoc.linkedAssetId || ''} onChange={(e) => handleUpdateField(selectedLoc.id!, 'linkedAssetId', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 font-bold outline-none">
                      <option value="">-- Hanya Dekoratif (Tanpa Aset) --</option>
                      {assets?.map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Box size={14} className="text-pink-500" /> Gambar Model 3D (Isolasi)
                    </label>
                    <div className="flex gap-2">
                       <input type="text" placeholder="URL Gambar PNG Transparan" value={selectedLoc.detailImageUrl || ''} onChange={(e) => handleUpdateField(selectedLoc.id!, 'detailImageUrl', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 font-medium outline-none" />
                       <Button onClick={() => detailImageInputRef.current?.click()} size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0 h-[46px] w-[46px] rounded-xl text-white shadow-md"><ImageIcon size={18}/></Button>
                       <input type="file" ref={detailImageInputRef} onChange={handleDetailImageUpload} accept="image/*" className="hidden" />
                    </div>
                    {selectedLoc.detailImageUrl && (
                      <Button onClick={() => setViewMode('detail')} className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 shadow-lg shadow-slate-900/20 font-bold">
                        Buka Editor 3D Detail <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Label</label>
                    <input type="text" value={selectedLoc.title} onChange={(e) => handleUpdateField(selectedLoc.id!, 'title', e.target.value)} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
                      <input type="text" value={selectedLoc.category} onChange={(e) => handleUpdateField(selectedLoc.id!, 'category', e.target.value)} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Warna Pin</label>
                      <select value={selectedLoc.color} onChange={(e) => handleUpdateField(selectedLoc.id!, 'color', e.target.value)} className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                        {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ikon Pin</label>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {ICON_OPTIONS.map(iconOpt => (
                        <button key={iconOpt.value} onClick={() => handleUpdateField(selectedLoc.id!, 'icon', iconOpt.value)} className={`h-12 bg-slate-50 border rounded-xl flex items-center justify-center transition-all ${selectedLoc.icon === iconOpt.value ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-200 hover:border-indigo-300'}`}>
                           {renderIcon(iconOpt.value, selectedLoc.icon === iconOpt.value ? "w-5 h-5 text-indigo-600" : "w-5 h-5 text-slate-400")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <Button variant="destructive" onClick={() => handleDeleteLocation(selectedLoc.id!)} className="w-full rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 h-12 transition-colors font-bold shadow-none">
                      <Trash2 size={16} className="mr-2" /> Hapus Pin Permanen
                    </Button>
                  </div>
                </>
              )}

              {/* ===================================== */}
              {/* MODE DETAIL: EDITOR ANOTASI (TEKS, PIN, PANAH) */}
              {/* ===================================== */}
              {viewMode === 'detail' && (
                <>
                  {/* Toolbar Tambah Anotasi */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    <Button onClick={() => handleAddAnnotation('pin')} variant="ghost" className="h-16 flex-col gap-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                      <MapPin size={20} /> <span className="text-[10px] font-bold">Ruangan</span>
                    </Button>
                    <Button onClick={() => handleAddAnnotation('text')} variant="ghost" className="h-16 flex-col gap-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border-x border-slate-200">
                      <Type size={20} /> <span className="text-[10px] font-bold">Teks</span>
                    </Button>
                    <Button onClick={() => handleAddAnnotation('arrow')} variant="ghost" className="h-16 flex-col gap-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                      <ArrowUpRight size={20} /> <span className="text-[10px] font-bold">Panah</span>
                    </Button>
                  </div>

                  <div className="border-t border-slate-100 my-2" />

                  {/* Properties Editor jika ada anotasi yang dipilih */}
                  {activeAnnotationId ? (
                    (() => {
                      const ann = detailAnnotations.find(a => a.id === activeAnnotationId);
                      if (!ann) return <p className="text-center text-sm text-slate-500">Pilih elemen di kanvas untuk diedit</p>;

                      return (
                        <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-2 mb-2">
                             {ann.type === 'pin' && <MapPin size={16} className="text-indigo-500" />}
                             {ann.type === 'text' && <Type size={16} className="text-indigo-500" />}
                             {ann.type === 'arrow' && <ArrowUpRight size={16} className="text-indigo-500" />}
                             <span className="text-sm font-black text-slate-900 uppercase">Properti {ann.type}</span>
                          </div>

                          {ann.type !== 'arrow' && (
                            <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Konten / Nama</label>
                              <input 
                                type="text" value={ann.content} 
                                onChange={(e) => handleUpdateAnnotationField(ann.id, 'content', e.target.value)} 
                                className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Warna</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {COLOR_OPTIONS.map(c => (
                                <button 
                                  key={c.value} onClick={() => handleUpdateAnnotationField(ann.id, 'color', c.value)} 
                                  className={`w-10 h-10 rounded-full border-4 transition-all ${ann.color === c.value ? 'border-indigo-200 scale-110 shadow-md' : 'border-white hover:scale-110'}`}
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                            </div>
                          </div>

                          <Button onClick={() => handleDeleteAnnotation(ann.id)} variant="destructive" className="mt-4 w-full rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 h-11 transition-colors font-bold shadow-none">
                            <Trash2 size={16} className="mr-2" /> Hapus Elemen Ini
                          </Button>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                      <MousePointer2 size={32} className="text-slate-300 mb-3" />
                      <p className="text-slate-500 font-bold text-sm">Pilih atau Tambah elemen di kanvas untuk mulai mengedit</p>
                    </div>
                  )}
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="absolute inset-0 z-[500] bg-white/50 backdrop-blur-md flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin shadow-xl" />
        </div>
      )}
    </div>
  );
}

// Tambahan komponen arrow right untuk icon button
function ArrowRight(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
}