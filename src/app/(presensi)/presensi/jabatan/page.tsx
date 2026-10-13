"use client";

import React, { useState, useMemo } from "react";
import { usePresensiAuth } from "@/lib/presensi/auth-context";
import {
  useJabatanList,
  useSaveJabatanMutation,
  useDeleteJabatanMutation,
  useSeedDefaultJabatanMutation,
} from "@/hooks/presensi/useJabatan";
import { usePegawaiList } from "@/hooks/presensi/usePegawai";
import { MasterJabatan } from "@/types/presensi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobilePageHeader from "@/components/presensi/dashboard/MobilePageHeader";
import {
  Network,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
} from "lucide-react";

// ── Helper Warna Badge Level ─────────────────────────────────────────
function getLevelBadge(level: number) {
  if (level === 1) {
    return (
      <Badge className="bg-purple-600/10 text-purple-700 border-purple-200 text-[11px] font-bold">
        L{level} • Puncak Pimpinan
      </Badge>
    );
  }
  if (level <= 3) {
    return (
      <Badge className="bg-indigo-600/10 text-indigo-700 border-indigo-200 text-[11px] font-bold">
        L{level} • Manajemen Eksekutif
      </Badge>
    );
  }
  if (level === 4) {
    return (
      <Badge className="bg-teal-600/10 text-teal-700 border-teal-200 text-[11px] font-semibold">
        L{level} • Kepala Divisi
      </Badge>
    );
  }
  if (level <= 7) {
    return (
      <Badge className="bg-blue-600/10 text-blue-700 border-blue-200 text-[11px] font-semibold">
        L{level} • Instruktur / Spesialis
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-600/10 text-slate-700 border-slate-200 text-[11px] font-medium">
      L{level} • Pelaksana / Staf
    </Badge>
  );
}

function getTipeBadge(tipe?: "struktural" | "fungsional" | "pelaksana") {
  switch (tipe) {
    case "struktural":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
          Struktural
        </Badge>
      );
    case "fungsional":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
          Fungsional
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px]">
          Pelaksana
        </Badge>
      );
  }
}

// ── Komponen Rekursif Pohon Hierarki (Organogram Tree View) ───────────
interface TreeNodeProps {
  jabatan: MasterJabatan;
  levelMap: Record<string, MasterJabatan[]>;
  pegawaiList: any[];
  onEdit: (j: MasterJabatan) => void;
  onDelete: (j: MasterJabatan) => void;
  isAdmin: boolean;
}

