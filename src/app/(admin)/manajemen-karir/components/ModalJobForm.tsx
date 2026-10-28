// src/app/(admin)/manajemen-karir/components/ModalJobForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { JobListing, JobCategory, JobWorkType, JobWorkSetup, JobExperienceLevel } from '@/types/job.types';
import {
  X,
  Briefcase,
  Building2,
  MapPin,
  GraduationCap,
  Sparkles,
  Link as LinkIcon,
  Mail,
  Coins,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ModalJobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialJob?: JobListing | null;
}

const CATEGORIES: JobCategory[] = [
  'IT & Rekayasa Perangkat Lunak',
  'Kecerdasan Buatan & Sains Data',
  'Keamanan Siber (Cyber Security)',
  'Multimedia, Game & Animasi 3D',
  'Manufaktur Presisi & Mekatronika',
  'Pemasaran & Bisnis Digital',
];

const WORK_TYPES: JobWorkType[] = [
  'Full-time',
  'Internship / Magang',
  'Contract',
  'Freelance / Project',
  'Part-time',
];

const WORK_SETUPS: JobWorkSetup[] = [
  'On-site (Solo Technopark)',
  'On-site',
  'Hybrid',
  'Remote / WFH',
];

const EXP_LEVELS: JobExperienceLevel[] = [
  'Fresh Graduate / Alumni Pelatihan',
  'Junior (0-2 Tahun)',
  'Mid-Level (2-4 Tahun)',
  'Senior (4+ Tahun)',
];

const TRAINING_PROGRAMS = [
  'Pelatihan Fullstack Web Development',
  'Bootcamp Software Quality Assurance',
  'Pelatihan AI & Machine Learning',
  'Pelatihan Pemrograman & Mesin CNC',
  'Pelatihan Cyber Security Defense',
  'Bootcamp Pengembangan Game & Animasi 3D',
  'Pelatihan Juru Las (Welder)',
  'Pelatihan IoT & Smart Embedded Systems',
  'Pelatihan Digital Marketing & E-Commerce',
];

