"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductCatalog, Invoice } from '@/types';
import { 
  ArrowLeft, CheckCircle2, Image as ImageIcon, ShoppingCart, Loader2, 
  Tag, Info, ListChecks, ChevronRight, Check, X, ChevronLeft, 
  ZoomIn, MessageCircle, ExternalLink, CalendarDays, Store, Building2,
  Share2, ShieldCheck
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
    };

    const res = await createNewInvoice(invoicePayload);
    setIsProcessing(false);
    setShowConfirmModal(false); 

    if (res.success) {
      toast.success("Pesanan Berhasil Dibuat!", { id: loadingToast, description: "Mengalihkan ke halaman tagihan...", icon: <CheckCircle2 className="text-emerald-500" /> });
      setTimeout(() => router.push('/tagihan'), 1500);
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
        <Skeleton className="w-full h-[60vh] rounded-[2rem] bg-slate-200 mb-10" />
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
      <div className="bg-[#FAFAFA] min-h-screen selection:bg-emerald-100 selection:text-emerald-900 pb-28 lg:pb-24">
        
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
          
          {/* HEADER INLINE & BREADCRUMB */}
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()} 
                className="rounded-full hover:bg-white h-9 px-3 gap-1.5 text-slate-600 font-bold -ml-1 shadow-xs bg-white/70"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Kembali</span>
              </Button>
              <div className="flex items-center text-xs font-semibold text-slate-400 gap-1.5 sm:gap-2">
                <Link href="/e-katalog" className="hover:text-slate-900 transition-colors">Katalog</Link> 
                <ChevronRight size={13}/> 
                <span className="text-slate-800 font-bold truncate max-w-[120px] sm:max-w-none">{product.category}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                className="rounded-full h-9 px-3.5 text-slate-600 font-bold border-0 bg-white hover:bg-slate-50 shadow-xs"
              >
                <Share2 size={14} className="sm:mr-1.5" /> 
                <span className="hidden sm:inline text-xs">Bagikan</span>
              </Button>
            </div>
          </div>

          {/* GALLERY HERO (SWIPEABLE DI MOBILE, SPLIT GRID DI DESKTOP) */}
          <MobileImageGallery 
            images={displayImages} 
            title={product.name} 
            onOpenLightbox={(idx) => { setActiveImageIdx(idx); setIsLightboxOpen(true); }}
            className="mb-6 lg:mb-8"
          />

          {/* KONTEN UTAMA - 60/40 Split */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start relative">
            
            {/* KOLOM KIRI (KONTEN UTAMA) */}
            <div className="w-full lg:w-[60%] flex flex-col gap-6 sm:gap-8">
              
              {/* Judul & Meta Bar */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-white px-3 py-1 rounded-full shadow-xs">
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

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-[1.2] mb-3">
                  {product.name}
                </h1>

                {product.shortDescription && (
                  <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mt-2">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* KARTU IDENTITAS PENYELENGGARA / TENANT */}
              <ProviderCard 
                ownerType={product.ownerType} 
                tenantName={product.tenantName} 
                tenantId={product.tenantId} 
              />

              {/* TABS NAVIGATION DENGAN PILL TABS */}
              <div className="w-full bg-white rounded-2xl p-5 sm:p-7 shadow-[0_4px_18px_-2px_rgba(15,23,42,0.04)] border-0">
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
                <div className="min-h-[200px]">
                  <AnimatePresence mode="wait">
                    
                    {/* Tab: Deskripsi */}
                    {activeTab === 'description' && (
                      <motion.div key="desc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <div className="prose prose-slate prose-headings:text-slate-900 text-slate-600 leading-relaxed max-w-none whitespace-pre-line text-sm sm:text-base">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {product.specifications.map((spec, idx) => (
                              <div key={idx} className="bg-slate-50/80 p-4 rounded-xl border-0 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{spec.label}</span>
                                <span className="text-sm sm:text-base font-extrabold text-slate-900">{spec.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-sm">Tidak ada spesifikasi khusus untuk produk ini.</p>
                        )}
                      </motion.div>
                    )}

                    {/* Tab: Keunggulan */}
                    {activeTab === 'highlights' && (
                      <motion.div key="high" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        {product.highlights && product.highlights.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {product.highlights.map((highlight, idx) => (
                              <div key={idx} className="flex items-start gap-3 bg-slate-50/60 p-4 rounded-xl border-0">
                                <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <Check size={14} strokeWidth={3} />
                                </div>
                                <p className="text-slate-700 font-semibold text-sm leading-relaxed">{highlight}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-sm">Tidak ada poin keunggulan khusus yang dicantumkan.</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* KOLOM KANAN (STICKY CONVERSION AREA) - Khusus Desktop */}
            <div className="hidden lg:block w-[40%] sticky top-28 z-10">
              <div className="bg-white border-0 rounded-[2rem] shadow-[0_12px_40px_-10px_rgba(15,23,42,0.06)] p-8 flex flex-col gap-7 relative overflow-hidden">
                
                {/* Efek Glow di Box Kanan */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

                {/* Area Harga */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tarif Layanan</p>
                  <div className="flex flex-col xl:flex-row xl:items-end gap-2 xl:gap-3 mb-2">
                    <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-slate-900">
                      <span className="text-2xl text-slate-400 mr-1 font-bold">Rp</span>
                      {product.price?.toLocaleString('id-ID')}
                    </h2>
                    <span className="text-base font-semibold text-slate-500 pb-1.5">/ {product.pricingType}</span>
                  </div>
                  
                  {product.isNegotiable && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg mt-2">
                      <Tag size={13} /> Harga Dapat Dinegosiasikan
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Utama */}
                <div className="flex flex-col gap-3 relative z-10">
                  <Button 
                    onClick={handleCTA} 
                    disabled={isProcessing} 
                    className={`w-full h-14 rounded-2xl text-base font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg border-0 ${
                      product.ctaType === 'WHATSAPP' ? 'bg-[#25D366] hover:bg-[#1DA851] shadow-[#25D366]/20' :
                      'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`}
                  >
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : renderCtaIcon()}
                    {isProcessing ? 'Memproses...' : product.ctaText || 'Pesan Sekarang'}
                  </Button>
                  <p className="text-center text-xs text-slate-400 font-medium">Layanan resmi terdaftar di Solo Technopark.</p>
                </div>

              </div>
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
      </div>

      {/* MOBILE STICKY BOTTOM BAR (DUAL-CTA) */}
      <div className="public-detail-bottom-bar lg:hidden">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tarif Layanan</span>
          <p className="font-black text-slate-900 text-lg flex items-baseline gap-1 mt-1 leading-none">
            Rp {product.price?.toLocaleString('id-ID')}
            <span className="text-xs font-semibold text-slate-400">/{product.pricingType}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol WhatsApp Konsultasi PIC Cepat */}
          <a 
            href={`https://wa.me/628112658888?text=${encodeURIComponent(`Halo Solo Technopark, saya ingin konsultasi mengenai layanan *${product.name}* (ID: ${product.id}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-full flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:scale-95 transition-all shrink-0"
            title="Tanya PIC via WhatsApp"
            aria-label="Tanya via WhatsApp"
          >
            <MessageCircle size={20} />
          </a>

          {/* Tombol Pesan Utama */}
          <Button 
            onClick={handleCTA} 
            disabled={isProcessing} 
            className={`h-11 px-5 rounded-full font-bold text-white shadow-md border-0 text-sm ${
              product.ctaType === 'WHATSAPP' ? 'bg-[#25D366] hover:bg-[#1DA851]' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (product.ctaText || 'Pesan Sekarang')}
          </Button>
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