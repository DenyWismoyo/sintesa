// src/app/(admin)/booking/components/TabFasilitasTeknis.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FacilityAddon,
  FacilityAddonCategory,
  FACILITY_ADDON_CATEGORY_LABELS,
  FacilityAddonCategoryEnum,
} from '@/types/facilityAddon.types';
import { facilityAddonService } from '@/services/facilityAddon.service';
import { formatRupiah } from '@/utils/format';
import {
  SlidersHorizontal,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Monitor,
  Radio,
  Video,
  Wifi,
  Zap,
  Sparkles,
  ShieldCheck,
  Layers,
  Cpu,
  Wrench,
  Loader2,
  Boxes,
  HelpCircle,
  TrendingUp,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Mapping nama ikon ke komponen Lucide
const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Monitor,
  Radio,
  Video,
  Wifi,
  Zap,
  Sparkles,
  ShieldCheck,
  Layers,
  Cpu,
  Wrench,
  SlidersHorizontal,
};

export default function TabFasilitasTeknis() {
  const [addons, setAddons] = useState<FacilityAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal Tambah / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<FacilityAddonCategory>('VISUAL_MULTIMEDIA');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('hari');
  const [formDescription, setFormDescription] = useState('');
  const [formStock, setFormStock] = useState<number>(1);
  const [formIsAvailable, setFormIsAvailable] = useState<boolean>(true);
  const [formIconName, setFormIconName] = useState('Monitor');
  const [isSaving, setIsSaving] = useState(false);

  // Modal Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAddon, setDeletingAddon] = useState<FacilityAddon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inisialisasi bawaan
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const data = await facilityAddonService.getAllAddons();
      setAddons(data);
    } catch (err) {
      console.error('Gagal mengambil data fasilitas teknis:', err);
      toast.error('Gagal memuat data fasilitas teknis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  // Filter List
  const filteredAddons = useMemo(() => {
    return addons.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [addons, searchQuery, selectedCategory]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = addons.length;
    const active = addons.filter((a) => a.isAvailable).length;
    const inactive = total - active;
    const avgPrice =
      total > 0 ? Math.round(addons.reduce((acc, a) => acc + a.price, 0) / total) : 0;
    return { total, active, inactive, avgPrice };
  }, [addons]);

  // Buka Form Tambah
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormName('');
    setFormCategory('VISUAL_MULTIMEDIA');
    setFormPrice(1000000);
    setFormUnit('hari');
    setFormDescription('');
    setFormStock(1);
    setFormIsAvailable(true);
    setFormIconName('Monitor');
    setIsFormModalOpen(true);
  };

  // Buka Form Edit
  const handleOpenEditModal = (addon: FacilityAddon) => {
    setIsEditing(true);
    setCurrentId(addon.id || null);
    setFormName(addon.name);
    setFormCategory(addon.category);
    setFormPrice(addon.price);
    setFormUnit(addon.unit);
    setFormDescription(addon.description || '');
    setFormStock(addon.stockQuantity || 1);
    setFormIsAvailable(addon.isAvailable);
    setFormIconName(addon.iconName || 'Monitor');
    setIsFormModalOpen(true);
  };

  // Simpan Form (Create / Update)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Nama fasilitas teknis tidak boleh kosong.');
      return;
    }
    if (formPrice < 0) {
      toast.error('Tarif sewa tidak boleh kurang dari 0.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<FacilityAddon, 'id'> = {
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice),
        unit: formUnit.trim() || 'hari',
        description: formDescription.trim(),
        stockQuantity: Math.max(1, Number(formStock)),
        isAvailable: formIsAvailable,
        iconName: formIconName,
      };

      if (isEditing && currentId) {
        await facilityAddonService.updateAddon(currentId, payload);
        toast.success(`Berhasil memperbarui "${formName}".`);
      } else {
        await facilityAddonService.createAddon(payload);
        toast.success(`Berhasil menambahkan "${formName}".`);
      }

      setIsFormModalOpen(false);
      fetchAddons();
    } catch (err: any) {
      console.error('Gagal menyimpan fasilitas teknis:', err);
      toast.error(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Cepat Ketersediaan
  const handleToggleAvailability = async (addon: FacilityAddon) => {
    if (!addon.id) return;
    const newStatus = !addon.isAvailable;
    try {
      await facilityAddonService.updateAddon(addon.id, { isAvailable: newStatus });
      setAddons((prev) =>
        prev.map((item) => (item.id === addon.id ? { ...item, isAvailable: newStatus } : item))
      );
      toast.success(
        `Status ${addon.name} diubah menjadi ${newStatus ? 'Tersedia Disewa' : 'Non-aktif'}.`
      );
    } catch (err) {
      toast.error('Gagal memperbarui status ketersediaan.');
    }
  };

  // Hapus Addon
  const handleDeleteConfirm = async () => {
    if (!deletingAddon || !deletingAddon.id) return;
    setIsDeleting(true);
    try {
      await facilityAddonService.deleteAddon(deletingAddon.id);
      toast.success(`Fasilitas "${deletingAddon.name}" telah dihapus.`);
      setIsDeleteModalOpen(false);
      setDeletingAddon(null);
      fetchAddons();
    } catch (err) {
      toast.error('Gagal menghapus fasilitas.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Seed Data Awal
  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const count = await facilityAddonService.seedDefaultAddons();
      toast.success(`Berhasil menambahkan ${count} paket fasilitas standar kawasan.`);
      fetchAddons();
    } catch (err) {
      toast.error('Gagal melakukan inisialisasi awal.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. KARTU STATISTIK RINGKAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Fasilitas Teknis
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
              {stats.total}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tersedia Disewa
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 block">
              {stats.active}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Perawatan / Nonaktif
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 block">
              {stats.inactive}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rata-Rata Tarif Sewa
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
              {formatRupiah(stats.avgPrice)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR PENCARIAN & AKSI */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari fasilitas teknis (Videotron, Sound System, Genset, IT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchAddons}
              disabled={loading}
              className="rounded-xl h-10 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </Button>

            {addons.length === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="rounded-xl h-10 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 gap-1.5 cursor-pointer"
              >
                {isSeeding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Inisialisasi Standar STP</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddModal}
              className="rounded-xl h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Fasilitas Teknis</span>
            </Button>
          </div>
        </div>

        {/* Filter Kategori Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Semua ({addons.length})
          </button>
          {Object.entries(FACILITY_ADDON_CATEGORY_LABELS).map(([catKey, label]) => {
            const count = addons.filter((a) => a.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === catKey
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TABEL DAFTAR PERLENGKAPAN TEKNIS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Memuat katalog fasilitas teknis kawasan...</span>
          </div>
        ) : filteredAddons.length === 0 ? (
          <div className="text-center p-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                Belum Ada Fasilitas Teknis Ditemukan
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Tidak ada perlengkapan yang sesuai dengan filter pencarian.'
                  : 'Katalog perlengkapan teknis masih kosong. Klik tombol di bawah untuk mengisi data default kawasan.'}
              </p>
            </div>
            {addons.length === 0 && (
              <Button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Muat Paket Standar Solo Technopark</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-4">Fasilitas & Spesifikasi</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4 text-right">Tarif Sewa (BLUD)</th>
                  <th className="p-4 text-center">Unit Stok</th>
                  <th className="p-4 text-center">Status Sewa</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAddons.map((addon) => {
                  const IconComp = ICON_COMPONENTS[addon.iconName || 'Monitor'] || Monitor;
                  return (
                    <tr key={addon.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                            <IconComp className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-tight">
                              {addon.name}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {addon.description || 'Tidak ada deskripsi spesifikasi tambahan.'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {FACILITY_ADDON_CATEGORY_LABELS[addon.category] || addon.category}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-extrabold text-slate-900 font-mono text-xs">
                          {formatRupiah(addon.price)}
                        </div>
                        <div className="text-[10px] text-slate-400">/{addon.unit}</div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-bold text-slate-800">
                          {addon.stockQuantity || 1} Unit
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(addon)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            addon.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {addon.isAvailable ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(addon)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                            title="Edit Fasilitas"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingAddon(addon);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Hapus Fasilitas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL DIALOG FORM (TAMBAH / EDIT) */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-md w-full rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              {isEditing ? 'Ubah Fasilitas Teknis & Add-on' : 'Tambah Fasilitas Teknis Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Atur komponen fasilitas dan peralatan operasional untuk penawaran B2B dan sewa kawasan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveForm} className="space-y-3.5 text-xs mt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Perlengkapan / Layanan Teknis *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Videotron LED P2.5 Indoor Stage"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Fasilitas *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FacilityAddonCategory)}
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {Object.entries(FACILITY_ADDON_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilihan Ikon Visual
                </label>
                <select
                  value={formIconName}
                  onChange={(e) => setFormIconName(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Monitor">Monitor (Layar / Videotron)</option>
                  <option value="Radio">Radio (Sound / Audio)</option>
                  <option value="Video">Video (Kamera / Streaming)</option>
                  <option value="Wifi">Wifi (Internet / Fiber)</option>
                  <option value="Zap">Zap (Genset / Listrik)</option>
                  <option value="Sparkles">Sparkles (Lighting / Lampu)</option>
                  <option value="ShieldCheck">ShieldCheck (Teknisi / Pengawal)</option>
                  <option value="Layers">Layers (Podium / Panggung)</option>
                  <option value="Cpu">Cpu (Komputer / Server)</option>
                  <option value="Wrench">Wrench (Peralatan Lab)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tarif Sewa Satuan (IDR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={50000}
                  placeholder="2000000"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Satuan Tarif *
                </label>
                <input
                  type="text"
                  required
                  placeholder="hari / sesi / paket"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Stok Unit
                </label>
                <input
                  type="number"
                  min={1}
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="w-full h-9.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ketersediaan Sewa
                </label>
                <button
                  type="button"
                  onClick={() => setFormIsAvailable(!formIsAvailable)}
                  className={`w-full h-9.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    formIsAvailable
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {formIsAvailable ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Aktif Disewakan</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-slate-400" />
                      <span>Sedang Non-Aktif</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Keterangan Spesifikasi Teknis
              </label>
              <textarea
                rows={2}
                placeholder="Rincian daya listrik, dimensi, merk, kelengkapan, dll..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-xl h-10 px-4 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl h-10 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Fasilitas'}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. MODAL KONFIRMASI HAPUS */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              Hapus Fasilitas Teknis?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus <strong>"{deletingAddon?.name}"</strong> dari katalog
              fasilitas teknis kawasan? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl h-9.5 px-4 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="rounded-xl h-9.5 px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus Fasilitas</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
