import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Send, Calculator } from 'lucide-react';
import { Booking } from '@/types';

interface InvoiceItemLocal {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ModalCreateInvoiceBookingProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  basePrice: number; // Harga dasar ruangan yang sudah dikalkulasi
  onSubmitToBilling: (invoiceData: any) => void;
  isProcessing?: boolean;
}

export default function ModalCreateInvoiceBooking({
  isOpen,
  onClose,
  booking,
  basePrice,
  onSubmitToBilling,
  isProcessing = false
}: ModalCreateInvoiceBookingProps) {
  const [additionalItems, setAdditionalItems] = useState<InvoiceItemLocal[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  // Reset state tiap kali modal dibuka untuk booking yang berbeda
  useEffect(() => {
    if (isOpen) {
      setAdditionalItems([]);
      setDiscount(0);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const handleAddItem = () => {
    const newItem: InvoiceItemLocal = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setAdditionalItems([...additionalItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setAdditionalItems(additionalItems.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItemLocal, value: any) => {
    setAdditionalItems(
      additionalItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const additionalSubtotal = additionalItems.reduce((sum, item) => sum + item.total, 0);
  const subTotal = basePrice + additionalSubtotal;
  const grandTotal = Math.max(0, subTotal - discount);

  const handleSubmit = () => {
    // Validasi sederhana
    const hasEmptyItem = additionalItems.some(i => i.description.trim() === '' || i.total === 0);
    if (hasEmptyItem) {
      alert("Pastikan semua item tambahan memiliki nama dan harga yang valid.");
      return;
    }

    // Menggabungkan item utama (Ruangan) dengan item tambahan
    const itemsPayload = [
      {
        referenceId: booking.assetId,
        referenceType: 'BOOKING', // Penting agar Auto-Lunas berfungsi
        description: `Sewa Ruang/Fasilitas: ${booking.assetName} (${booking.startDate})`,
        quantity: 1,
        unitPrice: basePrice,
        total: basePrice
      },
      ...additionalItems.map(item => ({
        referenceId: '',
        referenceType: 'LAINNYA', // Tipe khusus untuk biaya ekstra
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: item.total
      }))
    ];

    const payload = {
      items: itemsPayload,
      subTotal: subTotal,
      discount: discount,
      grandTotal: grandTotal,
    };

    onSubmitToBilling(payload);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Buat Tagihan Rinci (Manual)</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Tambahkan biaya penunjang sewa untuk <span className="font-bold text-blue-600">{booking.userName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50 custom-scrollbar">
          
          {/* Info Utama */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Item Utama (Ruangan)</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-800 text-base">{booking.assetName}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Sesuai kalkulasi durasi sewa sistem</p>
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-right">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Tarif Dasar</span>
                <span className="font-black text-slate-800">Rp {basePrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Komponen Tambahan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Komponen Biaya Tambahan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cth: Kebersihan, Sound System, Kursi, dll.</p>
              </div>
              <button onClick={handleAddItem} type="button" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            {additionalItems.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-sm font-medium">
                Tidak ada biaya tambahan.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="hidden sm:flex gap-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex-1">Deskripsi Layanan / Alat</div>
                  <div className="w-20 text-center">Qty</div>
                  <div className="w-40 text-right">Harga Satuan</div>
                  <div className="w-40 text-right">Total</div>
                  <div className="w-10"></div>
                </div>
                
                {additionalItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 sm:p-3 bg-white border border-slate-200 sm:border-transparent sm:bg-slate-50 sm:hover:bg-slate-100 rounded-xl transition-colors">
                    <div className="w-full sm:flex-1">
                      <label className="text-xs font-semibold text-slate-500 block mb-1 sm:hidden">Nama Item</label>
                      <input type="text" placeholder="Contoh: Sewa Sound System" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full text-sm h-10 border-slate-200 rounded-lg focus:ring-blue-500" />
                    </div>
                    <div className="w-full sm:w-20">
                      <label className="text-xs font-semibold text-slate-500 block mb-1 sm:hidden">Qty</label>
                      <input type="number" min="1" value={item.quantity || ''} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full text-sm h-10 border-slate-200 rounded-lg focus:ring-blue-500 text-center" />
                    </div>
                    <div className="w-full sm:w-40">
                      <label className="text-xs font-semibold text-slate-500 block mb-1 sm:hidden">Harga Satuan (Rp)</label>
                      <input type="number" min="0" value={item.unitPrice || ''} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} className="w-full text-sm h-10 border-slate-200 rounded-lg focus:ring-blue-500 text-right" />
                    </div>
                    <div className="w-full sm:w-40 sm:text-right pt-2 sm:pt-0">
                      <span className="text-sm font-bold text-slate-700">Rp {item.total.toLocaleString('id-ID')}</span>
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="w-full sm:w-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100 sm:border-transparent flex justify-center mt-2 sm:mt-0">
                      <Trash2 size={16} /> <span className="sm:hidden ml-2 text-xs font-bold">Hapus</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kalkulasi Akhir (Diskon & Grand Total) */}
          <div className="flex flex-col sm:flex-row justify-end pt-4 gap-6">
            <div className="w-full sm:w-96 space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">Rp {subTotal.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-700">Potongan Harga / Diskon:</span>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                  <input type="number" min="0" max={subTotal} value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full pl-8 pr-3 h-10 text-sm border-amber-200 bg-amber-50 rounded-lg focus:ring-amber-500 focus:bg-white text-right text-amber-700 font-bold" />
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-slate-200 mt-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Grand Total</span>
                <span className="text-2xl font-black text-blue-700 leading-none">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={isProcessing} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={isProcessing} className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70">
            {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            {isProcessing ? 'Memproses...' : 'Terbitkan Tagihan Final'}
          </button>
        </div>

      </div>
    </div>
  );
}