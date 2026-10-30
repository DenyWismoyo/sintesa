'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Hammer,
  Wrench,
  Cpu,
  Layers,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  FileText,
  Building2,
  Sparkles,
  ArrowRight,
  Phone,
  HelpCircle,
  PackageCheck,
  Zap
} from 'lucide-react';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { storageService } from '@/services/storage.service';
import { productionService } from '@/services/production.service';
import { ProductionCategory, ClientType } from '@/types/production.types';
import { useAuth } from '@/lib/AuthContext';

const CAPABILITIES = [
  {
    id: 'CNC_MACHINING',
    title: 'CNC & Presisi Machining 5-Axis',
    icon: Cpu,
    tag: 'Akurasi Tinggi',
    desc: 'Pemesinan milling dan bubut CNC kecepatan tinggi untuk komponen mekanik presisi dengan toleransi hingga mikron.',
    materials: ['Aluminium Dural', 'Stainless Steel', 'Baja Perkakas', 'Kuningan', 'POM/Teflon']
  },
  {
    id: '3D_PRINTING',
    title: '3D Printing & Additive Manufacturing',
    icon: Layers,
    tag: 'Rapid Prototyping',
    desc: 'Cetak purwarupa cepat dengan teknologi FDM & SLA resolusi tinggi sebelum masuk ke proses produksi massal.',
    materials: ['PLA+', 'PETG', 'ABS', 'Nylon Carbon Fiber', 'Tough Resin']
  },
  {
    id: 'CAD_DESIGN',
    title: 'Reverse Engineering & Desain CAD/CAM',
    icon: Sparkles,
    tag: 'Desain Terapan',
    desc: 'Pemindaian 3D laser scanner fisik komponen usang untuk rekonstruksi CAD 3D dan simulasi kekuatan mekanik FEA.',
    materials: ['Digital Twin', 'File .STEP', '.IGES', '.DWG', 'Visual Rendering']
  },
  {
    id: 'FABRIKASI_LAS',
    title: 'Fabrikasi Logam & Pengelasan Bersertifikat',
    icon: Hammer,
    tag: 'Standar Industri',
    desc: 'Pengelasan presisi TIG/MIG/SMAW dan pelatihan simulator las bawah air (Underwater Welding) dengan instruktur bersertifikasi.',
    materials: ['Struktur Baja', 'Sheet Metal Box', 'Chassis Alat', 'Piping System']
  }
];

