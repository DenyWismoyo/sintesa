// Lokasi file: src/app/(public)/verifikasi-sertifikat/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  GraduationCap,
  Calendar,
  Building2,
  Share2,
  Printer,
  Sparkles,
  ArrowRight,
  QrCode,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SectionContainer from '@/components/ui/SectionContainer';
import { alumniService } from '@/services/alumni.service';
import { toast } from 'sonner';

function VerifikasiSertifikatContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (queryCode: string) => {
    const clean = queryCode.trim();
    if (!clean) {
      toast.error('Masukkan nomor sertifikat atau kode registrasi.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await alumniService.verifyCertificate(clean);
      if (res.found && res.data) {
        setResult(res.data);
      } else {
        setErrorMsg(res.error || 'Data sertifikat tidak ditemukan.');
      }
    } catch (err: any) {
      setErrorMsg('Gagal memverifikasi sertifikat. Coba lagi dalam beberapa saat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  const handleShare = () => {
    if (typeof window !== 'undefined' && result) {
      const shareUrl = `${window.location.origin}/verifikasi-sertifikat?code=${encodeURIComponent(result.registrationCode)}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Tautan verifikasi disalin ke papan klip!');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <SectionContainer accent="emerald" width="narrow">
      <div className="py-8 sm:py-12 space-y-8">
        {/* HERO HEADER */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 shadow-2xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Pusat Validasi Resmi BLUD Solo Technopark</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verifikasi Keaslian E-Sertifikat & Kelulusan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Periksa keabsahan sertifikat pelatihan vokasi Solo Technopark dan lulusan program Rumah Siap Kerja Bersama (RSKB) Kota Surakarta secara seketika (*real-time*).
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(code);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: AL-2024-829103 atau RSKB-2024-512049"
                className="pl-11 h-12 rounded-2xl text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white font-medium transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              {loading ? (
                <span>Memvalidasi...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cek Keaslian</span>
                </>
              )}
            </Button>
          </form>
          <p className="text-[11px] text-slate-400 mt-2.5 ml-1">
            *Masukkan Nomor Registrasi atau Nomor Sertifikat yang tertera di bagian bawah dokumen Anda.
          </p>
        </div>

        {/* HASIL VERIFIKASI */}
        {searched && !loading && (
          <div>
            {result ? (
              <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Badge Status Resmi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-150">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={28} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Sertifikat Sah & Terdaftar
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        {result.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="rounded-xl text-xs font-bold gap-1.5 h-9"
                    >
                      <Share2 size={13} />
                      <span>Bagikan</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="rounded-xl text-xs font-bold gap-1.5 h-9"
                    >
                      <Printer size={13} />
                      <span>Cetak</span>
                    </Button>
                  </div>
                </div>

                {/* Detail Sertifikat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Program Pelatihan / Kejuruan
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{result.programTaken}</p>
                    {result.batch && (
                      <p className="text-slate-500">Angkatan / Batch: {result.batch}</p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Jalur & Asal Program
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {result.originSource === 'RSKB_SURAKARTA'
                        ? 'Rumah Siap Kerja Bersama (RSKB) Surakarta'
                        : 'Akademi Vokasi Solo Technopark'}
                    </p>
                    <p className="text-slate-500">Tahun: {result.graduationYear || '2024'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nomor Registrasi Unik
                    </span>
                    <p className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
                      {result.registrationCode}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Kualifikasi Hasil Sertifikasi
                    </span>
                    <p className="font-bold text-emerald-700 text-sm">
                      {result.certificationResult || 'Kompeten / Lulus Terverifikasi'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-slate-700 text-xs leading-relaxed flex items-center gap-3">
                  <Award size={20} className="text-emerald-600 shrink-0" />
                  <span>
                    Dokumen ini tercatat dalam pangkalan data resmi UPTD Kawasan Sains dan Teknologi Solo Technopark. Hasil verifikasi ini sah digunakan untuk keperluan rekrutmen mitra industri.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <XCircle size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Data Sertifikat Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {errorMsg || 'Nomor sertifikat atau kode registrasi yang Anda masukkan tidak terdaftar dalam pangkalan data resmi Solo Technopark.'}
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCode('');
                      setSearched(false);
                    }}
                    className="rounded-xl text-xs font-bold"
                  >
                    Cari Kembali
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO FOOTNOTE */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap size={20} className="text-blue-600 shrink-0" />
            <span>
              Ingin mengeksplorasi seluruh program pelatihan vokasi dan sertifikasi industri?
            </span>
          </div>
          <Link href="/program-pelatihan">
            <Button
              type="button"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-1.5 shrink-0"
            >
              <span>Lihat Program</span>
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </div>
    </SectionContainer>
  );
}

export default function VerifikasiSertifikatPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Memuat modul verifikasi...</div>}>
      <VerifikasiSertifikatContent />
    </Suspense>
  );
}

