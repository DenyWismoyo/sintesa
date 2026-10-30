'use client';

import React, { useState, useEffect } from 'react';
import { AppEvent, EventRegistration } from '@/types';
import { eventService } from '@/services/event.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Download,
  QrCode,
  Loader2,
  Phone,
  Mail,
  Building2,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/utils/format';
import * as XLSX from 'xlsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: AppEvent | null;
}

export default function ModalPesertaEvent({ isOpen, onClose, event }: Props) {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketInput, setTicketInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchRegistrations = async () => {
    if (!event?.id) return;
    setLoading(true);
    try {
      const data = await eventService.getEventRegistrations(event.id);
      setRegistrations(data);
    } catch (err) {
      console.error('Gagal mengambil pendaftar event:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchRegistrations();
      setSearchTerm('');
      setTicketInput('');
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const filtered = registrations.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.ticketCode.toLowerCase().includes(q) ||
      (r.agency && r.agency.toLowerCase().includes(q))
    );
  });

  const attendedCount = registrations.filter(r => r.status === 'ATTENDED').length;

  const handleManualCheckIn = async (ticketCode: string) => {
    if (!event.id) return;
    setIsVerifying(true);
    const res = await eventService.verifyAttendance(event.id, ticketCode);
    setIsVerifying(false);
    if (res.success) {
      toast.success(`Check-in berhasil untuk ${res.registration?.name}!`);
      setTicketInput('');
      fetchRegistrations();
    } else {
      toast.error(res.error || 'Check-in gagal');
    }
  };

  const handleExportExcel = () => {
    if (registrations.length === 0) {
      toast.error('Belum ada data pendaftar.');
      return;
    }
    const dataToExport = registrations.map((r, idx) => ({
      'No': idx + 1,
      'Kode Tiket': r.ticketCode,
      'Nama Lengkap': r.name,
      'Email': r.email,
      'No. WhatsApp': r.phone,
      'Asal Instansi': r.agency || '-',
      'Kategori Tiket': r.ticketTierName || 'Reguler',
      'Biaya (Rp)': r.price || 0,
      'Status Tiket': r.status,
      'Waktu Registrasi': new Date(r.registeredAt).toLocaleString('id-ID'),
      'Waktu Hadir (Check-in)': r.attendedAt ? new Date(r.attendedAt).toLocaleString('id-ID') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peserta Event');
    XLSX.writeFile(wb, `Peserta_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    toast.success('Daftar peserta berhasil diekspor ke Excel!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-6 rounded-3xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[11px] font-bold mb-1">
                <Ticket size={12} />
                <span>Manajemen Kehadiran & Tiket</span>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 line-clamp-1">
                {event.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Total Pendaftar: <strong>{registrations.length}</strong> orang • Hadir di Lokasi: <strong className="text-emerald-600">{attendedCount}</strong> orang
              </DialogDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              className="rounded-xl text-xs font-bold gap-2 self-start sm:self-auto shrink-0"
            >
              <Download size={14} /> Ekspor Excel
            </Button>
          </div>
        </DialogHeader>

        {/* TOOLBAR CHECK-IN & CARI */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-3 border-b border-slate-100 bg-slate-50/50 -mx-6 px-6">
          {/* Quick Check-in by Ticket Code */}
          <div className="md:col-span-6 flex items-center gap-2">
            <div className="relative flex-1">
              <QrCode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Scan / Ketik Kode Tiket (TKT-EVT-...)"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && ticketInput.trim()) {
                    handleManualCheckIn(ticketInput.trim());
                  }
                }}
                className="pl-9 h-9 text-xs rounded-xl bg-white uppercase font-mono font-bold"
              />
            </div>
            <Button
              type="button"
              disabled={isVerifying || !ticketInput.trim()}
              onClick={() => handleManualCheckIn(ticketInput.trim())}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
            >
              {isVerifying ? <Loader2 size={13} className="animate-spin" /> : 'Check-In'}
            </Button>
          </div>

          {/* Filter Pencarian Peserta */}
          <div className="md:col-span-6 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama, email, WhatsApp, instansi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-white"
            />
          </div>
        </div>

        {/* TABEL DAFTAR PESERTA */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y divide-slate-100">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={28} className="animate-spin text-violet-600" />
              <p className="text-xs font-bold text-slate-500">Memuat data pendaftar tiket...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Users size={36} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Tidak ada data pendaftar</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {searchTerm ? 'Tidak ada pendaftar yang cocok dengan kata kunci pencarian.' : 'Belum ada tiket yang terdaftar untuk acara ini.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Kode Tiket</th>
                    <th className="py-2.5 px-3">Nama & Kontak</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const isAttended = item.status === 'ATTENDED';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-violet-700">
                          {item.ticketCode}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-500">{item.agency || '-'}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><Mail size={11} /> {item.email}</span>
                            <span className="flex items-center gap-1"><Phone size={11} /> {item.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {item.ticketTierName || 'Reguler'}
                          </Badge>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {item.price > 0 ? formatRupiah(item.price) : 'Gratis'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isAttended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 size={11} /> Hadir di Lokasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                              <Clock size={11} /> Terdaftar
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isAttended ? (
                            <span className="text-[11px] font-bold text-slate-400">Selesai Check-in</span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleManualCheckIn(item.ticketCode)}
                              className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Check-In
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

