// src/app/(admin)/booking/components/TabKemitraanB2B.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PartnershipInquiry } from '@/types/partnership.types';
import { partnershipService } from '@/services/partnership.service';
import {
  Handshake,
  Building2,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  MessageCircle,
  Edit,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const STATUS_LABELS: Record<PartnershipInquiry['status'], { label: string; color: string }> = {
  PENDING: { label: 'Menunggu Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONTACTED: { label: 'Telah Dihubungi PIC', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  MEETING_SCHEDULED: { label: 'Jadwal Rapat / Site Visit', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  MOU_DRAFTED: { label: 'Penyusunan MoU / PKS', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  CLOSED: { label: 'Selesai / Terlaksana', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function TabKemitraanB2B() {
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState<PartnershipInquiry['status']>('PENDING');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await partnershipService.getAllInquiries();
      setInquiries(data);
    } catch (err) {
      console.error('Gagal mengambil data kemitraan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter((inq) => {
    const q = searchQuery.toLowerCase();
    return (
      inq.agencyName.toLowerCase().includes(q) ||
      inq.picName.toLowerCase().includes(q) ||
      inq.subject.toLowerCase().includes(q) ||
      inq.partnershipType.toLowerCase().includes(q)
    );
  });

  const handleOpenDetail = (inq: PartnershipInquiry) => {
    setSelectedInquiry(inq);
    setNewStatus(inq.status);
    setAdminNotes(inq.adminNotes || '');
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedInquiry || !selectedInquiry.id) return;
    setIsUpdating(true);
    try {
      const success = await partnershipService.updateInquiryStatus(
        selectedInquiry.id,
        newStatus,
        adminNotes
      );
      if (success) {
        toast.success('Status Kemitraan Berhasil Diperbarui!');
        setIsDetailModalOpen(false);
        fetchInquiries();
      } else {
        toast.error('Gagal memperbarui status');
      }
    } catch (err: any) {
      toast.error('Error update: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4">
      {/* Header & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-indigo-600" />
              <span>Tiket Permohonan Kemitraan & RFP B2B</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
              {inquiries.length} Pengajuan
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Daftar inisiasi kerjasama resmi dari BUMN, Kementerian, Korporasi Swasta, dan Perguruan Tinggi.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari instansi, PIC, perihal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Tabel Pengajuan Kemitraan */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs">Memuat data kemitraan...</span>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-2">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Belum Ada Pengajuan Kemitraan Baru</p>
          <p className="text-xs text-slate-400">
            Permohonan kerjasama melalui halaman publik /kemitraan akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-150">
              <tr>
                <th className="px-5 py-3 w-[28%]">Instansi / Pemohon</th>
                <th className="px-5 py-3 w-[22%]">Bidang Kerjasama</th>
                <th className="px-5 py-3 w-[26%]">Perihal & Linimasa</th>
                <th className="px-5 py-3 w-[14%]">Status</th>
                <th className="px-5 py-3 w-[10%] text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInquiries.map((inq) => {
                const statusMeta = STATUS_LABELS[inq.status] || STATUS_LABELS.PENDING;
                return (
                  <tr key={inq.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {inq.agencyName}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                        {inq.agencyType}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                        <span className="font-medium text-slate-800">{inq.picName}</span>
                        {inq.picPosition && <span className="text-slate-400">({inq.picPosition})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{inq.picPhone}</span>
                        <span>•</span>
                        <span>{inq.picEmail}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/60 text-indigo-900 font-bold text-[10px]">
                        {inq.partnershipType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800 line-clamp-1">{inq.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {inq.proposalSummary || '-'}
                      </div>
                      {inq.estimatedTimeline && (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {inq.estimatedTimeline}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusMeta.color}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right pr-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(inq)}
                        className="h-8 px-3 rounded-lg text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      >
                        Kelola
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail & Update Status Kemitraan */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Kelola Pengajuan Kemitraan B2B
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui status tindak lanjut, kontak PIC, dan catatan internal admin.
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Instansi:</span>
                  <span className="font-extrabold text-slate-900">{selectedInquiry.agencyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Kategori:</span>
                  <span className="font-semibold text-slate-700">{selectedInquiry.agencyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">PIC & Jabatan:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedInquiry.picName} ({selectedInquiry.picPosition || '-'})
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-500">Kontak WhatsApp:</span>
                  <a
                    href={`https://wa.me/${selectedInquiry.picPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{selectedInquiry.picPhone} (Chat WA)</span>
                  </a>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Perihal Kerjasama:</span>
                <p className="p-2.5 rounded-xl bg-white border border-slate-200 font-medium text-slate-800">
                  {selectedInquiry.subject}
                </p>
              </div>

              {selectedInquiry.proposalSummary && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">
                    Ringkasan Proposal / KAK:
                  </span>
                  <p className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedInquiry.proposalSummary}
                  </p>
                </div>
              )}

              {/* Form Update Status */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-800 block">
                  Status Tindak Lanjut Tim STP:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full h-9.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="PENDING">Menunggu Review</option>
                  <option value="CONTACTED">Telah Dihubungi PIC</option>
                  <option value="MEETING_SCHEDULED">Jadwal Rapat / Site Visit</option>
                  <option value="MOU_DRAFTED">Penyusunan MoU / PKS</option>
                  <option value="CLOSED">Selesai / Terlaksana</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Catatan Internal Admin / Progres:
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Rapat koordinasi teknis via Zoom telah dilakukan pada 14 Oktober..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl h-9 text-xs font-semibold"
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                  className="rounded-xl h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Simpan Progres Kemitraan</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
