'use client';

import React, { useState } from 'react';
import { useFaqs } from '@/hooks/useFaqs';
import { FAQ } from '@/types';
import { 
  Plus, Edit, Trash2, Search,
  Loader2, CheckCircle, XCircle, HelpCircle,
  Pin, ThumbsUp, ThumbsDown, Users, Tag, AlertCircle
} from 'lucide-react';

export default function ManajemenFAQPage() {
  const { faqs, loading, error, addFaq, updateFaq, removeFaq } = useFaqs();
  
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Knowledge Base (FAQ)</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola Pusat Bantuan Cerdas Omni-Hub STP</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-200 transition-colors"
          >
            <Plus size={18} /> Tambah FAQ
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle size={18}/> {error}</div>}
      
      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari pertanyaan, jawaban, atau kategori..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="text-sm font-bold text-slate-500 hidden sm:block px-4">
           Total: {filteredFaqs.length} Dokumen
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="animate-spin mb-4 text-blue-500" size={36} />
            <span className="font-bold">Memuat bank pengetahuan...</span>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><HelpCircle className="text-slate-300" size={40} /></div>
            <p className="font-bold text-slate-700 text-lg">Belum ada data FAQ</p>
            <p className="text-sm mt-1">Tambahkan pertanyaan baru untuk membantu pengguna.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className={`p-6 border ${faq.isPinned ? 'border-amber-200 bg-amber-50/30 shadow-md' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'} hover:border-blue-200 transition-all rounded-3xl flex items-start gap-5 group relative`}>
                
                {faq.isPinned && (
                  <div className="absolute top-0 right-0 p-3 text-amber-500" title="Disematkan di Beranda">
                    <Pin size={20} className="fill-amber-500/20" />
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${faq.isPinned ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  <HelpCircle size={24} />
                </div>
                
                <div className="flex-1 pr-8">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight group-hover:text-blue-600 transition-colors">{faq.question}</h3>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleOpenModal(faq)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(faq.id!)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed mb-5 line-clamp-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">{faq.answer}</p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                      {faq.category}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-black text-indigo-700 uppercase tracking-widest shadow-sm">
                      <Users size={14} /> {faq.targetAudience}
                    </span>
                    
                    {faq.relatedTags && faq.relatedTags.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 border-l-2 border-slate-200 pl-3">
                        <Tag size={14} /> {faq.relatedTags.join(', ')}
                      </div>
                    )}

                    <div className="flex items-center gap-4 ml-auto text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <span className="flex items-center gap-1.5 text-emerald-600"><ThumbsUp size={14} /> {faq.helpfulCount || 0}</span>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <span className="flex items-center gap-1.5 text-rose-500"><ThumbsDown size={14} /> {faq.unhelpfulCount || 0}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-3xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Edit Data FAQ' : 'Tambah FAQ Baru'}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Isi pertanyaan dan jawaban yang jelas untuk pengguna.</p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors"><XCircle size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
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

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200 sticky bottom-0 bg-slate-50/90 backdrop-blur-md pb-2">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50">
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