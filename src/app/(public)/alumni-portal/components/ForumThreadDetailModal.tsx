// src/app/(public)/alumni-portal/components/ForumThreadDetailModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Award,
  Flag,
  Send,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ForumThread,
  ForumActorType,
  ForumPortfolioEmbed,
} from '@/types/alumniForum.types';
import { useForumReplies, useForumMutations } from '@/hooks/useAlumniForum';
import { isInternalStaff } from '@/config/roles';
import { toast } from 'sonner';

interface ForumThreadDetailModalProps {
  thread: ForumThread | null;
  onClose: () => void;
  currentUid?: string;
  currentName: string;
  currentRole: string | null;
  actorType: ForumActorType;
  actorBadgeLabel: string;
  alumniId?: string;
  myPortfolioEmbed?: ForumPortfolioEmbed;
}

export default function ForumThreadDetailModal({
  thread,
  onClose,
  currentUid,
  currentName,
  currentRole,
  actorType,
  actorBadgeLabel,
  alumniId,
  myPortfolioEmbed,
}: ForumThreadDetailModalProps) {
  const { data: replies = [], isLoading } = useForumReplies(thread?.id, thread?.zone);
  const {
    createReplyMutation,
    acceptSolutionMutation,
    endorseReplyMutation,
    reportThreadMutation,
  } = useForumMutations();

  const [replyText, setReplyText] = useState('');
  const [attachPortfolio, setAttachPortfolio] = useState(false);

  if (!thread) return null;

  const isStaff = isInternalStaff(currentRole);
  const canMarkSolution = currentUid === thread.authorUid || isStaff;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUid || !replyText.trim()) return;

    const res = await createReplyMutation.mutateAsync({
      thread,
      reply: {
        content: replyText.trim(),
        authorUid: currentUid,
        authorName: currentName,
        authorActorType: actorType,
        authorBadgeLabel: actorBadgeLabel,
        authorAlumniId: alumniId,
        portfolioEmbed: attachPortfolio ? myPortfolioEmbed : undefined,
      },
    });

    if (res.success) {
      if (res.flagged) {
        toast.warning('Balasan Anda ditahan sementara untuk tinjauan keamanan Moderator STP.');
      } else {
        toast.success('Balasan diskusi berhasil dikirim!');
      }
      setReplyText('');
      setAttachPortfolio(false);
    } else {
      toast.error(res.error || 'Gagal mengirim balasan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-700">
              {thread.authorName} • {thread.authorBadgeLabel}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {thread.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {thread.id && (
              <button
                type="button"
                onClick={async () => {
                  await reportThreadMutation.mutateAsync(thread.id!);
                  toast.info('Laporan dikirim ke meja Moderator Karir STP.');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title="Laporkan konten mencurigakan / pungli ke Moderator"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body & Replies */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="p-4 rounded-2xl bg-slate-50 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {thread.content}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Tanggapan & Solusi Komunitas ({replies.length})
            </h4>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            ) : replies.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Jadilah yang pertama memberikan solusi atau tanggapan pada topik ini!
              </p>
            ) : (
              replies.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    r.isAcceptedSolution
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{r.authorName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {r.authorBadgeLabel}
                      </span>
                      {r.isAcceptedSolution && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Solusi Terbaik (+15 Reputasi)
                        </span>
                      )}
                      {r.endorsedByMentor && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                          <Award className="w-3 h-3" /> Di-endorse Mentor STP (+10)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canMarkSolution && !r.isAcceptedSolution && r.id && thread.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            await acceptSolutionMutation.mutateAsync({
                              threadId: thread.id!,
                              replyId: r.id!,
                              replyAuthorUid: r.authorUid,
                              threadTitle: thread.title,
                            });
                            toast.success('Ditandai sebagai Solusi Teknis Terbaik!');
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Pilih Solusi Terbaik
                        </button>
                      )}
                      {isStaff && !r.endorsedByMentor && r.id && thread.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            await endorseReplyMutation.mutateAsync({
                              replyId: r.id!,
                              threadId: thread.id!,
                            });
                            toast.success('Jawaban berhasil di-endorse oleh Mentor STP!');
                          }}
                          className="text-[11px] font-bold text-amber-700 hover:underline ml-2"
                        >
                          Endorse Mentor
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {r.content}
                  </p>

                  {r.portfolioEmbed && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        Portofolio: {r.portfolioEmbed.name} ({r.portfolioEmbed.programTaken || 'Alumni'})
                      </span>
                      {r.portfolioEmbed.portfolioUrl && (
                        <a
                          href={r.portfolioEmbed.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-700 inline-flex items-center gap-1"
                        >
                          Buka <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Composer Balasan */}
        {currentUid && (
          <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
            <Textarea
              required
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tulis solusi teknis, saran CV, atau pertanyaan kepada HRD / rekan alumni..."
              className="rounded-2xl bg-white text-xs"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              {myPortfolioEmbed ? (
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachPortfolio}
                    onChange={(e) => setAttachPortfolio(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  <span>Lampirkan Kartu Portofolio Terverifikasi Saya (1-Klik)</span>
                </label>
              ) : (
                <span />
              )}

              <Button
                type="submit"
                size="sm"
                disabled={createReplyMutation.isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{createReplyMutation.isPending ? 'Mengirim...' : 'Kirim Tanggapan'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

