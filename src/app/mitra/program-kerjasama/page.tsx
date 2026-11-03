// src/app/mitra/program-kerjasama/page.tsx
'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Building2,
  CheckCircle2,
  Award,
  Layers,
  ArrowRight,
  Send,
  Users,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { useMyPartnerProfile } from '@/hooks/usePartners';
import { formatRupiah } from '@/utils/format';
import { toast } from 'sonner';

const AVAILABLE_PROGRAMS = [
  {
    id: 'cnc-machining',
    title: 'Akademi Manufaktur CNC 5-Axis Presisi',
    category: 'Manufaktur Rekayasa',
    duration: '3 Bulan Intensif',
    feePerSeat: 12500000,
    facilities: ['Lab CNC DMG MORI 5-Axis', 'Metrologi Zeiss 3D CMM', 'Mastercam License'],
    alumniCount: '280+ Lulusan',
    hiringRate: '96%',
    description: 'Pendidikan vokasi presisi tinggi standar industri otomotif dan kedirgantaraan dengan sertifikasi BNSP & sertifikat industri.',
  },
  {
    id: 'underwater-welding',
    title: 'Underwater & GTAW Specialist Welding',
    category: 'Rekayasa Pengelasan',
    duration: '2.5 Bulan',
    feePerSeat: 14000000,
    facilities: ['Kolam Simulasi Selam Dalam', 'Mesin Miller Arc Welding', 'Uji NDT Ultrasonic'],
    alumniCount: '150+ Lulusan',
    hiringRate: '98%',
    description: 'Pelatihan teknisi las spesialis bawah air dan pipa gas bertekanan tinggi untuk proyek maritim dan kilang minyak lepas pantai.',
  },
  {
    id: 'ai-robotics',
    title: 'Kecerdasan Buatan (AI) & Otomasi Robotika',
    category: 'Teknologi Tinggi & AI',
    duration: '3 Bulan',
    feePerSeat: 8500000,
    facilities: ['NVIDIA AI Workstation Lab', 'Robot Arm ABB & Fanuc', 'Edge Computing Kit'],
    alumniCount: '320+ Lulusan',
    hiringRate: '92%',
    description: 'Penyusunan model Computer Vision industri, otomasi conveyor pintar, dan implementasi predictive maintenance.',
  },
  {
    id: 'cyber-security',
    title: 'Cyber Security Defense & Security Operations (SOC)',
    category: 'Keamanan Siber',
    duration: '2 Bulan',
    feePerSeat: 9000000,
    facilities: ['Cyber Range Simulation Lab', 'SIEM Platform Tools', 'Hardware Hacking Lab'],
    alumniCount: '190+ Lulusan',
    hiringRate: '94%',
    description: 'Pendidikan analis ketahanan siber, penetration testing, serta sertifikasi pertahanan insiden IT perbankan dan BUMN.',
  },
];

export default function MitraProgramKerjasamaPage() {
  const { user, partnerId } = useAuth();
  const { data: partnerProfile } = useMyPartnerProfile(user?.uid, partnerId);

  const [selectedProg, setSelectedProg] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quotaSponsor, setQuotaSponsor] = useState<number>(5);
  const [sponsorshipType, setSponsorshipType] = useState('FULL_SCHOLARSHIP');
  const [customRequirements, setCustomRequirements] = useState('');

  const handleOpenSponsor = (prog: any) => {
    setSelectedProg(prog);
    setIsModalOpen(true);
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pengajuan Sponsorship Batch Berhasil Terkirim!', {
      description: 'Tim Akademi Solo Technopark akan menyusun draft PKS khusus batch perusahaan Anda.',
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-300 text-[11px] font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Co-Branding Kurikulum & Sponsorship Batch</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Program Pelatihan & Sinergi Industri
          </h1>
          <p className="text-xs text-purple-100/80 max-w-2xl leading-relaxed">
            Sponsori beasiswa batch khusus dengan kurikulum yang disesuaikan kebutuhan spesifik perusahaan Anda, pasang nama akademi bersama, dan rekrut langsung lulusan terbaik.
          </p>
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {AVAILABLE_PROGRAMS.map((prog) => (
          <div
            key={prog.id}
            className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-700">
                  {prog.category}
                </Badge>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Daya Serap {prog.hiringRate}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">{prog.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{prog.description}</p>
              </div>

              {/* Lab & Fasilitas */}
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 text-[11px] space-y-1 text-slate-700">
                <span className="font-bold text-purple-900 block text-[10px] uppercase">
                  Fasilitas Lab Utama:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {prog.facilities.map((fac: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-[10px] font-bold text-purple-800">
                      {fac}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[10px]">Durasi Diklat</span>
                  <strong className="text-slate-800">{prog.duration}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[10px]">Standar Biaya / Seat</span>
                  <strong className="text-purple-700 font-black">{formatRupiah(prog.feePerSeat)}</strong>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{prog.alumniCount} aktif di industri</span>
              <Button
                type="button"
                onClick={() => handleOpenSponsor(prog)}
                className="rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
              >
                <span>Ajukan Sponsorship Batch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Pengajuan Sponsor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-lg font-black">
              Sponsori Batch: {selectedProg?.title}
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Diskusikan penyesuaian materi pelatihan dan hak prioritas rekrutmen alumni.
            </p>
          </div>

          <form onSubmit={handleSendProposal} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Skema Sponsorship</label>
              <select
                value={sponsorshipType}
                onChange={(e) => setSponsorshipType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
              >
                <option value="FULL_SCHOLARSHIP">Beasiswa Penuh Ikatan Kerja (100%)</option>
                <option value="CO_FUNDING">Co-Funding / Subsidi Biaya (50%)</option>
                <option value="EXCLUSIVE_CLASS">Kelas Eksklusif Tertutup untuk Perusahaan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Jumlah Kuota Peserta (Seat)</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quotaSponsor}
                onChange={(e) => setQuotaSponsor(Number(e.target.value))}
                className="rounded-xl text-xs"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Estimasi Komitmen: <strong className="text-purple-700 font-bold">{formatRupiah((selectedProg?.feePerSeat || 0) * quotaSponsor)}</strong>
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Kebutuhan Kurikulum Khusus / Syarat Rekrutmen
              </label>
              <Textarea
                rows={3}
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="Misal: Perlu tambahan modul pengelasan pipa 6G ASME IX, atau syarat calon peserta harus bersedia ditempatkan di pabrik Cikarang..."
                className="rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white"
              >
                Kirim Inisiasi Program
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

