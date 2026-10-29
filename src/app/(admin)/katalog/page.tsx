"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import TabDaftarKatalog from './components/TabDaftarKatalog';
import ModalFormProduct from './components/ModalFormProduct';
import DivisionInvoiceTracker from '@/components/finance/DivisionInvoiceTracker';
import { Tag, Settings, Receipt, CheckCircle2, Share2, Building2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

// Import Custom Hook Katalog
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCatalog } from '@/types';

export default function KatalogAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'daftar' | 'tagihan' | 'pengaturan'>('daftar');

  const { 
    products = [], 
    loading = false, 
    addProduct, 
    updateProduct, 
    editProduct,   
    deleteProduct, 
    removeProduct,
    getProduct
  } = useCatalog() as any;

  // State untuk mengontrol Modal & Loading Fetching
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalog | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Handler Modal
  const handleOpenAdd = () => {
    router.push('/katalog/builder'); return;
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: ProductCatalog) => {
    if (!product.id) return;
    router.push(`/katalog/builder?id=${product.id}`); return;

    setIsFetchingDetail(true);
    const result = await getProduct(product.id);
    setIsFetchingDetail(false);

    if (result && result.success && result.data) {
      setSelectedProduct(result.data);
      setIsModalOpen(true);
    } else {
      alert("Gagal memuat detail lengkap produk dari server.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 200);
  };

  const handleSaveProduct = async (data: Partial<ProductCatalog>, imageFiles: File[]) => {
    try {
      const { id, ...payload } = data;
      let res;
      
      if (selectedProduct?.id) {
        if (typeof editProduct === 'function') {
          res = await editProduct(selectedProduct.id, payload, imageFiles);
        } else if (typeof updateProduct === 'function') {
          res = await updateProduct(selectedProduct.id, payload, imageFiles.length > 0 ? imageFiles[0] : null);
        } else {
          alert("Fungsi edit tidak ditemukan pada sistem.");
          return;
        }
      } else {
        if (typeof editProduct === 'function') {
           res = await addProduct(payload, imageFiles);
        } else {
           res = await addProduct(payload, imageFiles.length > 0 ? imageFiles[0] : null);
        }
      }

      if (res && !res.success) {
        alert("Gagal menyimpan produk: " + res.error);
      } else {
        handleCloseModal();
      }
      
    } catch (error: any) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat upload gambar: " + error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus produk/layanan ini?")) {
      let res;
      if (typeof removeProduct === 'function') {
         res = await removeProduct(id);
      } else if (typeof deleteProduct === 'function') {
         res = await deleteProduct(id);
      }
      
      if (res && !res.success) {
        alert("Gagal menghapus produk: " + res.error);
      }
    }
  };

  const stpProductsCount = products.filter((p: ProductCatalog) => p.ownerType !== 'TENANT').length;
  const tenantProductsCount = products.filter((p: ProductCatalog) => p.ownerType === 'TENANT').length;

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300"> 
      
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Manajemen E-Katalog"
        subtitle="Kelola produk, layanan, ruangan, dan produk inovasi tenant binaan untuk disewa atau dibeli publik."
        badge={`${products.length} Produk Terdaftar`}
        breadcrumbs={[{ label: 'Katalog Produk' }]}
      >
        {/* Navigasi Pill Tab */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl overflow-x-auto w-full md:w-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'daftar' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Tag size={16} /> Daftar Produk
          </button>
          <button
            onClick={() => setActiveTab('tagihan')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'tagihan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Receipt size={16} /> Tagihan & Order
          </button>
          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'pengaturan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Settings size={16} /> Pengaturan Katalog
          </button>
        </div>
      </AdminPageHeader>

      {/* Konten Tab Aktif */}
      {activeTab === 'daftar' && (
        <TabDaftarKatalog 
          products={products}
          loading={loading}
          isFetchingDetail={isFetchingDetail}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteProduct}
        />
      )}

      {activeTab === 'tagihan' && (
        <DivisionInvoiceTracker
          division="KATALOG_PRODUK"
          title="Pantauan Tagihan & Order E-Katalog"
          subtitle="Pantau seluruh invoice checkout produk dari halaman publik /e-katalog beserta sinkronisasi omzet tenant."
        />
      )}
      
      {activeTab === 'pengaturan' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-base font-black text-slate-800">Integrasi Checkout & Billing BLUD</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Setiap pemesanan dari halaman publik <code className="font-mono text-blue-600">/e-katalog</code> dengan metode <strong>Checkout Langsung</strong> otomatis menerbitkan Invoice divisi <strong>KATALOG_PRODUK (COA 4.1.05)</strong>.
            </p>
            <div className="pt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              Status Sinkronisasi: Aktif ({stpProductsCount} Produk Internal STP)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h3 className="text-base font-black text-slate-800">Etalase Produk Inovasi Tenant</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Produk milik Tenant Binaan yang telah lulus kurasi di menu <strong>Inkubasi Tenant &rarr; Kurasi UKM</strong> dapat langsung dipromosikan ke Master E-Katalog. Saat tagihan produk tenant lunas, omzet otomatis tercatat ke buku pendapatan tenant.
            </p>
            <div className="pt-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Produk Tenant Tayang: {tenantProductsCount} Produk
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 size={20} />
            </div>
            <h3 className="text-base font-black text-slate-800">Atribusi Referral & Komisi Afiliasi</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pembelian E-Katalog yang menggunakan tautan referral (<code className="font-mono text-indigo-600">?ref=KODE</code>) otomatis mencatat komisi berstatus <em>Pending Payment</em> dan mencairkannya ke saldo Mitra Afiliasi saat Kasir memverifikasi pelunasan invoice.
            </p>
            <div className="pt-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
              Integrasi Afiliasi: Terhubung ke /afiliasi
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      <ModalFormProduct 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={selectedProduct} 
        onSubmit={handleSaveProduct}
      />

    </div>
  );
}
