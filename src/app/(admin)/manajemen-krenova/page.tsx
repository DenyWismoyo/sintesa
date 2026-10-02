"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Video, Search, Loader2, X, RefreshCw, UploadCloud, Tag } from "lucide-react";
import { KrenovaContent } from "@/types";
import { krenovaService } from "@/services/krenova.service";
import { storageService } from "@/services/storage.service";
import { toast } from "sonner";
import { AdminPageHeader, AdminFilterBar } from "@/components/admin";

export default function ManajemenKrenovaPage() {
  const [contents, setContents] = useState<KrenovaContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  
  // Form State
  const [formData, setFormData] = useState<Partial<KrenovaContent>>({
    title: "",
    description: "",
    tags: [],
    videoUrl: "",
    thumbnailUrl: "",
    type: "teaser"
  });
  const [tagsInput, setTagsInput] = useState("");

  // File Upload State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Fetch Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await krenovaService.getContents();
      setContents(data);
    } catch (error) {
      console.error("Gagal memuat data KRENOVA:", error);
      toast.error("Gagal memuat data", { description: "Pastikan koneksi internet stabil." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleOpenModal = (content?: KrenovaContent) => {
    if (content) {
      setEditingId(content.id || null);
      setFormData(content);
      setTagsInput(content.tags?.join(", ") || "");
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        tags: [],
        videoUrl: "",
        thumbnailUrl: "",
        type: "teaser"
      });
      setTagsInput("");
    }
    setVideoFile(null);
    setThumbnailFile(null);
    setUploadStatus("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadStatus("Menyiapkan data...");
    
    try {
      let finalVideoUrl = formData.videoUrl || "";
      let finalThumbnailUrl = formData.thumbnailUrl || "";

      // 1. Upload Video jika ada file yang dipilih
      if (videoFile) {
        setUploadStatus("Mengunggah Video... (Ini mungkin memakan waktu)");
        finalVideoUrl = await storageService.uploadFile(videoFile, 'krenova/videos');
      } else if (!finalVideoUrl) {
         toast.error("Video Wajib Diisi", { description: "Pilih file video atau masukkan URL video." });
         setIsSubmitting(false);
         return;
      }

      // 2. Upload Thumbnail jika ada file yang dipilih
      if (thumbnailFile) {
        setUploadStatus("Mengunggah Thumbnail...");
        finalThumbnailUrl = await storageService.uploadFile(thumbnailFile, 'krenova/thumbnails');
      }

      setUploadStatus("Menyimpan ke database...");

      // Parse tags dari string comma-separated
      const parsedTags = tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag !== "");
      
      const payload = { 
        ...formData, 
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        tags: parsedTags 
      } as KrenovaContent;

      if (editingId) {
        await krenovaService.updateContent(editingId, payload);
        toast.success("Berhasil Update", { description: "Data video KRENOVA telah diperbarui." });
      } else {
        await krenovaService.addContent(payload);
        toast.success("Berhasil Ditambahkan", { description: "Video KRENOVA baru telah dipublikasikan." });
      }
      
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      toast.error("Gagal Menyimpan", { description: "Terjadi kesalahan saat mengunggah atau menyimpan data." });
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  const handleDelete = async (id: string, videoUrl?: string, thumbnailUrl?: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus konten ini? (File di storage mungkin perlu dihapus manual)")) {
      try {
        await krenovaService.deleteContent(id);
        
        // Opsional: Hapus file dari storage jika memungkinkan
        if (videoUrl?.includes('firebasestorage')) storageService.deleteFile(videoUrl);
        if (thumbnailUrl?.includes('firebasestorage')) storageService.deleteFile(thumbnailUrl);

        toast.success("Berhasil Dihapus", { description: "Konten telah ditarik dari peredaran." });
        await loadData();
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        toast.error("Gagal Menghapus", { description: "Sistem mengalami kendala." });
      }
    }
  };

  // Filter Data
  const filteredContents = contents.filter(c => {
    const matchQuery = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = typeFilter === "ALL" || c.type === typeFilter;
    return matchQuery && matchType;
  });

  return (
    <div className="w-full space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* STANDARDIZED HEADER */}
      <AdminPageHeader
        title="Manajemen KRENOVA"
        description="Kelola konten video pitching inovasi untuk kurator virtual Solo Technopark."
        badge={`${contents.length} Video`}
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'Krenova' }
        ]}
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadData}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="min-h-[40px] flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Tambah Video
            </button>
          </div>
        }
      />

      {/* STANDARDIZED FILTER BAR */}
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari judul, tag, atau deskripsi video..."
        filters={[
          {
            key: 'type',
            label: 'Tipe Video',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'Semua Tipe', value: 'ALL' },
              { label: 'Teaser', value: 'teaser' },
              { label: 'Pitching', value: 'pitching' },
              { label: 'Highlight', value: 'highlight' },
            ]
          }
        ]}
        activeCount={typeFilter !== 'ALL' ? 1 : 0}
        onReset={() => {
          setSearchQuery('');
          setTypeFilter('ALL');
        }}
      />

      {/* CONTENT GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-sm">Memuat data konten...</p>
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">Belum ada konten KRENOVA</h3>
          <p className="text-slate-500 text-sm">Klik tombol "Tambah Video" untuk mulai mengunggah data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContents.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col group">
              <div className="aspect-video bg-slate-100 relative overflow-hidden shrink-0">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Video className="w-8 h-8 opacity-50" />
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-[10px] font-black uppercase tracking-wider">
                  {item.type}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900 text-base line-clamp-1 mb-1.5 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">#{tag}</span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Permanent Action Bar (Touch-friendly 40px) */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenModal(item)} 
                      className="min-h-[38px] px-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => item.id && handleDelete(item.id, item.videoUrl, item.thumbnailUrl)} 
                      className="min-h-[38px] px-3 bg-red-50/50 hover:bg-red-50 text-rose-600 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM WITH UPLOAD FEATURE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Video KRENOVA" : "Tambah Video Baru"}
              </h2>
              <button onClick={handleCloseModal} disabled={isSubmitting} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="krenova-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1: Info Dasar */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Judul Konten <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" required
                      value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Contoh: Teaser KRENOVA 2026"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipe Konten <span className="text-rose-500">*</span></label>
                      <select 
                        value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="teaser">Teaser / Trailer</option>
                        <option value="mascot">Perkenalan Maskot</option>
                        <option value="rundown">Rundown / Jadwal</option>
                        <option value="guide">Panduan / Tutorial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Tags (Pisahkan koma)</label>
                      <input 
                        type="text"
                        value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="maskot, si ino, ai"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Deskripsi Singkat (Dibaca AI) <span className="text-rose-500">*</span></label>
                    <textarea 
                      required rows={3}
                      value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Jelaskan isi video ini agar AI Asisten mudah merekomendasikannya kepada pengunjung..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Section 2: Media Upload */}
                <div className="space-y-5">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-2">
                      <Video className="w-4 h-4" /> File Video <span className="text-rose-500">*</span>
                    </label>
                    
                    <input 
                      type="file" 
                      accept="video/mp4,video/webm"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer"
                    />
                    
                    <div className="relative">
                       <div className="absolute inset-0 flex items-center" aria-hidden="true">
                         <div className="w-full border-t border-indigo-200/60"></div>
                       </div>
                       <div className="relative flex justify-center">
                         <span className="bg-indigo-50/50 px-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">Atau Gunakan Link</span>
                       </div>
                    </div>

                    <input 
                      type="url"
                      value={formData.videoUrl} 
                      onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                      placeholder="https://... (Kosongkan jika upload file)"
                      className="w-full mt-3 px-4 py-2 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-slate-500" /> Cover Thumbnail
                    </label>
                    
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-500 mb-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 transition-all cursor-pointer"
                    />

                    <input 
                      type="url"
                      value={formData.thumbnailUrl} 
                      onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                      placeholder="URL Gambar... (Kosongkan jika upload file)"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
              
              <div className="text-sm font-medium text-indigo-600 flex-1 flex items-center gap-2">
                {isSubmitting && (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {uploadStatus}</>
                )}
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  form="krenova-form"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? "Memproses..." : "Simpan Konten"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}