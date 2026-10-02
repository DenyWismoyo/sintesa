'use client';

import React, { useState } from 'react';
import { useFaqs } from '@/hooks/useFaqs';
import { FAQ } from '@/types';
import { 
  Plus, Edit, Trash2, Search,
  Loader2, CheckCircle, XCircle, HelpCircle,
  Pin, ThumbsUp, ThumbsDown, Users, Tag, AlertCircle
} from 'lucide-react';
import { AdminPageHeader, AdminFilterBar } from '@/components/admin';

export default function ManajemenFAQPage() {
  const { faqs, loading, error, addFaq, updateFaq, removeFaq } = useFaqs();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAudience, setSelectedAudience] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: 'Umum',
    targetAudience: 'ALL',
    relatedTags: [],
    isPinned: false,
  });

  const categories = ['Umum', 'Fasilitas & Booking', 'Inkubasi Startup', 'Pelatihan', 'Tagihan & Pembayaran'];
  const audiences = [
    { value: 'ALL', label: 'Semua Pengunjung' },
    { value: 'TENANT', label: 'Hanya Tenant / Startup' },
    { value: 'PUBLIC', label: 'Hanya Publik Eksternal' },
    { value: 'ADMIN', label: 'Hanya Internal Admin' }
  ];

  const filteredFaqs = faqs.filter(f => {
    const matchSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    const matchAudience = selectedAudience === 'ALL' || f.targetAudience === selectedAudience;
    return matchSearch && matchCategory && matchAudience;
  });

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingId(faq.id || null);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'Umum',
        targetAudience: faq.targetAudience || 'ALL',
        relatedTags: faq.relatedTags || [],
        isPinned: faq.isPinned || false,
      });
    } else {
      setEditingId(null);
      setFormData({ 
        question: '', answer: '', category: 'Umum', 
        targetAudience: 'ALL', relatedTags: [], isPinned: false 
      });
    }
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.relatedTags?.includes(newTag)) {
        setFormData({ ...formData, relatedTags: [...(formData.relatedTags || []), newTag] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ 
      ...formData, 
      relatedTags: formData.relatedTags?.filter(tag => tag !== tagToRemove) 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await updateFaq(editingId, formData as FAQ);
      } else {
        await addFaq(formData as Omit<FAQ, 'id' | 'createdAt'>);
      }
      handleCloseModal();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus FAQ ini?`)) {
      await removeFaq(id);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300">
      {/* STANDARDIZED HEADER */}
      <AdminPageHeader
        title="Knowledge Base (FAQ)"
        description="Kelola bank informasi & tanya-jawab resmi untuk pengunjung, tenant, dan internal kawasan."
        badge={`${faqs.length} Total FAQ`}
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard' },
          { label: 'FAQ' }
        ]}
        actions={
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-200 transition-colors w-full sm:w-auto"
          >
            <Plus size={18} /> Tambah FAQ
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      
      {/* STANDARDIZED FILTER BAR */}
      <AdminFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari pertanyaan, jawaban, atau kata kunci..."
        filters={[
          {
            key: 'category',
            label: 'Kategori',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
              { label: 'Semua Kategori', value: 'ALL' },
              ...categories.map(c => ({ label: c, value: c }))
            ]
          },
          {
            key: 'audience',
            label: 'Audiens',
            value: selectedAudience,
            onChange: setSelectedAudience,
            options: [
              { label: 'Semua Audiens', value: 'ALL' },
              ...audiences.map(a => ({ label: a.label, value: a.value }))
            ]
          }
        ]}
        activeCount={(selectedCategory !== 'ALL' ? 1 : 0) + (selectedAudience !== 'ALL' ? 1 : 0)}
        onReset={() => {
          setSearchTerm('');
          setSelectedCategory('ALL');
          setSelectedAudience('ALL');
        }}
      />

      {/* LIST CONTENT */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Loader2 className="animate-spin mb-3 text-blue-500" size={32} />
            <span className="font-bold text-sm">Memuat bank pengetahuan...</span>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center bg-white rounded-3xl border border-slate-200 shadow-xs border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <HelpCircle className="text-slate-300" size={32} />
            </div>
            <p className="font-bold text-slate-700 text-base">Belum ada data FAQ</p>
            <p className="text-xs text-slate-500 mt-1">Tambahkan pertanyaan baru untuk membantu pengunjung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`p-4 sm:p-6 border ${faq.isPinned ? 'border-amber-200 bg-amber-50/20 shadow-xs' : 'border-slate-200 bg-white shadow-xs hover:shadow-md'} hover:border-blue-200 transition-all rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-start gap-4 sm:gap-5 group relative`}
              >
                {faq.isPinned && (
                  <div className="absolute top-3 right-3 text-amber-500" title="Disematkan di Beranda">
                    <Pin size={18} className="fill-amber-500/20" />
                  </div>
                )}

                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border ${faq.isPinned ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  <HelpCircle size={22} />
                </div>
                
                <div className="flex-1 w-full min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2 pr-6">
                    <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-blue-600 transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 bg-slate-50/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 whitespace-pre-line">
                    {faq.answer}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        {faq.category}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                        <Users size={12} /> {faq.targetAudience}
                      </span>
                      
                      {faq.relatedTags && faq.relatedTags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <Tag size={12} /> {faq.relatedTags.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Touch Friendly Action Buttons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button 
                        onClick={() => handleOpenModal(faq)} 
                        className="min-h-[38px] px-3 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-xs flex items-center gap-1"
                        title="Edit FAQ"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(faq.id!)} 
                        className="min-h-[38px] px-3 text-xs font-bold text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-xs flex items-center gap-1"
                        title="Hapus FAQ"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FORM DINAMIS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Edit Data FAQ' : 'Tambah FAQ Baru'}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">Isi pertanyaan dan jawaban yang jelas untuk pengguna.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 sm:p-2.5 rounded-full transition-colors"><XCircle size={22} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
              <div className="space-y-6">
                
                {/* Switcher Pin */}
                <div className="flex items-center justify-between p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
                  <div>
                    <h4 className="text-sm font-black text-amber-900 flex items-center gap-2 uppercase tracking-widest">
                      <Pin size={18} /> Sematkan di Beranda
                    </h4>
                    <p className="text-xs text-amber-700 font-medium mt-1">FAQ ini akan diprioritaskan tampil paling atas di halaman awal publik.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.isPinned} onChange={(e) => setFormData({...formData, isPinned: e.target.checked})} />
                    <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Pertanyaan Utama (Q) *</label>
                    <input required type="text" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} className={inputClass} placeholder="Tuliskan pertanyaan spesifik..." />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between items-end">
                      <span>Jawaban Komprehensif (A) *</span>
                      <span className="text-[10px] text-slate-400 font-medium">Mendukung format Markdown/HTML dasar</span>
                    </label>
                    <textarea required rows={6} value={formData.answer} onChange={(e) => setFormData({...formData, answer: e.target.value})} className={`${inputClass} resize-y leading-relaxed`} placeholder="Tuliskan jawaban yang komprehensif dan mudah dipahami..."></textarea>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori / Topik *</label>
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={`${inputClass} font-bold text-slate-700 cursor-pointer`}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-700 mb-1.5 flex items-center gap-1.5">
                        <Users size={14} /> Target Audience (Akses) *
                      </label>
                      <select value={formData.targetAudience} onChange={(e) => setFormData({...formData, targetAudience: e.target.value as any})} className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-900 cursor-pointer transition-all outline-none">
                        {audiences.map(aud => <option key={aud.value} value={aud.value}>{aud.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Tag size={16} className="text-blue-500" /> Tags Dinamis (SEO)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.relatedTags?.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                          {tag} <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={14}/></button>
                        </span>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className={inputClass} 
                      placeholder="Ketik kata kunci dan tekan Enter (contoh: Lab AI, Pembayaran, Invoice)..." 
                    />
                  </div>
                </div>

              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 sm:pt-6 mt-6 border-t border-slate-200 sticky bottom-0 bg-slate-50/95 backdrop-blur-md pb-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="w-full sm:w-auto min-h-[42px] px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full sm:w-auto min-h-[42px] flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50 text-center"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} 
                  {isSubmitting ? 'Menyimpan...' : 'Simpan FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}