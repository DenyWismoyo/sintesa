'use client';

import React, { useState } from 'react';
import { ProductCategory } from '@/types';
import ProductCard from './components/ProductCard';
import { PackageSearch, Store } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useCatalog } from '@/hooks/useCatalog';
import SectionContainer from '@/components/ui/SectionContainer';
import PageHero from '@/components/ui/PageHero';
import PillTabs from '@/components/ui/PillTabs';
import EmptyState from '@/components/ui/EmptyState';

const categories: (ProductCategory | 'Semua')[] = [
  'Semua', 'Ruangan', 'Peralatan', 'Layanan Teknis', 'Pelatihan', 'Produk Tenant', 'Lainnya'
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 320, damping: 26 }
  }
};

// Skeleton Loading yang Elegan & Borderless
const ProductSkeleton = () => (
  <div className="public-card p-5 flex flex-col">
    <div className="public-shimmer h-52 w-full rounded-2xl mb-5" />
    <div className="public-shimmer h-6 w-3/4 rounded-lg mb-3" />
    <div className="public-shimmer h-4 w-full rounded-lg mb-2" />
    <div className="public-shimmer h-4 w-4/5 rounded-lg mb-6" />
    <div className="mt-auto pt-4 flex justify-between items-end">
      <div className="public-shimmer h-8 w-1/2 rounded-xl" />
      <div className="public-shimmer h-10 w-10 rounded-full" />
    </div>
  </div>
);

export default function KatalogPublikPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Semua'>('Semua');

  const { products: rawProducts, loading } = useCatalog();

  const products = rawProducts.filter(p => {
    const isPublished = p.isPublished === true;
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.shortDescription || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return isPublished && matchCategory && matchSearch;
  });

  return (
    <SectionContainer accent="emerald">
      {/* Header Reusable PageHero */}
      <PageHero 
        breadcrumbs={[{ label: 'Katalog', href: '/e-katalog' }]}
        badge={{ label: 'E-Katalog Resmi', icon: <Store size={13} />, variant: 'emerald' }}
        title="Katalog Inovasi & Layanan"
        subtitle="Jelajahi berbagai fasilitas eksklusif, produk teknologi terapan, dan layanan profesional yang tersedia di kawasan kami."
        accentColor="emerald"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari nama alat, ruangan, atau layanan..."
        isLoadingSearch={loading}
      />

      {/* Filter Kategori Animatif (Pills) Standar */}
      <div className="mb-4 sm:mb-6">
        <PillTabs
          tabs={categories.map(cat => ({ key: cat, label: cat }))}
          active={selectedCategory}
          onChange={(cat) => setSelectedCategory(cat as any)}
          layoutId="e-katalog-pill-tab"
          ariaLabel="Filter Kategori Produk"
        />
      </div>

      {/* Area Hasil */}
      <div className="pt-2 min-h-[50vh]">
        {loading && rawProducts.length === 0 ? (
          <div className="public-grid-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <ProductSkeleton key={n} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <motion.div className="public-grid-4" variants={containerVariants} initial="hidden" animate="visible">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div key={product.id} variants={itemVariants} layoutId={`product-${product.id}`}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState 
            icon={PackageSearch}
            title="Layanan Tidak Ditemukan"
            description="Kami tidak dapat menemukan produk atau layanan yang cocok dengan kata kunci atau filter yang Anda pilih. Silakan coba istilah lain."
            actionLabel="Reset Pencarian"
            onAction={() => { setSearchTerm(''); setSelectedCategory('Semua'); }}
          />
        )}
      </div>
    </SectionContainer>
  );
}