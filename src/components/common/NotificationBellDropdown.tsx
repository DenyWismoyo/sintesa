// Lokasi file: src/components/common/NotificationBellDropdown.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  CheckCircle2,
  Briefcase,
  Calendar,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isInternalStaff } from '@/config/roles';
import { notificationService } from '@/services/notification.service';
import { EcosystemNotification } from '@/types/alumniForum.types';

function getCategoryIcon(category: string) {
  switch (category) {
    case 'FORUM_REPLY':
      return <MessageSquare size={14} className="text-blue-600" />;
    case 'SOLUTION_ACCEPTED':
      return <CheckCircle2 size={14} className="text-emerald-600" />;
    case 'JOB_APPLICATION':
      return <Briefcase size={14} className="text-indigo-600" />;
    case 'INTERVIEW_INVITE':
      return <Calendar size={14} className="text-purple-600" />;
    case 'MODERATION_ALERT':
      return <ShieldAlert size={14} className="text-rose-600" />;
    default:
      return <Sparkles size={14} className="text-amber-500" />;
  }
}

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'Baru saja';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}j lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}h lalu`;
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

interface NotificationBellProps {
  align?: 'left' | 'right';
  className?: string;
}

export default function NotificationBellDropdown({ align = 'right', className = '' }: NotificationBellProps) {
  const router = useRouter();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery<EcosystemNotification[]>({
    queryKey: ['ecosystem-notifications', user?.uid, role],
    queryFn: () => notificationService.getNotificationsForUser(user?.uid || '', role),
    enabled: !!user?.uid,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const unreadCount = useMemo(() => {
    if (!user?.uid) return 0;
    return notifications.filter((item) => !item.readByUids?.includes(user.uid)).length;
  }, [notifications, user?.uid]);

  const filteredItems = useMemo(() => {
    if (filter === 'unread' && user?.uid) {
      return notifications.filter((item) => !item.readByUids?.includes(user.uid));
    }
    return notifications;
  }, [notifications, filter, user?.uid]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = async (item: EcosystemNotification) => {
    if (item.id && user?.uid && !item.readByUids?.includes(user.uid)) {
      await notificationService.markAsRead(item.id, user.uid);
      queryClient.setQueryData<EcosystemNotification[]>(
        ['ecosystem-notifications', user.uid, role],
        (old = []) =>
          old.map((n) => (n.id === item.id ? { ...n, readByUids: [...(n.readByUids || []), user.uid] } : n))
      );
    }
    setIsOpen(false);
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    await notificationService.markAllAsRead(user.uid, role);
    queryClient.setQueryData<EcosystemNotification[]>(
      ['ecosystem-notifications', user.uid, role],
      (old = []) =>
        old.map((n) => ({
          ...n,
          readByUids: Array.from(new Set([...(n.readByUids || []), user.uid])),
        }))
    );
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 h-9 w-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
        title="Pusat Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck size={13} />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="px-3 pt-2 pb-1 border-b border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Memuat notifikasi...</div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">Tidak ada notifikasi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {filter === 'unread' ? 'Semua notifikasi sudah dibaca.' : 'Aktivitas terbaru Anda akan muncul di sini.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isUnread = user?.uid ? !item.readByUids?.includes(user.uid) : false;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 hover:bg-slate-50/90 transition-colors cursor-pointer flex items-start gap-3 relative ${
                        isUnread ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
                      </div>
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2 self-center" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(isInternalStaff(role) ? '/dashboard' : '/alumni-portal');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <span>{isInternalStaff(role) ? 'Buka Command Center Admin' : 'Buka Pusat Komunitas & Forum'}</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

