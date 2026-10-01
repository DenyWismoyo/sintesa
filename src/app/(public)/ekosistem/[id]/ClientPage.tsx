// Lokasi file: src/app/(public)/ekosistem/[id]/ClientPage.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantTeam, useTenantProducts, useTenantMilestones } from '@/hooks/useTenants';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, Target, CheckCircle2, DollarSign, Package, 
  Users, TrendingUp, Mail, ExternalLinkIcon, Star, Code2, ChevronDown, 
  Maximize2, Minimize2, ShieldCheck, Phone, ArrowUpRight, Zap, UserPlus, 
  FileText, Linkedin, Instagram, Youtube, DownloadCloud, Sparkles, MessageCircle, Share2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// --- ENTERPRISE FEATURE: SMART IMAGE OPTIMIZATION ---
const OptimizedImage = ({ src, alt, className, defaultIcon }: { src?: string, alt: string, className: string, defaultIcon?: React.ReactNode }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;
    try {
      const urlObj = new URL(src);
      if (urlObj.hostname.includes('firebasestorage')) {
         const pathParts = urlObj.pathname.split('%2F');
         const fileName = pathParts.pop();
         if (fileName && !fileName.startsWith('thumb_') && !src.includes('.webp')) {
             const cleanName = fileName.replace(/\.[^/.]+$/, ""); 
             pathParts.push(`thumb_${cleanName}.webp`);
             urlObj.pathname = pathParts.join('%2F');
             setImgSrc(urlObj.toString());
         } else { setImgSrc(src); }
      } else { setImgSrc(src); }
    } catch { setImgSrc(src); }
  }, [src]);

  if (!src || hasError) return <>{defaultIcon}</>;
  return <img src={imgSrc} alt={alt} className={className} onError={() => { if (imgSrc !== src) { setImgSrc(src); } else { setHasError(true); } }} />;
};

