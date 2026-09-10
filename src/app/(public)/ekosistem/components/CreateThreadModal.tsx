'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useCreateHubThread } from '@/hooks/useHub';
import { useAuth } from '@/lib/AuthContext';

export const HUB_TYPES = [
  { id: 'All', label: 'Semua Topik' },
  { id: 'PROBLEM_STATEMENT', label: 'Mencari Solusi' },
  { id: 'LOOKING_FOR_FUNDING', label: 'Pendanaan' },
  { id: 'PARTNERSHIP', label: 'Kemitraan' },
  { id: 'RESEARCH_OFFER', label: 'Riset Akademik' },
  { id: 'PRODUCT_TESTING', label: 'Product Testing' }
];

const modalVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.3, duration: 0.5 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

interface CreateThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateThreadModal({ isOpen, onClose }: CreateThreadModalProps) {
  const { user, role } = useAuth();
  const { mutateAsync: createThread, isPending: isCreatingThread } = useCreateHubThread();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<any>('PROBLEM_STATEMENT');
  const [description, setDescription] = useState('');
  const [budgetOrTicketSize, setBudgetOrTicketSize] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Judul dan deskripsi wajib diisi.');
      return;
    }

    try {
      const authorId = user?.uid || 'user_' + Math.random().toString(36).substring(7);
      const authorName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna Ekosistem';
      const authorRole = (role as any) || 'industri';
      const authorLogoUrl = user?.photoURL || '';

      await createThread({
        authorId,
        authorName,
        authorRole,
        authorLogoUrl,
        title: title.trim(),
        description: description.trim(),
        type,
        tags,
        budgetOrTicketSize: budgetOrTicketSize.trim() || undefined,
        status: 'OPEN'
      });

      setTitle('');
      setDescription('');
      setBudgetOrTicketSize('');
      setTags([]);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat thread. Silakan coba lagi.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isCreatingThread && onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Buat Thread Baru</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Mulai kolaborasi dengan ekosistem Technopark</p>
              </div>
              <button
                type="button"
                onClick={() => !isCreatingThread && onClose()}
                className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              <form id="hub-thread-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Judul Diskusi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Mencari Mitra Manufaktur IoT..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Kategori / Topik <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all appearance-none cursor-pointer"
                    >
                      {HUB_TYPES.filter((t) => t.id !== 'All').map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Estimasi Budget / Ukuran Tiket</label>
                    <input
                      type="text"
                      value={budgetOrTicketSize}
                      onChange={(e) => setBudgetOrTicketSize(e.target.value)}
                      placeholder="Contoh: Rp 50 Juta - 100 Juta"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Deskripsi Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Jelaskan kebutuhan, masalah, atau penawaran riset Anda secara detail..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all resize-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tags / Kata Kunci</label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex flex-wrap gap-2 items-center min-h-[50px]">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder={tags.length < 5 ? 'Ketik lalu tekan Enter (Maks 5)' : 'Maksimal tag tercapai'}
                        disabled={tags.length >= 5}
                        className="flex-1 min-w-[120px] bg-transparent outline-hidden p-1 text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isCreatingThread}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="hub-thread-form"
                disabled={isCreatingThread}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCreatingThread ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  'Posting Thread'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
