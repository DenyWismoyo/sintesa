// Lokasi file: src/components/portal/UserOnboardingChecklist.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { auth, db } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserProfileData {
  phone?: string;
  name?: string;
  agency?: string;
  alumniId?: string;
}

export default function UserOnboardingChecklist() {
  const { user, role } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Cek localStorage dismissal
    const dismissed = localStorage.getItem(`onboarding_dismissed_${user?.uid}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    if (!user?.uid) {
      setLoadingProfile(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setProfileData(snap.data() as UserProfileData);
        }
      } catch (err) {
        console.error('Gagal mengambil data user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user?.uid]);

  // Evaluasi 4 langkah onboarding
  const steps = useMemo(() => {
    const isEmailVerified = Boolean(user?.emailVerified);
    const hasPhone = Boolean(profileData?.phone && profileData.phone.trim().length >= 8);
    const isEcosystemActive = Boolean(
      role === 'alumni' ||
      role === 'industri' ||
      role === 'tenant' ||
      role === 'admin' ||
      role === 'super_admin' ||
      profileData?.alumniId
    );

    return [
      {
        id: 'account',
        title: 'Akun Terdaftar',
        description: `Terdaftar sebagai ${user?.email || 'Pengguna'}`,
        completed: true,
      },
      {
        id: 'email',
        title: 'Verifikasi Email',
        description: isEmailVerified
          ? 'Email terverifikasi resmi'
          : 'Verifikasi alamat email Anda untuk keamanan notifikasi',
        completed: isEmailVerified,
        actionType: 'email_verify',
      },
      {
        id: 'phone',
        title: 'Lengkapi WhatsApp / Kontak',
        description: hasPhone
          ? `Nomor tersimpan: ${profileData?.phone}`
          : 'Tambahkan nomor WhatsApp untuk notifikasi jadwal & faktur',
        completed: hasPhone,
        href: '/profil',
      },
      {
        id: 'ecosystem',
        title: 'Status Ekosistem / Alumni',
        description: isEcosystemActive
          ? 'Akun terhubung dalam ekosistem Solo Technopark'
          : 'Klaim kode alumni atau daftar pelatihan untuk aktif penuh',
        completed: isEcosystemActive,
        href: '/profil',
      },
    ];
  }, [user, profileData, role]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);

  // Jika sudah 100% lengkap dan user dismiss, jangan tampilkan
  if (isDismissed || (progressPercentage === 100 && isDismissed)) {
    return null;
  }

  const handleSendVerification = async () => {
    if (!auth.currentUser) return;
    setSendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Email verifikasi dikirim!', {
        description: `Periksa kotak masuk / spam di ${auth.currentUser.email}.`,
      });
    } catch (err: any) {
      toast.error('Gagal mengirim email verifikasi', {
        description: err?.message || 'Coba lagi dalam beberapa saat.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDismiss = () => {
    if (user?.uid) {
      localStorage.setItem(`onboarding_dismissed_${user.uid}`, 'true');
    }
    setIsDismissed(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all">
      {/* Background glow subtle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Panduan Memulai Akun Solo Technopark
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {progressPercentage}% Selesai
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Selesaikan 4 langkah berikut untuk membuka seluruh fitur ekosistem kawasan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Perluas' : 'Ciutkan'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
            title="Tutup Panduan"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-blue-100/70 h-2 rounded-full overflow-hidden mb-5">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Checklist items */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                step.completed
                  ? 'bg-white/90 border-emerald-200/80 shadow-2xs'
                  : 'bg-white border-blue-200/60 shadow-2xs'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400">Langkah {idx + 1}</span>
                  {step.completed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Selesai</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                      <Circle size={13} className="text-amber-500 shrink-0" />
                      <span>Perlu Tindakan</span>
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{step.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Action Button */}
              {!step.completed && (
                <div className="pt-3 mt-2 border-t border-slate-100">
                  {step.actionType === 'email_verify' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSendVerification}
                      disabled={sendingEmail}
                      className="w-full h-8 text-[11px] font-bold rounded-xl bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 gap-1.5"
                    >
                      <Mail size={12} />
                      <span>{sendingEmail ? 'Mengirim...' : 'Kirim Ulang Email'}</span>
                    </Button>
                  ) : step.href ? (
                    <Link href={step.href}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-[11px] font-bold rounded-xl bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
                      >
                        <span>Lengkapi</span>
                        <ArrowRight size={12} />
                      </Button>
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

