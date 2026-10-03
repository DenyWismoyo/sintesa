"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductCatalog, Invoice } from '@/types';
import { 
  ArrowLeft, CheckCircle2, Image as ImageIcon, ShoppingCart, Loader2, 
  Tag, Info, ListChecks, ChevronRight, Check, X, ChevronLeft, 
  ZoomIn, MessageCircle, ExternalLink, CalendarDays, Store, Building2,
  Share2, ShieldCheck, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useCatalog } from '@/hooks/useCatalog';
import { useBilling } from '@/hooks/useBilling';
import { getThumbnailUrl } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import ProductCard from '../components/ProductCard'; 
import MobileImageGallery from '@/components/ui/MobileImageGallery';
import ProviderCard from '@/components/ui/ProviderCard';
import PillTabs from '@/components/ui/PillTabs';
import SectionContainer from '@/components/ui/SectionContainer';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { MobileStickyBottomBar } from '@/components/common/MobileStickyBottomBar';
import { getActiveRefCode } from '@/components/common/AffiliateTracker';
import { AffiliateShareButton } from '@/components/common/AffiliateShareButton';
import { affiliateService } from '@/services/affiliate.service';

type TabType = 'description' | 'specifications' | 'highlights';

interface ClientPageProps {
  initialProduct?: ProductCatalog | null;
}

