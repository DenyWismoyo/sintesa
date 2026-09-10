// Lokasi file: src/app/(public)/ekosistem/[id]/ClientPage.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantTeam, useTenantProducts, useTenantMilestones } from '@/hooks/useTenants';
import { motion, Variants, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowLeft, Building2, Target, CheckCircle2, DollarSign, Package, 
  Users, TrendingUp, Mail, ExternalLinkIcon, Star, Code2, ChevronDown, 
  Maximize2, Minimize2, ShieldCheck, Phone, ArrowUpRight, Zap, UserPlus, 
  FileText, Linkedin, Instagram, Youtube, DownloadCloud, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    } catch(e) { setImgSrc(src); }
  }, [src]);

  if (!src || hasError) return <>{defaultIcon}</>;
  return <img src={imgSrc} alt={alt} className={className} onError={() => { if (imgSrc !== src) { setImgSrc(src); } else { setHasError(true); } }} />;
};

const fadeUpVariants: Variants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
const staggerContainer: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

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
    case 'StartUp': return { color: '#6366F1', tailwind: 'indigo', text: 'text-indigo-600', bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-200', shadow: 'shadow-indigo-500/20' };
    case 'UMKM': return { color: '#F59E0B', tailwind: 'amber', text: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200', shadow: 'shadow-amber-500/20' };
    case 'Koperasi': return { color: '#10B981', tailwind: 'emerald', text: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-200', shadow: 'shadow-emerald-500/20' };
    case 'Kampus': return { color: '#3B82F6', tailwind: 'blue', text: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', border: 'border-blue-200', shadow: 'shadow-blue-500/20' };
    case 'Industri': return { color: '#8B5CF6', tailwind: 'purple', text: 'text-purple-600', bg: 'bg-purple-600', lightBg: 'bg-purple-50', border: 'border-purple-200', shadow: 'shadow-purple-500/20' };
    default: return { color: '#6366F1', tailwind: 'indigo', text: 'text-indigo-600', bg: 'bg-indigo-600', lightBg: 'bg-indigo-50', border: 'border-indigo-200', shadow: 'shadow-indigo-500/20' };
  }
};

const FAQItem = ({ faq, theme }: { faq: any, theme: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border-b border-slate-100 last:border-0 bg-white transition-all duration-300`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-5 text-left focus:outline-none group">
        <span className="font-bold text-slate-800 pr-4 text-base tracking-tight group-hover:text-slate-900">{faq.question}</span>
        <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-slate-800' : 'text-slate-400'}`}><ChevronDown size={20} /></div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-6 text-slate-600 text-sm leading-relaxed font-medium">{faq.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ExpandableText = ({ text, maxLength = 250, theme }: { text: string, maxLength?: number, theme: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (text.length <= maxLength) return <p className="text-slate-600 leading-relaxed text-base font-medium">{text}</p>;

  return (
    <div className="relative">
      <motion.div animate={{ height: isExpanded ? 'auto' : '120px' }} className="overflow-hidden relative">
        <p className="text-slate-600 leading-relaxed text-base font-medium whitespace-pre-wrap">{text}</p>
        {!isExpanded && <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />}
      </motion.div>
      <button onClick={() => setIsExpanded(!isExpanded)} className={`mt-2 inline-flex items-center gap-1.5 text-sm font-bold transition-colors ${theme.text} hover:opacity-80`}>
        {isExpanded ? <><Minimize2 size={14}/> Sembunyikan</> : <><Maximize2 size={14}/> Baca Selengkapnya</>}
      </button>
    </div>
  );
};

export default function TenantProfilePublicPage({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  
  const [tenant, setTenant] = useState<any>(null);
  const [isTenantsLoading, setIsTenantsLoading] = useState(true);

  // 1. Fetch Tenant secara aman di Browser (Klien) untuk bypass bug gRPC Node.js
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTenant({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        setIsTenantsLoading(false);
      }
    };
    if (tenantId) fetchTenant();
  }, [tenantId]);

  // 2. Fetch Subkoleksi secara otomatis (Klien)
  const { teamMembers, isLoading: isTeamLoading } = useTenantTeam(tenant?.id);
  const { products, isLoading: isProductsLoading } = useTenantProducts(tenant?.id);
  const { milestones, isLoading: isMilestonesLoading } = useTenantMilestones(tenant?.id);

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
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  if (isTenantsLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-8 flex justify-center w-full">
        <div className="w-full max-w-[1800px] h-[500px] rounded-[3rem] mx-4 bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-[70vh] bg-[#F8FAFC] flex flex-col items-center justify-center px-4 w-full">
        <Building2 className="w-20 h-20 text-slate-300 mb-6" />
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Profil Tidak Ditemukan</h2>
        <button onClick={() => router.push('/ekosistem')} className="mt-8 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1">
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const primaryCtaText = tenant.primaryCta?.text || 'Kunjungi Website';
  const primaryCtaUrl = tenant.primaryCta?.url ? ensureAbsoluteUrl(tenant.primaryCta.url) : (tenant.website ? ensureAbsoluteUrl(tenant.website) : null);
  
  const theme = tenant.brandColor ? { color: tenant.brandColor, tailwind: 'custom', text: `text-[${tenant.brandColor}]`, bg: `bg-[${tenant.brandColor}]`, lightBg: 'bg-slate-50', border: 'border-slate-200', shadow: 'shadow-xl' } : getSegmentTheme(tenant.segment);
  const mainColor = tenant.brandColor || theme.color;

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-40 font-sans">
      
      {/* 1. IMMERSIVE HERO SECTION */}
      <div className="relative w-full h-[50vh] min-h-[450px] max-h-[600px] overflow-hidden bg-slate-900">
        <motion.div style={{ y: heroY, opacity: heroOpacity, willChange: "transform, opacity" }} className="absolute inset-0 w-full h-full transform-gpu">
          <OptimizedImage 
            src={tenant.coverImageUrl} 
            alt={`${tenant.name} Cover`} 
            className="w-full h-full object-cover" 
            defaultIcon={<div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${mainColor}40, ${mainColor}90)` }} />}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-slate-900/60 to-transparent" />
        </motion.div>

        <div className="absolute top-6 left-4 sm:left-6 lg:left-10 z-20">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 px-4 py-2.5 rounded-2xl shadow-sm">
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 lg:px-10 pb-12 lg:pb-16 max-w-[1800px] mx-auto z-10">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8">
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4, delay: 0.1 }} className="w-28 h-28 lg:w-36 lg:h-36 rounded-[1.5rem] bg-white p-2 shadow-xl border border-white/50 shrink-0 relative">
              <div className="w-full h-full rounded-[1rem] bg-slate-50 overflow-hidden flex items-center justify-center">
                <OptimizedImage 
                   src={tenant.logoUrl} 
                   alt={tenant.name} 
                   className="w-full h-full object-contain p-2" 
                   defaultIcon={<span className="text-5xl font-black" style={{ color: mainColor }}>{tenant.name.charAt(0)}</span>}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex-1 text-slate-900">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <Badge className="px-2.5 py-0.5 font-bold tracking-widest uppercase text-[10px] border-none text-white shadow-sm" style={{ backgroundColor: mainColor }}>
                  {tenant.segment || 'StartUp'}
                </Badge>
                {tenant.isVerified && (
                  <Badge className="bg-blue-500 text-white border-none px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                    <ShieldCheck size={12} /> Verified
                  </Badge>
                )}
                {tenant.status === 'Alumni' && (
                  <Badge className="bg-slate-800 text-white border-none px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                     <Star size={12} className="fill-white" /> Alumni
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-2 drop-shadow-sm leading-none">{tenant.name}</h1>
              <p className="text-lg lg:text-xl text-slate-700 font-medium max-w-3xl leading-snug drop-shadow-sm opacity-90">
                {tenant.elevatorPitch || "Inovator Ekosistem Technopark"}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10">
        
        {tenant.keyMetrics && tenant.keyMetrics.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-30 -mt-6 mb-10">
             <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-200/80 shadow-lg shadow-slate-200/40 p-2 flex overflow-x-auto hide-scrollbar divide-x divide-slate-100">
               {tenant.keyMetrics.map((metric: any, idx: number) => (
                 <div key={idx} className="flex-1 min-w-[160px] px-6 py-4 text-center flex flex-col justify-center">
                   <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 + (idx * 0.1) }} className="text-3xl lg:text-4xl font-black mb-1 tracking-tighter text-slate-800" >
                     {metric.value}
                   </motion.span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
                 </div>
               ))}
             </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8">
          
          <div className="lg:col-span-8 space-y-10">
            {products && products.length > 0 && (
              <motion.section id="produk" variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6"><h2 className="text-2xl font-black text-slate-900 tracking-tight">Katalog Produk & Layanan</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-white border border-slate-200/80 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col group relative cursor-pointer">
                       
                       <div className="w-full h-56 bg-slate-100 relative overflow-hidden shrink-0">
                         {prod.images && prod.images.length > 0 ? (
                           <OptimizedImage src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={40} className="opacity-40"/></div>
                         )}
                         
                         {/* OVERLAY AI INSIGHTS & FITUR UNGGULAN */}
                         <div className="absolute inset-0 bg-[#1A1C29]/95 backdrop-blur-md p-6 flex flex-col justify-center translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1] z-20 overflow-y-auto custom-scrollbar">
                           {prod.isCurated && prod.aiInsights ? (
                             <>
                               <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                 <p className="text-white font-bold flex items-center gap-2"><Sparkles size={18} className="text-amber-400"/> AI Market Insights</p>
                                 <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">Score: {prod.curation?.totalScore}</span>
                               </div>
                               <ul className="space-y-4">
                                 <li className="text-xs text-slate-300 leading-snug"><strong className="text-amber-400 block mb-1">Target Market:</strong> {prod.aiInsights.targetMarket}</li>
                                 <li className="text-xs text-slate-300 leading-snug"><strong className="text-amber-400 block mb-1">Kanal Distribusi:</strong> {prod.aiInsights.distributionChannel}</li>
                                 <li className="text-xs text-slate-300 leading-snug"><strong className="text-amber-400 block mb-1">Strategi:</strong> {prod.aiInsights.brandingStrategy}</li>
                               </ul>
                             </>
                           ) : (
                             <>
                               <p className="text-white font-bold mb-4 flex items-center gap-2 text-lg"><Zap size={20} className="text-amber-400 fill-amber-400/20"/> Fitur Unggulan</p>
                               {prod.features && prod.features.length > 0 ? (
                                 <ul className="space-y-3">
                                   {prod.features.slice(0, 5).map((feat: string, i: number) => (
                                     <li key={i} className="text-sm text-slate-300 flex items-start gap-3"><CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5"/> <span className="line-clamp-2 leading-snug">{feat}</span></li>
                                   ))}
                                 </ul>
                               ) : <p className="text-slate-400 text-sm italic">Info fitur belum ditambahkan secara spesifik.</p>}
                             </>
                           )}
                         </div>

                         {/* BADGE KURASI & MODEL BISNIS */}
                         <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 transition-opacity duration-300 group-hover:opacity-0">
                           {prod.businessModel && <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">{prod.businessModel}</span>}
                           {prod.isCurated && <span className="bg-indigo-600/90 backdrop-blur-md text-white border border-indigo-400/50 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1"><ShieldCheck size={10}/> Curated</span>}
                         </div>
                       </div>

                       <div className="p-6 flex flex-col flex-1 bg-white relative z-30">
                         <h4 className="font-black text-slate-900 text-xl mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{prod.name}</h4>
                         <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium line-clamp-3 flex-1">{prod.description}</p>
                         {prod.productUrl && (
                           <a href={ensureAbsoluteUrl(prod.productUrl)} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center text-sm font-bold transition-colors" style={{ color: mainColor }}>
                             {prod.callToActionText || 'Kunjungi Layanan'} <ArrowUpRight size={16} className="ml-1"/>
                           </a>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            <motion.section id="overview" variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="scroll-mt-32">
              <div className="bg-white rounded-[1.5rem] border border-slate-200/80 shadow-sm p-8 lg:p-10">
                <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Misi & Solusi</h3>
                <div className="space-y-8">
                  {tenant.companyDescription && <ExpandableText text={tenant.companyDescription} maxLength={400} theme={theme} />}
                  {(tenant.problemStatement || tenant.solutionStatement) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                      {tenant.problemStatement && (
                        <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3"><Target size={14}/> Problem</h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{tenant.problemStatement}</p>
                        </div>
                      )}
                      {tenant.solutionStatement && (
                        <div className="bg-emerald-50/30 border border-emerald-100/50 p-6 rounded-2xl">
                          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-3"><CheckCircle2 size={14}/> Solution</h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{tenant.solutionStatement}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {tenant.techStack && tenant.techStack.length > 0 && (
                     <div className="pt-6 border-t border-slate-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Code2 size={14}/> Tech Stack</p>
                        <div className="flex flex-wrap gap-2">
                           {tenant.techStack.map((tech: string, idx: number) => <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-600 font-medium text-xs px-3 py-1.5 rounded-lg">{tech}</span>)}
                        </div>
                     </div>
                  )}
                </div>
              </div>
            </motion.section>

            {tenant.customSections && tenant.customSections.length > 0 && (
              <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6 mt-10">
                 {tenant.customSections.map((sec: any) => {
                   const isImageLeft = sec.mediaPosition === 'left';
                   const isImageTop = sec.mediaPosition === 'top';
                   const hasImage = !!sec.mediaUrl;
                   return (
                     <motion.div key={sec.id} variants={fadeUpVariants} className={`flex flex-col ${!isImageTop ? (isImageLeft ? 'md:flex-row' : 'md:flex-row-reverse') : ''} gap-6 md:gap-8 items-center bg-white rounded-[1.5rem] p-8 lg:p-10 shadow-sm border border-slate-200/80`}>
                        {hasImage && (
                          <div className={`w-full ${!isImageTop ? 'md:w-1/2' : 'mb-2'} rounded-2xl overflow-hidden bg-slate-50`}>
                             <OptimizedImage src={sec.mediaUrl} alt={sec.title} className="w-full h-auto object-cover rounded-2xl" />
                          </div>
                        )}
                        <div className={`w-full ${hasImage && !isImageTop ? 'md:w-1/2' : ''} space-y-4`}>
                          <h3 className="text-2xl font-black text-slate-900 leading-tight">{sec.title}</h3>
                          <div className="text-slate-600 leading-relaxed space-y-3 text-sm font-medium">
                             {sec.content.split('\n').map((line: string, i: number) => <p key={i}>{line}</p>)}
                          </div>
                        </div>
                     </motion.div>
                   )
                 })}
              </motion.section>
            )}

            {tenant.promoVideoUrl && getYoutubeId(tenant.promoVideoUrl) && (
              <motion.section variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="w-full aspect-video rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200 bg-slate-900 relative group">
                <iframe src={`https://www.youtube.com/embed/${getYoutubeId(tenant.promoVideoUrl)}`} title="Promo Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full relative z-20"></iframe>
              </motion.section>
            )}

            {tenant.testimonials && tenant.testimonials.length > 0 && (
              <motion.section variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-10">
                <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Kepercayaan Klien</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tenant.testimonials.map((testi: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm flex flex-col justify-between">
                          <div className="flex gap-1 mb-4 text-amber-400">
                            <Star size={14} className="fill-amber-400" /><Star size={14} className="fill-amber-400" /><Star size={14} className="fill-amber-400" /><Star size={14} className="fill-amber-400" /><Star size={14} className="fill-amber-400" />
                          </div>
                          <p className="italic text-slate-600 mb-6 text-sm leading-relaxed font-medium">"{testi.quote}"</p>
                          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">{testi.name.charAt(0)}</div>
                            <div><h5 className="font-bold text-slate-800 text-sm leading-tight">{testi.name}</h5><p className="text-[10px] font-bold text-slate-500 mt-0.5">{testi.role}</p></div>
                          </div>
                      </div>
                    ))}
                </div>
              </motion.section>
            )}

            {milestones && milestones.length > 0 && (
              <motion.section id="traksi" variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="scroll-mt-32">
                <div className="bg-white rounded-[1.5rem] border border-slate-200/80 shadow-sm p-8 lg:p-10">
                  <div className="mb-8"><h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Jejak & Pencapaian</h3><p className="text-slate-500 text-sm font-medium">Rekam jejak pertumbuhan dan pendanaan.</p></div>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {milestones.map((mile: any) => (
                      <div key={mile.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                          {mile.category === 'Funding' ? <DollarSign size={16}/> : mile.category === 'Product' ? <Package size={16}/> : <TrendingUp size={16}/>}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{mile.date}</span>
                          <h4 className="text-base font-bold text-slate-900 mb-2">{mile.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-3">{mile.description}</p>
                          {mile.articleUrl && <a href={ensureAbsoluteUrl(mile.articleUrl)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold transition-colors" style={{ color: mainColor }}>Baca Berita <ArrowUpRight size={12}/></a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {tenant.clientLogos && tenant.clientLogos.length > 0 && (
              <motion.section variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="py-10 text-center border-t border-slate-200/60 mt-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Telah Dipercaya Oleh</p>
                <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {tenant.clientLogos.map((logo: string, idx: number) => <OptimizedImage key={idx} src={logo} alt={`Client ${idx}`} className="h-8 md:h-10 object-contain" />)}
                </div>
              </motion.section>
            )}

            {tenant.faqs && tenant.faqs.length > 0 && (
              <motion.section id="faq" variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="scroll-mt-32">
                <div className="bg-white rounded-[1.5rem] border border-slate-200/80 shadow-sm p-8 lg:p-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">FAQ</h3>
                  <div className="flex flex-col">{tenant.faqs.map((faq: any, idx: number) => <FAQItem key={idx} faq={faq} theme={theme} />)}</div>
                </div>
              </motion.section>
            )}
          </div>

          <div className="lg:col-span-4 relative">
            <div className="sticky top-[100px] flex flex-col gap-5 pb-10">
              
              <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white border border-slate-200/80 rounded-full p-1.5 shadow-sm flex items-center justify-between relative z-20">
                {['Overview', 'Produk', 'Traksi', 'FAQ'].map((item) => {
                  const id = item.toLowerCase();
                  const isActive = activeSection === id;
                  if (id === 'produk' && (!products || products.length === 0)) return null;
                  if (id === 'traksi' && (!milestones || milestones.length === 0)) return null;
                  if (id === 'faq' && (!tenant.faqs || tenant.faqs.length === 0)) return null;

                  return (
                    <button key={id} onClick={() => scrollToSection(id)} className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all duration-300 flex-1 text-center whitespace-nowrap ${isActive ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} style={isActive ? { backgroundColor: mainColor } : {}}>
                      {item}
                    </button>
                  );
                })}
              </motion.div>

              <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className={`bg-white border rounded-[1.5rem] shadow-sm relative overflow-hidden transition-all duration-500 ${tenant.isRaising ? 'border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-200' : 'border-slate-200/80'}`}>
                {tenant.isRaising && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400"></div>}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Funding Stage</p><p className="text-xl font-black text-slate-800 leading-none">{tenant.fundingStage || 'Bootstrapped'}</p></div>
                    {tenant.isRaising && <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-100"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"/> Raising</span>}
                  </div>

                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Sektor</span><span className="font-bold text-slate-900">{tenant.sector || '-'}</span></div>
                     <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Badan Hukum</span><span className="font-bold text-slate-900">{tenant.legalEntity || '-'}</span></div>
                     <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Ukuran Tim</span><span className="font-bold text-slate-900">{tenant.teamSize ? `${tenant.teamSize} Orang` : '-'}</span></div>
                  </div>

                  {primaryCtaUrl && <a href={primaryCtaUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-sm mb-3" style={{ backgroundColor: mainColor }}>{primaryCtaText} <ArrowUpRight size={16} /></a>}

                  <div className="flex items-center gap-2 mb-4">
                    {tenant.contact && <a href={`https://wa.me/${tenant.contact.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-50 hover:bg-[#25D366]/10 text-slate-600 hover:text-[#1EBE5A] border border-slate-200 py-2.5 rounded-lg flex items-center justify-center transition-colors"><Phone size={16} /></a>}
                    {tenant.email && <a href={`mailto:${tenant.email}`} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-lg flex items-center justify-center transition-colors"><Mail size={16} /></a>}
                    {tenant.pitchDeckUrl && <a href={tenant.pitchDeckUrl} target="_blank" rel="noopener noreferrer" title="Pitch Deck" className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-lg flex items-center justify-center transition-colors"><FileText size={16} /></a>}
                  </div>

                  {tenant.socialLinks && (tenant.socialLinks.linkedin || tenant.socialLinks.instagram || tenant.socialLinks.youtube || tenant.socialLinks.tiktok) && (
                    <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100">
                      {tenant.socialLinks.linkedin && <a href={ensureAbsoluteUrl(tenant.socialLinks.linkedin)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors"><Linkedin size={18} /></a>}
                      {tenant.socialLinks.instagram && <a href={ensureAbsoluteUrl(tenant.socialLinks.instagram)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600 transition-colors"><Instagram size={18} /></a>}
                      {tenant.socialLinks.youtube && <a href={ensureAbsoluteUrl(tenant.socialLinks.youtube)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-600 transition-colors"><Youtube size={18} /></a>}
                      {tenant.socialLinks.tiktok && <a href={ensureAbsoluteUrl(tenant.socialLinks.tiktok)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black transition-colors font-bold text-xs flex items-center">TikTok</a>}
                    </div>
                  )}
                </div>
              </motion.div>

              {tenant.publicAssets && (tenant.publicAssets.companyProfileUrl || tenant.publicAssets.mediaKitUrl) && (
                <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><DownloadCloud size={14} /> Dokumen Publik</h4>
                  <div className="space-y-2">
                    {tenant.publicAssets.companyProfileUrl && <a href={ensureAbsoluteUrl(tenant.publicAssets.companyProfileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 transition-colors">Company Profile <ExternalLinkIcon size={14} className="text-slate-400"/></a>}
                    {tenant.publicAssets.mediaKitUrl && <a href={ensureAbsoluteUrl(tenant.publicAssets.mediaKitUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 transition-colors">Media Kit <ExternalLinkIcon size={14} className="text-slate-400"/></a>}
                  </div>
                </motion.div>
              )}

              <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2"><Users size={14} /> Tim & Founder</h4>
                {teamMembers && teamMembers.length > 0 ? (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center shrink-0">{member.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0"><h5 className="font-bold text-slate-800 text-sm truncate">{member.name}</h5><p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5 truncate">{member.role}</p></div>
                      </div>
                    ))}
                  </div>
                ) : tenant.ownerName ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center shrink-0">{tenant.ownerName.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><h5 className="font-bold text-slate-800 text-sm truncate">{tenant.ownerName}</h5><p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Founder</p></div>
                  </div>
                ) : <p className="text-sm text-slate-400 italic">Informasi tim belum tersedia.</p>}
              </motion.div>

              {tenant.jobOpenings && tenant.jobOpenings.length > 0 && (
                <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-emerald-50 border border-emerald-200 rounded-[1.5rem] p-5 shadow-sm">
                   <div className="flex items-center gap-2 mb-3"><UserPlus size={16} className="text-emerald-600" /><h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800">Sedang Merekrut</h4></div>
                   <div className="space-y-2">
                      {tenant.jobOpenings.map((job: any) => (
                         <div key={job.id} className="block p-3 bg-white border border-emerald-100 rounded-xl"><h5 className="font-bold text-slate-800 text-sm">{job.title}</h5><p className="text-[10px] font-medium text-slate-500 mt-1">{job.type} • {job.location}</p></div>
                      ))}
                   </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}