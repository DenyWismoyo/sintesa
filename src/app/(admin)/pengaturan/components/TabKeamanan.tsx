// Lokasi file: src/app/pengaturan/components/TabKeamanan.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Search, AlertTriangle, Loader2, Filter, Users, X, Info } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { APP_ROLES, ROLE_LABELS, canPerformAction, PERMISSIONS } from '@/config/roles';
import { useAuth } from '@/lib/AuthContext';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: number;
}

// DEFINISI KELOMPOK ROLE UNTUK UI
const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  {
    label: "Sistem & Manajemen Utama",
    roles: [APP_ROLES.SUPER_ADMIN, APP_ROLES.ADMIN]
  },
  {
    label: "Modul Keuangan & Billing",
    roles: [APP_ROLES.ADMIN_KEUANGAN, APP_ROLES.KASIR, APP_ROLES.KASIR_PENGELUARAN]
  },
  {
    label: "Modul Aset & Fasilitas",
    roles: [APP_ROLES.ADMIN_ASET, APP_ROLES.OPERATOR_ASET]
  },
  {
    label: "Modul Ekosistem Tenant",
    roles: [APP_ROLES.ADMIN_TENANT, APP_ROLES.OPERATOR_TENANT]
  },
  {
    label: "Modul Pelatihan & LMS",
    roles: [APP_ROLES.ADMIN_PELATIHAN, APP_ROLES.OPERATOR_PELATIHAN]
  }
];

