'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { DialogPageModeProvider } from '@/components/ui/dialog';
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCatalog } from '@/types';
import ModalFormProduct from '../components/ModalFormProduct';
import { toast } from 'sonner';

function KatalogBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');

  const { products = [], loading: catalogLoading, addProduct, updateProduct, editProduct, getProduct } = useCatalog() as any;
  const [initialData, setInitialData] = useState<ProductCatalog | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(Boolean(editId));

  useEffect(() => {
    if (!editId) {
      setInitialData(null);
      setLoadingDetail(false);
      return;
    }

    // 1. Jika data sudah ada di TanStack Query / cache lokal, gunakan seketika!
    const foundInMemory = products.find((p: any) => p.id === editId);
    if (foundInMemory) {
      setInitialData(foundInMemory);
      setLoadingDetail(false);
      return;
    }

    // 2. Jika daftar produk masih proses fetch awal dari cache, pertahankan loading sementara
    if (catalogLoading) {
      setLoadingDetail(true);
      return;
    }

    // 3. Fallback: ambil secara direct via getProduct jika tidak ada di memori lokal (misal direct URL)
    let active = true;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await getProduct(editId);
        if (active) {
          if (res?.success && res.data) {
            setInitialData(res.data);
            setLoadingDetail(false);
          } else {
            toast.error('Produk tidak ditemukan.');
            router.push('/katalog');
          }
        }
      } catch (err) {
        console.error(err);
        if (active) {
          toast.error('Gagal memuat konfigurasi produk.');
          router.push('/katalog');
        }
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [editId, products, catalogLoading, getProduct, router]);

  const handleSaveProduct = async (data: Partial<ProductCatalog>, imageFiles: File[]) => {
    const { id, ...payload } = data;
    let res;
    if (editId) {
      if (typeof editProduct === 'function') {
        res = await editProduct(editId, payload, imageFiles);
      } else if (typeof updateProduct === 'function') {
        res = await updateProduct(editId, payload, imageFiles.length > 0 ? imageFiles[0] : null);
      }
    } else {
      if (typeof editProduct === 'function') {
        res = await addProduct(payload, imageFiles);
      } else {
        res = await addProduct(payload, imageFiles.length > 0 ? imageFiles[0] : null);
      }
    }

    if (res && !res.success) {
      toast.error('Gagal menyimpan produk: ' + res.error);
    } else {
      toast.success(editId ? 'Perubahan produk berhasil disimpan!' : 'Produk baru berhasil diterbitkan!');
      router.push('/katalog');
    }
  };

  if (loadingDetail) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Memuat Konfigurasi Produk...</p>
        <button
          type="button"
          onClick={() => router.push('/katalog')}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Batal & Kembali ke Katalog</span>
        </button>
      </div>
    );
  }

  return (
    <DialogPageModeProvider
      backHref="/katalog"
      backLabel="Kembali ke E-Katalog"
      pageTitle={editId ? `Edit Produk: ${initialData?.name || ''}` : 'Tambah Produk & Layanan E-Katalog'}
      pageSubtitle="Kelola informasi produk, komponen paket bundling, spesifikasi teknis, dan galeri dalam tampilan penuh."
      badgeText={editId ? 'Mode Edit' : 'Produk Baru'}
      onClosePage={() => router.push('/katalog')}
    >
      <ModalFormProduct
        isOpen={true}
        onClose={() => router.push('/katalog')}
        onSubmit={handleSaveProduct}
        initialData={initialData}
      />
    </DialogPageModeProvider>
  );
}

export default function KatalogBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <KatalogBuilderContent />
    </Suspense>
  );
}