function JabatanTreeNode({
  jabatan,
  levelMap,
  pegawaiList,
  onEdit,
  onDelete,
  isAdmin,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = levelMap[jabatan.id] || [];
  const holders = pegawaiList.filter(
    (p) =>
      p.jabatanId === jabatan.id ||
      p.jabatan?.trim().toLowerCase() === jabatan.namaJabatan.trim().toLowerCase()
  );

  return (
    <div className="flex flex-col mb-2.5">
      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 transition-all shadow-xs group">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors ${
            children.length === 0 ? "invisible" : ""
          }`}
          title={isExpanded ? "Ciutkan cabang" : "Bentangkan cabang"}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-bold text-xs sm:text-sm text-slate-900">{jabatan.namaJabatan}</span>
          {getLevelBadge(jabatan.level)}
          {getTipeBadge(jabatan.tipeJabatan)}

          {jabatan.departemen && (
            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
              {jabatan.departemen}
            </span>
          )}

          {/* Pemegang Jabatan Saat Ini */}
          {holders.length > 0 && (
            <div className="flex items-center gap-1 ml-auto sm:ml-2 flex-wrap">
              {holders.slice(0, 3).map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-medium"
                >
                  <User size={10} />
                  {h.nama}
                </span>
              ))}
              {holders.length > 3 && (
                <span className="text-[10px] text-slate-400 font-medium">
                  +{holders.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(jabatan)}
              className="h-7 w-7 text-slate-500 hover:text-violet-600 hover:bg-violet-50"
              title="Edit Jabatan"
            >
              <Pencil size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(jabatan)}
              className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Hapus Jabatan"
            >
              <Trash2 size={13} />
            </Button>
          </div>
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="ml-5 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-emerald-200/60 mt-1 space-y-1">
          {children.map((child) => (
            <JabatanTreeNode
              key={child.id}
              jabatan={child}
              levelMap={levelMap}
              pegawaiList={pegawaiList}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Komponen Utama Halaman Manajemen Jabatan ──────────────────────────
export default function ManajemenJabatanPage() {
  const { user } = usePresensiAuth();
  const isAdmin = user?.role === "admin";

  const { data: jabatanList = [], isLoading, refetch } = useJabatanList(user?.orgId);
  const { data: allPegawai = [] } = usePegawaiList();

  const saveMutation = useSaveJabatanMutation();
  const deleteMutation = useDeleteJabatanMutation();
  const seedMutation = useSeedDefaultJabatanMutation();

  const [activeTab, setActiveTab] = useState<"tabel" | "pohon">("tabel");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipe, setFilterTipe] = useState<string>("all");
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState<MasterJabatan | null>(null);
  const [formData, setFormData] = useState<{
    id?: string;
    namaJabatan: string;
    level: number;
    parentJabatanId: string;
    departemen: string;
    tipeJabatan: "struktural" | "fungsional" | "pelaksana";
    status: "aktif" | "nonaktif";
    keterangan: string;
  }>({
    namaJabatan: "",
    level: 4,
    parentJabatanId: "",
    departemen: "",
    tipeJabatan: "struktural",
    status: "aktif",
    keterangan: "",
  });

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = jabatanList.length;
    const struktural = jabatanList.filter((j) => j.tipeJabatan === "struktural").length;
    const fungsional = jabatanList.filter((j) => j.tipeJabatan === "fungsional").length;
    const pelaksana = jabatanList.filter((j) => j.tipeJabatan === "pelaksana").length;
    return { total, struktural, fungsional, pelaksana };
  }, [jabatanList]);

  // Filter List untuk Tabel
  const filteredJabatan = useMemo(() => {
    return jabatanList.filter((j) => {
      const matchSearch =
        j.namaJabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.departemen || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchTipe = filterTipe === "all" || j.tipeJabatan === filterTipe;
      return matchSearch && matchTipe;
    });
  }, [jabatanList, searchQuery, filterTipe]);

  // Peta Hierarki untuk Mode Pohon (parentJabatanId -> children[])
  const hierarchyMap = useMemo(() => {
    const map: Record<string, MasterJabatan[]> = {};
    jabatanList.forEach((j) => {
      const parentId = j.parentJabatanId || "root";
      if (!map[parentId]) map[parentId] = [];
      map[parentId].push(j);
    });
    // Urutkan anak berdasarkan level dan nama
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.level - b.level || a.namaJabatan.localeCompare(b.namaJabatan));
    });
    return map;
  }, [jabatanList]);

  const rootJabatans = hierarchyMap["root"] || [];

  // Calon Atasan untuk Form (Hanya jabatan dengan level < formData.level)
  const potentialParents = useMemo(() => {
    return jabatanList.filter(
      (j) => j.level < Number(formData.level) && (!formData.id || j.id !== formData.id)
    );
  }, [jabatanList, formData.level, formData.id]);

  // Buka Form Tambah
  const handleOpenAdd = () => {
    setEditingJabatan(null);
    setFormData({
      namaJabatan: "",
      level: 4,
      parentJabatanId: jabatanList.find((j) => j.level === 3)?.id || "",
      departemen: "",
      tipeJabatan: "struktural",
      status: "aktif",
      keterangan: "",
    });
    setAlertMessage(null);
    setIsModalOpen(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (j: MasterJabatan) => {
    setEditingJabatan(j);
    setFormData({
      id: j.id,
      namaJabatan: j.namaJabatan,
      level: j.level,
      parentJabatanId: j.parentJabatanId || "",
      departemen: j.departemen || "",
      tipeJabatan: j.tipeJabatan || "struktural",
      status: j.status || "aktif",
      keterangan: j.keterangan || "",
    });
    setAlertMessage(null);
    setIsModalOpen(true);
  };

  // Submit Simpan (Tambah / Update)
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMessage(null);

    const parentObj = jabatanList.find((j) => j.id === formData.parentJabatanId);

    try {
      const res = await saveMutation.mutateAsync({
        id: formData.id,
        namaJabatan: formData.namaJabatan,
        level: Number(formData.level),
        parentJabatanId: formData.parentJabatanId || null,
        parentJabatanNama: parentObj?.namaJabatan || null,
        departemen: formData.departemen,
        tipeJabatan: formData.tipeJabatan,
        status: formData.status,
        keterangan: formData.keterangan,
      });

      if (res.success) {
        setAlertMessage({ type: "success", text: res.message });
        await refetch();
        setTimeout(() => {
          setIsModalOpen(false);
          setAlertMessage(null);
        }, 1500);
      } else {
        setAlertMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setAlertMessage({ type: "error", text: err.message || "Gagal menyimpan jabatan." });
    }
  };

  // Handle Hapus Jabatan
  const handleDelete = async (j: MasterJabatan) => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus jabatan "${j.namaJabatan}" (Level ${j.level})?`
    );
    if (!isConfirmed) return;

    try {
      const res = await deleteMutation.mutateAsync(j.id);
      if (res.success) {
        await refetch();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert("Gagal menghapus jabatan.");
    }
  };

  // Reset / Seeding Default
  const handleResetDefaults = async () => {
    const isConfirmed = window.confirm(
      "Apakah Anda ingin mereset/menginisialisasi ulang seluruh jabatan ke data standar Solo Technopark?"
    );
    if (!isConfirmed) return;

    try {
      const res = await seedMutation.mutateAsync();
      alert(res.message);
      await refetch();
    } catch (err) {
      alert("Gagal menginisialisasi jabatan default.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Mobile Top Header */}
      <MobilePageHeader
        title="Hierarki Jabatan"
        subtitle="Kelola master level & posisi organisasi"
        backHref="/presensi"
        rightElement={
          isAdmin ? (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="btn-primary text-xs h-8 px-2.5 rounded-lg gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </Button>
          ) : undefined
        }
      />

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 card-base p-6 bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
              <Network className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white">
              Manajemen Master Jabatan & Hierarki
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Atur hierarki kewenangan approval, silsilah pohon jabatan (organogram), dan level
            numerik dinamis tanpa perlu hardcode di sistem.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              disabled={seedMutation.isPending}
              className="text-xs h-9 bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
              title="Reset ke struktur standar STP"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {seedMutation.isPending ? "Mengatur..." : "Reset Standar STP"}
            </Button>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="btn-primary text-xs h-9 px-4 gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              Tambah Jabatan Baru
            </Button>
          </div>
        )}
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        <div className="card-base p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Jabatan</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Posisi terdaftar</div>
        </div>

        <div className="card-base p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Struktural</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.struktural}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pimpinan & Pejabat</div>
        </div>

        <div className="card-base p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Fungsional</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.fungsional}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Instruktur & Spesialis</div>
        </div>

        <div className="card-base p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pelaksana</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.pelaksana}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Staf Operasional</div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="card-base p-4 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs Mode */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("tabel")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "tabel"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Mode Tabel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pohon")}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === "pohon"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Network size={14} />
              Pohon Hierarki (Organogram)
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari nama jabatan / divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="text-xs h-9 rounded-md border border-slate-200 bg-white px-2.5 text-slate-700"
            >
              <option value="all">Semua Tipe</option>
              <option value="struktural">Struktural</option>
              <option value="fungsional">Fungsional</option>
              <option value="pelaksana">Pelaksana</option>
            </select>
          </div>
        </div>

        {/* Content Tab: Tabel atau Pohon */}
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500">
            Memuat hierarki jabatan...
          </div>
        ) : activeTab === "tabel" ? (
          /* ── Tab: Mode Tabel ─────────────────────────────────────── */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Nama Jabatan</th>
                  <th className="py-3 px-4">Level Hierarki</th>
                  <th className="py-3 px-4">Tipe Jabatan</th>
                  <th className="py-3 px-4">Subdivisi / Divisi</th>
                  <th className="py-3 px-4">Atasan Langsung</th>
                  <th className="py-3 px-4 text-center">Pemegang</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJabatan.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada jabatan yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredJabatan.map((j) => {
                    const holders = allPegawai.filter(
                      (p) =>
                        p.jabatanId === j.id ||
                        p.jabatan?.trim().toLowerCase() === j.namaJabatan.trim().toLowerCase()
                    );

                    return (
                      <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {j.namaJabatan}
                        </td>
                        <td className="py-3 px-4">{getLevelBadge(j.level)}</td>
                        <td className="py-3 px-4">{getTipeBadge(j.tipeJabatan)}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {j.departemen || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          {j.parentJabatanNama ? (
                            <span className="text-slate-700 font-medium">{j.parentJabatanNama}</span>
                          ) : (
                            <span className="text-slate-400 italic">— Puncak Pimpinan</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              holders.length > 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {holders.length} orang
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={
                              j.status === "aktif"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }
                          >
                            {j.status === "aktif" ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(j)}
                                className="h-7 w-7 text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                                title="Edit Jabatan"
                              >
                                <Pencil size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(j)}
                                className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus Jabatan"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Tab: Mode Pohon (Organogram Tree View) ───────────────── */
          <div className="p-3 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 min-h-[320px]">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-emerald-600" />
                Pohon Organisasi Berdasarkan Jalur Komando:
              </span>
              <span>Klik ikon panah untuk melipat / membuka cabang</span>
            </div>

            {rootJabatans.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Belum ada struktur pohon yang terdefinisi.
              </div>
            ) : (
              rootJabatans.map((root) => (
                <JabatanTreeNode
                  key={root.id}
                  jabatan={root}
                  levelMap={hierarchyMap}
                  pegawaiList={allPegawai}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Modal Dialog Tambah / Edit Jabatan ────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  {editingJabatan ? "Edit Data Jabatan" : "Tambah Jabatan Baru"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur nama posisi, level hierarki, dan atasan langsungnya.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {alertMessage && (
              <div
                className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 border ${
                  alertMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {alertMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                {alertMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4">
              {/* Nama Jabatan */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Nama Jabatan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Kepala Divisi Riset dan Inkubator"
                  value={formData.namaJabatan}
                  onChange={(e) => setFormData({ ...formData, namaJabatan: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              {/* Level Hierarki & Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Level Hierarki (Angka) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    className="text-xs h-9 font-bold"
                  />
                  <p className="text-[10px] text-slate-500">
                    1 = Puncak Pimpinan, angka lebih tinggi = bawahan.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Tipe Jabatan <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    value={formData.tipeJabatan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipeJabatan: e.target.value as "struktural" | "fungsional" | "pelaksana",
                      })
                    }
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="struktural">Struktural (Pimpinan / Pejabat)</option>
                    <option value="fungsional">Fungsional (Instruktur / Ahli)</option>
                    <option value="pelaksana">Pelaksana (Staf / Operator)</option>
                  </select>
                </div>
              </div>

              {/* Atasan Langsung Jabatan */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Jabatan Atasan Langsung
                </Label>
                <select
                  value={formData.parentJabatanId}
                  onChange={(e) => setFormData({ ...formData, parentJabatanId: e.target.value })}
                  className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">— Tidak Ada Atasan (Puncak Hierarki / Level 1) —</option>
                  {potentialParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.namaJabatan} (Level {parent.level})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  Hanya menampilkan jabatan dengan level angka lebih kecil dari jabatan ini.
                </p>
              </div>

              {/* Subdivisi / Departemen & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Subdivisi / Bidang Unit
                  </Label>
                  <Input
                    type="text"
                    placeholder="Contoh: Information Technology"
                    value={formData.departemen}
                    onChange={(e) => setFormData({ ...formData, departemen: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Status Jabatan</Label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "aktif" | "nonaktif",
                      })
                    }
                    className="w-full text-xs h-9 rounded-md border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                  </select>
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Uraian / Keterangan</Label>
                <Input
                  type="text"
                  placeholder="Keterangan singkat tugas atau ruang lingkup posisi..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs h-9 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary btn-sm text-xs px-5 shadow-sm"
                >
                  {saveMutation.isPending ? "Menyimpan..." : "Simpan Data Jabatan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