// FUNGSI UNTUK MENDAPATKAN WARNA BADGE BERDASARKAN KELOMPOK
const getRoleBadgeStyle = (role: string) => {
  if (role === APP_ROLES.PUBLIC || role === APP_ROLES.ALUMNI || role === APP_ROLES.TENANT) 
    return 'bg-slate-50 text-slate-600 border-slate-200';
  
  if (ROLE_GROUPS[0].roles.includes(role)) return 'bg-purple-50 text-purple-700 border-purple-200'; // Utama
  if (ROLE_GROUPS[1].roles.includes(role)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'; // Keuangan
  if (ROLE_GROUPS[2].roles.includes(role)) return 'bg-amber-50 text-amber-700 border-amber-200'; // Aset
  if (ROLE_GROUPS[3].roles.includes(role)) return 'bg-rose-50 text-rose-700 border-rose-200'; // Tenant
  if (ROLE_GROUPS[4].roles.includes(role)) return 'bg-blue-50 text-blue-700 border-blue-200'; // Pelatihan

  return 'bg-slate-50 text-slate-700 border-slate-200'; // Fallback
};

export default function TabKeamanan() {
  const { user: currentUser, role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<'STAFF' | 'PUBLIC' | 'EXTERNAL' | 'ALL'>('STAFF');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // STATE UNTUK MODAL KONFIRMASI CERDAS
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    newRole: string;
    userName: string;
    currentRole: string;
  } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      
      const fetchedUsers: UserData[] = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserData);
      });
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      toast.error("Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // FUNGSI UNTUK MENGAKTIFKAN MODAL KONFIRMASI (MENGGANTIKAN WINDOW.CONFIRM)
  const handleRoleChangeIntent = (userId: string, newRole: string, userName: string, currentRole: string) => {
    if (userId === currentUser?.uid) {
      toast.error("Anda tidak dapat mengubah role Anda sendiri saat sedang login.");
      return;
    }
    setConfirmDialog({ isOpen: true, userId, newRole, userName, currentRole });
  };

  // FUNGSI UNTUK MENGEKSEKUSI PERUBAHAN ROLE SETELAH DIKONFIRMASI
  const executeRoleChange = async () => {
    if (!confirmDialog) return;
    
    const { userId, newRole, userName } = confirmDialog;
    
    setConfirmDialog(null); // Tutup modal segera
    setUpdatingId(userId); // Tampilkan indikator loading di tabel
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Hak akses ${userName} berhasil diperbarui menjadi ${ROLE_LABELS[newRole]}.`);
    } catch (error) {
      console.error("Gagal update role:", error);
      toast.error("Gagal mengubah hak akses.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatNameFallback = (user: UserData) => {
    if (user.displayName) return user.displayName;
    if ((user as any).name) return (user as any).name; 
    if (user.email) {
      const username = user.email.split('@')[0];
      return username
        .split(/[\.\-_]/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Tanpa Nama';
  };

  const filteredUsers = users.filter(u => {
    const displayName = formatNameFallback(u);
    const matchSearch = displayName.toLowerCase().includes(search.toLowerCase()) || 
                        u.email?.toLowerCase().includes(search.toLowerCase());
                        
    let matchView = true;
    const userRole = u.role || APP_ROLES.PUBLIC; 
    
    if (viewFilter === 'STAFF') {
      matchView = userRole !== APP_ROLES.PUBLIC && userRole !== APP_ROLES.TENANT && userRole !== APP_ROLES.ALUMNI;
    } else if (viewFilter === 'PUBLIC') {
      matchView = userRole === APP_ROLES.PUBLIC;
    } else if (viewFilter === 'EXTERNAL') {
      matchView = userRole === APP_ROLES.TENANT || userRole === APP_ROLES.ALUMNI;
    }

    return matchSearch && matchView;
  });

  if (!canPerformAction(currentUserRole, PERMISSIONS.MANAGE_ROLES_USERS)) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Akses Ditolak</h3>
        <p className="text-slate-500 mt-2 max-w-md">
          Anda tidak memiliki wewenang <b>MANAGE_ROLES_USERS</b> untuk menambah atau mengubah konfigurasi hak akses pengguna di sistem ini.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 relative">
      <div className="bg-amber-50/80 text-amber-800 px-5 py-4 rounded-2xl text-sm flex items-start gap-3 border border-amber-200/50">
        <Shield className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Manajemen Hak Akses Sistem (RBAC)</p>
          <p className="leading-relaxed opacity-90">
            Atur wewenang setiap akun staf di sini. Sistem menggunakan pengelompokan modul untuk mempermudah penugasan. Berhati-hatilah dalam memberikan akses <b>Super Admin</b>. Untuk mengangkat staf baru, silakan cari di filter <b>"Pengguna Umum"</b> dan ubah rolenya.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari nama atau email pengguna..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={viewFilter} 
            onChange={(e) => setViewFilter(e.target.value as any)} 
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer border-none focus:ring-0"
          >
            <option value="STAFF">🏢 Hanya Staf Internal</option>
            <option value="PUBLIC">🌍 Pengguna Umum</option>
            <option value="EXTERNAL">🤝 Eksternal Khusus (Tenant/Alumni)</option>
            <option value="ALL">👥 Semua Pengguna</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Informasi Pengguna</th>
                <th className="px-6 py-4">Divisi / Hak Akses Saat Ini</th>
                <th className="px-6 py-4 text-right">Aksi Manajemen Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500">Memuat data staf...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Users className="w-6 h-6 text-slate-300"/>
                    </div>
                    Tidak ada {viewFilter === 'STAFF' ? 'Staf Internal' : viewFilter === 'PUBLIC' ? 'Pengguna Umum' : viewFilter === 'EXTERNAL' ? 'Eksternal Khusus' : 'Pengguna'} yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const displayName = formatNameFallback(u);
                  const initials = displayName.substring(0, 2).toUpperCase();
                  const currentRole = u.role || APP_ROLES.PUBLIC;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${currentRole === APP_ROLES.PUBLIC ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{displayName}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getRoleBadgeStyle(currentRole)}`}>
                          {ROLE_LABELS[currentRole] || currentRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {updatingId === u.id ? (
                          <div className="flex items-center justify-end gap-2 text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                          </div>
                        ) : (
                          <select
                            value={currentRole}
                            onChange={(e) => handleRoleChangeIntent(u.id, e.target.value, displayName, currentRole)}
                            disabled={u.id === currentUser?.uid}
                            className={`px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-50 cursor-pointer ${currentRole === APP_ROLES.PUBLIC ? 'text-slate-500' : 'text-slate-800'}`}
                          >
                            <option value={APP_ROLES.PUBLIC}>Cabut Akses (Jadikan Umum)</option>
                            
                            {ROLE_GROUPS.map((group, idx) => (
                              <optgroup key={idx} label={`── ${group.label} ──`}>
                                {group.roles.map(roleKey => (
                                  <option key={roleKey} value={roleKey}>
                                    {ROLE_LABELS[roleKey]}
                                  </option>
                                ))}
                              </optgroup>
                            ))}

                            <optgroup label="── Eksternal Khusus ──">
                              <option value={APP_ROLES.TENANT}>{ROLE_LABELS[APP_ROLES.TENANT]}</option>
                              <option value={APP_ROLES.ALUMNI}>{ROLE_LABELS[APP_ROLES.ALUMNI]}</option>
                            </optgroup>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERLAY MODAL KONFIRMASI CERDAS */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
            
            {/* Header Modal Dinamis (Cerdas) */}
            <div className={`px-6 py-5 flex items-center justify-between border-b ${
              confirmDialog.newRole === APP_ROLES.SUPER_ADMIN ? 'bg-red-50 border-red-100' : 
              confirmDialog.newRole === APP_ROLES.PUBLIC ? 'bg-amber-50 border-amber-100' : 
              'bg-blue-50 border-blue-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmDialog.newRole === APP_ROLES.SUPER_ADMIN ? 'bg-red-100 text-red-600' : 
                  confirmDialog.newRole === APP_ROLES.PUBLIC ? 'bg-amber-100 text-amber-600' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  {confirmDialog.newRole === APP_ROLES.SUPER_ADMIN || confirmDialog.newRole === APP_ROLES.PUBLIC ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className={`text-base font-black ${
                    confirmDialog.newRole === APP_ROLES.SUPER_ADMIN ? 'text-red-800' : 
                    confirmDialog.newRole === APP_ROLES.PUBLIC ? 'text-amber-800' : 
                    'text-blue-800'
                  }`}>
                    {confirmDialog.newRole === APP_ROLES.SUPER_ADMIN ? 'Peringatan Keamanan' : 
                     confirmDialog.newRole === APP_ROLES.PUBLIC ? 'Pencabutan Akses' : 
                     'Konfirmasi Perubahan'}
                  </h2>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Verifikasi Aksi Super Admin</p>
                </div>
              </div>
              <button onClick={() => setConfirmDialog(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-white/50 hover:bg-white"><X size={18} /></button>
            </div>

            {/* Isi Konten Pesan */}
            <div className="p-6 space-y-4 text-sm text-slate-600">
              <p>Anda akan mengubah wewenang (Role) untuk akun berikut:</p>
              
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-400 text-xs">Nama Staf</span>
                  <span className="font-black text-slate-800">{confirmDialog.userName}</span>
                </div>
                <div className="flex justify-between items-center pt-1 gap-4">
                  <span className="font-semibold text-slate-500 flex-1 line-through">{ROLE_LABELS[confirmDialog.currentRole] || 'Pengguna Umum'}</span>
                  <div className="flex-shrink-0 bg-blue-100 px-2 py-0.5 rounded text-blue-600 font-bold text-xs">Menjadi</div>
                  <span className="font-black text-slate-900 flex-1 text-right">{ROLE_LABELS[confirmDialog.newRole]}</span>
                </div>
              </div>

              {/* Peringatan Cerdas Tambahan */}
              {confirmDialog.newRole === APP_ROLES.SUPER_ADMIN && (
                <div className="flex gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">
                    <strong>Tindakan Berbahaya:</strong> Anda sedang memberikan akses kontrol tertinggi. Pengguna ini akan dapat mengakses, mengedit, dan menghapus seluruh data sistem termasuk peran Anda sendiri.
                  </p>
                </div>
              )}
              {confirmDialog.newRole === APP_ROLES.PUBLIC && (
                <div className="flex gap-2 text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">
                    <strong>Pencabutan Wewenang:</strong> Pengguna ini akan dikembalikan menjadi Pengguna Umum (Publik) dan kehilangan akses ke seluruh modul admin internal aplikasi.
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setConfirmDialog(null)} 
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeRoleChange} 
                className={`flex-1 px-4 py-2.5 font-bold rounded-xl text-white transition-all shadow-sm ${
                  confirmDialog.newRole === APP_ROLES.SUPER_ADMIN ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 
                  confirmDialog.newRole === APP_ROLES.PUBLIC ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 
                  'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                Ya, Ubah Hak Akses
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}