const fadeUpVariants: Variants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getSegmentTheme = (segment?: string) => {
  switch (segment) {
    case 'StartUp': return { color: '#6366F1', tailwind: 'indigo', text: 'text-indigo-600', bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-200' };
    case 'UMKM': return { color: '#F59E0B', tailwind: 'amber', text: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200' };
    case 'Koperasi': return { color: '#10B981', tailwind: 'emerald', text: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-200' };
    case 'Kampus': return { color: '#3B82F6', tailwind: 'blue', text: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-200' };
    case 'Industri': return { color: '#8B5CF6', tailwind: 'purple', text: 'text-purple-600', bg: 'bg-purple-600', lightBg: 'bg-purple-50', border: 'border-purple-200' };
    default: return { color: '#6366F1', tailwind: 'indigo', text: 'text-indigo-600', bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-200' };
  }
};

const FAQItem = ({ faq }: { faq: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0 bg-white transition-all duration-300">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-4 text-left focus:outline-none group">
        <span className="font-bold text-slate-800 pr-3 text-sm sm:text-base tracking-tight group-hover:text-indigo-600 transition-colors">{faq.question}</span>
        <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-4 text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">{faq.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExpandableText = ({ text, maxLength = 240, theme }: { text: string, maxLength?: number, theme: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (text.length <= maxLength) return <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-normal">{text}</p>;

  return (
    <div className="relative">
      <motion.div animate={{ height: isExpanded ? 'auto' : '110px' }} className="overflow-hidden relative">
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-normal whitespace-pre-wrap">{text}</p>
        {!isExpanded && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />}
      </motion.div>
      <button onClick={() => setIsExpanded(!isExpanded)} className={`mt-2 inline-flex items-center gap-1 text-xs sm:text-sm font-bold transition-colors ${theme.text} hover:opacity-80`}>
        {isExpanded ? <><Minimize2 size={13}/> Sembunyikan</> : <><Maximize2 size={13}/> Baca Selengkapnya</>}
      </button>
    </div>
  );
};

export default function TenantProfilePublicPage({ tenantId, initialTenant }: { tenantId: string, initialTenant?: any }) {
  const router = useRouter();
  
  const [tenant, setTenant] = useState<any>(() => {
    if (initialTenant && (!tenantId || initialTenant.id === tenantId)) return initialTenant;
    return null;
  });
  const [isTenantsLoading, setIsTenantsLoading] = useState(() => {
    if (initialTenant && (!tenantId || initialTenant.id === tenantId)) return false;
    return true;
  });

  useEffect(() => {
    if (!tenantId) return;
    if (initialTenant && initialTenant.id === tenantId) {
      setTenant(initialTenant);
      setIsTenantsLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTenant({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Gagal memuat profil tenant:", error);
      } finally {
        setIsTenantsLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId, initialTenant]);

  const { teamMembers } = useTenantTeam(tenant?.id);
  const { products } = useTenantProducts(tenant?.id);
  const { milestones } = useTenantMilestones(tenant?.id);

  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const sections = ['produk', 'overview', 'traksi', 'faq'];
        const scrollYPos = window.scrollY;
        let currentSection = 'overview';
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element && scrollYPos >= (element.offsetTop - 150)) {
            currentSection = section;
          }
        }
        setActiveSection(currentSection);
      }, 50); 
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(timeoutId); };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const elementPosition = element.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  if (isTenantsLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-8 flex justify-center w-full px-4">
        <div className="w-full max-w-[1400px] h-[350px] rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-[70vh] bg-[#FAFAFA] flex flex-col items-center justify-center px-4 w-full text-center">
        <Building2 className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Profil Startup Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">Tenant atau inovator yang Anda cari mungkin belum dipublikasikan atau tautan salah.</p>
        <Button onClick={() => router.push('/ekosistem')} className="rounded-full px-6 bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-sm">
          Kembali ke Ekosistem
        </Button>
      </div>
    );
  }

  const primaryCtaText = tenant.primaryCta?.text || 'Kunjungi Website';
  const primaryCtaUrl = tenant.primaryCta?.url ? ensureAbsoluteUrl(tenant.primaryCta.url) : (tenant.website ? ensureAbsoluteUrl(tenant.website) : null);
  
  const theme = tenant.brandColor 
    ? { color: tenant.brandColor, tailwind: 'custom', text: `text-[${tenant.brandColor}]`, bg: `bg-[${tenant.brandColor}]`, lightBg: 'bg-slate-50', border: 'border-slate-200' } 
    : getSegmentTheme(tenant.segment);
  const mainColor = tenant.brandColor || theme.color;

  const cleanWhatsappNumber = tenant.contact ? tenant.contact.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-32 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. CLEAN LIGHT HERO SECTION (Sesuai Tema Terang Solo Technopark) */}
      <div className="w-full max-w-[1400px] mx-auto sm:px-6 lg:px-10 sm:pt-6">
        
        {/* Cover Image Container */}
        <div className="relative w-full h-44 sm:h-64 md:h-80 sm:rounded-3xl overflow-hidden bg-slate-100 border-b sm:border border-slate-200/80 shadow-xs">
          <OptimizedImage 
            src={tenant.coverImageUrl} 
            alt={`${tenant.name} Cover`} 
            className="w-full h-full object-cover" 
            defaultIcon={
              <div 
                className="w-full h-full flex items-center justify-center" 
                style={{ background: `linear-gradient(135deg, ${mainColor}15, ${mainColor}35)` }}
              >
                <Building2 size={64} className="opacity-20" style={{ color: mainColor }} />
              </div>
            }
          />

          {/* Top Floating Back & Share Button */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <button 
              onClick={() => router.push('/ekosistem')} 
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white/90 backdrop-blur-md border border-slate-200/80 hover:bg-white px-3 py-1.5 rounded-full shadow-xs transition-colors"
            >
              <ArrowLeft size={13} /> Ekosistem
            </button>

            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: tenant.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tautan profil tenant berhasil disalin!');
                }
              }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-700 flex items-center justify-center hover:text-indigo-600 transition-colors shadow-xs"
              title="Bagikan Profil"
            >
              <Share2 size={13}/>
            </button>
          </div>
        </div>

        {/* Identity & Profile Bar */}
        <div className="px-4 sm:px-2 pt-0 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 mb-4 relative z-10">
            
            {/* Logo & Title Box */}
            <div className="flex items-end gap-3.5 sm:gap-5">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 shadow-md border-2 border-white shrink-0 flex items-center justify-center overflow-hidden">
                <OptimizedImage 
                  src={tenant.logoUrl} 
                  alt={tenant.name} 
                  className="w-full h-full object-contain" 
                  defaultIcon={<span className="text-3xl sm:text-4xl font-black" style={{ color: mainColor }}>{tenant.name.charAt(0)}</span>}
                />
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge className="px-2 py-0.2 font-bold tracking-wider uppercase text-[10px] border-none text-white shadow-xs" style={{ backgroundColor: mainColor }}>
                    {tenant.segment || 'StartUp'}
                  </Badge>
                  {tenant.isVerified && (
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.2 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <ShieldCheck size={11} className="text-blue-600"/> Verified
                    </Badge>
                  )}
                  {tenant.status === 'Alumni' && (
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.2 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                       <Star size={11} className="fill-amber-400 text-amber-400" /> Alumni STP
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{tenant.name}</h1>
              </div>
            </div>

            {/* Quick Action Desktop */}
            <div className="hidden sm:flex items-center gap-2 self-end pb-1">
              {cleanWhatsappNumber && (
                <a 
                  href={`https://wa.me/${cleanWhatsappNumber}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 px-4 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageCircle size={15}/> WhatsApp
                </a>
              )}
              {primaryCtaUrl && (
                <a 
                  href={primaryCtaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-10 px-5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: mainColor }}
                >
                  {primaryCtaText} <ArrowUpRight size={14} />
                </a>
              )}
            </div>

          </div>

          {/* Elevator Pitch Tagline */}
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-3xl">
            {tenant.elevatorPitch || "Inovator binaan ekosistem riset & teknologi terpadu Solo Technopark."}
          </p>

          {/* Key Metrics Chips (Horizontal Scrollable) */}
          {tenant.keyMetrics && tenant.keyMetrics.length > 0 && (
            <div className="mt-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 flex overflow-x-auto no-scrollbar divide-x divide-slate-100">
              {tenant.keyMetrics.map((metric: any, idx: number) => (
                <div key={idx} className="flex-1 min-w-[120px] px-4 py-2 text-center flex flex-col justify-center">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">
                    {metric.value}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metric.label}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* 2. MAIN CONTENT LAYOUT */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mt-4 sm:mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* KOLOM UTAMA */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Sticky Navigation PillTabs */}
            <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs rounded-full p-1 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Profil' },
                { id: 'produk', label: 'Produk & Layanan', hidden: !products || products.length === 0 },
                { id: 'traksi', label: 'Jejak & Traksi', hidden: !milestones || milestones.length === 0 },
                { id: 'faq', label: 'FAQ', hidden: !tenant.faqs || tenant.faqs.length === 0 }
              ].filter(t => !t.hidden).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    activeSection === tab.id 
                      ? 'text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  style={activeSection === tab.id ? { backgroundColor: mainColor } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Section: Overview (Misi, Solusi & Tech Stack) */}
            <section id="overview" className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-5 sm:p-7 scroll-mt-24">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">Misi & Solusi</h3>
              <div className="space-y-6">
                {tenant.companyDescription && <ExpandableText text={tenant.companyDescription} maxLength={350} theme={theme} />}
                
                {(tenant.problemStatement || tenant.solutionStatement) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {tenant.problemStatement && (
                      <div className="bg-slate-50/70 border border-slate-100 p-4 sm:p-5 rounded-2xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <Target size={14} className="text-rose-500"/> Masalah (Problem)
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">{tenant.problemStatement}</p>
                      </div>
                    )}
                    {tenant.solutionStatement && (
                      <div className="bg-emerald-50/40 border border-emerald-100/60 p-4 sm:p-5 rounded-2xl">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={14} className="text-emerald-600"/> Solusi (Solution)
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">{tenant.solutionStatement}</p>
                      </div>
                    )}
                  </div>
                )}

                {tenant.techStack && tenant.techStack.length > 0 && (
                   <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <Code2 size={14}/> Teknologi yang Digunakan
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                         {tenant.techStack.map((tech: string, idx: number) => (
                           <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1 rounded-lg">
                             {tech}
                           </span>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </section>

            {/* Section: Produk & Layanan (Borderless Card Grid / Mobile Friendly) */}
            {products && products.length > 0 && (
              <section id="produk" className="scroll-mt-24">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Katalog Produk & Layanan</h2>
                    <p className="text-xs sm:text-sm text-slate-500">Inovasi unggulan yang telah dirilis ke pasar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-white border border-slate-200/70 rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
                       
                       <div className="w-full h-44 sm:h-48 bg-slate-100 relative overflow-hidden shrink-0">
                         {prod.images && prod.images.length > 0 ? (
                           <OptimizedImage src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                             <Package size={36} className="opacity-40"/>
                           </div>
                         )}

                         {/* Badges */}
                         <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                           {prod.businessModel && (
                             <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                               {prod.businessModel}
                             </span>
                           )}
                           {prod.isCurated && (
                             <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                               <ShieldCheck size={10}/> Curated
                             </span>
                           )}
                         </div>
                       </div>

                       <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
                         <h4 className="font-black text-slate-900 text-base sm:text-lg mb-1 leading-snug group-hover:text-indigo-600 transition-colors">{prod.name}</h4>
                         <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 font-normal line-clamp-3 flex-1">{prod.description}</p>
                         
                         {/* Fitur Highlights Ringkas */}
                         {prod.features && prod.features.length > 0 && (
                           <div className="mb-4 bg-slate-50/80 rounded-xl p-2.5 space-y-1.5 border border-slate-100">
                             {prod.features.slice(0, 2).map((feat: string, i: number) => (
                               <div key={i} className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                                 <CheckCircle2 size={12} className="text-emerald-500 shrink-0"/>
                                 <span className="truncate">{feat}</span>
                               </div>
                             ))}
                           </div>
                         )}

                         {prod.productUrl && (
                           <a 
                             href={ensureAbsoluteUrl(prod.productUrl)} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="mt-auto inline-flex items-center text-xs sm:text-sm font-bold transition-colors pt-2 border-t border-slate-100" 
                             style={{ color: mainColor }}
                           >
                             {prod.callToActionText || 'Kunjungi Layanan'} <ArrowUpRight size={14} className="ml-1"/>
                           </a>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Custom Sections (Jika ada konten tambahan) */}
            {tenant.customSections && tenant.customSections.length > 0 && (
              <div className="space-y-4">
                 {tenant.customSections.map((sec: any) => {
                   const isImageTop = sec.mediaPosition === 'top';
                   const hasImage = !!sec.mediaUrl;
                   return (
                     <div key={sec.id} className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/70">
                        {hasImage && isImageTop && (
                          <div className="w-full rounded-2xl overflow-hidden bg-slate-50 mb-4">
                             <OptimizedImage src={sec.mediaUrl} alt={sec.title} className="w-full h-auto object-cover rounded-2xl" />
                          </div>
                        )}
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 leading-tight">{sec.title}</h3>
                        <div className="text-slate-600 leading-relaxed space-y-2 text-xs sm:text-sm font-normal">
                           {sec.content.split('\n').map((line: string, i: number) => <p key={i}>{line}</p>)}
                        </div>
                     </div>
                   );
                 })}
              </div>
            )}

            {/* Video Promo YouTube */}
            {tenant.promoVideoUrl && getYoutubeId(tenant.promoVideoUrl) && (
              <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-xs border border-slate-200 bg-black relative">
                <iframe 
                  src={`https://www.youtube.com/embed/${getYoutubeId(tenant.promoVideoUrl)}`} 
                  title="Promo Video" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                  className="absolute inset-0 w-full h-full border-none"
                ></iframe>
              </div>
            )}

            {/* Milestones / Traksi */}
            {milestones && milestones.length > 0 && (
              <section id="traksi" className="scroll-mt-24">
                <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-5 sm:p-7">
                  <div className="mb-6">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Jejak & Pencapaian</h3>
                    <p className="text-slate-500 text-xs sm:text-sm">Rekam jejak pertumbuhan, pendanaan, dan produk.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {milestones.map((mile: any) => (
                      <div key={mile.id} className="flex items-start gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          {mile.category === 'Funding' ? <DollarSign size={14} className="text-amber-500"/> : mile.category === 'Product' ? <Package size={14} className="text-blue-500"/> : <TrendingUp size={14} className="text-emerald-500"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{mile.date}</span>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{mile.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal mt-0.5">{mile.description}</p>
                          {mile.articleUrl && (
                            <a href={ensureAbsoluteUrl(mile.articleUrl)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold" style={{ color: mainColor }}>
                              Baca Berita <ArrowUpRight size={11}/>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* FAQ */}
            {tenant.faqs && tenant.faqs.length > 0 && (
              <section id="faq" className="scroll-mt-24">
                <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-5 sm:p-7">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">Pertanyaan yang Sering Diajukan</h3>
                  <div className="flex flex-col">
                    {tenant.faqs.map((faq: any, idx: number) => <FAQItem key={idx} faq={faq} />)}
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* KOLOM KANAN: SIDEBAR DESKTOP */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-20 flex flex-col gap-4 pb-8">
              
              {/* Card Informasi Bisnis & Kontak */}
              <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Funding Stage</p>
                    <p className="text-lg font-black text-slate-900 leading-none">{tenant.fundingStage || 'Bootstrapped'}</p>
                  </div>
                  {tenant.isRaising && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"/> Raising
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6 text-xs sm:text-sm">
                   <div className="flex justify-between items-center"><span className="text-slate-500">Sektor</span><span className="font-bold text-slate-900">{tenant.sector || '-'}</span></div>
                   <div className="flex justify-between items-center"><span className="text-slate-500">Badan Hukum</span><span className="font-bold text-slate-900">{tenant.legalEntity || '-'}</span></div>
                   <div className="flex justify-between items-center"><span className="text-slate-500">Ukuran Tim</span><span className="font-bold text-slate-900">{tenant.teamSize ? `${tenant.teamSize} Orang` : '-'}</span></div>
                </div>

                {primaryCtaUrl && (
                  <a 
                    href={primaryCtaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full py-3 text-white font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-1.5 transition-all hover:opacity-90 shadow-xs mb-3" 
                    style={{ backgroundColor: mainColor }}
                  >
                    {primaryCtaText} <ArrowUpRight size={14} />
                  </a>
                )}

                {/* Quick Icon Links */}
                <div className="flex items-center gap-2 mb-4">
                  {cleanWhatsappNumber && (
                    <a 
                      href={`https://wa.me/${cleanWhatsappNumber}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 bg-slate-50 hover:bg-[#25D366]/10 text-slate-600 hover:text-[#1EBE5A] border border-slate-200 py-2 rounded-xl flex items-center justify-center transition-colors"
                      title="WhatsApp"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                  {tenant.email && (
                    <a 
                      href={`mailto:${tenant.email}`} 
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2 rounded-xl flex items-center justify-center transition-colors"
                      title="Email"
                    >
                      <Mail size={15} />
                    </a>
                  )}
                  {tenant.pitchDeckUrl && (
                    <a 
                      href={tenant.pitchDeckUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title="Pitch Deck" 
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <FileText size={15} />
                    </a>
                  )}
                </div>

                {/* Social Links */}
                {tenant.socialLinks && (tenant.socialLinks.linkedin || tenant.socialLinks.instagram || tenant.socialLinks.youtube || tenant.socialLinks.tiktok) && (
                  <div className="flex justify-center items-center gap-4 pt-3 border-t border-slate-100">
                    {tenant.socialLinks.linkedin && <a href={ensureAbsoluteUrl(tenant.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors"><Linkedin size={16} /></a>}
                    {tenant.socialLinks.instagram && <a href={ensureAbsoluteUrl(tenant.socialLinks.instagram)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600 transition-colors"><Instagram size={16} /></a>}
                    {tenant.socialLinks.youtube && <a href={ensureAbsoluteUrl(tenant.socialLinks.youtube)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-600 transition-colors"><Youtube size={16} /></a>}
                    {tenant.socialLinks.tiktok && <a href={ensureAbsoluteUrl(tenant.socialLinks.tiktok)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors font-bold text-[11px] flex items-center">TikTok</a>}
                  </div>
                )}
              </div>

              {/* Dokumen Publik */}
              {tenant.publicAssets && (tenant.publicAssets.companyProfileUrl || tenant.publicAssets.mediaKitUrl) && (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><DownloadCloud size={13} /> Dokumen Publik</h4>
                  <div className="space-y-2">
                    {tenant.publicAssets.companyProfileUrl && <a href={ensureAbsoluteUrl(tenant.publicAssets.companyProfileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-colors">Company Profile <ExternalLinkIcon size={12} className="text-slate-400"/></a>}
                    {tenant.publicAssets.mediaKitUrl && <a href={ensureAbsoluteUrl(tenant.publicAssets.mediaKitUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-colors">Media Kit <ExternalLinkIcon size={12} className="text-slate-400"/></a>}
                  </div>
                </div>
              )}

              {/* Founder & Tim */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5"><Users size={13} /> Tim & Founder</h4>
                {teamMembers && teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">{member.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0"><h5 className="font-bold text-slate-800 text-xs truncate">{member.name}</h5><p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">{member.role}</p></div>
                      </div>
                    ))}
                  </div>
                ) : tenant.ownerName ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">{tenant.ownerName.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><h5 className="font-bold text-slate-800 text-xs truncate">{tenant.ownerName}</h5><p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Founder</p></div>
                  </div>
                ) : <p className="text-xs text-slate-400">Informasi tim belum tersedia.</p>}
              </div>

              {/* Lowongan Kerja */}
              {tenant.jobOpenings && tenant.jobOpenings.length > 0 && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-5 shadow-xs">
                   <div className="flex items-center gap-1.5 mb-3"><UserPlus size={15} className="text-emerald-600" /><h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">Sedang Merekrut</h4></div>
                   <div className="space-y-2">
                      {tenant.jobOpenings.map((job: any) => (
                         <div key={job.id} className="block p-2.5 bg-white border border-emerald-100 rounded-xl"><h5 className="font-bold text-slate-800 text-xs">{job.title}</h5><p className="text-[10px] font-medium text-slate-500 mt-0.5">{job.type} • {job.location}</p></div>
                      ))}
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE STICKY BOTTOM BAR (Akses Cepat Tenant) --- */}
      <div className="public-detail-bottom-bar sm:hidden">
        <div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{tenant.segment || 'Startup'} STP</p>
           <p className="text-sm font-black text-slate-900 leading-none truncate max-w-[130px]">{tenant.fundingStage || 'Binaan STP'}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {cleanWhatsappNumber && (
            <a 
              href={`https://wa.me/${cleanWhatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-xs shrink-0"
              title="Hubungi via WhatsApp"
            >
              <Phone size={16}/>
            </a>
          )}
          {primaryCtaUrl ? (
            <a 
              href={primaryCtaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-full text-xs font-bold text-white shadow-xs flex items-center gap-1"
              style={{ backgroundColor: mainColor }}
            >
              {primaryCtaText} <ArrowUpRight size={13}/>
            </a>
          ) : (
            <Button 
              onClick={() => {
                if (navigator.share) navigator.share({ title: tenant.name, url: window.location.href });
                else { navigator.clipboard.writeText(window.location.href); alert('Tautan disalin!'); }
              }}
              className="h-10 px-4 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs"
            >
              Bagikan
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}