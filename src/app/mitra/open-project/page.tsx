// src/app/mitra/open-project/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ExternalLink,
  Filter,
  DollarSign,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { useMyPartnerProfile } from '@/hooks/usePartners';
import {
  usePartnerOpenProjects,
  useOpenProjectMutations,
  useProjectApplications,
} from '@/hooks/useOpenProjects';
import {
  OpenProject,
  OpenProjectCategory,
  OpenProjectStatus,
  OPEN_PROJECT_CATEGORY_LABELS,
  ProjectApplication,
} from '@/types/partnership.types';
import { formatRupiah } from '@/utils/format';
import { toast } from 'sonner';

export default function MitraOpenProjectPage() {
  const { user, partnerId } = useAuth();
  const { data: partnerProfile } = useMyPartnerProfile(user?.uid, partnerId);
  const effectivePartnerId = partnerProfile?.id || partnerId || user?.uid || '';

  const { data: projects = [], isLoading } = usePartnerOpenProjects(effectivePartnerId);
  const { submitProjectDraftMutation, updateApplicationStatusMutation } = useOpenProjectMutations();

  // Create Project Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OpenProjectCategory>('INDUSTRIAL_DESIGN');
  const [description, setDescription] = useState('');
  const [deliverablesText, setDeliverablesText] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [budgetAmount, setBudgetAmount] = useState<number>(10000000);
  const [durationEstimate, setDurationEstimate] = useState('1 Bulan');
  const [workSetup, setWorkSetup] = useState<'REMOTE' | 'HYBRID' | 'ONSITE_STP' | 'ONSITE_COMPANY'>('HYBRID');
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  // Selected Project for Viewing Applicants
  const [selectedProject, setSelectedProject] = useState<OpenProject | null>(null);
  const { data: applicants = [] } = useProjectApplications(selectedProject?.id || undefined);

  // Tab filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter === 'ALL') return true;
      return p.status === statusFilter;
    });
  }, [projects, statusFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Lengkapi judul dan deskripsi proyek.');
      return;
    }

    const deliverables = deliverablesText
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const requiredSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const res = await submitProjectDraftMutation.mutateAsync({
      partnerId: effectivePartnerId,
      partnerName: partnerProfile?.companyName || user?.displayName || 'Mitra Industri STP',
      partnerLogo: partnerProfile?.companyLogo,
      partnerSector: partnerProfile?.industrySector || 'Manufaktur & Teknologi',
      picName: partnerProfile?.picName || user?.displayName || 'PIC Mitra',
      picContact: partnerProfile?.picPhone || user?.email || '',
      title,
      category,
      description,
      deliverables,
      requiredSkills,
      projectType: 'FREELANCE',
      budgetType: 'FIXED',
      budgetAmount,
      durationEstimate,
      workSetup,
      preferredPrograms: [],
      isFeatured: false,
      maxApplicants: 10,
      submissionDeadline: submissionDeadline || undefined,
    });

    if (res.success) {
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setDeliverablesText('');
      setSkillsText('');
    }
  };

  const handleUpdateApplicant = async (appId: string, newStatus: any) => {
    await updateApplicationStatusMutation.mutateAsync({
      id: appId,
      status: newStatus,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Industrial Open Project Hub</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Manajemen Open Project & Taskforce Alumni
          </h1>
          <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
            Delegasikan kebutuhan teknis, desain prototipe, atau pengujian rekayasa perusahaan Anda kepada alumni bersertifikasi Solo Technopark dengan kurasi mutu terjamin.
          </p>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-11 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs gap-2 shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Proyek Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Semua Proyek' },
          { id: 'PENDING_REVIEW', label: 'Menunggu Kurasi STP' },
          { id: 'ACTIVE', label: 'Aktif Tayang' },
          { id: 'IN_PROGRESS', label: 'Sedang Dikerjakan' },
          { id: 'COMPLETED', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Proyek */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat daftar proyek...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-800">Belum Ada Proyek yang Diajukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Mulai delegasikan pekerjaan rekayasa dan digital Anda ke alumni vokasi Solo Technopark.
          </p>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl text-xs font-bold bg-emerald-600 text-white"
          >
            Buat Draf Proyek Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-700"
                  >
                    {OPEN_PROJECT_CATEGORY_LABELS[project.category] || project.category}
                  </Badge>

                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-black ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : project.status === 'PENDING_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {project.status === 'PENDING_REVIEW' && 'Menunggu Review STP'}
                    {project.status === 'ACTIVE' && 'Tayang di Publik'}
                    {project.status === 'IN_PROGRESS' && 'Dikerjakan Alumni'}
                    {project.status === 'COMPLETED' && 'Selesai'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{project.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Kompensasi</span>
                    <strong className="text-emerald-700 font-black">{formatRupiah(project.budgetAmount)}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu & Setup</span>
                    <strong className="text-slate-800">{project.durationEstimate} ({project.workSetup})</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedProject(project)}
                  className="rounded-xl text-xs font-bold border-slate-200 gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Lihat Pelamar Alumni</span>
                </Button>
                {project.submissionDeadline && (
                  <span className="text-[10px] text-slate-400">
                    Deadline: {project.submissionDeadline}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Proyek Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-lg font-black">Ajukan Draf Open Project Baru</DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Draf proyek akan direview tim kurator STP sebelum tayang di bursa tugas talenta.
            </p>
          </div>

          <form onSubmit={handleCreateProject} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Judul Proyek / Kebutuhan *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Perancangan Fixture 3D CAD Mesin Pengemas Otomatis"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kategori Pekerjaan *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  {Object.entries(OPEN_PROJECT_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Model Kerja</label>
                <select
                  value={workSetup}
                  onChange={(e) => setWorkSetup(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="REMOTE">Remote (Daring Penuh)</option>
                  <option value="HYBRID">Hybrid (Daring & Lab STP)</option>
                  <option value="ONSITE_STP">Onsite di Fasilitas Solo Technopark</option>
                  <option value="ONSITE_COMPANY">Onsite di Pabrik / Kantor Mitra</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Anggaran Kompensasi (Rp) *</label>
                <Input
                  required
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(Number(e.target.value))}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Estimasi Durasi</label>
                <Input
                  value={durationEstimate}
                  onChange={(e) => setDurationEstimate(e.target.value)}
                  placeholder="Contoh: 3 Minggu / 1 Bulan"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Batas Lamaran</label>
                <Input
                  type="date"
                  value={submissionDeadline}
                  onChange={(e) => setSubmissionDeadline(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deskripsi Lengkap Kebutuhan *</label>
              <Textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan ruang lingkup, latar belakang masalah, dan spesifikasi teknis yang diharapkan..."
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Target Output / Deliverables (1 item per baris)
              </label>
              <Textarea
                rows={2}
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                placeholder="File 3D CAD (.step)&#10;Gambar kerja 2D detail&#10;Laporan pengujian"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Keahlian / Software yang Dibutuhkan (pisahkan dengan koma)
              </label>
              <Input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Contoh: Solidworks, GD&T, Metrologi Industri"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitProjectDraftMutation.isPending}
                className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {submitProjectDraftMutation.isPending ? 'Mengajukan...' : 'Kirim untuk Kurasi STP'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Daftar Pelamar Proyek */}
      <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
          <div className="bg-slate-900 p-6 text-white">
            <DialogTitle className="text-lg font-black">
              Pelamar Alumni: {selectedProject?.title}
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Pilih alumni yang memiliki portofolio dan penawaran terbaik untuk mengerjakan proyek Anda.
            </p>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            {applicants.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada pelamar alumni untuk proyek ini.
              </p>
            ) : (
              applicants.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{app.alumniName}</h4>
                      <p className="text-xs text-slate-500">{app.alumniProgram || 'Alumni Vokasi STP'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Kontak: {app.alumniEmail} | {app.alumniPhone}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {app.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {app.proposalLetter}
                  </p>

                  {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {app.portfolioLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Tautan Portofolio {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/60">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateApplicant(app.id || '', 'SHORTLISTED')}
                      className="rounded-xl text-[11px] font-bold"
                    >
                      Shortlist
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpdateApplicant(app.id || '', 'ACCEPTED')}
                      className="rounded-xl text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Terima Penawaran
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

