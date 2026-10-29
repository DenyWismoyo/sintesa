'use client';

import React, { useState, useEffect } from 'react';
import { Tenant } from '@/types';
import { tenantService, TenantTicketItem } from '@/services/tenant.service';
import { Headset, Search, Clock, CheckCircle2, MessageSquare, Loader2, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  tenants: Tenant[];
}

export default function TabHelpdeskTenant({ tenants }: Props) {
  const [tickets, setTickets] = useState<TenantTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROSES' | 'SELESAI'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<TenantTicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [nextStatus, setNextStatus] = useState<'PENDING' | 'PROSES' | 'SELESAI'>('PROSES');
  const [isSaving, setIsSaving] = useState(false);

  const loadAllTickets = async () => {
    setLoading(true);
    try {
      const data = await tenantService.getAllTenantTickets(tenants);
      setTickets(data);
    } catch (err) {
      toast.error('Gagal memuat daftar tiket helpdesk tenant.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenants.length > 0) {
      loadAllTickets();
    } else {
      setLoading(false);
    }
  }, [tenants]);

  const filteredTickets = tickets.filter(t => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.tenantName || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleOpenReply = (t: TenantTicketItem) => {
    setSelectedTicket(t);
    setReplyText(t.adminReply || '');
    setNextStatus(t.status === 'PENDING' ? 'PROSES' : t.status);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !selectedTicket.tenantId || !selectedTicket.id) return;
    setIsSaving(true);
    try {
      await tenantService.updateTenantTicket(selectedTicket.tenantId, selectedTicket.id, {
        status: nextStatus,
        adminReply: replyText.trim(),
        repliedAt: Date.now()
      });
      toast.success(`Tiket #${selectedTicket.title} berhasil diperbarui ke status ${nextStatus}`);
      setSelectedTicket(null);
      await loadAllTickets();
    } catch (err: any) {
      toast.error('Gagal menyimpan balasan tiket: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Headset className="w-5 h-5 text-amber-600" /> Pusat Helpdesk & Keluhan Fasilitas Tenant
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tindak lanjuti laporan kendala ruangan, internet, kebersihan, dan teknis yang dikirim dari Portal Tenant (<code className="font-mono">/tenant/tickets</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul / nama tenant..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          >
            <option value="ALL">Semua Status ({tickets.length})</option>
            <option value="PENDING">Menunggu ({tickets.filter(t => t.status === 'PENDING').length})</option>
            <option value="PROSES">Diproses ({tickets.filter(t => t.status === 'PROSES').length})</option>
            <option value="SELESAI">Selesai ({tickets.filter(t => t.status === 'SELESAI').length})</option>
          </select>
          <button
            onClick={loadAllTickets}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Segarkan Tiket"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600 text-sm">Belum ada tiket keluhan fasilitas dari tenant.</p>
          <p className="text-xs text-slate-400 mt-0.5">Tiket yang diajukan tenant melalui /tenant/tickets akan otomatis tampil di sini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map(t => (
            <div key={`${t.tenantId}-${t.id}`} className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-300 transition-all bg-white shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    {t.tenantName || 'Tenant Binaan'}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                    t.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    t.status === 'PROSES' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</span>
                  {t.priority === 'Darurat' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" /> Darurat
                    </span>
                  )}
                </div>

                <h3 className="font-black text-slate-800 text-sm mb-1.5">{t.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.description}</p>

                {t.adminReply && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-4 text-xs">
                    <p className="text-[10px] font-black text-indigo-500 uppercase mb-0.5">Balasan Admin:</p>
                    <p className="text-indigo-900 font-medium italic">&quot;{t.adminReply}&quot;</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID') : '-'}
                </span>
                <button
                  onClick={() => handleOpenReply(t)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Tindak Lanjuti
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tindak Lanjut Tiket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">{selectedTicket.tenantName}</span>
                <h3 className="text-base font-black text-slate-900">{selectedTicket.title}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Tutup</button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedTicket.description}</p>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ubah Status Penanganan</label>
                <select
                  value={nextStatus}
                  onChange={e => setNextStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="PENDING">PENDING (Menunggu)</option>
                  <option value="PROSES">PROSES (Sedang Dikerjakan Teknisi)</option>
                  <option value="SELESAI">SELESAI (Masalah Teratasi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Balasan untuk Tenant</label>
                <textarea
                  rows={3}
                  required
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Contoh: Teknisi gedung sedang menuju lokasi ruangan Anda..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setSelectedTicket(null)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Simpan & Kirim Balasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