export default function DetailKatalogEnterprisePage({ initialProduct }: ClientPageProps) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // Hooks
  const { getProduct, products: allProducts } = useCatalog(); 
  const { createNewInvoice } = useBilling('MUTATION_ONLY');

  const paramId = (params?.id as string) || '';

  // State: Coba ambil dari initialProduct atau cari di allProducts jika sudah ada di client cache
  const [product, setProduct] = useState<ProductCatalog | null>(() => {
    if (initialProduct && (!paramId || initialProduct.id === paramId)) return initialProduct;
    if (paramId && allProducts.length > 0) {
      const cached = allProducts.find(p => p.id === paramId);
      if (cached) return cached;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (initialProduct && (!paramId || initialProduct.id === paramId)) return false;
    if (paramId && allProducts.length > 0) {
      const cached = allProducts.find(p => p.id === paramId);
      if (cached) return false;
    }
    return true;
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  
  // UI State
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Normalisasi gambar dari images array atau fallback coverImage
  const displayImages: string[] = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    const fallbackCover = (product as any)?.coverImage;
    if (fallbackCover) return [fallbackCover];
    return [];
  }, [product]);

  const hasImages = displayImages.length > 0;

  // Sinkronisasi data detail secara instan tanpa blocking
  useEffect(() => {
    if (!paramId) return;

    // 1. Jika initialProduct dari server sudah ada dan lengkap dengan deskripsi, gunakan langsung
    if (initialProduct && initialProduct.id === paramId && initialProduct.description) {
      setProduct(initialProduct);
      setLoading(false);
      return;
    }

    // 2. Jika produk di state sudah cocok dan memiliki deskripsi lengkap, selesai
    if (product && product.id === paramId && product.description) {
      setLoading(false);
      return;
    }

    // 3. Jika ada di allProducts (TanStack Cache), pasang sebagai preview instan (0ms) agar UI langsung render
    const foundInCache = allProducts.find(p => p.id === paramId);
    if (foundInCache && (!product || product.id !== paramId)) {
      setProduct(foundInCache);
      setLoading(false);
    } else if (!product && !foundInCache) {
      setLoading(true);
    }

    // 4. SELALU ambil dokumen penuh dari Firestore (catalogs/{id}) agar isian deskripsi,
    // spesifikasi, dan seluruh galeri foto 100% lengkap dan sesuai pengaturan di Admin
    let isMounted = true;
    getProduct(paramId).then(result => {
      if (isMounted) {
        if (result.success && result.data) {
          setProduct(result.data);
        }
        setLoading(false);
      }
    }).catch(err => {
      console.error("[CATALOG DETAIL] Gagal memuat data lengkap:", err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [paramId, initialProduct, allProducts]);

  // Kunci Scroll saat Lightbox Terbuka
  useEffect(() => {
    if (isLightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLightboxOpen]);

  // Layanan Serupa (Cross-selling)
  const relatedProducts = allProducts
    .filter(p => p.category === product?.category && p.id !== product?.id && p.isPublished)
    .slice(0, 4);

  // Logic Pemesanan (Invoice)
  const handlePesanViaInvoice = async () => {
    if (!user) {
      toast.error("Akses Ditolak", { description: "Silakan login terlebih dahulu.", action: { label: "Login", onClick: () => router.push('/login') } });
      return;
    }
    
    if (!product) return;
    setIsProcessing(true);
    
    const loadingToast = toast.loading("Sedang memproses pesanan Anda...");
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const invNumber = `INV/${dateStr}/${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date(); dueDateObj.setDate(dueDateObj.getDate() + 7);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];
    
    const basePrice = Number(product.price || 0);
    const totalAmount = basePrice;

    const refCode = getActiveRefCode();

    const invoicePayload: Omit<Invoice, 'id'> = {
      invoiceNumber: invNumber, 
      customerName: user.displayName || user.email?.split('@')[0] || 'Pelanggan Publik',
      customerType: 'Umum', 
      customerEmail: user.email || '', 
      customerPhone: '', 
      items: [{ 
        id: Date.now().toString(), 
        referenceId: product.id || '', 
        referenceType: 'CATALOG', 
        description: product.name || 'Produk', 
        quantity: 1, 
        unitPrice: basePrice, 
        total: basePrice 
      }],
      subTotal: basePrice, 
      taxAmount: 0, 
      discountAmount: 0, 
      totalAmount: totalAmount,
      paidAmount: 0, 
      remainingAmount: totalAmount, 
      term: 'FULL_PAYMENT',
      date: today, 
      dueDate: dueDateStr, 
      status: 'PENDING', 
      issuerName: '',
      issuerRole: 'Kasir',
      issuerNIP: '',
      history: [],
      notes: `Pemesanan E-Katalog: ${product.name}`,
      referralCode: refCode || undefined
    };

    const res = await createNewInvoice(invoicePayload);
    setIsProcessing(false);
    setShowConfirmModal(false); 

    if (res.success) {
      if (refCode && basePrice > 0 && res.id) {
        try {
          const partner = await affiliateService.getAffiliateByCode(refCode);
          if (partner && partner.userId !== user.uid) {
            const settings = await affiliateService.getAffiliateSettings();
            const rate = settings.catalogCommissionRate || 0.05;
            const commissionAmount = Math.round(basePrice * rate);

            await affiliateService.createCommission({
              affiliateId: partner.userId,
              referralCode: refCode,
              domain: 'KATALOG',
              itemId: product.id || '',
              itemTitle: product.name || 'Produk Katalog',
              customerName: user.displayName || user.email || 'Pelanggan',
              customerEmail: user.email || '',
              transactionAmount: basePrice,
              commissionRate: rate,
              commissionAmount: commissionAmount,
              invoiceId: res.id
            });
          }
        } catch (affErr) {
          console.warn("Gagal mencatat komisi afiliasi pesanan katalog:", affErr);
        }
      }

      toast.success("Pesanan Berhasil Dibuat!", { id: loadingToast, description: "Mengalihkan ke halaman tagihan...", icon: <CheckCircle2 className="text-emerald-500" /> });
      setTimeout(() => router.push('/profil'), 1500);
    } else {
      toast.error("Gagal membuat pesanan", { id: loadingToast, description: res.error || "Terjadi kesalahan internal." });
    }
  };

  // Handler Tombol Utama
  const handleCTA = () => {
    if (!product) return;
    const ctaType = product.ctaType || 'INVOICE';
    
    if (ctaType === 'WHATSAPP') {
      toast.success("Mengarahkan ke WhatsApp...");
      const phone = product.ctaLink?.replace(/\D/g, '') || ''; 
      const text = encodeURIComponent(`Halo, saya tertarik dengan "${product.name}" di E-Katalog KST.`);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else if (ctaType === 'EXTERNAL_LINK') {
      let link = product.ctaLink || '#';
      if (!link.startsWith('http') && link !== '#') link = `https://${link}`;
      window.open(link, '_blank');
    } else if (ctaType === 'BOOKING_FORM') {
      router.push('/fasilitas');
    } else {
      if (!user) {
        toast.error("Akses Ditolak", { description: "Silakan login terlebih dahulu.", action: { label: "Login", onClick: () => router.push('/login') } });
        return;
      }
      setShowConfirmModal(true);
    }
  };

  // Render Icon CTA
  const renderCtaIcon = () => {
    switch(product?.ctaType) {
      case 'WHATSAPP': return <MessageCircle className="mr-2 h-5 w-5" />;
      case 'EXTERNAL_LINK': return <ExternalLink className="mr-2 h-5 w-5" />;
      case 'BOOKING_FORM': return <CalendarDays className="mr-2 h-5 w-5" />;
      default: return <ShoppingCart className="mr-2 h-5 w-5" />;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-8 pb-20 px-4 sm:px-6 lg:px-8 xl:px-16 w-full mx-auto max-w-[1600px]">
        <Skeleton className="h-6 w-48 mb-8 rounded-full bg-slate-200" />
        <div className="w-full mb-10">
          <Skeleton className="w-full aspect-video rounded-2xl sm:rounded-3xl bg-slate-200" />
          <div className="mt-3 sm:mt-4 flex gap-2.5 sm:gap-3 overflow-hidden">
            <Skeleton className="w-20 sm:w-28 md:w-32 aspect-video rounded-xl sm:rounded-2xl bg-slate-200 shrink-0" />
            <Skeleton className="w-20 sm:w-28 md:w-32 aspect-video rounded-xl sm:rounded-2xl bg-slate-200 shrink-0" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[60%] space-y-8">
             <Skeleton className="h-12 w-3/4 bg-slate-200 rounded-xl" />
             <Skeleton className="h-6 w-1/2 bg-slate-200 rounded-xl" />
             <Skeleton className="w-full h-40 rounded-[2rem] bg-slate-200" />
          </div>
          <div className="w-full lg:w-[40%]">
             <Skeleton className="h-64 w-full rounded-[2rem] bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!product) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center bg-[#FAFAFA] px-6">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Layanan Tidak Ditemukan</h2>
          <Button onClick={() => router.push('/e-katalog')} variant="outline" className="mt-4 rounded-xl px-8 h-12">Kembali ke Katalog</Button>
        </div>
      </div>
    );
  }

  const detailTabs = [
    { key: 'description' as TabType, label: 'Deskripsi' },
    { key: 'specifications' as TabType, label: `Spesifikasi (${product.specifications?.length || 0})` },
    { key: 'highlights' as TabType, label: 'Keunggulan' }
  ];

  return (
    <>
      <SectionContainer accent="emerald" width="default" className="pb-24 sm:pb-12">
        <div className="py-4 sm:py-8 space-y-6 sm:space-y-8">
          
          {/* HEADER INLINE & BREADCRUMB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <Breadcrumbs 
              items={[
                { label: 'E-Katalog', href: '/e-katalog' },
                { label: product.category, href: `/e-katalog?kategori=${encodeURIComponent(product.category)}` },
                { label: product.name, active: true }
              ]} 
            />
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()} 
                className="rounded-full hover:bg-slate-100 h-8 px-2.5 gap-1 text-slate-600 font-bold text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Tautan Disalin", { description: "Link produk telah disalin ke clipboard." });
                  }
                }}
                className="rounded-full h-8 px-3 text-slate-600 font-bold text-xs border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
              >
                <Share2 size={13} className="mr-1" /> 
                <span>Bagikan</span>
              </Button>
            </div>
          </div>

          {/* HERO GRID 2-KOLOM (7/5 SPLIT: GALERI 16:9 DI KIRI, KARTU ORDER DI KANAN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* KOLOM KIRI (7 Kolom): Galeri 16:9 & Identitas Penyedia */}
            <div className="lg:col-span-7 space-y-6">
              <MobileImageGallery 
                images={displayImages} 
                title={product.name} 
                onOpenLightbox={(idx) => { setActiveImageIdx(idx); setIsLightboxOpen(true); }}
              />

              {/* Provider / Tenant Info Card */}
              <ProviderCard 
                ownerType={product.ownerType} 
                tenantName={product.tenantName} 
                tenantId={product.tenantId} 
              />
            </div>

            {/* KOLOM KANAN (5 Kolom): Detail Produk & Sticky Box Order */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                
                {/* Judul & Kategori */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-full shadow-2xs">
                      {product.category}
                    </span>
                    {product.isNegotiable && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                        <Tag size={12} /> Bisa Nego
                      </span>
                    )}
                    {product.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-xs font-medium text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {product.name}
                  </h1>

                  {product.shortDescription && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-2.5">
                      {product.shortDescription}
                    </p>
                  )}
                </div>

                {/* Pricing Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Tarif Layanan</span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      Rp {product.price?.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/{product.pricingType}</span>
                  </div>
                  {product.isNegotiable && (
                    <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <Tag size={12} /> Harga dapat dinegosiasikan sesuai kebutuhan skala industri
                    </p>
                  )}
                </div>

                {/* Tombol Aksi Utama */}
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleCTA} 
                    disabled={isProcessing} 
                    className={`w-full h-12 rounded-full text-xs sm:text-sm font-bold text-white transition-all shadow-md ${
                      product.ctaType === 'WHATSAPP' ? 'bg-[#25D366] hover:bg-[#1DA851] shadow-[#25D366]/20' :
                      'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : renderCtaIcon()}
                    {isProcessing ? 'Memproses...' : product.ctaText || 'Pesan Sekarang'}
                  </Button>

                  {product.category === 'Pelatihan' && (
                    <Link
                      href={`/program-pelatihan/${product.id}`}
                      className="w-full h-11 rounded-full text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 flex items-center justify-center gap-2 transition-all shadow-2xs"
                    >
                      <GraduationCap size={16} className="text-amber-700" />
                      <span>Lihat Silabus & Formulir Pendaftaran</span>
                    </Link>
                  )}

                  <AffiliateShareButton
                    path={`/e-katalog/${product.id}`}
                    title={product.name || 'Produk E-Katalog'}
                    description={product.description}
                    className="w-full h-11 rounded-full"
                    variant="subtle"
                    size="sm"
                  />
                </div>

                {/* Trust & Compliance Badges */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Layanan resmi terdaftar di Solo Technopark</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                    <span>Faktur & Surat Izin Resmi PPK-BLUD</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* TABS INFORMASI LENGKAP (FULL WIDTH DI BAWAH HERO) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="mb-6">
              <PillTabs
                tabs={detailTabs}
                active={activeTab}
                onChange={(t) => setActiveTab(t as TabType)}
                layoutId="detail-katalog-active-pill"
                ariaLabel="Navigasi Detail Produk"
              />
            </div>

            {/* TABS CONTENT */}
            <div className="min-h-[160px]">
              <AnimatePresence mode="wait">
                {/* Tab: Deskripsi */}
                {activeTab === 'description' && (
                  <motion.div key="desc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <div className="prose prose-slate prose-headings:text-slate-900 text-slate-600 leading-relaxed max-w-none whitespace-pre-line text-xs sm:text-sm">
                      {product.description || (
                        <div className="space-y-3 py-2 animate-pulse">
                          <div className="h-4 bg-slate-100 rounded w-full"></div>
                          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                          <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Tab: Spesifikasi */}
                {activeTab === 'specifications' && (
                  <motion.div key="specs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {product.specifications && product.specifications.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {product.specifications.map((spec, idx) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{spec.label}</span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-xs">Tidak ada spesifikasi khusus untuk produk ini.</p>
                    )}
                  </motion.div>
                )}

                {/* Tab: Keunggulan */}
                {activeTab === 'highlights' && (
                  <motion.div key="high" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {product.highlights && product.highlights.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {product.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Check size={13} strokeWidth={3} />
                            </div>
                            <p className="text-slate-700 font-semibold text-xs sm:text-sm leading-relaxed">{highlight}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-xs">Tidak ada poin keunggulan khusus yang dicantumkan.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CROSS SELLING: Layanan Serupa (Horizontal Snap Carousel di Mobile, Grid di Desktop) */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 sm:mt-24 pt-10 sm:pt-14 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Layanan Terkait</h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Pilihan inovasi dan fasilitas sejenis di kawasan</p>
                </div>
                <Link href="/e-katalog" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0">
                  Lihat Semua <ChevronRight size={14} />
                </Link>
              </div>

              {/* Mobile: Horizontal Swipeable Snap; Desktop: Grid 4 Kolom */}
              <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto no-scrollbar gap-4 pb-4 pt-1 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                {relatedProducts.map(relProduct => (
                  <div key={relProduct.id} className="w-[280px] sm:w-[310px] lg:w-auto shrink-0 snap-start">
                    <ProductCard product={relProduct} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </SectionContainer>

      {/* MOBILE STICKY BOTTOM BAR (MINIMALIS & ERGONOMIS) */}
      <div className="public-detail-bottom-bar lg:hidden">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">Tarif</span>
          <p className="font-black text-slate-900 text-base sm:text-lg flex items-baseline gap-1 mt-1 leading-none truncate">
            Rp {product.price?.toLocaleString('id-ID')}
            <span className="text-[11px] font-medium text-slate-400 truncate">/{product.pricingType}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AffiliateShareButton
            path={`/e-katalog/${product.id}`}
            title={product.name || 'Produk E-Katalog'}
            description={product.description}
            size="sm"
            variant="subtle"
            iconOnly={true}
          />

          {/* Tombol WhatsApp Konsultasi PIC Cepat */}
          <a 
            href={`https://wa.me/628112658888?text=${encodeURIComponent(`Halo Solo Technopark, saya ingin konsultasi mengenai layanan *${product.name}* (ID: ${product.id}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 active:scale-95 transition-all shrink-0"
            title="Tanya PIC via WhatsApp"
            aria-label="Tanya via WhatsApp"
          >
            <MessageCircle size={18} />
          </a>

          {/* Tombol Aksi Utama: Jika Pelatihan langsung ke Silabus, jika umum pesan */}
          {product.category === 'Pelatihan' ? (
            <Link
              href={`/program-pelatihan/${product.id}`}
              className="h-10 px-4 rounded-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm shrink-0 active:scale-95 transition-all"
              title="Lihat Silabus & Pendaftaran"
            >
              <GraduationCap size={15} />
              <span>Silabus</span>
            </Link>
          ) : (
            <Button 
              onClick={handleCTA} 
              disabled={isProcessing} 
              className={`h-10 px-5 rounded-full font-bold text-white shadow-sm border-0 text-xs shrink-0 active:scale-95 transition-all ${
                product.ctaType === 'WHATSAPP' ? 'bg-[#25D366] hover:bg-[#1DA851]' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (product.ctaText || 'Pesan')}
            </Button>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Pesanan */}
      <AnimatePresence>
        {showConfirmModal && product && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl flex flex-col"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-8 border-white shadow-lg flex items-center justify-center text-emerald-600 mb-4 -mt-16">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Konfirmasi Pemesanan</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">Sistem akan menerbitkan tagihan resmi ke akun Anda.</p>
              </div>

              <div className="bg-[#FAFAFA] p-5 rounded-[1.25rem] border border-slate-200 mb-8 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Item Layanan</p>
                  <p className="text-base font-bold text-slate-800 leading-snug">{product.name}</p>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-slate-200/80">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Bayar</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">Rp {Number(product.price || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handlePesanViaInvoice} disabled={isProcessing} className="w-full rounded-[1.25rem] h-14 font-bold text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white transition-all">
                  {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  {isProcessing ? 'Memproses...' : 'Proses Pesanan Sekarang'}
                </Button>
                <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={isProcessing} className="w-full rounded-[1.25rem] h-14 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                  Batalkan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Galeri HD */}
      <AnimatePresence>
        {isLightboxOpen && hasImages && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all z-10"><X size={24} /></button>

            {displayImages.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setActiveImageIdx((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1)); }} className="absolute left-4 sm:left-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all z-10"><ChevronLeft size={32} /></button>
            )}

            <motion.div 
              key={activeImageIdx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}
            >
              <img src={displayImages[activeImageIdx]} alt={`View ${activeImageIdx + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" draggable={false} />
            </motion.div>

            {displayImages.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setActiveImageIdx((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1)); }} className="absolute right-4 sm:right-12 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all z-10"><ChevronRight size={32} /></button>
            )}

            {displayImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white font-bold text-sm bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-full tracking-widest z-10">{activeImageIdx + 1} / {displayImages.length}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}