export default function ModalJobForm({
  isOpen,
  onClose,
  onSuccess,
  initialJob,
}: ModalJobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyType, setCompanyType] = useState('Mitra Industri STP');
  const [category, setCategory] = useState<JobCategory>('IT & Rekayasa Perangkat Lunak');
  const [location, setLocation] = useState('Surakarta, Jawa Tengah');
  const [city, setCity] = useState('Surakarta');
  const [workType, setWorkType] = useState<JobWorkType>('Full-time');
  const [workSetup, setWorkSetup] = useState<JobWorkSetup>('On-site (Solo Technopark)');
  const [experienceLevel, setExperienceLevel] = useState<JobExperienceLevel>(
    'Fresh Graduate / Alumni Pelatihan'
  );

  const [salaryMin, setSalaryMin] = useState<number | ''>(4500000);
  const [salaryMax, setSalaryMax] = useState<number | ''>(7000000);
  const [isDisclosed, setIsDisclosed] = useState(true);

  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [applicationUrl, setApplicationUrl] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [isStpPartner, setIsStpPartner] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title);
      setCompany(initialJob.company);
      setCompanyLogo(initialJob.companyLogo || '');
      setCompanyType(initialJob.companyType || 'Mitra Industri STP');
      setCategory(initialJob.category);
      setLocation(initialJob.location);
      setCity(initialJob.city || 'Surakarta');
      setWorkType(initialJob.workType);
      setWorkSetup(initialJob.workSetup);
      setExperienceLevel(initialJob.experienceLevel);
      setSalaryMin(initialJob.salary.min || '');
      setSalaryMax(initialJob.salary.max || '');
      setIsDisclosed(initialJob.salary.isDisclosed ?? true);
      setDescription(initialJob.description);
      setSkillsInput(initialJob.skills.join(', '));
      setSelectedPrograms(initialJob.relevantTrainingPrograms || []);
      setApplicationUrl(initialJob.applicationUrl || '');
      setApplicationEmail(initialJob.applicationEmail || '');
      setIsStpPartner(initialJob.isStpPartner ?? true);
      setIsFeatured(initialJob.isFeatured ?? false);
      setIsActive(initialJob.isActive ?? true);
    } else {
      // Reset default
      setTitle('');
      setCompany('');
      setCompanyLogo('');
      setCompanyType('Mitra Industri STP');
      setCategory('IT & Rekayasa Perangkat Lunak');
      setLocation('Surakarta, Jawa Tengah');
      setCity('Surakarta');
      setWorkType('Full-time');
      setWorkSetup('On-site (Solo Technopark)');
      setExperienceLevel('Fresh Graduate / Alumni Pelatihan');
      setSalaryMin(4500000);
      setSalaryMax(7000000);
      setIsDisclosed(true);
      setDescription('');
      setSkillsInput('');
      setSelectedPrograms([]);
      setApplicationUrl('');
      setApplicationEmail('');
      setIsStpPartner(true);
      setIsFeatured(false);
      setIsActive(true);
    }
  }, [initialJob, isOpen]);

  if (!isOpen) return null;

  const toggleProgram = (prog: string) => {
    if (selectedPrograms.includes(prog)) {
      setSelectedPrograms(selectedPrograms.filter((p) => p !== prog));
    } else {
      setSelectedPrograms([...selectedPrograms, prog]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      toast.error('Judul lowongan dan nama perusahaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      id: initialJob?.id,
      title: title.trim(),
      company: company.trim(),
      companyLogo: companyLogo.trim() || undefined,
      companyType,
      category,
      location: location.trim(),
      city: city.trim(),
      workType,
      workSetup,
      experienceLevel,
      salary: {
        currency: 'IDR',
        period: 'Bulan' as const,
        min: typeof salaryMin === 'number' ? salaryMin : undefined,
        max: typeof salaryMax === 'number' ? salaryMax : undefined,
        isNegotiable: true,
        isDisclosed,
      },
      description: description.trim(),
      responsibilities: [],
      requirements: [],
      benefits: [],
      skills,
      relevantTrainingPrograms: selectedPrograms,
      applicationUrl: applicationUrl.trim() || undefined,
      applicationEmail: applicationEmail.trim() || undefined,
      applySource: 'Mitra Kawasan STP',
      isStpPartner,
      isFeatured,
      isActive,
    };

    try {
      const url = '/api/jobs';
      const method = initialJob ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan lowongan.');
      }

      toast.success(
        initialJob
          ? 'Lowongan pekerjaan berhasil diperbarui!'
          : 'Lowongan mitra baru berhasil diterbitkan!'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan lowongan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {initialJob ? 'Edit Lowongan Pekerjaan' : 'Tambah Lowongan Mitra Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Publikasikan peluang karir untuk alumni diklat & ekosistem Solo Technopark.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Baris 1: Judul & Perusahaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <span>Posisi Pekerjaan *</span>
              </label>
              <Input
                placeholder="Contoh: CNC Operator & Programmer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nama Perusahaan / Industri *</span>
              </label>
              <Input
                placeholder="Contoh: PT ATMI IGI Center Solo"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          {/* Baris 2: URL Logo & Tipe Perusahaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>URL Logo Perusahaan (Opsional)</span>
              </label>
              <Input
                placeholder="https://perusahaan.com/logo.png"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Afiliasi / Status Perusahaan</label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Mitra Industri STP">Mitra Industri Resmi Solo Technopark</option>
                <option value="Tenant Inkubasi Startup STP">Tenant Inkubasi Startup STP</option>
                <option value="BUMN & Pemerintah">BUMN & Instansi Pemerintah</option>
                <option value="Perusahaan Teknologi">Perusahaan Teknologi / Software House</option>
                <option value="Industri Manufaktur">Industri Manufaktur / Otomasi</option>
              </select>
            </div>
          </div>

          {/* Baris 3: Kategori & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kategori Bidang *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JobCategory)}
                className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lokasi Penempatan</span>
              </label>
              <Input
                placeholder="Contoh: Surakarta, Jawa Tengah"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kota / Kabupaten</label>
              <Input
                placeholder="Contoh: Surakarta"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          {/* Baris 4: Tipe Kerja, Model Kerja, Pengalaman */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tipe Pekerjaan</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as JobWorkType)}
                className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {WORK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Penataan Kerja</label>
              <select
                value={workSetup}
                onChange={(e) => setWorkSetup(e.target.value as JobWorkSetup)}
                className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {WORK_SETUPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pengalaman Minimal</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as JobExperienceLevel)}
                className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {EXP_LEVELS.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 5: Rentang Gaji */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Rentang Gaji Bulanan (IDR)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={isDisclosed}
                  onChange={(e) => setIsDisclosed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Tampilkan Gaji ke Publik</span>
              </label>
            </div>

            {isDisclosed && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Gaji Minimum (Rp)</span>
                  <Input
                    type="number"
                    placeholder="Contoh: 4500000"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : '')}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Gaji Maksimum (Rp)</span>
                  <Input
                    type="number"
                    placeholder="Contoh: 7000000"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : '')}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Baris 6: Program Pelatihan Selaras Solo Technopark */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-amber-600" />
              <span>Pilih Program Pelatihan STP yang Kurikulumnya Selaras:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TRAINING_PROGRAMS.map((prog) => {
                const isSelected = selectedPrograms.includes(prog);
                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => toggleProgram(prog)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{prog}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baris 7: Keahlian / Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Daftar Keahlian Utama (Pisahkan dengan tanda koma)</span>
            </label>
            <Input
              placeholder="Contoh: CNC Milling, Mastercam, G-Code, Kalibrasi Mesin"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          {/* Baris 8: Tautan & Email Pendaftaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Link Pendaftaran / Form Eksternal</span>
              </label>
              <Input
                placeholder="https://karir.perusahaan.com/apply"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Lamaran (Opsional)</span>
              </label>
              <Input
                placeholder="hrd@perusahaan.com"
                value={applicationEmail}
                onChange={(e) => setApplicationEmail(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          {/* Baris 9: Deskripsi Lowongan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Rincian Lengkap & Deskripsi Pekerjaan</label>
            <Textarea
              placeholder="Tuliskan deskripsi pekerjaan, kualifikasi yang dicari, dan informasi fasilitas kerja..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Baris 10: Status & Toggle Pengaturan */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStpPartner}
                onChange={(e) => setIsStpPartner(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Mitra Resmi Solo Technopark
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Lowongan Unggulan (Featured)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Tayang Aktif di Bursa Karir</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{initialJob ? 'Simpan Perubahan' : 'Terbitkan Lowongan'}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