export default function JasaProduksiPublicClient() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    clientName: user?.displayName || '',
    clientEmail: user?.email || '',
    clientPhone: '',
    clientAddress: '',
    clientType: 'Industri' as ClientType,
    projectTitle: '',
    category: 'CNC_MACHINING' as ProductionCategory,
    partName: '',
    material: 'Aluminium Dural / Baja',
    quantity: 1,
    targetDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRfq, setSubmittedRfq] = useState<{ orderNumber: string; title: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.clientPhone || !form.projectTitle) {
      toast.error('Mohon lengkapi seluruh kolom wajib bertanda bintang (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedBlueprintList: any[] = [];

      // 1. Unggah Berkas Gambar CAD / Teknik jika ada
      if (blueprintFile) {
        toast.info('Mengunggah gambar teknik CAD...');
        const fileUrl = await storageService.uploadFile(blueprintFile, 'production/blueprints');
        uploadedBlueprintList.push({
          id: Date.now().toString(),
          name: blueprintFile.name,
          url: fileUrl,
          uploadedAt: Date.now(),
          size: blueprintFile.size
        });
      }

      // 2. Format Nomor SPK/RFQ
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const generatedOrderNumber = `RFQ/STP/${dateStr}/${randNum}`;

      // 3. Simpan ke sistem jasa produksi
      const payload: any = {
        orderNumber: generatedOrderNumber,
        clientName: form.clientName,
        clientType: form.clientType,
        clientPhone: form.clientPhone,
        clientEmail: form.clientEmail || '',
        clientAddress: form.clientAddress || '-',
        clientPic: form.clientName,
        projectTitle: form.projectTitle,
        category: form.category,
        items: [
          {
            id: Date.now().toString(),
            partName: form.partName || form.projectTitle,
            material: form.material,
            dimensions: '-',
            quantity: Number(form.quantity) || 1,
            unit: 'Pcs',
            unitPrice: 0,
            totalPrice: 0,
            notes: form.notes || 'Permintaan Penawaran Online (RFQ)'
          }
        ],
        blueprintFiles: uploadedBlueprintList,
        estimatedDurationDays: 14,
        targetDeliveryDate: form.targetDeliveryDate,
        status: 'ESTIMATION',
        productionProgress: 0,
        assignedTechnician: 'Tim Engineering Bengkel STP',
        workshopLocation: 'Workshop Manufaktur Presisi STP',
        workNotes: [
          {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            percentage: 0,
            note: 'Permintaan penawaran (RFQ) masuk dari portal publik. Menunggu telaah teknis dan perhitungan RAB bahan.',
            author: form.clientName
          }
        ],
        totalCost: 0,
        dpRequired: true,
        dpPercentage: 30,
        dpAmount: 0,
        paymentStatus: 'UNPAID',
        notes: `Permintaan RFQ Publik: ${form.notes || '-'}`
      };

      const created = await productionService.createProductionOrder(payload);

      if (created) {
        setSubmittedRfq({ orderNumber: generatedOrderNumber, title: form.projectTitle });
        toast.success('Permintaan Penawaran (RFQ) Berhasil Terkirim!');
      } else {
        throw new Error('Gagal menyimpan pesanan.');
      }
    } catch (err: any) {
      console.error('Gagal mengirim RFQ:', err);
      toast.error('Gagal mengirim permintaan: ' + (err.message || 'Coba beberapa saat lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SectionContainer accent="sky" width="default">
      {/* 1. HERO HEADER */}
      <PageHero
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Fasilitas', href: '/fasilitas' },
          { label: 'Layanan Jasa Produksi' },
        ]}
        title="Layanan Jasa Produksi & Manufaktur Presisi"
        subtitle="Solusi terpadu permesinan CNC 5-Axis, prototyping 3D, reverse engineering, dan fabrikasi logam berstandar industri dengan fasilitas modern Solo Technopark."
        badge={{
          label: 'Fasilitas Manufaktur & Prototyping BLUD',
          variant: 'sky'
        }}
        accentColor="sky"
      />

      <div className="space-y-16 pt-6 sm:pt-8">

        {/* 2. GRID SHOWCASE KAPABILITAS BENGKEL */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Kapabilitas Workshop STP</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Pusat Fabrikasi Presisi & Rekayasa Rekatekstil
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Didukung mesin modern berstandar industri dan teknisi bersertifikat nasional untuk melayani kebutuhan B2B, universitas, maupun riset startup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.id}
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <cap.icon size={24} />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600">
                        {cap.tag}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                        {cap.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {cap.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {cap.materials.map((m, i) => (
                      <span key={i} className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. FORMULIR REQUEST FOR QUOTATION (RFQ) */}
          <div id="rfq-form" className="max-w-3xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-lg">
            
            {submittedRfq ? (
              <div className="text-center py-10 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">
                    Permintaan Penawaran (RFQ) Berhasil Terkirim!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Nomor Tiket RFQ Anda: <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{submittedRfq.orderNumber}</span>
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Tim Enjiniring & Estimasi Bengkel Solo Technopark akan menelaah gambar teknik dan menghubungi kontak Anda dalam 1x24 jam kerja.
                  </p>
                </div>
                <Button
                  onClick={() => setSubmittedRfq(null)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6"
                >
                  Ajukan Permintaan Lain
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold mb-2">
                    <Zap size={14} /> Formulir Permintaan Penawaran (RFQ)
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Kirim Kebutuhan Manufaktur & Prototyping
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Unggah desain teknik Anda untuk mendapatkan estimasi Rencana Anggaran Biaya (RAB) dan estimasi jam pengerjaan mesin.
                  </p>
                </div>

                {/* PROFIL PEMESAN */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Data Pemohon / Perusahaan</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">
                        Nama Pemohon / Instansi <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="Contoh: PT Industri Presisi Mandiri"
                        value={form.clientName}
                        onChange={(e) => setForm(prev => ({ ...prev, clientName: e.target.value }))}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Tipe Entitas</Label>
                      <select
                        value={form.clientType}
                        onChange={(e) => setForm(prev => ({ ...prev, clientType: e.target.value as ClientType }))}
                        className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="Industri">Industri / Korporasi</option>
                        <option value="Instansi">Instansi Pemerintah / BUMN</option>
                        <option value="UMKM">UMKM / Startup Binaan</option>
                        <option value="Perorangan">Perorangan / Akademisi / Mahasiswa</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">
                        Nomor WhatsApp PIC <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="08xxxxxxxxxx"
                        value={form.clientPhone}
                        onChange={(e) => setForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Email Resmi</Label>
                      <Input
                        type="email"
                        placeholder="kontak@perusahaan.com"
                        value={form.clientEmail}
                        onChange={(e) => setForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SPESIFIKASI PEKERJAAN */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Rincian Teknis & Gambar Kerja</h4>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Nama Proyek / Komponen <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Contoh: Pembuatan Gearbox Flange Pompa Industri 5 Pcs"
                      value={form.projectTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, projectTitle: e.target.value }))}
                      required
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Kategori Permesinan</Label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as ProductionCategory }))}
                        className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="CNC_MACHINING">CNC Machining 5-Axis</option>
                        <option value="3D_PRINTING">3D Printing / Prototyping</option>
                        <option value="FABRIKASI_LAS">Fabrikasi & Las Logam</option>
                        <option value="CAD_DESIGN">Desain CAD & Reverse Eng</option>
                        <option value="ELECTRONICS_IOT">Elektronika & Perakitan IoT</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Bahan / Material Utama</Label>
                      <Input
                        placeholder="Misal: Dural 6061 / SS304"
                        value={form.material}
                        onChange={(e) => setForm(prev => ({ ...prev, material: e.target.value }))}
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Jumlah Unit (Pcs)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* UNGGAH GAMBAR TEKNIK */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Unggah Gambar Kerja / Berkas CAD 3D (.step, .dwg, .pdf, .zip)
                    </Label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
                      <input
                        type="file"
                        id="blueprint-upload"
                        className="hidden"
                        onChange={(e) => setBlueprintFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="blueprint-upload" className="cursor-pointer block">
                        <UploadCloud size={24} className="text-slate-400 mx-auto mb-1" />
                        <span className="text-xs font-bold text-slate-700 block">
                          {blueprintFile ? blueprintFile.name : 'Pilih file CAD / Gambar Kerja 2D/3D'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Format: STEP, IGES, STL, DWG, DXF, PDF, ZIP (Maks. 25MB)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Catatan Khusus & Toleransi Presisi</Label>
                    <textarea
                      rows={3}
                      placeholder="Sebutkan toleransi presisi (misal: ±0.02 mm), perlakuan panas (hardening), atau finishing permukaan yang diinginkan..."
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Mengirimkan Permintaan RFQ...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Kirim Permintaan Penawaran (RFQ)</span>
                      </>
                    )}
                  </Button>
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    Layanan resmi BLUD UPTD Kawasan Sains dan Teknologi Solo Technopark.
                  </p>
                </div>
              </form>
            )}

          </div>

        </div>
    </SectionContainer>
  );
}

