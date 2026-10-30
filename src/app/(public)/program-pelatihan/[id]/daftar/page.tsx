'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Training, TrainingBatch } from '@/types';
import { useTraining } from '@/hooks/useTraining';
import { useAuth } from '@/lib/AuthContext';
import { billingService } from '@/services/billing.service';
import { affiliateService } from '@/services/affiliate.service';
import { batchService } from '@/services/batch.service';
import { getActiveRefCode } from '@/components/common/AffiliateTracker';
import { motion } from 'framer-motion';
import Link from 'next/link';

import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  FileText,
  UploadCloud,
  File as FileIcon,
  CreditCard,
  Badge,
  Calendar,
  Layers,
  CheckCircle,
  Tag,
  Building2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PendaftaranKelasPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trainingId = params?.id as string;
  const initialVoucher = searchParams?.get('voucher') || '';
  const initialBatch = searchParams?.get('batch') || '';

  const { user } = useAuth();
  const { registerForTraining, uploadImage } = useTraining();

  const [training, setTraining] = useState<Training | null>(null);
  const [batches, setBatches] = useState<TrainingBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [voucherInput, setVoucherInput] = useState<string>(initialVoucher);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    label: string;
    source: 'PARTNER_DINAS' | 'PARTNER_SMK' | 'PARTNER_CSR';
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    origin: ''
  });

  const [customData, setCustomData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchTrainingAndBatches = async () => {
      if (!trainingId) return;
      try {
        const [docSnap, bList] = await Promise.all([
          getDoc(doc(db, 'trainings', trainingId)),
          batchService.getBatches(trainingId),
        ]);

        if (docSnap.exists()) {
          setTraining({ id: docSnap.id, ...docSnap.data() } as Training);
        }
        setBatches(bList);

        if (bList.length > 0) {
          if (initialBatch) {
            const matched = bList.find(b => String(b.batchNumber) === initialBatch || b.id === initialBatch);
            if (matched) setSelectedBatchId(matched.id);
            else setSelectedBatchId(bList[0].id);
          } else {
            const openBatch = bList.find(b => b.status === 'REGISTRATION_OPEN') || bList[0];
            setSelectedBatchId(openBatch.id);
          }
        }
      } catch (error) {
        console.error("Gagal memuat data kelas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainingAndBatches();
  }, [trainingId, initialBatch]);

  useEffect(() => {
    if (initialVoucher) {
      applyVoucherCode(initialVoucher);
    }
  }, [initialVoucher]);

  const applyVoucherCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    if (clean.includes('DINAS') || clean.includes('DISNAKER') || clean.includes('PEMKOT')) {
      setAppliedVoucher({
        code: clean,
        label: 'Beasiswa Kemitraan Dinas / Pemkot Surakarta (100% Subsidi)',
        source: 'PARTNER_DINAS'
      });
      toast.success('Voucher Kemitraan Dinas Berhasil Digunakan!', { description: 'Biaya pendaftaran disubsidi penuh 100%.' });
    } else if (clean.includes('SMK') || clean.includes('VOKASI') || clean.includes('KAMPUS')) {
      setAppliedVoucher({
        code: clean,
        label: 'Program Vokasi Kemitraan Sekolah / Kampus (100% Subsidi)',
        source: 'PARTNER_SMK'
      });
      toast.success('Voucher Kemitraan Vokasi Berhasil Digunakan!', { description: 'Biaya pendaftaran disubsidi penuh 100%.' });
    } else if (clean.includes('CSR') || clean.includes('INDUSTRI')) {
      setAppliedVoucher({
        code: clean,
        label: 'Program Penugasan Industri & CSR Korporasi (100% Subsidi)',
        source: 'PARTNER_CSR'
      });
      toast.success('Voucher CSR Industri Berhasil Digunakan!', { description: 'Biaya pendaftaran disubsidi penuh 100%.' });
    } else {
      toast.error('Kode voucher tidak valid atau tidak berlaku untuk program ini.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  if (!training) return <div className="min-h-screen flex items-center justify-center text-slate-500">Kelas tidak ditemukan.</div>;

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const isFull = (training.registeredCount || 0) >= (training.quota || 0) && training.quota !== 0;

  const handleCustomDataChange = (label: string, value: any) => {
    setCustomData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFull) return toast.error("Maaf, kuota kelas ini sudah penuh.");

    setIsSubmitting(true);
    try {
      const finalCustomData: Record<string, string> = {};
      
      for (const field of (training.registrationFields || [])) {
        const value = customData[field.label];
        
        if (field.isRequired && !value) {
           throw new Error(`Syarat "${field.label}" wajib diisi!`);
        }

        if (field.type === 'file' && value instanceof File) {
          toast.info(`Mengunggah dokumen ${field.label}...`);
          const uploadRes = await uploadImage(value);
          if (!uploadRes.success || !uploadRes.url) {
            throw new Error(`Gagal mengunggah file ${field.label}`);
          }
          finalCustomData[field.label] = uploadRes.url;
        } else if (value) {
          finalCustomData[field.label] = String(value);
        }
      }

      toast.info("Menyimpan data pendaftaran...");
      const refCode = getActiveRefCode();

      const isSubsidized = !!appliedVoucher;
      const isActuallyFree = training.isFree || isSubsidized;

      const selectedBatch = batches.find(b => b.id === selectedBatchId);

      let generatedInvoiceId: string | undefined = undefined;

      if (!isActuallyFree) {
        // 1. Buat Tagihan Resmi Terlebih Dahulu agar invoiceId tersimpan sejak dokumen pertama
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const invNumber = `INV-TRN-${Date.now().toString().slice(-6)}`;
        const price = training.price || 0;

        const newInvoiceData = {
          invoiceNumber: invNumber,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          customerType: 'Umum' as const,
          items: [{
            id: Date.now().toString(),
            referenceType: 'TRAINING' as const,
            referenceId: training.id as string,
            description: `Pendaftaran Pelatihan: ${training.title}`,
            quantity: 1,
            unitPrice: price,
            total: price
          }],
          subTotal: price,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: price,
          paidAmount: 0,
          remainingAmount: price,
          term: 'FULL_PAYMENT' as const,
          date: today,
          dueDate: dueDate,
          status: 'PENDING' as const,
          division: 'DIKLAT_PELATIHAN' as const,
          divisionPic: (training as any).instructor || 'Divisi Diklat STP',
          divisionRefNumber: training.id as string,
          referralCode: refCode || undefined,
          issuerName: '',
          issuerRole: 'Kasir' as const,
          issuerNIP: '',
          notes: `Pendaftaran Peserta: ${form.name} (${form.email}) - Pelatihan: ${training.title}`,
          history: []
        };

        const createdId = await billingService.createInvoice(newInvoiceData);
        if (createdId) generatedInvoiceId = createdId;
      }

      const regData = {
        ...form,
        batchId: selectedBatch?.id || undefined,
        batchNumber: selectedBatch?.batchNumber || undefined,
        registrationSource: appliedVoucher ? appliedVoucher.source : 'CATALOG_ONLINE',
        customData: finalCustomData,
        paymentStatus: isActuallyFree ? 'FREE' : 'PENDING',
        status: isActuallyFree ? 'CONFIRMED' : 'PENDING',
        referralCode: refCode || undefined,
        invoiceId: generatedInvoiceId || undefined
      };

      const regRes = await registerForTraining(training.id as string, regData);
      
      if (!regRes.success) {
         throw new Error(regRes.error || "Gagal mendaftar ke server.");
      }

      const invoiceId = generatedInvoiceId;

      if (!isActuallyFree) {
        // Jika ada referralCode aktif, catat komisi pending untuk mitra afiliasi
        const price = training.price || 0;
        if (refCode && price > 0 && invoiceId) {
          try {
            const partner = await affiliateService.getAffiliateByCode(refCode);
            if (partner && partner.userId !== user?.uid) {
              const settings = await affiliateService.getAffiliateSettings();
              const rate = settings.trainingCommissionRate || 0.05;
              const commissionAmount = Math.round(price * rate);

              await affiliateService.createCommission({
                affiliateId: partner.userId,
                referralCode: refCode,
                domain: 'PELATIHAN',
                itemId: training.id as string,
                itemTitle: training.title,
                customerName: form.name,
                customerEmail: form.email,
                transactionAmount: price,
                commissionRate: rate,
                commissionAmount: commissionAmount,
                invoiceId: invoiceId
              });
            }
          } catch (affErr) {
            console.warn("Gagal mencatat komisi afiliasi pendaftaran:", affErr);
          }
        }

        toast.success("Pendaftaran Berhasil!", { 
          description: "Tagihan telah diterbitkan. Silakan selesaikan pembayaran di menu Tagihan Profil Anda." 
        });
        router.push(`/profil`); 
      } else {
        toast.success("Pendaftaran Berhasil!", { description: "Pendaftaran kelas gratis telah dikonfirmasi." });
        router.push(`/ruang-belajar`);
      }

    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses pendaftaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-10 pb-24">
      {/* LAYOUT UPDATE: Mengikuti katalog max-w-[1920px] */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10">
        
        <div className="mb-8">
          <Link href={`/program-pelatihan/${training.id}`} className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2"/> Kembali ke Detail Kelas
          </Link>
          <h1 className="text-3xl font-black text-slate-900">Checkout & Pendaftaran</h1>
          <p className="text-slate-500 mt-2">Lengkapi data diri dan persyaratan di bawah ini untuk bergabung.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            
            {/* Step 1: Pilihan Batch Pelatihan Kuartal I - IV (Jika Ada) */}
            {batches.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                    Pilih Batch Pelatihan (Kuartal I–IV)
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">Tahun {batches[0]?.year}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {batches.map((b) => {
                    const isSelected = selectedBatchId === b.id;
                    const isBatchOpen = b.status === 'REGISTRATION_OPEN';
                    const isBatchFull = b.registeredCount >= b.quota && b.quota > 0;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          if (!isBatchFull) setSelectedBatchId(b.id);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                            : isBatchFull
                            ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isBatchOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isBatchOpen ? 'Pendaftaran Dibuka' : b.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              Kuota: {b.registeredCount}/{b.quota}
                            </span>
                          </div>

                          <h4 className="font-black text-slate-900 text-sm">{b.title}</h4>
                          <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                            <Calendar size={13} className="text-slate-400 shrink-0" />
                            <span>
                              {new Date(b.startDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} – {new Date(b.endDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Jalur: {b.fundingScheme.replace('_', ' ')}</span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-blue-600 font-bold">
                              <CheckCircle size={13} /> Terpilih
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                 <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">{batches.length > 0 ? '2' : '1'}</span> Informasi Pribadi
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-bold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input 
                    required 
                    value={form.name} 
                    onChange={e=>setForm({...form, name: e.target.value})} 
                    className="h-11 rounded-xl" 
                    placeholder="Nama sesuai identitas" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-700 flex justify-between">
                    <span>Alamat Email <span className="text-red-500">*</span></span>
                    {user?.email && <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Terverifikasi</span>}
                  </Label>
                  <Input 
                    type="email" 
                    required 
                    value={form.email} 
                    onChange={e=>setForm({...form, email: e.target.value})} 
                    className={`h-11 rounded-xl ${user?.email ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200 focus-visible:ring-0' : ''}`} 
                    placeholder="email@anda.com" 
                    readOnly={!!user?.email}
                    title={user?.email ? "Email diambil secara otomatis dari akun Google Anda." : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-slate-700">Nomor WhatsApp <span className="text-red-500">*</span></Label>
                  <Input type="tel" required value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="h-11 rounded-xl" placeholder="08..." />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-bold text-slate-700">Asal Instansi / Universitas <span className="text-red-500">*</span></Label>
                  <Input required value={form.origin} onChange={e=>setForm({...form, origin: e.target.value})} className="h-11 rounded-xl" placeholder="Cth: PT Teknologi Maju / Universitas Sebelas Maret" />
                </div>
              </div>
            </motion.div>

            {training.registrationFields && training.registrationFields.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Dokumen Persyaratan
                </h2>
                
                <div className="space-y-6">
                  {training.registrationFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                        {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                      </Label>
                      
                      {field.type === 'text' && (
                        <Input 
                          required={field.isRequired}
                          value={customData[field.label] || ''}
                          onChange={(e) => handleCustomDataChange(field.label, e.target.value)}
                          className="h-11 rounded-xl"
                          placeholder="Jawaban Anda..."
                        />
                      )}

                      {field.type === 'link' && (
                        <Input 
                          type="url"
                          required={field.isRequired}
                          value={customData[field.label] || ''}
                          onChange={(e) => handleCustomDataChange(field.label, e.target.value)}
                          className="h-11 rounded-xl"
                          placeholder="https://..."
                        />
                      )}

                      {field.type === 'file' && (
                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <input 
                            type="file" 
                            required={field.isRequired && !customData[field.label]}
                            onChange={(e) => handleCustomDataChange(field.label, e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {customData[field.label] instanceof File ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                              <FileIcon size={18} /> {customData[field.label].name}
                            </div>
                          ) : (
                            <>
                              <UploadCloud size={24} className="text-slate-400 mb-1" />
                              <p className="text-sm font-semibold text-slate-600">Klik untuk mengunggah</p>
                              <p className="text-xs text-slate-400 mt-1">PDF, JPG, atau PNG (Maks 2MB)</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1 xl:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl border border-slate-200/80 shadow-xl sticky top-24 overflow-hidden flex flex-col">
              
              {/* IMAGE THUMBNAIL UPDATE: 3:4 Aspect Ratio */}
              <div className="w-full aspect-[3/4] bg-slate-100 relative shrink-0">
                {training.imageUrl ? (
                   <img src={training.imageUrl} alt="Poster" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex flex-col justify-center items-center text-slate-300">
                      <FileText size={48} className="mb-2"/>
                      <span className="text-xs font-semibold uppercase">Poster Kelas</span>
                   </div>
                )}
                {/* Gradient di atas gambar untuk tulisan "Ringkasan Pesanan" */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-900/80 to-transparent p-5">
                   <h3 className="font-bold text-lg text-white mb-1 shadow-sm">Ringkasan Pesanan</h3>
                   <p className="text-xs text-slate-300 font-medium">Transaksi aman & terenkripsi</p>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <Badge className="mb-2 bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2.5">{training.type}</Badge>
                  <h4 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2">{training.title}</h4>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                    <span>Harga Kelas</span>
                    <span className="text-slate-800">{training.isFree ? 'Rp 0' : formatRupiah(training.price)}</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex items-center justify-between text-sm font-bold text-emerald-600">
                      <span>Subsidi Kemitraan</span>
                      <span>- {formatRupiah(training.price || 0)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-bold text-slate-500">
                    <span>Pajak & Layanan</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Gratis</span>
                  </div>
                </div>

                {/* Voucher Kemitraan Box */}
                {!training.isFree && (
                  <div className="space-y-2 pt-2 border-t border-slate-150">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag size={13} className="text-amber-500" /> Kode Voucher / Kemitraan
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value)}
                        placeholder="Cth: STP-DISNAKER / STP-SMK"
                        className="h-10 text-xs uppercase font-mono rounded-xl bg-slate-50"
                        disabled={!!appliedVoucher}
                      />
                      {appliedVoucher ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAppliedVoucher(null);
                            setVoucherInput('');
                            toast.info("Voucher kemitraan dilepas.");
                          }}
                          className="h-10 text-xs font-bold text-red-600 rounded-xl hover:bg-red-50 shrink-0"
                        >
                          Batal
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyVoucherCode(voucherInput)}
                          className="h-10 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 shrink-0"
                        >
                          Pakai
                        </Button>
                      )}
                    </div>
                    {appliedVoucher && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2 animate-in fade-in">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{appliedVoucher.label}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">100% Bebas Biaya Pendaftaran</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <hr className="border-slate-200 border-dashed" />

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-base">Total Tagihan</span>
                  <span className="font-black text-2xl text-slate-900">
                    {training.isFree || appliedVoucher ? (
                      <span className="text-emerald-600">Gratis</span>
                    ) : (
                      formatRupiah(training.price)
                    )}
                  </span>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isFull}
                  className={`w-full h-14 rounded-2xl text-base font-bold shadow-lg transition-all mt-2 ${isFull ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50'}`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                  ) : (training.isFree || appliedVoucher) ? (
                    'Selesaikan Pendaftaran (Gratis)'
                  ) : (
                    <><CreditCard className="mr-2 h-5 w-5" /> Lanjut ke Pembayaran</>
                  )}
                </Button>

                <div className="flex items-start gap-2.5 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Dengan mendaftar, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi KST Solo Technopark.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

        </form>
      </div>
    </div>
  );
}