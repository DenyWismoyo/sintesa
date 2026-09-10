'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTenants } from '@/hooks/useTenants';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headset, Plus, Loader2, X, AlertCircle, Clock, 
  CheckCircle2, MessageSquare, Trash2, Tag, ArrowRight,
  Wifi, ShieldCheck, Sparkles, Wrench
} from 'lucide-react';
import { toast } from 'sonner';

// --- Tipe Data Tiket ---
export interface Ticket {
  id?: string;
  title: string;
  category: 'Fasilitas' | 'Internet & IT' | 'Kebersihan' | 'Keamanan' | 'Lainnya';
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  description: string;
  status: 'PENDING' | 'PROSES' | 'SELESAI';
  createdAt: number;
  adminReply?: string;
}

export default function TenantTicketsPage() {
  const { user } = useAuth();
  const { useTenantProfile } = useTenants();
  
  // PERBAIKAN: Menggunakan fallback user?.uid jika email kosong
  const { data: profile, isLoading: isProfileLoading } = useTenantProfile(user?.email || user?.uid);

  // Local State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'SEMUA' | 'PENDING' | 'PROSES' | 'SELESAI'>('SEMUA');

  // Form State
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    category: 'Fasilitas',
    priority: 'Sedang',
    title: '',
    description: ''
  });

  // --- Real-time Listener ke Sub-collection Tenant ---
  useEffect(() => {
    if (!profile?.id) {
      setIsTicketsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tenants', profile.id, 'tickets'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(data);
      setIsTicketsLoading(false);
    }, (err) => {
      console.error("Gagal memuat tiket:", err);
      toast.error("Gagal terhubung ke server helpdesk.");
      setIsTicketsLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.id]);

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (!newTicket.title || !newTicket.description) {
      toast.error("Harap isi judul dan deskripsi masalah.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tenants', profile.id, 'tickets'), {
        ...newTicket,
        status: 'PENDING',
        createdAt: Date.now(),
      });
      toast.success("Tiket berhasil dikirim ke Admin!");
      setIsModalOpen(false);
      setNewTicket({ category: 'Fasilitas', priority: 'Sedang', title: '', description: '' });
    } catch (error) {
      toast.error("Gagal membuat tiket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!profile?.id) return;
    if (confirm("Hapus tiket ini? Tiket yang sudah diproses sebaiknya tidak dihapus.")) {
      try {
        await deleteDoc(doc(db, 'tenants', profile.id, 'tickets', ticketId));
        toast.success("Tiket dibatalkan.");
      } catch (error) {
        toast.error("Gagal menghapus tiket.");
      }
    }
  };

  const markAsResolved = async (ticketId: string) => {
     if (!profile?.id) return;
     try {
       await updateDoc(doc(db, 'tenants', profile.id, 'tickets', ticketId), {
         status: 'SELESAI'
       });
       toast.success("Terima kasih! Tiket ditutup.");
     } catch (error) {
       toast.error("Gagal memperbarui tiket.");
     }
  };

  // --- Render Helpers ---
  if (isProfileLoading || isTicketsLoading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-md rounded-[2.5rem] shadow-sm border border-slate-200/60 mt-6">
        <Headset size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 text-center max-w-md text-sm">Profil startup Anda belum terhubung. Harap lengkapi Profil Publik terlebih dahulu.</p>
      </div>
    );
  }

  const filteredTickets = tickets.filter(t => filter === 'SEMUA' || t.status === filter);
  
  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Internet & IT': return <Wifi size={16} />;
      case 'Keamanan': return <ShieldCheck size={16} />;
      case 'Kebersihan': return <Sparkles size={16} />;
      default: return <Wrench size={16} />;
    }
  };

  return (
    <div className="w-full pb-24 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl shadow-inner">
              <Headset size={28} />
            </div> 
            Helpdesk Fasilitas
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Laporkan kendala teknis, internet, atau kebersihan di ruang kerja Anda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-slate-900 hover:bg-amber-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Buat Tiket Baru
        </button>
      </div>

      {/* STATS & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-slate-200/60 overflow-x-auto custom-scrollbar shrink-0">
          {['SEMUA', 'PENDING', 'PROSES', 'SELESAI'].map(f => (
            <button 
              key={f} onClick={() => setFilter(f as any)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              {f === 'SEMUA' ? 'Semua Tiket' : f === 'PENDING' ? 'Menunggu' : f === 'PROSES' ? 'Sedang Diproses' : 'Selesai'}
            </button>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4">
           <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total</span>
              <span className="text-xl font-black text-slate-800">{tickets.length}</span>
           </div>
           <div className="bg-amber-50/50 backdrop-blur-md border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Pending</span>
              <span className="text-xl font-black text-amber-700">{tickets.filter(t => t.status === 'PENDING').length}</span>
           </div>
           <div className="bg-emerald-50/50 backdrop-blur-md border border-emerald-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Selesai</span>
              <span className="text-xl font-black text-emerald-700">{tickets.filter(t => t.status === 'SELESAI').length}</span>
           </div>
        </div>
      </div>

      {/* TICKETS LIST */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-slate-300 py-24 text-center px-4 w-full">
          <CheckCircle2 size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Semua Aman Terkendali!</h3>
          <p className="text-slate-500 text-sm">Tidak ada tiket laporan dalam kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <motion.div 
                key={ticket.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group"
              >
                {/* Header Card */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 shadow-sm">
                      {getCategoryIcon(ticket.category)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{ticket.category}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${
                    ticket.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                    ticket.status === 'PROSES' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {ticket.status}
                  </span>
                </div>

                {/* Body Card */}
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-lg font-black text-slate-800 mb-2 leading-tight">{ticket.title}</h4>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">{ticket.description}</p>
                  
                  {/* Status Bar */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString('id-ID')}
                    </div>
                    <div className="flex gap-2">
                      {ticket.priority === 'Darurat' && <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded uppercase">Darurat</span>}
                      {ticket.status === 'PENDING' && (
                        <button onClick={() => handleDelete(ticket.id!)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Reply Section (Jika Ada) */}
                {ticket.adminReply && (
                  <div className="bg-indigo-50/80 p-5 border-t border-indigo-100 relative">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Headset size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Balasan Admin</p>
                        <p className="text-sm text-indigo-900 font-medium italic">"{ticket.adminReply}"</p>
                      </div>
                    </div>
                    {ticket.status === 'PROSES' && (
                      <button onClick={() => markAsResolved(ticket.id!)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> Konfirmasi Masalah Selesai
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL BUAT TIKET */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white z-50 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Plus className="text-amber-500" /> Buat Tiket Baru</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X size={18}/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Kategori Masalah</label>
                    <select required value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="Fasilitas">Fasilitas Ruangan (AC, Lampu, dll)</option>
                      <option value="Internet & IT">Internet & Jaringan IT</option>
                      <option value="Kebersihan">Kebersihan</option>
                      <option value="Keamanan">Keamanan / Akses</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Tingkat Prioritas</label>
                    <select required value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="Rendah">Rendah (Bisa ditunda)</option>
                      <option value="Sedang">Sedang (Standar)</option>
                      <option value="Tinggi">Tinggi (Mengganggu Kerja)</option>
                      <option value="Darurat">Darurat (Kritis)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Judul Singkat</label>
                  <input required type="text" value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} placeholder="Contoh: AC Ruangan Rapat Mati" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Detail Masalah</label>
                  <textarea required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} rows={4} placeholder="Jelaskan secara detail lokasi dan masalah yang terjadi..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />} 
                    {isSubmitting ? 'Mengirim Tiket...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}