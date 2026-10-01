'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArticles } from '@/hooks/useArticles';
import { useCatalog } from '@/hooks/useCatalog';
import { useTraining } from '@/hooks/useTraining';
import { useAssets } from '@/hooks/useAssets';
import { Article, ArticleCategory, ArticleCtaType } from '@/types';
import { slugify } from '@/services/article.service';
import { storageService } from '@/services/storage.service';
import ArticleImagePickerModal, { SelectedMasterImage } from '@/components/admin/ArticleImagePickerModal';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { toast } from 'sonner';
import { 
  Newspaper, Plus, Search, Edit3, Trash2, ExternalLink, Eye, 
  Clock, Calendar, User, Tag, Sparkles, CheckCircle2, 
  X, Image as ImageIcon, ArrowUpRight, MessageCircle, 
  GraduationCap, Store, Building2, Link as LinkIcon, AlertCircle, 
  FileText, ShieldCheck, UploadCloud, FileCode, Heading2, Heading3, 
  Bold, Italic, List, CheckSquare, Code, Quote, Table as TableIcon, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const CATEGORIES: ArticleCategory[] = [
  'Panduan Pelatihan',
  'Berita & Event',
  'Inovasi & Teknologi',
  'Fasilitas & Bisnis',
  'Profil Tenant',
  'Umum',
];

const CTA_TYPES: { value: ArticleCtaType; label: string; icon: any }[] = [
  { value: 'NONE', label: 'Tanpa CTA', icon: X },
  { value: 'TRAINING', label: 'Program Pelatihan', icon: GraduationCap },
  { value: 'CATALOG', label: 'Katalog Produk / Jasa', icon: Store },
  { value: 'FACILITY', label: 'Fasilitas & Ruangan', icon: Building2 },
  { value: 'WHATSAPP', label: 'Konsultasi WhatsApp', icon: MessageCircle },
  { value: 'CUSTOM', label: 'Tautan Kustom', icon: LinkIcon },
];

export default function ManajemenArtikelPage() {
  const { articles, loading, addArticle, updateArticle, deleteArticle, isSubmitting } = useArticles();
  
  // Data pelengkap untuk auto-picker Smart CTA
  const { products: catalogProducts } = useCatalog();
  const { trainings } = useTraining();
  const { assets } = useAssets();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Image & Markdown Tools State
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [markdownViewMode, setMarkdownViewMode] = useState<'WRITE' | 'PREVIEW'>('WRITE');

  // Form State
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    slug: '',
    category: 'Panduan Pelatihan',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    authorName: 'Humas Solo Technopark',
    authorRole: 'Tim Redaksi & Edukasi',
    authorAvatarUrl: '',
    readTimeMins: 3,
    isPublished: true,
    isFeatured: false,
    tags: [],
    cta: {
      type: 'NONE',
      title: '',
      description: '',
      buttonText: 'Pelajari Selengkapnya',
      targetId: '',
      targetUrl: '',
      targetBadge: '',
      priceDisplay: '',
    }
  });

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'Semua' || art.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || 
                          (selectedStatus === 'PUBLISHED' && art.isPublished) ||
                          (selectedStatus === 'DRAFT' && !art.isPublished);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [articles, searchTerm, selectedCategory, selectedStatus]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter(a => a.isPublished).length;
    const drafts = total - published;
    const views = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
    return { total, published, drafts, views };
  }, [articles]);

  const handleOpenModal = (article?: Article) => {
    if (article) {
      setEditingId(article.id || null);
      setFormData({
        ...article,
        cta: article.cta || {
          type: 'NONE',
          title: '',
          description: '',
          buttonText: 'Pelajari Selengkapnya',
          targetId: '',
          targetUrl: '',
          targetBadge: '',
          priceDisplay: '',
        }
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        slug: '',
        category: 'Panduan Pelatihan',
        excerpt: '',
        content: '',
        coverImageUrl: '',
        authorName: 'Humas Solo Technopark',
        authorRole: 'Tim Redaksi & Edukasi',
        authorAvatarUrl: '',
        readTimeMins: 3,
        isPublished: true,
        isFeatured: false,
        tags: ['Solo Technopark', 'Edukasi'],
        cta: {
          type: 'NONE',
          title: '',
          description: '',
          buttonText: 'Pelajari Selengkapnya',
          targetId: '',
          targetUrl: '',
          targetBadge: '',
          priceDisplay: '',
        }
      });
    }
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: prev.slug && editingId ? prev.slug : slugify(val)
    }));
  };

  // Upload Cover Image langsung ke Firebase Storage (dengan kompresi klien otomatis)
  const handleUploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const url = await storageService.uploadImage(file, 'articles');
      setFormData(prev => ({ ...prev, coverImageUrl: url }));
      toast.success("Foto Sampul Berhasil Diunggah", {
        description: "Gambar telah dikompres otomatis dan disimpan ke storage."
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal Mengunggah Gambar", { description: err.message || "Terjadi kesalahan saat upload." });
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Pilih Gambar dari Master Data (Pelatihan / Fasilitas / Katalog)
  const handleSelectMasterImage = (selected: SelectedMasterImage) => {
    setFormData(prev => {
      const updates: Partial<Article> = {
        ...prev,
        coverImageUrl: selected.url,
      };

      // Jika CTA belum diatur, otomatis tautkan Smart CTA ke item tersebut
      if (!prev.cta || prev.cta.type === 'NONE') {
        updates.cta = {
          type: selected.sourceType,
          targetId: selected.sourceId,
          targetUrl: selected.targetUrl,
          targetBadge: selected.targetBadge,
          title: selected.sourceType === 'TRAINING' 
            ? `Tertarik Mengikuti Pelatihan ${selected.sourceTitle}?`
            : selected.sourceType === 'CATALOG'
            ? `Butuh Produk / Layanan ${selected.sourceTitle}?`
            : `Reservasi Fasilitas ${selected.sourceTitle}`,
          description: selected.suggestedDescription || 'Pelajari detail lengkap dan lakukan pendaftaran atau reservasi sekarang.',
          buttonText: selected.sourceType === 'TRAINING' ? 'Daftar Pelatihan' : selected.sourceType === 'CATALOG' ? 'Buka E-Katalog' : 'Cek Fasilitas'
        };
      }

      return updates;
    });

    toast.success("Gambar Master Data Dipilih", {
      description: `Gambar ${selected.sourceTitle} berhasil diintegrasikan.`
    });
  };

  // Import File .md (Markdown Reader)
  const handleImportMarkdownFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');

      // 1. Ekstrak H1 (# Judul) jika field judul form masih kosong atau default
      const h1Line = lines.find(l => l.trim().startsWith('# '));
      if (h1Line && (!formData.title || formData.title.trim() === '')) {
        const extractedTitle = h1Line.replace(/^#\s+/, '').trim();
        handleTitleChange(extractedTitle);
      }

      // 2. Ekstrak excerpt jika belum diisi
      if (!formData.excerpt) {
        const nonHeadings = lines.filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('!['))[0];
        if (nonHeadings) {
          setFormData(prev => ({ ...prev, excerpt: nonHeadings.substring(0, 160) }));
        }
      }

      // 3. Estimasi waktu baca
      const wordCount = text.trim().split(/\s+/).length;
      const estimatedMins = Math.max(1, Math.ceil(wordCount / 200));

      setFormData(prev => ({
        ...prev,
        content: text,
        readTimeMins: estimatedMins,
      }));

      toast.success("File Markdown Berhasil Diimpor", {
        description: `Memuat ${lines.length} baris dokumen. Siap dipratinjau & disimpan.`
      });
    };

    reader.onerror = () => {
      toast.error("Gagal Membaca File Markdown");
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper Quick Markdown Insert
  const insertMarkdownSnippet = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      content: (prev.content ? prev.content + '\n' : '') + snippet
    }));
  };

  // Helper Saat Mengubah Smart CTA Preset
  const handleCtaTypeChange = (newType: ArticleCtaType) => {
    setFormData(prev => {
      let defaultTitle = '';
      let defaultDesc = '';
      let defaultBtn = 'Pelajari Selengkapnya';
      let defaultUrl = '';

      if (newType === 'TRAINING') {
        defaultTitle = 'Tertarik Mengikuti Pelatihan Ini?';
        defaultDesc = 'Daftarkan diri Anda sekarang untuk menguasai kompetensi industri berstandar nasional di Solo Technopark.';
        defaultBtn = 'Lihat Program Pelatihan';
        defaultUrl = '/program-pelatihan';
      } else if (newType === 'CATALOG') {
        defaultTitle = 'Butuh Layanan atau Produk Ini?';
        defaultDesc = 'Dapatkan penawaran resmi dari unit layanan teknologi dan manufaktur Solo Technopark.';
        defaultBtn = 'Buka Katalog Layanan';
        defaultUrl = '/e-katalog';
      } else if (newType === 'FACILITY') {
        defaultTitle = 'Ingin Menggunakan Fasilitas Ini?';
        defaultDesc = 'Cek ketersediaan ruangan, lab, dan coworking space untuk agenda bisnis atau workshop Anda.';
        defaultBtn = 'Reservasi Fasilitas';
        defaultUrl = '/fasilitas';
      } else if (newType === 'WHATSAPP') {
        defaultTitle = 'Konsultasi Langsung dengan Customer Care STP';
        defaultDesc = 'Punya pertanyaan seputar kurikulum, jadwal, atau kemitraan? Hubungi tim kami via WhatsApp.';
        defaultBtn = 'Chat WhatsApp Resmi';
        defaultUrl = 'https://wa.me/6281234567890';
      }

      return {
        ...prev,
        cta: {
          ...prev.cta,
          type: newType,
          title: prev.cta?.title || defaultTitle,
          description: prev.cta?.description || defaultDesc,
          buttonText: prev.cta?.buttonText || defaultBtn,
          targetUrl: prev.cta?.targetUrl || defaultUrl,
        }
      };
    });
  };

  // Quick autofill when selecting target item
  const handleSelectCtaTarget = (targetType: ArticleCtaType, targetId: string) => {
    if (targetType === 'TRAINING') {
      const selected = trainings.find((t: any) => t.id === targetId);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          cta: {
            ...prev.cta,
            type: 'TRAINING',
            targetId: selected.id,
            targetUrl: `/program-pelatihan/${selected.id}`,
            title: `Ikuti Program: ${selected.title}`,
            description: selected.description ? `${selected.description.substring(0, 110)}...` : 'Pelatihan resmi berstandar industri Solo Technopark.',
            buttonText: 'Daftar Kelas Sekarang',
            targetBadge: selected.certificationType ? `Sertifikasi ${selected.certificationType}` : selected.level,
            priceDisplay: selected.isFree ? 'Gratis' : `Rp ${selected.price.toLocaleString('id-ID')}`
          }
        }));
      }
    } else if (targetType === 'CATALOG') {
      const selected = catalogProducts.find(p => p.id === targetId);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          cta: {
            ...prev.cta,
            type: 'CATALOG',
            targetId: selected.id,
            targetUrl: `/e-katalog/${selected.id}`,
            title: `Pesan Layanan: ${selected.name}`,
            description: selected.shortDescription || 'Layanan teknologi terapan berkualitas di Solo Technopark.',
            buttonText: 'Lihat Detail & Spesifikasi',
            targetBadge: selected.category,
            priceDisplay: selected.price ? `Rp ${selected.price.toLocaleString('id-ID')}` : undefined
          }
        }));
      }
    } else if (targetType === 'FACILITY') {
      const selected = assets.find(a => a.id === targetId);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          cta: {
            ...prev.cta,
            type: 'FACILITY',
            targetId: selected.id,
            targetUrl: `/fasilitas`,
            title: `Sewa Ruangan: ${selected.name}`,
            description: selected.description ? `${selected.description.substring(0, 110)}...` : `Fasilitas representatif di kawasan Solo Technopark (${selected.location}).`,
            buttonText: 'Cek Jadwal & Pesan',
            targetBadge: selected.category,
            priceDisplay: selected.priceValue ? `Rp ${Number(selected.priceValue).toLocaleString('id-ID')}` : undefined
          }
        }));
      }
    }
  };

  const updateCta = (patch: Partial<NonNullable<Article['cta']>>) => {
    setFormData(prev => ({
      ...prev,
      cta: {
        type: prev.cta?.type || 'NONE',
        title: prev.cta?.title || '',
        description: prev.cta?.description || '',
        buttonText: prev.cta?.buttonText || 'Pelajari Selengkapnya',
        targetId: prev.cta?.targetId || '',
        targetUrl: prev.cta?.targetUrl || '',
        targetBadge: prev.cta?.targetBadge || '',
        priceDisplay: prev.cta?.priceDisplay || '',
        ...patch,
      }
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !formData.tags?.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !formData.content) {
      alert("Harap lengkapi judul, ringkasan, dan isi artikel!");
      return;
    }

    try {
      if (editingId) {
        await updateArticle({ id: editingId, data: formData });
      } else {
        await addArticle(formData as Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArticle(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Newspaper size={20} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Artikel & Warta</h1>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Kelola publikasi berita kawasan, warta inovasi, dan panduan program pelatihan dengan Smart CTA terpadu.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link 
            href="/artikel" 
            target="_blank" 
            className="h-11 px-4 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink size={14} /> Preview Publik
          </Link>
          <Button 
            onClick={() => handleOpenModal()} 
            className="h-11 px-5 rounded-full bg-slate-900 hover:bg-amber-500 hover:shadow-amber-500/20 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> Tulis Artikel Baru
          </Button>
        </div>
      </div>

      {/* 2. Statistik Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Artikel</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Tayang (Published)</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.published}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Draf Simpanan</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.drafts}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Total Pembaca</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-600">{stats.views.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan judul, kategori, atau penulis..."
            className="pl-10 h-11 bg-slate-50 border-0 rounded-full text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-4 bg-slate-50 rounded-full text-xs font-bold text-slate-700 border-0 outline-none cursor-pointer"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="h-11 px-4 bg-slate-50 rounded-full text-xs font-bold text-slate-700 border-0 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PUBLISHED">Tayang (Published)</option>
            <option value="DRAFT">Draf (Draft)</option>
          </select>
        </div>
      </div>

      {/* 4. Daftar Artikel (Card Grid Modern & Borderless) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Memuat daftar artikel...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <Newspaper size={44} className="mx-auto opacity-30 text-slate-400" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Artikel</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Tidak ada artikel yang cocok dengan filter pencarian.' : 'Mulai publikasikan warta atau panduan pertama Anda untuk menarik customer.'}
          </p>
          <Button onClick={() => handleOpenModal()} className="rounded-full px-5 h-10 text-xs bg-slate-900 text-white font-bold">
            <Plus size={14} className="mr-1.5" /> Buat Artikel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredArticles.map(article => {
            const hasCta = article.cta && article.cta.type !== 'NONE';
            return (
              <div 
                key={article.id} 
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Thumbnail Header */}
                <div className="h-44 bg-slate-100 relative overflow-hidden shrink-0">
                  {article.coverImageUrl ? (
                    <img 
                      src={article.coverImageUrl} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                      <ImageIcon size={36} className="opacity-40 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Solo Technopark</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <Badge className="bg-white/95 text-slate-800 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border-0 shadow-xs">
                      {article.category}
                    </Badge>
                    <Badge className={article.isPublished ? 'bg-emerald-600 text-white text-[10px] font-bold border-0' : 'bg-amber-500 text-white text-[10px] font-bold border-0'}>
                      {article.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] font-bold flex items-center gap-1">
                    <Clock size={11} /> {article.readTimeMins} mnt baca
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4 font-normal flex-1">
                    {article.excerpt}
                  </p>

                  {/* Smart CTA Indicator */}
                  {hasCta && (
                    <div className="mb-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Sparkles size={14} className="text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-900 truncate text-[11px]">
                          CTA: {article.cta?.buttonText || article.cta?.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest shrink-0">
                        {article.cta?.type}
                      </span>
                    </div>
                  )}

                  {/* Footer Meta & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 font-medium text-[11px]">
                      <span className="flex items-center gap-1"><Eye size={12}/> {article.viewCount || 0}</span>
                      <span>•</span>
                      <span>{article.authorName.split(' ')[0]}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link 
                        href={`/artikel/${article.id}`} 
                        target="_blank"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Lihat Tampilan Publik"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button 
                        onClick={() => handleOpenModal(article)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Edit Artikel"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(article.id || null)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Artikel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL FORM EDITOR ARTIKEL & SMART CTA */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full sm:max-w-[850px] p-0 overflow-hidden bg-white sm:rounded-3xl border-0 shadow-2xl max-h-[92vh] flex flex-col focus:outline-none">
          <DialogTitle className="sr-only">Editor Artikel Solo Technopark</DialogTitle>
          
          {/* Header Dialog */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Newspaper size={18} />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {editingId ? 'Edit Artikel' : 'Tulis Artikel & Warta Baru'}
                </h2>
                <p className="text-xs text-slate-500 font-normal">Buat artikel edukatif dan tautkan Smart CTA ke layanan Anda.</p>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 no-scrollbar">
            
            {/* Bagian 1: Judul & Slug */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Artikel <span className="text-rose-500">*</span></label>
                <Input 
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Contoh: Mengapa Pelatihan Pengelasan FCAW Sangat Dibutuhkan Industri Maritim?"
                  className="h-11 rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Artikel</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Slug URL</label>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                    placeholder="slug-otomatis-dari-judul"
                    className="h-11 rounded-xl text-xs font-mono text-slate-600 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Gambar Cover & Meta Penulis */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <label className="text-xs font-bold text-slate-700">URL Gambar Sampul (Cover Image)</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsImagePickerOpen(true)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Sparkles size={12} className="text-amber-600" />
                      Pilih dari Master Data STP
                    </button>
                    <label className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                      {isUploadingImage ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-amber-600" />
                          <span>Mengompres & Upload...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={12} />
                          <span>Upload Foto</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUploadCoverImage} 
                        disabled={isUploadingImage}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
                <Input 
                  value={formData.coverImageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                  placeholder="https://... atau klik tombol di atas untuk upload / pilih master data"
                  className="h-10 rounded-xl text-xs bg-white"
                />

                {/* Pratinjau Thumbnail Gambar */}
                {formData.coverImageUrl && (
                  <div className="mt-2.5 relative rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center group shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={formData.coverImageUrl} 
                      alt="Pratinjau Cover" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setIsImagePickerOpen(true)}
                        className="bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs"
                      >
                        Ganti Gambar
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Waktu Baca (Menit)</label>
                <Input 
                  type="number"
                  min={1}
                  max={60}
                  value={formData.readTimeMins || 3}
                  onChange={(e) => setFormData(prev => ({ ...prev, readTimeMins: parseInt(e.target.value) || 3 }))}
                  className="h-10 rounded-xl text-xs bg-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Penulis</label>
                <Input 
                  value={formData.authorName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  placeholder="Humas Solo Technopark"
                  className="h-10 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Peran / Jabatan Penulis</label>
                <Input 
                  value={formData.authorRole || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorRole: e.target.value }))}
                  placeholder="Tim Akademik & Edukasi"
                  className="h-10 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status Publikasi</label>
                <div className="flex items-center gap-2 h-10">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isPublished} 
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700">
                    {formData.isPublished ? 'Tayang (Published)' : 'Simpan Draf'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian 3: Excerpt / Ringkasan Singkat */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ringkasan / Excerpt Singkat <span className="text-rose-500">*</span></label>
              <Textarea 
                required
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Tulis 1-2 kalimat ringkasan yang menarik untuk cuplikan kartu dan hasil pencarian..."
                className="rounded-xl text-xs font-medium"
              />
            </div>

            {/* Bagian 4: Isi Konten Artikel (.md / Markdown) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">Isi Konten Artikel (.md / Markdown) <span className="text-rose-500">*</span></label>
                  
                  {/* Mode Tabs: Edit vs Preview */}
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMarkdownViewMode('WRITE')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        markdownViewMode === 'WRITE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ✍️ Tulis Teks
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarkdownViewMode('PREVIEW')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        markdownViewMode === 'PREVIEW' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👁️ Pratinjau GitHub (.md)
                    </button>
                  </div>
                </div>

                {/* Import File .md Button */}
                <label className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <FileCode size={13} className="text-indigo-600" />
                  Import File .md / Dokumen
                  <input 
                    type="file" 
                    accept=".md,.markdown,text/markdown,text/plain" 
                    onChange={handleImportMarkdownFile} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Quick Markdown Toolbar jika mode WRITE */}
              {markdownViewMode === 'WRITE' && (
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <button type="button" onClick={() => insertMarkdownSnippet('## Judul Seksi Baru\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900 font-bold" title="Heading 2">H2</button>
                  <button type="button" onClick={() => insertMarkdownSnippet('### Sub Judul\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900 font-bold" title="Heading 3">H3</button>
                  <button type="button" onClick={() => insertMarkdownSnippet('**teks tebal**')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900 font-bold" title="Tebal"><Bold size={13} /></button>
                  <button type="button" onClick={() => insertMarkdownSnippet('*teks miring*')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900 italic" title="Miring"><Italic size={13} /></button>
                  <button type="button" onClick={() => insertMarkdownSnippet('> Kutipan atau catatan penting kawasan...\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900" title="Kutipan"><Quote size={13} /></button>
                  <button type="button" onClick={() => insertMarkdownSnippet('- Poin materi / kurikulum 1\n- Poin materi / kurikulum 2\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900" title="Daftar Bullet"><List size={13} /></button>
                  <button type="button" onClick={() => insertMarkdownSnippet('- [ ] Checklist materi selesai\n- [x] Sertifikasi terbit\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900" title="Checklist"><CheckSquare size={13} /></button>
                  <button type="button" onClick={() => insertMarkdownSnippet('| Fitur / Modul | Durasi | Sertifikasi |\n|---|---|---|\n| Teori Dasar | 8 Jam | Internal STP |\n| Praktik Bengkel | 32 Jam | BNSP |\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900 inline-flex items-center gap-1" title="Tabel"><TableIcon size={13} /> Tabel</button>
                  <button type="button" onClick={() => insertMarkdownSnippet('```ts\n// kode program atau spesifikasi teknis\n```\n')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900 font-mono" title="Kode"><Code size={13} /></button>
                  <button type="button" onClick={() => insertMarkdownSnippet('[Kunjungi Portal Solo Technopark](https://solotechnopark.id)')} className="px-2 py-1 rounded hover:bg-white hover:text-slate-900" title="Tautan">Link</button>
                </div>
              )}

              {markdownViewMode === 'WRITE' ? (
                <Textarea 
                  required
                  rows={11}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="# Judul Artikel&#10;&#10;Tuliskan ulasan mendalam, materi edukasi, atau panduan dalam format Markdown (.md) di sini.&#10;&#10;Anda juga dapat mengklik tombol 'Import File .md / Dokumen' di pojok kanan atas untuk langsung mengunggah file catatan Anda..."
                  className="rounded-xl text-xs sm:text-sm font-normal leading-relaxed font-mono bg-white border border-slate-200"
                />
              ) : (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 min-h-[300px] max-h-[500px] overflow-y-auto">
                  {formData.content ? (
                    <MarkdownRenderer content={formData.content} />
                  ) : (
                    <p className="text-xs text-slate-400 italic">Konten masih kosong. Tulis atau import file .md untuk melihat pratinjau GitHub di sini.</p>
                  )}
                </div>
              )}
            </div>

            {/* Bagian 5: Tags */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tags & Kata Kunci</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.tags?.map((tag, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-500 ml-0.5"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <Input 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Ketik tag lalu tekan Enter atau koma (misal: welding, diklat, bumn)..."
                className="h-10 rounded-xl text-xs"
              />
            </div>

            {/* Bagian 6: SMART CTA BOX BUILDER (Fitur Kunci) */}
            <div className="border border-amber-200 bg-amber-50/40 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Smart Call-to-Action (CTA) Box</h3>
                    <p className="text-[11px] text-slate-500">Tautkan artikel ini langsung ke program pelatihan, katalog, atau booking fasilitas.</p>
                  </div>
                </div>
              </div>

              {/* Pilihan Tipe CTA */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CTA_TYPES.map(cta => {
                  const Icon = cta.icon;
                  const isSelected = formData.cta?.type === cta.value;
                  return (
                    <button
                      type="button"
                      key={cta.value}
                      onClick={() => handleCtaTypeChange(cta.value)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        isSelected 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={14} className={isSelected ? 'text-white' : 'text-amber-600'} />
                      <span className="truncate">{cta.label}</span>
                    </button>
                  );
                })}
              </div>

              {formData.cta?.type !== 'NONE' && (
                <div className="space-y-3 pt-3 border-t border-amber-200/60">
                  
                  {/* Auto-picker dari Master Data */}
                  {formData.cta?.type === 'TRAINING' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Pilih Kelas Pelatihan Rujukan</label>
                      <select 
                        value={formData.cta?.targetId || ''}
                        onChange={(e) => handleSelectCtaTarget('TRAINING', e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="">-- Pilih dari Program Pelatihan STP --</option>
                        {trainings.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.title} ({t.type} - {t.level})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.cta?.type === 'CATALOG' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Pilih Produk / Jasa Katalog Rujukan</label>
                      <select 
                        value={formData.cta?.targetId || ''}
                        onChange={(e) => handleSelectCtaTarget('CATALOG', e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="">-- Pilih dari Katalog STP --</option>
                        {catalogProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.cta?.type === 'FACILITY' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Pilih Fasilitas / Ruangan Rujukan</label>
                      <select 
                        value={formData.cta?.targetId || ''}
                        onChange={(e) => handleSelectCtaTarget('FACILITY', e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="">-- Pilih Fasilitas / Ruangan STP --</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.category} - {a.location})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Field Judul & Deskripsi CTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Judul Banner CTA</label>
                      <Input 
                        value={formData.cta?.title || ''}
                        onChange={(e) => updateCta({ title: e.target.value })}
                        placeholder="Contoh: Siap Mengikuti Kelas Ini?"
                        className="h-9 rounded-xl text-xs bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Teks Tombol Aksi</label>
                      <Input 
                        value={formData.cta?.buttonText || ''}
                        onChange={(e) => updateCta({ buttonText: e.target.value })}
                        placeholder="Daftar Sekarang / Hubungi CS"
                        className="h-9 rounded-xl text-xs bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Deskripsi Singkat Banner CTA</label>
                    <Input 
                      value={formData.cta?.description || ''}
                      onChange={(e) => updateCta({ description: e.target.value })}
                      placeholder="Tulis kalimat ajakan yang meyakinkan customer..."
                      className="h-9 rounded-xl text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Tautan / URL Tujuan</label>
                      <Input 
                        value={formData.cta?.targetUrl || ''}
                        onChange={(e) => updateCta({ targetUrl: e.target.value })}
                        placeholder="/program-pelatihan/... atau https://..."
                        className="h-9 rounded-xl text-xs bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Badge / Highlight (Opsional)</label>
                      <Input 
                        value={formData.cta?.targetBadge || ''}
                        onChange={(e) => updateCta({ targetBadge: e.target.value })}
                        placeholder="Sertifikasi BNSP / Kuota Terbatas"
                        className="h-9 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Tombol Simpan Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full px-5 h-11 text-xs font-bold"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-full px-7 h-11 text-xs font-bold bg-slate-900 hover:bg-amber-500 hover:shadow-amber-500/25 text-white transition-all shadow-sm"
              >
                {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Terbitkan Artikel')}
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL KONFIRMASI HAPUS */}
      {deleteConfirmId && (
        <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-0 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900 mb-2">Hapus Artikel Ini?</DialogTitle>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">
              Artikel yang telah dihapus tidak dapat dipulihkan. Apakah Anda yakin ingin melanjutkan?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="rounded-full text-xs font-bold h-10 px-4">
                Batal
              </Button>
              <Button 
                onClick={() => handleDelete(deleteConfirmId)} 
                className="rounded-full text-xs font-bold h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                Ya, Hapus
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 7. MODAL PILIH GAMBAR MASTER DATA STP */}
      <ArticleImagePickerModal 
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelectImage={handleSelectMasterImage}
      />

    </div>
  );
}
