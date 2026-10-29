// src/app/(public)/alumni-portal/components/ForumZoneSidebar.tsx
'use client';

import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  Handshake,
  Hash,
  Bell,
  Check,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_FORUM_CHANNELS } from '@/types/alumniForum.types';
import { canAccessForumZoneA } from '@/config/roles';
import { useEcosystemNotifications, useForumMutations } from '@/hooks/useAlumniForum';

interface ForumZoneSidebarProps {
  role: string | null;
  uid?: string | null;
  activeChannel: string;
  onSelectChannel: (channelId: string) => void;
}

export default function ForumZoneSidebar({
  role,
  uid,
  activeChannel,
  onSelectChannel,
}: ForumZoneSidebarProps) {
  const allowZoneA = canAccessForumZoneA(role);
  const zoneAChannels = DEFAULT_FORUM_CHANNELS.filter((c) => c.zone === 'ZONE_A_ALUMNI_ONLY');
  const zoneBChannels = DEFAULT_FORUM_CHANNELS.filter((c) => c.zone === 'ZONE_B_INDUSTRY_BRIDGE');

  const { data: notifications = [] } = useEcosystemNotifications(uid, role);
  const { markNotificationReadMutation } = useForumMutations();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(
    (n) => uid && !(n.readByUids || []).includes(uid)
  ).length;

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* Lonceng Notifikasi Komunitas */}
      <div className="public-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSelectChannel('ALL')}
            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 ${
              activeChannel === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Semua Kanal
          </button>

          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 transition-colors"
            title="Notifikasi Komunitas & Lamaran"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {showNotifs && (
          <div className="pt-2 border-t border-slate-100 space-y-2 max-h-56 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-2">
                Belum ada notifikasi baru.
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const isUnread = uid ? !(n.readByUids || []).includes(uid) : false;
                return (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-[11px] space-y-1 ${
                      isUnread ? 'bg-emerald-50/80' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      {isUnread && n.id && uid && (
                        <button
                          type="button"
                          onClick={() =>
                            markNotificationReadMutation.mutate({ notifId: n.id!, uid })
                          }
                          className="text-emerald-700 hover:underline shrink-0"
                          title="Tandai dibaca"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 leading-snug">{n.message}</p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ZONA A: INTERNAL MURNI ALUMNI */}
      <div className="public-card p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zona A • Internal Alumni
          </span>
          {!allowZoneA && <Lock className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Ruang privat sesama Alumni Vokasi STP & RSKB Surakarta (tertutup dari perusahaan mitra).
        </p>

        {allowZoneA ? (
          <div className="space-y-1 pt-1">
            {zoneAChannels.map((ch) => {
              const active = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChannel(ch.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Hash className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-emerald-200' : 'text-emerald-600'}`} />
                  <span className="truncate">{ch.shortLabel}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-500 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Demi menjaga keterbukaan diskusi gaji & bedah CV alumni, akun Mitra berinteraksi khusus di <strong>Zona B</strong>.
            </span>
          </div>
        )}
      </div>

      {/* ZONA B: JEMBATAN INDUSTRI x ALUMNI */}
      <div className="public-card p-4 space-y-2.5">
        <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 inline-flex items-center gap-1.5">
          <Handshake className="w-3.5 h-3.5 text-sky-600" />
          Zona B • Jembatan Industri
        </span>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Kolaborasi terbuka Alumni bersama HRD Mitra Resmi, Startup Tenant STP, dan Instruktur.
        </p>

        <div className="space-y-1 pt-1">
          {zoneBChannels.map((ch) => {
            const active = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelectChannel(ch.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Hash className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-sky-200' : 'text-sky-600'}`} />
                <span className="truncate">{ch.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

