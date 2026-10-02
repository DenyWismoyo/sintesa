"use client";

import React, { useState } from 'react';
import TabDaftarKatalog from './components/TabDaftarKatalog';
import ModalFormProduct from './components/ModalFormProduct';
import { Tag, Settings, Info } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin';

// Import Custom Hook Katalog
import { useCatalog } from '@/hooks/useCatalog';
import { ProductCatalog } from '@/types';

export default function KatalogAdminPage() {
  const [activeTab, setActiveTab] = useState('daftar');

  const { 
    products = [], 
    loading = false, 
    addProduct, 
    updateProduct, 
    editProduct,   
    deleteProduct, 
    removeProduct,
    getProduct // PENTING: Diperlukan untuk memanggil data full sebelum edit
  } = useCatalog() as any;

  // State untuk mengontrol Modal & Loading Fetching
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalog | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Handler Modal
  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: ProductCatalog) => {
    if (!product.id) return;

    // PENCEGAHAN BUG DATA HILANG:
    // Karena tabel menggunakan data Cache (yang terkompresi/tidak lengkap),
    // kita WAJIB mendownload dokumen aslinya terlebih dahulu agar form edit terisi penuh.
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

  return (
    <div className="w-full space-y-6 pb-24 animate-in fade-in duration-300"> 
      
      {/* 1. ADMIN PAGE HEADER */}
      <AdminPageHeader
        title="Manajemen E-Katalog"
        subtitle="Kelola produk, layanan, ruangan, dan fasilitas untuk disewa atau dibeli publik."
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
            onClick={() => setActiveTab('pengaturan')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'pengaturan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Settings size={16} /> Pengaturan Katalog
          </button>
        </div>
      </AdminPageHeader>

      {/* Banner Info - Clean Styling */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed text-slate-700 pt-1">
            Anda dapat mengelola detail, harga, dan spesifikasi seluruh produk e-katalog pada halaman ini. Data akan otomatis diperbarui dan dapat langsung dilihat oleh pengunjung web.
          </p>
        </div>
      </div>

      {/* Konten Tab Aktif */}
      <div className="mt-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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
        
        {activeTab === 'pengaturan' && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center border border-slate-100 mb-4">
              <Settings size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Pengaturan Lanjutan</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Fitur manajemen banner *carousel* dan pengaturan *custom* kategori sedang dalam pengembangan (Coming Soon).
            </p>
          </div>
        )}
      </div>

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