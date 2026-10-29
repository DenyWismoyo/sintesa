// src/components/career/AlumniInvitationsBox.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, CheckCircle2, XCircle, Building2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { useAlumniInvitations, usePartnerMutations } from '@/hooks/usePartners';
import { useMyJobApplications } from '@/hooks/useAlumniForum';
import { JOB_APPLICATION_STATUS_LABELS } from '@/types/alumniForum.types';
import { toast } from 'sonner';

interface AlumniInvitationsBoxProps {
  alumniId?: string;
}

export default function AlumniInvitationsBox({ alumniId }: AlumniInvitationsBoxProps) {
  const { user } = useAuth();
  const { data: invitations = [] } = useAlumniInvitations(alumniId);
  const { data: myApplications = [] } = useMyJobApplications(user?.uid);
  const { respondInvitationMutation } = usePartnerMutations();

  if (!alumniId) return null;

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    const ok = await respondInvitationMutation.mutateAsync({ id, status });
    if (ok) {
      toast.success(
        status === 'ACCEPTED'
          ? 'Undangan wawancara diterima! Tim Karir STP & HRD Mitra telah diberitahu.'
          : 'Undangan telah ditolak dengan sopan.'
      );
    } else {
      toast.error('Gagal memperbarui respons undangan.');
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Banner Pintas Forum Eksklusif Alumni */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-emerald-400">Komunitas Eksklusif 2 Zona</span>
          <p className="text-xs sm:text-sm font-bold">
            Diskusi Loker Referral, Bedah CV & Proyek Industri di Forum Alumni STP × RSKB
          </p>
        </div>
        <Link href="/alumni-portal" className="shrink-0">
          <Button
            type="button"
            size="sm"
            className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Buka Forum Alumni</span>
          </Button>
        </Link>
      </div>

      {invitations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white border border-emerald-200 space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-emerald-700" />
        <h4 className="text-sm font-black text-emerald-950">
          Undangan Wawancara Eksklusif untuk Anda ({invitations.length})
        </h4>
      </div>

      <div className="space-y-2.5">
        {invitations.map((inv) => {
          const canReply = inv.status === 'PENDING' || inv.status === 'REVIEWED_BY_ADMIN';
          return (
            <div
              key={inv.id}
              className="bg-white rounded-xl border border-emerald-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900 inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    {inv.senderCompanyName}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {inv.roleOffered} ({inv.workType})
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{inv.message}</p>
                {inv.status === 'ACCEPTED' && inv.senderPicContact && (
                  <p className="text-[11px] font-bold text-emerald-700">
                    Kontak PIC ({inv.senderPicName}): {inv.senderPicContact}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canReply && inv.id ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      disabled={respondInvitationMutation.isPending}
                      onClick={() => handleRespond(inv.id!, 'ACCEPTED')}
                      className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terima
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={respondInvitationMutation.isPending}
                      onClick={() => handleRespond(inv.id!, 'DECLINED')}
                      className="h-8 px-2.5 rounded-xl text-rose-700 border-rose-200 text-xs font-bold gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {inv.status === 'ACCEPTED' ? 'Diterima' : 'Ditolak'}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </div>
      )}

      {myApplications.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-black text-slate-900">
              Pelacak Lamaran Kerja Saya ({myApplications.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {myApplications.map((app) => (
              <div key={app.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">
                    {app.jobTitle} — <span className="text-emerald-700">{app.companyName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Dikirim {new Date(app.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold self-start sm:self-auto ${
                    app.status === 'HIRED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : app.status === 'INTERVIEWING'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : app.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {JOB_APPLICATION_STATUS_LABELS[app.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

