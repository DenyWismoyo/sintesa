// src/app/(public)/kemitraan/components/ProjectApplicationModal.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Send,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { formatRupiah } from '@/utils/format';
import { OpenProject } from '@/types/partnership.types';
import { useOpenProjectMutations } from '@/hooks/useOpenProjects';
import { useAuth } from '@/lib/AuthContext';

interface ProjectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: OpenProject | null;
}

export default function ProjectApplicationModal({
  isOpen,
  onClose,
  project,
}: ProjectApplicationModalProps) {
  const { user } = useAuth();
  const { submitApplicationMutation } = useOpenProjectMutations();

  const [alumniName, setAlumniName] = useState(user?.displayName || '');
  const [alumniEmail, setAlumniEmail] = useState(user?.email || '');
  const [alumniPhone, setAlumniPhone] = useState('');
  const [alumniProgram, setAlumniProgram] = useState('');
  const [proposalLetter, setProposalLetter] = useState('');
  const [portfolioLinksText, setPortfolioLinksText] = useState('');
  const [proposedBudget, setProposedBudget] = useState<number>(project?.budgetAmount || 0);
  const [proposedTimeline, setProposedTimeline] = useState(project?.durationEstimate || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!alumniName.trim() || !alumniEmail.trim() || !proposalLetter.trim()) {
      return;
    }

    const links = portfolioLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const res = await submitApplicationMutation.mutateAsync({
      projectId: project.id || '',
      projectTitle: project.title,
      partnerId: project.partnerId,
      alumniId: user?.uid || `guest-applicant-${Date.now()}`,
      alumniName,
      alumniEmail,
      alumniPhone: alumniPhone || undefined,
      alumniProgram: alumniProgram || undefined,
      proposalLetter,
      portfolioLinks: links,
      proposedBudget: proposedBudget > 0 ? proposedBudget : project.budgetAmount,
      proposedTimeline: proposedTimeline || project.durationEstimate,
    });

    if (res.success) {
      onClose();
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-slate-200 bg-white">
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-6 text-white relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Briefcase className="w-4 h-4" />
            </span>
            <Badge className="bg-emerald-500/30 text-emerald-200 border-none font-bold text-[10px]">
              Open Project Marketplace
            </Badge>
          </div>
          <DialogTitle className="text-lg md:text-xl font-black">
            Lamar Pengerjaan Proyek: {project.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-200/80 mt-1">
            Diajukan oleh <strong className="text-white">{project.partnerName}</strong> ?" Kompensasi:{' '}
            <strong className="text-emerald-300">{formatRupiah(project.budgetAmount)}</strong>
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Lengkap Alumni/Pelamar *</label>
              <Input
                required
                value={alumniName}
                onChange={(e) => setAlumniName(e.target.value)}
                placeholder="Nama Anda"
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nomor WhatsApp Aktif *</label>
              <Input
                required
                type="tel"
                value={alumniPhone}
                onChange={(e) => setAlumniPhone(e.target.value)}
                placeholder="08123456789"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Aktif *</label>
              <Input
                required
                type="email"
                value={alumniEmail}
                onChange={(e) => setAlumniEmail(e.target.value)}
                placeholder="email@domain.com"
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Program Pelatihan / Institusi Asal</label>
              <Input
                value={alumniProgram}
                onChange={(e) => setAlumniProgram(e.target.value)}
                placeholder="Contoh: Alumni CNC Presisi 2025"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Usulan Anggaran (Rp)</label>
              <Input
                type="number"
                value={proposedBudget}
                onChange={(e) => setProposedBudget(Number(e.target.value))}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Estimasi Waktu Pengerjaan</label>
              <Input
                value={proposedTimeline}
                onChange={(e) => setProposedTimeline(e.target.value)}
                placeholder="Contoh: 3 Minggu"
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Tautan Portofolio / Hasil Karya (1 tautan per baris)
            </label>
            <Textarea
              rows={2}
              value={portfolioLinksText}
              onChange={(e) => setPortfolioLinksText(e.target.value)}
              placeholder="https://github.com/username/project&#10;https://drive.google.com/..."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Surat Pengantar & Solusi Teknis Singkat *
            </label>
            <Textarea
              required
              rows={4}
              value={proposalLetter}
              onChange={(e) => setProposalLetter(e.target.value)}
              placeholder="Jelaskan pengalaman relevan Anda dengan kebutuhan proyek ini, tools yang akan Anda gunakan, dan mengapa Anda pilihan tepat untuk mitra..."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitApplicationMutation.isPending}
              className="rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
              <span>{submitApplicationMutation.isPending ? 'Mengirim...' : 'Kirim Lamaran Proyek'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

