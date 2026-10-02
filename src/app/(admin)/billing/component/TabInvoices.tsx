'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, Eye, Link as LinkIcon, Loader2, CheckCircle, Clock, 
  AlertCircle, Edit, Building, BookOpen, Store, Package, 
  FileText, Calendar, Phone, Filter, ArrowDownUp, Copy, Network, Plus, Receipt
} from 'lucide-react';
import { Invoice } from '@/types';

interface Props {
  rawInvoices: Invoice[];
  activeTab?: string;
  onGenerateLink: (invoice: Invoice) => void;
  processingId: string | null;
  onViewDetail: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onAllocateBAS?: (invoice: Invoice) => void;
  onOpenAdd?: () => void;
  onOpenKwitansi?: (invoice: Invoice) => void; // PROPS BARU UNTUK KWITANSI
}

export default function TabInvoices({ rawInvoices, activeTab = 'ALL', onGenerateLink, processingId, onViewDetail, onEditInvoice, onDuplicateInvoice, onAllocateBAS, onOpenAdd, onOpenKwitansi }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');

  const displayData = useMemo(() => {
    let data = [...rawInvoices];

    data = data.filter(invoice => {
      const matchParentTab = activeTab === 'ALL' || invoice.status === activeTab;
      
      // Filter khusus untuk yang menunggu verifikasi bukti upload
      if (filterStatus === 'VERIFYING') {
         return invoice.history?.some((h: any) => h.status === 'PENDING');
      }
      
      const matchLocalStatus = filterStatus === 'ALL' || invoice.status === filterStatus;
      return matchParentTab && matchLocalStatus;
    });

    if (filterCategory !== 'ALL') {
      data = data.filter(invoice => {
        if (!invoice.items || invoice.items.length === 0) return filterCategory === 'LAINNYA';
        const type = invoice.items[0].referenceType;
        if (filterCategory === 'FASILITAS') return ['BOOKING', 'TARIFF_DAY', 'TARIFF_MONTH'].includes(type);
        if (filterCategory === 'PELATIHAN') return type === 'TRAINING';
        if (filterCategory === 'PRODUK') return type === 'CATALOG';
        if (filterCategory === 'LAINNYA') return type === 'CUSTOM';
        return true;
      });
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      data = data.filter(invoice => 
        (invoice.invoiceNumber || '').toLowerCase().includes(term) || 
        (invoice.customerName || '').toLowerCase().includes(term) ||
        (invoice.customerEmail || '').toLowerCase().includes(term) ||
        (invoice.items && invoice.items.some(item => (item.description || '').toLowerCase().includes(term)))
      );
    }

    data.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      switch (sortBy) {
        case 'NEWEST': return dateB - dateA;
        case 'OLDEST': return dateA - dateB;
        case 'HIGHEST_AMOUNT': return b.totalAmount - a.totalAmount;
        case 'LOWEST_AMOUNT': return a.totalAmount - b.totalAmount;
        default: return 0;
      }
    });

    return data;
  }, [rawInvoices, activeTab, filterStatus, filterCategory, searchTerm, sortBy]);

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

  const renderStatusWithDetails = (inv: Invoice) => {
    switch (inv.status) {
      case 'PAID': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> Lunas</span>;
      case 'PARTIAL': 
        const paidPercent = Math.round((inv.paidAmount / inv.totalAmount) * 100);
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Clock className="w-3.5 h-3.5" /> Cicilan ({paidPercent}%)</span>;
      case 'PENDING': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><Clock className="w-3.5 h-3.5" /> Menunggu Bayar</span>;
      case 'OVERDUE': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100"><AlertCircle className="w-3.5 h-3.5" /> Jatuh Tempo</span>;
      case 'CANCELLED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200"><AlertCircle className="w-3.5 h-3.5" /> Dibatalkan</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 capitalize">{String(inv.status).toLowerCase()}</span>;
    }
  };

  const getItemSummary = (invoice: Invoice) => {
    if (!invoice.items || invoice.items.length === 0) return { text: "Tidak ada rincian", icon: <FileText className="w-3.5 h-3.5"/>, color: "text-slate-500 bg-slate-50 border border-slate-200" };
    const firstItem = invoice.items[0];
    const type = firstItem.referenceType;
    const moreCount = invoice.items.length - 1;
    const text = `${firstItem.description} ${moreCount > 0 ? ` (+${moreCount})` : ''}`;

    if (['BOOKING', 'TARIFF_DAY', 'TARIFF_MONTH'].includes(type)) return { text, icon: <Building className="w-3.5 h-3.5"/>, color: "text-indigo-700 bg-indigo-50 border border-indigo-100" };
    if (type === 'TRAINING') return { text, icon: <BookOpen className="w-3.5 h-3.5"/>, color: "text-blue-700 bg-blue-50 border border-blue-100" };
    if (type === 'CATALOG') return { text, icon: <Store className="w-3.5 h-3.5"/>, color: "text-orange-700 bg-orange-50 border border-orange-100" };
    return { text, icon: <Package className="w-3.5 h-3.5"/>, color: "text-slate-700 bg-slate-50 border border-slate-200" };
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in">
      
      {/* HEADER TOOLBAR */}
      <div className="px-4 py-4 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-center bg-white rounded-t-3xl">
        <div className="relative w-full xl:w-[320px] shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari pelanggan atau no tagihan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-none">
            <Package className="w-4 h-4 text-slate-400 shrink-0" />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full">
              <option value="ALL">Semua Layanan</option>
              <option value="FASILITAS">Sewa Fasilitas</option>
              <option value="PELATIHAN">Pelatihan & Course</option>
              <option value="PRODUK">Katalog Produk</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full">
              <option value="ALL">Semua Status</option>
              <option value="VERIFYING">🟢 Perlu Verifikasi Bukti</option>
              <option value="PAID">Lunas (Paid)</option>
              <option value="PARTIAL">Cicilan (Partial)</option>
              <option value="PENDING">Menunggu Bayar</option>
              <option value="OVERDUE">Jatuh Tempo</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex-1 sm:flex-none">
            <ArrowDownUp className="w-4 h-4 text-blue-600 shrink-0" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-xs font-bold text-blue-800 outline-none cursor-pointer w-full">
              <option value="NEWEST">Terbaru</option>
              <option value="OLDEST">Terlama</option>
              <option value="HIGHEST_AMOUNT">Nominal Tertinggi</option>
            </select>
          </div>

          {onOpenAdd && (
            <button onClick={onOpenAdd} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Terbitkan Tagihan
            </button>
          )}

        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block overflow-x-auto w-full min-h-[400px]">
        <table className="w-full text-sm text-left whitespace-nowrap border-collapse">
          <thead className="text-xs text-slate-500 bg-slate-50/80 border-b border-slate-100 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4 w-[25%]">Detail Tagihan & BAS</th>
              <th className="px-6 py-4 w-[25%]">Pelanggan</th>
              <th className="px-6 py-4 w-[20%]">Status & Tempo</th>
              <th className="px-6 py-4 text-right w-[15%]">Nominal</th>
              <th className="px-6 py-4 text-center w-[15%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Search className="w-6 h-6 text-slate-300"/>
                  </div>
                  <p className="font-bold text-slate-700 text-base">Tidak ada tagihan ditemukan</p>
                </td>
              </tr>
            ) : (
              displayData.map((invoice) => {
                const summary = getItemSummary(invoice);
                const needsAllocation = invoice.status === 'PAID' && !invoice.isAllocated;
                
                const hasPendingProof = invoice.history?.some((h: any) => h.status === 'PENDING');
                const hasSuccessfulPayment = invoice.history?.some((h: any) => h.status === 'SUCCESS');

                return (
                  <tr key={invoice.id} className={`transition-colors group ${hasPendingProof ? 'bg-amber-50/30' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-slate-800 text-sm mb-1.5">{invoice.invoiceNumber}</div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${summary.color} max-w-[250px] truncate mb-2`}>
                        {summary.icon}
                        <span className="truncate">{summary.text}</span>
                      </div>

                      {needsAllocation && (
                        <div className="flex items-start gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded w-fit font-bold mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Belum Mapping BAS
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-slate-800 mb-1">{invoice.customerName}</div>
                      <div className="flex flex-col gap-1 mt-1.5">
                        {invoice.customerPhone && <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> {invoice.customerPhone}</div>}
                      </div>
                    </td>

                    <td className="px-6 py-5 align-top">
                      <div className="mb-2">{renderStatusWithDetails(invoice)}</div>
                      
                      {hasPendingProof && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black rounded uppercase tracking-wider mb-2 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> Ada Bukti Transfer!
                        </div>
                      )}

                      <div className="text-[11px] flex items-center gap-1.5 mt-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5"/> Tempo: {invoice.dueDate}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right align-top">
                      <div className="font-black text-slate-800 text-base mb-1">{formatRupiah(invoice.totalAmount)}</div>
                      {invoice.paidAmount > 0 && invoice.status !== 'PAID' && <div className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1 mt-1.5">Dibayar: {formatRupiah(invoice.paidAmount)}</div>}
                      {invoice.status === 'PARTIAL' && invoice.remainingAmount > 0 && <div className="text-xs text-slate-500 font-bold flex items-center justify-end gap-1 mt-1">Sisa: {formatRupiah(invoice.remainingAmount)}</div>}
                    </td>

                    <td className="px-6 py-5 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onViewDetail(invoice)} className={`p-2 rounded-lg transition-all shadow-xs ${hasPendingProof ? 'bg-amber-600 text-white hover:bg-amber-700 animate-bounce' : 'text-slate-500 bg-white border border-slate-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'}`} title="Lihat Detail & Validasi">
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasSuccessfulPayment && onOpenKwitansi && (
                          <button onClick={() => onOpenKwitansi(invoice)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all shadow-xs" title="Cetak Kwitansi">
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        
                        {needsAllocation && onAllocateBAS && (
                          <button onClick={() => onAllocateBAS(invoice)} className="p-2 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all shadow-xs" title="Alokasi ke BAS">
                            <Network className="w-4 h-4" />
                          </button>
                        )}
                        
                        {['PENDING', 'OVERDUE'].includes(invoice.status) && !hasPendingProof && (
                          <>
                            <button onClick={() => onEditInvoice(invoice)} className="p-2 text-slate-500 hover:text-amber-600 bg-white border border-slate-200 hover:border-amber-200 hover:bg-amber-50 rounded-lg transition-all shadow-xs" title="Edit Tagihan">
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button onClick={() => onGenerateLink(invoice)} disabled={processingId === invoice.id} className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all shadow-xs disabled:opacity-50" title="Salin Link Pembayaran">
                              {processingId === invoice.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="lg:hidden p-3 sm:p-4 space-y-3">
        {displayData.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">Tidak ada tagihan ditemukan</p>
          </div>
        ) : (
          displayData.map((invoice) => {
            const summary = getItemSummary(invoice);
            const needsAllocation = invoice.status === 'PAID' && !invoice.isAllocated;
            const hasPendingProof = invoice.history?.some((h: any) => h.status === 'PENDING');
            const hasSuccessfulPayment = invoice.history?.some((h: any) => h.status === 'SUCCESS');

            return (
              <div 
                key={invoice.id} 
                className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 transition-all ${
                  hasPendingProof ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''
                }`}
              >
                {/* Header: No Invoice, Layanan, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {invoice.invoiceNumber}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${summary.color}`}>
                        {summary.icon}
                        <span className="truncate max-w-[180px]">{summary.text}</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    {renderStatusWithDetails(invoice)}
                  </div>
                </div>

                {/* Pelanggan & Nominal */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{invoice.customerName}</div>
                    {invoice.customerPhone && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {invoice.customerPhone}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Tagihan</div>
                    <div className="font-black text-slate-900 text-sm sm:text-base">
                      {formatRupiah(invoice.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* Indikator Proof & Tempo */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tempo: {invoice.dueDate}
                  </span>
                  {hasPendingProof && (
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                      Ada Bukti Transfer
                    </span>
                  )}
                  {needsAllocation && (
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                      Perlu Alokasi BAS
                    </span>
                  )}
                </div>

                {/* Action Buttons: Touch Friendly */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => onViewDetail(invoice)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat & Validasi</span>
                  </button>

                  {hasSuccessfulPayment && onOpenKwitansi && (
                    <button
                      onClick={() => onOpenKwitansi(invoice)}
                      className="p-2.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                      title="Cetak Kwitansi"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  )}

                  {needsAllocation && onAllocateBAS && (
                    <button
                      onClick={() => onAllocateBAS(invoice)}
                      className="p-2.5 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
                      title="Alokasi BAS"
                    >
                      <Network className="w-4 h-4" />
                    </button>
                  )}

                  {['PENDING', 'OVERDUE'].includes(invoice.status) && !hasPendingProof && (
                    <button
                      onClick={() => onEditInvoice(invoice)}
                      className="p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                      title="Edit Tagihan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}