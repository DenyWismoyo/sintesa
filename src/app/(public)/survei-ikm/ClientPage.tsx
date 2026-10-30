// src/app/(public)/survei-ikm/ClientPage.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SectionContainer } from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIkmMutations } from '@/hooks/useIkm';
import { IKM_SERVICE_LABELS, IkmServiceType, IkmScore } from '@/types/ikm.types';
import {
  Award,
  CheckCircle2,
  Send,
  Star,
  Building2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';

const QUESTIONS = [
  {
    key: 'u1_persyaratan' as keyof IkmScore,
    title: '1. Persyaratan Pelayanan',
    desc: 'Bagaimana kemudahan persyaratan yang harus dipenuhi dalam mendapatkan pelayanan?',
    options: [
      { val: 1, label: 'Tidak Mudah' },
      { val: 2, label: 'Kurang Mudah' },
      { val: 3, label: 'Mudah' },
      { val: 4, label: 'Sangat Mudah' },
    ],
  },
  {
    key: 'u2_prosedur' as keyof IkmScore,
    title: '2. Prosedur Pelayanan',
    desc: 'Bagaimana kemudahan alur, mekanisme, dan tahapan pelayanan yang diberikan?',
    options: [
      { val: 1, label: 'Tidak Mudah' },
      { val: 2, label: 'Kurang Mudah' },
      { val: 3, label: 'Mudah' },
      { val: 4, label: 'Sangat Mudah' },
    ],
  },
  {
    key: 'u3_waktu' as keyof IkmScore,
    title: '3. Waktu Pelayanan',
    desc: 'Bagaimana ketepatan dan kecepatan waktu dalam penyelesaian pelayanan?',
    options: [
      { val: 1, label: 'Sangat Lambat' },
      { val: 2, label: 'Kurang Cepat' },
      { val: 3, label: 'Cepat' },
      { val: 4, label: 'Sangat Cepat' },
    ],
  },
  {
    key: 'u4_biaya' as keyof IkmScore,
    title: '4. Biaya / Tarif',
    desc: 'Bagaimana kewajaran dan transparansi biaya/tarif pelayanan sesuai ketentuan yang berlaku?',
    options: [
      { val: 1, label: 'Sangat Mahal' },
      { val: 2, label: 'Cukup Mahal' },
      { val: 3, label: 'Wajar / Terjangkau' },
      { val: 4, label: 'Gratis / Sangat Murah' },
    ],
  },
  {
    key: 'u5_produk' as keyof IkmScore,
    title: '5. Produk Spesifikasi Layanan',
    desc: 'Bagaimana kesesuaian antara hasil pelayanan yang diterima dengan ketentuan yang dijanjikan?',
    options: [
      { val: 1, label: 'Tidak Sesuai' },
      { val: 2, label: 'Kurang Sesuai' },
      { val: 3, label: 'Sesuai' },
      { val: 4, label: 'Sangat Sesuai' },
    ],
  },
  {
    key: 'u6_kompetensi' as keyof IkmScore,
    title: '6. Kompetensi Petugas',
    desc: 'Bagaimana keahlian, keterampilan, dan wawasan petugas dalam memberikan pelayanan?',
    options: [
      { val: 1, label: 'Tidak Kompeten' },
      { val: 2, label: 'Kurang Kompeten' },
      { val: 3, label: 'Kompeten' },
      { val: 4, label: 'Sangat Kompeten' },
    ],
  },
  {
    key: 'u7_perilaku' as keyof IkmScore,
    title: '7. Perilaku Petugas',
    desc: 'Bagaimana kesopanan, keramahan, dan responsivitas petugas saat melayani Anda?',
    options: [
      { val: 1, label: 'Tidak Ramah' },
      { val: 2, label: 'Kurang Ramah' },
      { val: 3, label: 'Ramah & Sopan' },
      { val: 4, label: 'Sangat Ramah & Sigap' },
    ],
  },
  {
    key: 'u8_sarana' as keyof IkmScore,
    title: '8. Kualitas Sarana & Prasarana',
    desc: 'Bagaimana kebersihan, kenyamanan, dan kelengkapan fasilitas ruang serta sarana teknopark?',
    options: [
      { val: 1, label: 'Buruk' },
      { val: 2, label: 'Cukup' },
      { val: 3, label: 'Baik & Bersih' },
      { val: 4, label: 'Sangat Nyaman & Modern' },
    ],
  },
  {
    key: 'u9_pengaduan' as keyof IkmScore,
    title: '9. Penanganan Aduan & Saran',
    desc: 'Bagaimana responsivitas dan kecepatan tindak lanjut pengaduan atau keluhan yang Anda sampaikan?',
    options: [
      { val: 1, label: 'Tidak Ada Tanggapan' },
      { val: 2, label: 'Kurang Responsif' },
      { val: 3, label: 'Responsif & Solutif' },
      { val: 4, label: 'Sangat Cepat & Tuntas' },
    ],
  },
];

export default function SurveiIkmClientPage() {
  const { submitSurveyMutation } = useIkmMutations();
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [respondentName, setRespondentName] = useState('');
  const [respondentAgency, setRespondentAgency] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [serviceType, setServiceType] = useState<IkmServiceType>('SEWA_FASILITAS');
  const [feedback, setFeedback] = useState('');

  // 9 Scores
  const [scores, setScores] = useState<IkmScore>({
    u1_persyaratan: 4,
    u2_prosedur: 4,
    u3_waktu: 4,
    u4_biaya: 4,
    u5_produk: 4,
    u6_kompetensi: 4,
    u7_perilaku: 4,
    u8_sarana: 4,
    u9_pengaduan: 4,
  });

  const handleScoreChange = (key: keyof IkmScore, val: number) => {
    setScores((p) => ({ ...p, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondentName.trim()) {
      toast.error('Mohon isi nama Anda.');
      return;
    }

    const res = await submitSurveyMutation.mutateAsync({
      serviceType,
      respondentName,
      respondentAgency,
      respondentEmail,
      scores,
      feedback,
    });

    if (res.success) {
      setIsSuccess(true);
    }
  };

  return (
    <SectionContainer accent="sky" width="narrow">
      <PageHero
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Survei IKM', href: '/survei-ikm' },
        ]}
        badge={{ label: 'Standar PermenPAN-RB No. 14/2017', variant: 'sky' }}
        title="Survei Kepuasan Masyarakat (IKM)"
        subtitle="Bantu kami meningkatkan kualitas tata kelola, fasilitas kawasan, program inkubasi, dan pelayanan publik Solo Technopark dengan memberikan penilaian objektif Anda."
        accentColor="sky"
      />

      <div className="pt-2 sm:pt-4">
        {isSuccess ? (
          <div className="public-card p-8 sm:p-12 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Matur Nuwun! Penilaian Anda Telah Diterima</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Apresiasi dan masukan yang Anda berikan menjadi dasar evaluasi berkelanjutan bagi peningkatan mutu layanan
              di Kawasan Sains dan Teknologi Solo Technopark.
            </p>
            <div className="pt-4">
              <Link href="/">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-8 shadow-sm">
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="public-card p-5 sm:p-8 space-y-6">
            {/* IDENTITAS RESPONDEN */}
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-sky-600" />
                Data Penerima Layanan / Responden
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama Lengkap *</label>
                  <Input
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Instansi / Usaha / Startup</label>
                  <Input
                    value={respondentAgency}
                    onChange={(e) => setRespondentAgency(e.target.value)}
                    placeholder="Contoh: PT Startup Inovasi / Mahasiswa UNS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Email (Opsional)</label>
                  <Input
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="email@instansi.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Jenis Layanan yang Diterima *</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as IkmServiceType)}
                    className="public-select w-full"
                  >
                    {Object.entries(IKM_SERVICE_LABELS).map(([k, lbl]) => (
                      <option key={k} value={k}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 9 UNSUR KUESIONER */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award size={20} className="text-sky-600" />
                Penilaian 9 Unsur Mutu Pelayanan
              </h3>

              {QUESTIONS.map((q) => {
                const currentVal = scores[q.key];
                return (
                  <div key={q.key} className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{q.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{q.desc}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                      {q.options.map((opt) => {
                        const isSelected = currentVal === opt.val;
                        return (
                          <button
                            type="button"
                            key={opt.val}
                            onClick={() => handleScoreChange(q.key, opt.val)}
                            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                              isSelected
                                ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200 scale-[1.02]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
                            }`}
                          >
                            <span className="block text-base mb-1 font-mono">{opt.val}</span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SARAN DAN MASUKAN */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Kritik, Saran & Masukan untuk Solo Technopark (Opsional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-28 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Bagikan pengalaman atau saran Anda untuk kemajuan pelayanan Solo Technopark ke depan..."
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitSurveyMutation.isPending}
                className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm gap-2 shadow-lg shadow-sky-200"
              >
                <Send size={18} />
                {submitSurveyMutation.isPending ? 'Mengirimkan Evaluasi...' : 'Kirimkan Penilaian IKM'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </SectionContainer>
  );
}

