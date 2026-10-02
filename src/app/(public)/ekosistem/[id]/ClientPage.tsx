// Lokasi: src/app/(public)/ekosistem/[id]/ClientPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tenant } from '@/types/tenant.types';
import { ProductCatalog } from '@/types';
import { 
  ArrowLeft, 
  Building2, 
  Cpu, 
  Globe, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  ShoppingBag, 
  ArrowRight, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Briefcase, 
  MessageCircle,
  Share2,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionContainer from '@/components/ui/SectionContainer';
import PillTabs from '@/components/ui/PillTabs';
import { SocialShareBar } from '@/components/common/SocialShareBar';
import { getSegmentTheme } from '../components/TenantCard';

interface TenantDetailClientProps {
  tenantId: string;
  initialTenant: Tenant | null;
}

export default function TenantDetailClient({ tenantId, initialTenant }: TenantDetailClientProps) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant);
  const [loading, setLoading] = useState(!initialTenant);
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'PRODUCTS' | 'CONTACT'>('ABOUT');
  const [tenantProducts, setTenantProducts] = useState<ProductCatalog[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!initialTenant) {
      const fetchTenant = async () => {
        try {
          const docRef = doc(db, 'tenants', tenantId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setTenant({ id: snap.id, ...snap.data() } as Tenant);
          }
        } catch (err) {
          console.error('Gagal mengambil profil tenant:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchTenant();
    }
  }, [tenantId, initialTenant]);

  // Fetch produk yang dimiliki oleh tenant ini dari koleksi catalogs
  useEffect(() => {
    const fetchTenantCatalogs = async () => {
      setLoadingProducts(true);
      try {
        const q = query(collection(db, 'catalogs'), where('tenantId', '==', tenantId));
        const snap = await getDocs(q);
        const prods: ProductCatalog[] = [];
        snap.forEach(d => {
          prods.push({ id: d.id, ...d.data() } as ProductCatalog);
        });
        setTenantProducts(prods);
      } catch (err) {
        console.error('Gagal mengambil produk tenant:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (tenantId) {
      fetchTenantCatalogs();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <SectionContainer accent="indigo">
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-slate-500">Memuat profil inovator & startup...</p>
        </div>
      </SectionContainer>
    );
  }

  if (!tenant) {
    return (
      <SectionContainer accent="indigo">
        <div className="py-20 text-center max-w-md mx-auto space-y-4">
          <Building2 size={48} className="text-slate-300 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-slate-900">Tenant Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Profil inovator atau startup yang Anda cari tidak tersedia dalam pangkalan data kawasan.</p>
          <Link
            href="/ekosistem"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft size={14} /> Kembali ke Direktori Ekosistem
          </Link>
        </div>
      </SectionContainer>
    );
  }

  const theme = getSegmentTheme(tenant.segment);
  const cleanContact = tenant.contact ? tenant.contact.replace(/\D/g, '') : '';
  const waContact = cleanContact.startsWith('0') ? '62' + cleanContact.slice(1) : cleanContact;

  return (
    <SectionContainer accent="indigo" width="default">
      <div className="py-6 sm:py-10 space-y-8">

        {/* --- 1. TOP BREADCRUMB --- */}
        <div className="flex items-center justify-between">
          <Link
            href="/ekosistem"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} /> Kembali ke Direktori
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`border shadow-2xs font-bold text-xs ${theme.badge}`}>
              {tenant.segment || 'StartUp'}
            </Badge>
          </div>
        </div>

        {/* --- 2. HERO PROFILE HEADER --- */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cover Banner */}
          <div className="h-40 sm:h-52 w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            {tenant.coverImageUrl && (
              <img src={tenant.coverImageUrl} alt={tenant.name} className="w-full h-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          </div>

          {/* Profile Info Overlay */}
          <div className="px-6 sm:px-10 pb-8 relative -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              
              {/* Logo & Basic Info */}
              <div className="flex items-end gap-5">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-3 relative z-10">
                  {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 size={44} className="text-slate-300" />
                  )}
                </div>

                <div className="space-y-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {tenant.name}
                    </h1>
                    {tenant.legalEntity && tenant.legalEntity !== 'Belum Ada' && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {tenant.legalEntity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                    <Cpu size={13} /> {tenant.sector || 'Teknologi'} · Bergabung {tenant.joinedAt ? new Date(tenant.joinedAt).getFullYear() : '2024'}
                  </p>
                </div>
              </div>

              {/* Action Buttons & Social Share */}
              <div className="flex items-center gap-2 sm:self-end">
                <SocialShareBar title={`Startup ${tenant.name} di Solo Technopark`} description={tenant.elevatorPitch} compact={true} />
                
                {waContact && (
                  <a
                    href={`https://wa.me/${waContact}?text=${encodeURIComponent(`Halo ${tenant.name}, kami tertarik berkolaborasi melalui ekosistem Solo Technopark.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <MessageCircle size={15} />
                    <span>Hubungi Startup</span>
                  </a>
                )}
              </div>

            </div>

            {/* Elevator Pitch Tagline */}
            {tenant.elevatorPitch && (
              <p className="mt-6 text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                &ldquo;{tenant.elevatorPitch}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* --- 3. PILL TABS NAVIGATION --- */}
        <PillTabs
          tabs={[
            { key: 'ABOUT', label: 'Tentang & Inovasi', icon: <Lightbulb size={14} /> },
            { key: 'PRODUCTS', label: `Produk & Layanan (${tenantProducts.length})`, icon: <ShoppingBag size={14} /> },
            { key: 'CONTACT', label: 'Kontak & Legalitas', icon: <Briefcase size={14} /> },
          ]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
          layoutId="tenantDetailTabIndicator"
        />

        {/* --- 4. TAB CONTENTS --- */}
        {activeTab === 'ABOUT' && (
          <div className="space-y-6">
            {/* Problem & Solution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <Target size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Problem Statement</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {tenant.problemStatement || 'Tantangan industri atau kesenjangan kebutuhan pasar yang menjadi latar belakang lahirnya inovasi ini.'}
                </p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Solusi Ditawarkan</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {tenant.solutionStatement || 'Solusi teknologi tepat guna, produk teruji, atau layanan spesifik yang dihadirkan oleh tim pengembang.'}
                </p>
              </div>
            </div>

            {/* Company Description */}
            {tenant.companyDescription && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900">Profil Perusahaan</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {tenant.companyDescription}
                </p>
              </div>
            )}

            {/* Current Needs / Traction */}
            {tenant.currentNeeds && tenant.currentNeeds.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900">Kebutuhan Akselerasi Saat Ini</h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tenant.currentNeeds.map((need, i) => (
                    <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                      ✓ {need}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'PRODUCTS' && (
          <div className="space-y-6">
            {loadingProducts ? (
              <div className="py-16 text-center text-slate-400 text-xs font-bold">Memuat produk tenant...</div>
            ) : tenantProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
                <ShoppingBag size={40} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Belum Ada Produk Terdaftar di Katalog</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Produk inovasi dari {tenant.name} sedang dalam proses kurasi kualitas oleh tim inkubator Solo Technopark.
                </p>
                <Link
                  href="/e-katalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm"
                >
                  Jelajahi E-Katalog Kawasan <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tenantProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/e-katalog/${p.id}`}
                    className="public-card public-card-hover group flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                        {p.coverImage || (p.images && p.images[0]) ? (
                          <img src={p.coverImage || p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-white/95 text-[10px] font-bold px-2 py-0.5 rounded-md text-slate-800 shadow-2xs">
                          {p.category}
                        </span>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-slate-900">
                        {p.price ? `Rp ${Number(p.price).toLocaleString('id-ID')}` : 'Hubungi Kami'}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Detail <ArrowRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CONTACT' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-lg font-black text-slate-900">Informasi Manajemen & Kontak Resmi</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Founder / Penanggung Jawab</span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  <span>{tenant.ownerName || 'Tim Manajemen'}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Telepon / WhatsApp</span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Phone size={16} className="text-emerald-600" />
                  <span>{tenant.contact || 'Melalui Sekretariat STP'}</span>
                </p>
              </div>

              {tenant.email && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Surel Bisnis</span>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Mail size={16} className="text-blue-600" />
                    <span>{tenant.email}</span>
                  </p>
                </div>
              )}

              {tenant.website && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Situs Web Resmi</span>
                  <a
                    href={tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2"
                  >
                    <Globe size={16} />
                    <span className="truncate">{tenant.website}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Legal Status */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-900 font-medium">
                Tenant resmi binaan Kawasan Sains dan Teknologi Solo Technopark. Terverifikasi dalam sistem pendampingan PPK-BLUD.
              </p>
            </div>
          </div>
        )}

      </div>
    </SectionContainer>
  );
}