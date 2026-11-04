'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrainingReviewProgram, 
  TrainingReviewItem, 
  ReviewAspect, 
  REVIEWER_ROLE_LABELS, 
  REVIEWER_ROLE_BADGES, 
  ReviewerRole 
} from '@/types';
import { learningReviewService } from '@/services/learningReview.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MessageSquareQuote, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  ThumbsUp, 
  SlidersHorizontal, 
  DownloadCloud, 
  Building2, 
  GraduationCap, 
  HelpCircle, 
  Save, 
  Loader2, 
  X,
  MessageSquare,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import Link from 'next/link';

export default function ManajemenReviewPelatihanPage() {
  const [activeTab, setActiveTab] = useState<'programs' | 'reviews'>('programs');
  const [programs, setPrograms] = useState<TrainingReviewProgram[]>([]);
  const [reviews, setReviews] = useState<TrainingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State Ulasan
  const [searchReview, setSearchReview] = useState('');
  const [filterProgramId, setFilterProgramId] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');

  // Modal Program State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Partial<TrainingReviewProgram> | null>(null);

  // Modal Respon Admin
  const [responseModalReview, setResponseModalReview] = useState<TrainingReviewItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progs, revs] = await Promise.all([
        learningReviewService.getReviewPrograms('ALL'),
        learningReviewService.getAllReviewsForAdmin(),
      ]);
      setPrograms(progs);
      setReviews(revs);
    } catch (err) {
      console.error('Error fetching review data:', err);
      toast.error('Gagal memuat data review program pelatihan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Ulasan
  const filteredReviews = reviews.filter(rev => {
    const matchesSearch = !searchReview || 
      rev.reviewerName.toLowerCase().includes(searchReview.toLowerCase()) ||
      rev.headline.toLowerCase().includes(searchReview.toLowerCase()) ||
      rev.feedback.toLowerCase().includes(searchReview.toLowerCase()) ||
      (rev.reviewerInstitution || '').toLowerCase().includes(searchReview.toLowerCase());

    const matchesProgram = filterProgramId === 'ALL' || rev.programId === filterProgramId;
    const matchesRole = filterRole === 'ALL' || rev.reviewerRole === filterRole;
    const matchesStatus = filterStatus === 'ALL' || rev.status === filterStatus;
    const matchesRating = filterRating === 'ALL' || Math.round(rev.overallRating).toString() === filterRating;

    return matchesSearch && matchesProgram && matchesRole && matchesStatus && matchesRating;
  });

  // Metrik Ringkasan
  const totalReviewsCount = reviews.length;
  const publishedReviews = reviews.filter(r => r.status === 'PUBLISHED');
  const avgGlobalRating = publishedReviews.length > 0
    ? (publishedReviews.reduce((sum, r) => sum + r.overallRating, 0) / publishedReviews.length).toFixed(1)
    : '5.0';
  const recommendPercent = publishedReviews.length > 0
    ? Math.round((publishedReviews.filter(r => r.isRecommended).length / publishedReviews.length) * 100)
    : 100;

  // Handler Buka Modal Tambah Program
  const handleOpenAddProgram = () => {
    setEditingProgram({
      title: '',
      slug: '',
      shortDescription: '',
      category: 'Manufaktur & Vokasi',
      batch: 'Batch II',
      year: '2026',
      organizer: 'Solo Technopark',
      partnerInstitution: '',
      targetAudience: 'Lulusan SMK / Vokasi',
      imageUrl: '',
      status: 'ACTIVE',
      allowPublicReview: true,
      aspects: [
        { id: 'kurikulum', label: 'Kurikulum & Materi', description: 'Kesesuaian silabus dengan standar industri', weight: 1 },
        { id: 'instruktur', label: 'Instruktur & Pengajar', description: 'Kompetensi dan metode pengajaran', weight: 1 },
        { id: 'fasilitas', label: 'Fasilitas & Lab Praktik', description: 'Kelengkapan mesin dan keselamatan kerja (K3)', weight: 1 },
        { id: 'kesiapan_kerja', label: 'Kesiapan & Penyaluran Kerja', description: 'Dukungan tes kompetensi dan penempatan kerja', weight: 1 },
      ]
    });
    setIsProgramModalOpen(true);
  };

  // Handler Buka Modal Edit Program
  const handleOpenEditProgram = (prog: TrainingReviewProgram) => {
    setEditingProgram({ ...prog });
    setIsProgramModalOpen(true);
  };

  // Handler Tambah Aspek Penilaian Kustom di Modal Program
  const handleAddAspect = () => {
    if (!editingProgram) return;
    const currentAspects = editingProgram.aspects || [];
    const newId = `aspek_${Date.now()}`;
    setEditingProgram({
      ...editingProgram,
      aspects: [
        ...currentAspects,
        { id: newId, label: 'Kriteria Baru', description: 'Keterangan kriteria penilaian', weight: 1 }
      ]
    });
  };

  const handleAspectChange = (idx: number, field: keyof ReviewAspect, value: any) => {
    if (!editingProgram || !editingProgram.aspects) return;
    const updated = [...editingProgram.aspects];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditingProgram({ ...editingProgram, aspects: updated });
  };

  const handleRemoveAspect = (idx: number) => {
    if (!editingProgram || !editingProgram.aspects) return;
    if (editingProgram.aspects.length <= 1) {
      toast.error('Minimal harus ada 1 kriteria penilaian');
      return;
    }
    const updated = editingProgram.aspects.filter((_, i) => i !== idx);
    setEditingProgram({ ...editingProgram, aspects: updated });
  };

  // Simpan Program Review
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram || !editingProgram.title) {
      toast.error('Judul program pelatihan wajib diisi.');
      return;
    }

    setIsSavingProgram(true);
    try {
      await learningReviewService.saveReviewProgram(editingProgram);
      toast.success('Program review pelatihan berhasil disimpan.');
      setIsProgramModalOpen(false);
      setEditingProgram(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan program.');
    } finally {
      setIsSavingProgram(false);
    }
  };

  // Hapus Program Review
  const handleDeleteProgram = async (id: string, title: string) => {
    if (!confirm(`Hapus program review "${title}"? Seluruh ulasan terkait akan tetap tersimpan.`)) return;
    try {
      await learningReviewService.deleteReviewProgram(id);
      toast.success('Program review berhasil dihapus.');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus program.');
    }
  };

  // Moderasi Ulasan
  const handleUpdateStatus = async (reviewId: string, status: 'PUBLISHED' | 'PENDING' | 'REJECTED') => {
    try {
      await learningReviewService.moderateReview(reviewId, status);
      toast.success(`Status ulasan berhasil diubah menjadi ${status}.`);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status } : r));
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status ulasan.');
    }
  };

  // Buka Modal Tanggapan Admin
  const handleOpenResponseModal = (rev: TrainingReviewItem) => {
    setResponseModalReview(rev);
    setResponseText(rev.adminResponse || '');
  };

  // Simpan Tanggapan Admin
  const handleSaveResponse = async () => {
    if (!responseModalReview || !responseModalReview.id) return;
    setIsSubmittingResponse(true);
    try {
      await learningReviewService.moderateReview(
        responseModalReview.id, 
        responseModalReview.status, 
        responseText.trim()
      );
      toast.success('Tanggapan resmi Solo Technopark berhasil disimpan.');
      setReviews(prev => prev.map(r => r.id === responseModalReview.id ? { 
        ...r, 
        adminResponse: responseText.trim(),
        adminResponseAt: Date.now() 
      } : r));
      setResponseModalReview(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tanggapan.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Export Excel Ulasan
  const handleExportExcel = () => {
    if (filteredReviews.length === 0) {
      toast.error('Tidak ada data ulasan untuk diekspor.');
      return;
    }

    const dataRows = filteredReviews.map((r, i) => ({
      No: i + 1,
      'Program Pelatihan': r.programTitle,
      'Nama Pengulas': r.reviewerName,
      'Peran': REVIEWER_ROLE_LABELS[r.reviewerRole] || r.reviewerRole,
      'Keterangan Peran / Asal': r.reviewerRoleCustom || r.reviewerInstitution || '-',
      'Email': r.reviewerEmail || '-',
      'Rating Keseluruhan (1-5)': r.overallRating,
      'Judul Ulasan': r.headline,
      'Ulasan & Testimoni': r.feedback,
      'Saran & Masukan': r.suggestions || '-',
      'Rekomendasikan Program': r.isRecommended ? 'Ya' : 'Tidak',
      'Status Moderasi': r.status,
      'Tanggapan Resmi STP': r.adminResponse || '-',
      'Jumlah Like': r.likesCount || 0,
      'Tanggal Dikirim': new Date(r.createdAt).toLocaleString('id-ID'),
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ulasan_Pelatihan');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Rekapitulasi_Review_Pelatihan_STP_${dateStr}.xlsx`);
    toast.success(`${filteredReviews.length} data ulasan berhasil diekspor!`);
  };

  return (
    <div className="space-y-8">
      {/* HEADER UTAMA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Sparkles size={14} className="text-emerald-600" /> Pusat Evaluasi & Kepuasan Pelatihan
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Review & Evaluasi Program Pelatihan
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Kelola program pelatihan yang dibuka untuk direview oleh peserta, mentor, dan publik. Sesuaikan aspek penilaian serta kurasi testimoni nyata untuk meningkatkan kepercayaan industri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href="/review-pelatihan" 
            target="_blank"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold px-4 py-2.5 text-xs shadow-xs transition-colors"
          >
            <ExternalLink size={15} className="mr-2 text-slate-500" /> Lihat Portal Publik
          </Link>
          <Button 
            onClick={handleExportExcel} 
            variant="outline" 
            className="rounded-xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold text-xs"
          >
            <DownloadCloud size={15} className="mr-2" /> Export Excel
          </Button>
          <Button 
            onClick={handleOpenAddProgram} 
            className="rounded-xl bg-slate-900 text-white font-bold text-xs shadow-md"
          >
            <Plus size={15} className="mr-2" /> Tambah Program Review
          </Button>
        </div>
      </div>

      {/* KARTU STATISTIK RINGKASAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Program Aktif</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{programs.filter(p => p.status === 'ACTIVE').length} Program</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Siap direview publik</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Ulasan Masuk</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalReviewsCount} Ulasan</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{publishedReviews.length} telah dipublikasikan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <MessageSquareQuote size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{avgGlobalRating}</h3>
              <div className="flex text-amber-400">
                <Star size={16} fill="currentColor" />
              </div>
              <span className="text-xs font-bold text-slate-400">/ 5.0</span>
            </div>
            <p className="text-[11px] text-amber-600 font-bold mt-0.5">Indeks Kepuasan Vokasi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star size={24} fill="currentColor" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tingkat Rekomendasi</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{recommendPercent}%</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Merekomendasikan pelatihan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ThumbsUp size={24} />
          </div>
        </div>
      </div>

      {/* TAB NAVIGASI PANEL */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('programs')}
          className={`pb-3 text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'programs'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap size={18} />
          <span>Program Pelatihan & Aspek Penilaian ({programs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquareQuote size={18} />
          <span>Moderasi & Kotak Masuk Ulasan ({reviews.length})</span>
        </button>
      </div>

      {/* KONTEN TAB 1: DAFTAR PROGRAM PELATIHAN */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog) => (
              <div 
                key={prog.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Gambar / Banner Program */}
                  <div className="h-40 bg-slate-900 relative overflow-hidden">
                    <img 
                      src={prog.imageUrl || 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'} 
                      alt={prog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                        prog.status === 'ACTIVE' 
                          ? 'bg-emerald-500/90 text-white' 
                          : 'bg-slate-700/90 text-slate-200'
                      }`}>
                        {prog.status === 'ACTIVE' ? 'Aktif Direview' : prog.status}
                      </span>
                      {prog.partnerInstitution && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/90 text-slate-900 backdrop-blur-md shadow-xs">
                          {prog.partnerInstitution}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-xs font-bold flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span>{prog.stats?.averageRating || 0}</span>
                      <span className="text-[10px] text-slate-300">({prog.stats?.totalReviews || 0} ulasan)</span>
                    </div>
                  </div>

                  {/* Konten Detail Program */}
                  <div className="p-5 space-y-3">
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                      {prog.category} • {prog.batch} ({prog.year})
                    </div>
                    <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {prog.shortDescription}
                    </p>

                    {/* Kriteria Aspek Penilaian */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Kriteria Aspek Dinilai ({prog.aspects?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {prog.aspects?.map((asp) => (
                          <span 
                            key={asp.id} 
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md"
                          >
                            {asp.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Kartu & Aksi */}
                <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-4">
                  <Link 
                    href={`/review-pelatihan?program=${prog.id}`}
                    target="_blank"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Buka Form Publik</span>
                    <ExternalLink size={13} />
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenEditProgram(prog)}
                      className="rounded-xl h-8 px-3 text-xs font-bold border-slate-200 hover:bg-slate-50"
                    >
                      <Edit3 size={13} className="mr-1" /> Edit & Kriteria
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteProgram(prog.id, prog.title)}
                      className="rounded-xl h-8 w-8 p-0 text-red-500 border-red-100 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KONTEN TAB 2: MODERASI REVIEW & INBOX */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* BAR PENCARIAN & FILTER */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                value={searchReview}
                onChange={e => setSearchReview(e.target.value)}
                placeholder="Cari nama pengulas, instansi, atau kata kunci ulasan..."
                className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={filterProgramId}
                onChange={e => setFilterProgramId(e.target.value)}
                className="h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Program Pelatihan</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Peran Reviewer</option>
                <option value="PESERTA">Peserta Pelatihan / Alumni</option>
                <option value="MENTOR">Instruktur / Mentor</option>
                <option value="INDUSTRI">Mitra Industri / Perusahaan</option>
                <option value="PUBLIK">Masyarakat Umum</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">Published (Tampil Publik)</option>
                <option value="PENDING">Pending (Perlu Moderasi)</option>
                <option value="REJECTED">Ditolak / Arsip</option>
              </select>

              <select
                value={filterRating}
                onChange={e => setFilterRating(e.target.value)}
                className="h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Bintang</option>
                <option value="5">Bintang 5</option>
                <option value="4">Bintang 4</option>
                <option value="3">Bintang 3</option>
                <option value="2">Bintang 2</option>
                <option value="1">Bintang 1</option>
              </select>
            </div>
          </div>

          {/* DAFTAR KARTU ULASAN */}
          {loading ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
              <p className="font-bold text-slate-500">Memuat ulasan program pelatihan...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">Tidak ada ulasan yang sesuai filter.</p>
              <p className="text-xs text-slate-400 mt-1">Ulasan baru dari publik akan otomatis muncul di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col lg:flex-row gap-6 justify-between"
                >
                  {/* Kolom Kiri: Info Pengulas & Konten */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                        REVIEWER_ROLE_BADGES[rev.reviewerRole as ReviewerRole] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {REVIEWER_ROLE_LABELS[rev.reviewerRole as ReviewerRole] || rev.reviewerRole}
                      </span>
                      <span className="text-xs font-bold text-slate-400">•</span>
                      <span className="text-xs font-black text-slate-900">{rev.reviewerName}</span>
                      {rev.reviewerInstitution && (
                        <span className="text-xs text-slate-500 font-medium">({rev.reviewerInstitution})</span>
                      )}
                      <span className="text-xs font-bold text-slate-400">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={16} 
                              className={star <= rev.overallRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} 
                            />
                          ))}
                        </div>
                        <h4 className="font-black text-slate-900 text-base">{rev.headline}</h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                        "{rev.feedback}"
                      </p>
                    </div>

                    {/* Masukan / Saran jika ada */}
                    {rev.suggestions && (
                      <div className="text-xs text-amber-900 bg-amber-50/80 p-3 rounded-xl border border-amber-200/70">
                        <span className="font-bold">Saran untuk Program:</span> {rev.suggestions}
                      </div>
                    )}

                    {/* Rincian Aspek Penilaian */}
                    {rev.aspectRatings && Object.keys(rev.aspectRatings).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(rev.aspectRatings).map(([aspKey, score]) => (
                          <div 
                            key={aspKey}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-2xs"
                          >
                            <span className="capitalize">{aspKey.replace(/_/g, ' ')}:</span>
                            <span className="text-emerald-700 flex items-center gap-0.5">
                              <Star size={11} className="fill-emerald-500 text-emerald-500" /> {score}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tanggapan Resmi Admin jika ada */}
                    {rev.adminResponse && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Tanggapan Resmi Solo Technopark:</span>
                        </div>
                        <p className="text-emerald-900 leading-relaxed">{rev.adminResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Kolom Kanan: Status & Tindakan Moderasi */}
                  <div className="flex flex-row lg:flex-col items-end lg:items-end justify-between lg:justify-start gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        rev.status === 'PUBLISHED' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : rev.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {rev.status === 'PUBLISHED' ? 'Tayang di Publik' : rev.status === 'PENDING' ? 'Menunggu Moderasi' : 'Ditolak'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {rev.status !== 'PUBLISHED' && (
                        <Button 
                          onClick={() => handleUpdateStatus(rev.id!, 'PUBLISHED')}
                          size="sm" 
                          className="rounded-xl h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <CheckCircle2 size={13} className="mr-1" /> Terbitkan
                        </Button>
                      )}

                      {rev.status !== 'PENDING' && (
                        <Button 
                          onClick={() => handleUpdateStatus(rev.id!, 'PENDING')}
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 font-bold"
                        >
                          <Clock size={13} className="mr-1" /> Tahan
                        </Button>
                      )}

                      <Button 
                        onClick={() => handleOpenResponseModal(rev)}
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                      >
                        <MessageSquare size={13} className="mr-1" /> {rev.adminResponse ? 'Ubah Balasan' : 'Beri Balasan'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PROGRAM REVIEW & KUSTOMISASI ASPEK */}
      <AnimatePresence>
        {isProgramModalOpen && editingProgram && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden"
            >
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingProgram.id ? 'Edit Program & Aspek Review' : 'Tambah Program Pelatihan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur deskripsi program dan kustomisasi kriteria penilaian yang akan dinilai oleh publik/peserta.
                  </p>
                </div>
                <button 
                  onClick={() => setIsProgramModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveProgram} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  {/* Informasi Dasar Program */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                      Informasi Pelatihan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-700">Nama / Judul Program Pelatihan <span className="text-red-500">*</span></Label>
                        <Input 
                          required
                          value={editingProgram.title || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, title: e.target.value })}
                          placeholder="Contoh: Pelatihan dan Sertifikasi Welder (SMK Go Global)"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-700">Deskripsi Singkat Program</Label>
                        <textarea
                          rows={2}
                          value={editingProgram.shortDescription || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, shortDescription: e.target.value })}
                          placeholder="Penjelasan singkat tujuan pelatihan, kompetensi yang dipelajari, dan penempatan..."
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Kategori Program</Label>
                        <Input 
                          value={editingProgram.category || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, category: e.target.value })}
                          placeholder="Contoh: Manufaktur & Vokasi"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Batch / Angkatan</Label>
                        <Input 
                          value={editingProgram.batch || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, batch: e.target.value })}
                          placeholder="Contoh: Batch II / Angkatan 2026"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Mitra Kerjasama / Lembaga</Label>
                        <Input 
                          value={editingProgram.partnerInstitution || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, partnerInstitution: e.target.value })}
                          placeholder="Contoh: BP3MI Jawa Tengah"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Target Peserta</Label>
                        <Input 
                          value={editingProgram.targetAudience || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, targetAudience: e.target.value })}
                          placeholder="Contoh: Lulusan SMK Teknik / Vokasi"
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold text-slate-700">URL Foto / Banner Program</Label>
                        <Input 
                          value={editingProgram.imageUrl || ''}
                          onChange={e => setEditingProgram({ ...editingProgram, imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KUSTOMISASI ASPEK EVALUASI / KRITERIA REVIEW */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                          Kustomisasi Kriteria Penilaian (Rating Aspek)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Pengulas akan memberikan rating 1-5 bintang untuk masing-masing aspek di bawah ini:
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={handleAddAspect} 
                        className="rounded-xl h-8 text-xs font-bold bg-slate-900 text-white"
                      >
                        <Plus size={13} className="mr-1" /> Tambah Aspek
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {editingProgram.aspects?.map((aspect, idx) => (
                        <div 
                          key={idx} 
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-1.5 w-full">
                            <Input 
                              value={aspect.label}
                              onChange={e => handleAspectChange(idx, 'label', e.target.value)}
                              placeholder="Nama Aspek (contoh: Kurikulum & Materi)"
                              className="h-9 rounded-lg bg-white text-xs font-bold"
                            />
                            <Input 
                              value={aspect.description || ''}
                              onChange={e => handleAspectChange(idx, 'description', e.target.value)}
                              placeholder="Keterangan panduan aspek (contoh: Kesesuaian materi dengan industri)"
                              className="h-8 rounded-lg bg-white text-[11px]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAspect(idx)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 self-end sm:self-center transition-colors"
                            title="Hapus Aspek"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 shrink-0">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsProgramModalOpen(false)}
                    className="rounded-xl font-bold text-xs"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSavingProgram}
                    className="rounded-xl bg-slate-900 text-white font-bold text-xs px-6 shadow-sm"
                  >
                    {isSavingProgram ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                    Simpan Program
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL TANGGAPAN RESMI ADMIN */}
      <AnimatePresence>
        {responseModalReview && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-slate-900">Tanggapan Resmi Solo Technopark</h3>
                  <p className="text-xs text-slate-500">
                    Membalas ulasan dari: <strong>{responseModalReview.reviewerName}</strong>
                  </p>
                </div>
                <button onClick={() => setResponseModalReview(null)} className="text-slate-400 p-1.5 hover:bg-slate-100 rounded-full">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700">
                <p className="font-bold mb-1">"{responseModalReview.headline}"</p>
                <p className="italic text-slate-500">"{responseModalReview.feedback}"</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Tulis Tanggapan Resmi</Label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Tuliskan ucapan terima kasih, penjelasan evaluasi, atau komitmen tindak lanjut dari Solo Technopark..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setResponseModalReview(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveResponse}
                  disabled={isSubmittingResponse}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {isSubmittingResponse ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
                  Kirim Tanggapan
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

