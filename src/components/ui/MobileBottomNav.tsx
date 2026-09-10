'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  Store, 
  Building2, 
  GraduationCap, 
  CalendarDays, 
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMobileMenu?: () => void;
}

const NAV_ITEMS = [
  { label: 'Beranda', path: '/', icon: Home, exact: true },
  { label: 'Katalog', path: '/e-katalog', icon: Store },
  { label: 'Fasilitas', path: '/fasilitas', icon: Building2 },
  { label: 'Pelatihan', path: '/program-pelatihan', icon: GraduationCap },
  { label: 'Event', path: '/event', icon: CalendarDays },
];

export default function MobileBottomNav({ onOpenMobileMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <div className="public-bottom-nav lg:hidden">
      <nav 
        aria-label="Navigasi Seluler Bawah"
        className="public-bottom-nav-bar"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact 
            ? pathname === item.path 
            : pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`public-bottom-nav-item ${isActive ? 'public-bottom-nav-item-active' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActiveIndicator"
                  className="absolute inset-0 bg-indigo-50/80 rounded-xl sm:rounded-2xl -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <Icon 
                size={19} 
                className={`transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} 
              />
              <span className={`text-[10px] mt-0.5 tracking-tight truncate ${isActive ? 'font-black' : 'font-semibold'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Tombol Menu Tambahan (Ekosistem, Ruang Belajar, FAQ, Profil, dll.) */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="public-bottom-nav-item"
            title="Buka Menu Lengkap"
          >
            <Menu size={19} className="stroke-[1.8]" />
            <span className="text-[10px] font-semibold mt-0.5 tracking-tight">
              Menu
            </span>
          </button>
        )}
      </nav>
    </div>
  );
}
