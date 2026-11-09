"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  ClockCheck,
  Receipt,
  GraduationCap,
  Building2,
  CalendarDays,
  Wrench,
  Shield,
  Layers,
  X,
} from 'lucide-react';
import { hasAccess, canPerformAction } from '@/config/roles';
import { AdminMenuGroupConfig, AdminMenuItemConfig, AdminSubTabConfig } from '@/app/(admin)/layout';

export interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  role: string | null;
  menuGroups: AdminMenuGroupConfig[];
}

interface PaletteItem {
  id: string;
  type: 'menu' | 'subtab' | 'action';
  title: string;
  subtitle: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  keywords?: string[];
}

export default function AdminCommandPalette({
  isOpen,
  onClose,
  role,
  menuGroups,
}: AdminCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Kompilasi item yang dapat diakses pengguna
  const accessibleItems = useMemo(() => {
    const items: PaletteItem[] = [];

    // 1. Aksi Cepat Bawaan
    if (hasAccess(role, '/billing')) {
      items.push({
        id: 'action-billing-income',
        type: 'action',
        title: 'Verifikasi Pembayaran & Pendapatan',
        subtitle: 'Buka antrean pembayaran masuk billing',
        href: '/billing?tab=KONFIRMASI',
        icon: Receipt,
        badge: 'Keuangan',
        keywords: ['bayar', 'konfirmasi', 'income', 'tagihan', 'kasir'],
      });
    }

    if (hasAccess(role, '/pelatihan')) {
      items.push({
        id: 'action-pelatihan-alumni',
        type: 'action',
        title: 'Database Alumni & Sertifikat',
        subtitle: 'Pencarian 600+ alumni & verifikasi sertifikat',
        href: '/pelatihan?tab=alumni',
        icon: GraduationCap,
        badge: 'Pelatihan',
        keywords: ['alumni', 'sertifikat', 'kelulusan', 'peserta'],
      });
    }

    if (hasAccess(role, '/booking')) {
      items.push({
        id: 'action-booking-calendar',
        type: 'action',
        title: 'Kalender Master Pemakaian Ruangan',
        subtitle: 'Jadwal peminjaman aset & gedung technopark',
        href: '/booking?tab=Kalender',
        icon: CalendarDays,
        badge: 'Operasional',
        keywords: ['jadwal', 'kalender', 'ruangan', 'sewa', 'agenda'],
      });
    }

    if (hasAccess(role, '/service-desk')) {
      items.push({
        id: 'action-servicedesk-open',
        type: 'action',
        title: 'Antrean Tiket Perbaikan & SPK',
        subtitle: 'Tiket sarpras menunggu penanganan teknisi',
        href: '/service-desk?tab=OPEN',
        icon: Wrench,
        badge: 'Sarpras',
        keywords: ['tiket', 'rusak', 'komplain', 'teknisi', 'spk'],
      });
    }

    if (hasAccess(role, '/presensi')) {
      items.push({
        id: 'action-presensi-cepat',
        type: 'action',
        title: 'Presensi Pegawai STP (Techno Sign)',
        subtitle: 'Buka sistem presensi & tanda tangan digital',
        href: '/presensi',
        icon: ClockCheck,
        badge: 'Kepegawaian',
        keywords: ['absen', 'kehadiran', 'pegawai', 'sign', 'presensi'],
      });
    }

    // 2. Seluruh Menu & Sub-Tab berdasarkan MENU_GROUPS
    menuGroups.forEach((group) => {
      const allowedMenuItems = group.items.filter((item) => hasAccess(role, item.href));
      allowedMenuItems.forEach((menu) => {
        // Menu Utama
        items.push({
          id: `menu-${menu.href}`,
          type: 'menu',
          title: menu.name,
          subtitle: `Modul ${group.group}`,
          href: menu.href,
          icon: menu.icon,
          badge: group.group,
          keywords: [menu.name.toLowerCase(), group.group.toLowerCase()],
        });

        // Sub-Tab
        if (menu.subTabs) {
          menu.subTabs.forEach((sub) => {
            if (sub.hideForRoles && role && sub.hideForRoles.includes(role)) return;
            if (sub.permission && !canPerformAction(role as any, sub.permission as any)) return;

            items.push({
              id: `subtab-${menu.href}-${sub.id}`,
              type: 'subtab',
              title: sub.label,
              subtitle: `${menu.name} › ${group.group}`,
              href: `${menu.href}?tab=${encodeURIComponent(sub.id)}`,
              icon: menu.icon,
              badge: 'Sub-Tab',
              keywords: [
                sub.label.toLowerCase(),
                sub.id.toLowerCase(),
                menu.name.toLowerCase(),
                group.group.toLowerCase(),
              ],
            });
          });
        }
      });
    });

    return items;
  }, [menuGroups, role]);

  // Filter hasil pencarian
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accessibleItems.slice(0, 20); // Tampilkan 20 teratas secara default

    return accessibleItems
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const subMatch = item.subtitle.toLowerCase().includes(q);
        const keywordMatch = item.keywords?.some((k) => k.includes(q));
        return titleMatch || subMatch || keywordMatch;
      })
      .slice(0, 30);
  }, [accessibleItems, query]);

  // Reset selectedIndex saat hasil berubah
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Autofocus input saat dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Navigasi keyboard & shortcut Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  // Scroll otomatis ke item yang dipilih
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[75vh] animate-in zoom-in-95 duration-150 z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3 bg-slate-50/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik untuk mencari menu, sub-tab, atau aksi cepat (mis. Alumni, Invoice, Booking)..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50 custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <Command className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada menu yang cocok</p>
              <p className="text-xs text-slate-400">
                Coba kata kunci lain seperti <i>&quot;Alumni&quot;</i>, <i>&quot;Tagihan&quot;</i>, atau <i>&quot;Presensi&quot;</i>.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComponent = item.icon || Layers;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-100 group ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'hover:bg-slate-100/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : item.type === 'action'
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.type === 'subtab'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] truncate ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? 'text-white translate-x-0.5'
                        : 'text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs font-bold text-slate-600">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs font-bold text-slate-600">
                ↓
              </kbd>
              Navigasi
            </span>
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] shadow-2xs font-bold text-slate-600">
                ↵
              </kbd>
              Pilih
            </span>
          </div>
          <span className="font-semibold text-slate-500">
            {filteredItems.length} opsi tersedia
          </span>
        </div>
      </div>
    </div>
  );
}

