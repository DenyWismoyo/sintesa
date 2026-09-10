// Lokasi file: src/app/billing/component/PrintInvoiceLayout.tsx
import React from 'react';
import { Building, MapPin, Phone, Mail, Globe, Receipt, QrCode, AlertCircle, Clock } from 'lucide-react';
import { Invoice, Account } from '@/types';
import { useSetting } from '@/hooks/useSetting';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export const downloadInvoicePDF = async (invoiceNumber: string, onComplete?: () => void) => {
  const element = document.getElementById('print-invoice-wrapper');
  if (!element) {
    if (onComplete) onComplete();
    return;
  }

  try {
    element.style.left = '0px';
    element.style.zIndex = '-9999';
    element.style.opacity = '1';

    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: 800 
    });

    element.style.left = '-9999px';

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    const safeInvoiceName = invoiceNumber.replace(/\//g, '_');
    const fileName = `Invoice_${safeInvoiceName}.pdf`;
    
    pdf.save(fileName);
    
  } catch (error) {
    console.error("Gagal mengekspor PDF:", error);
    alert("Terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
  } finally {
    if (onComplete) onComplete();
  }
};

interface Props {
  invoice: Invoice | null;
  accounts: Account[]; 
}

export default function PrintInvoiceLayout({ invoice, accounts }: Props) {
  const { profile } = useSetting();

  if (!invoice) return null;

  // --- LOGIKA MULTI-REKENING ---
  let activePaymentAccounts: any[] = [];
  if (invoice.paymentAccounts && invoice.paymentAccounts.length > 0) {
    // Menggunakan data dari invoice jika sudah dipilih multi-rekening
    activePaymentAccounts = invoice.paymentAccounts;
  } else if (invoice.paymentBankName && invoice.paymentAccountNumber) {
    // Backward Compatibility (Sistem Lama)
    activePaymentAccounts = [{ bankName: invoice.paymentBankName, accountNumber: invoice.paymentAccountNumber, accountHolder: invoice.paymentAccountHolder }];
  } else {
    // Fallback System Defaults: Mencari rekening penerimaan utama
    const receivingAccounts = accounts?.filter(a => a.type === 'KAS_BANK' && a.isReceivingAccount);
    if (receivingAccounts && receivingAccounts.length > 0) {
      activePaymentAccounts = receivingAccounts.map(a => ({ 
        bankName: a.bankName || a.name, 
        accountNumber: a.accountNumber, 
        accountHolder: a.accountHolder || '-' 
      }));
    } else {
      // Fallback terakhir: Ambil akun kas/bank mana saja yang punya nomor rekening
      const defaultAcc = accounts?.find(a => a.type === 'KAS_BANK' && a.accountNumber);
      if (defaultAcc) {
        activePaymentAccounts = [{ 
          bankName: defaultAcc.bankName || defaultAcc.name, 
          accountNumber: defaultAcc.accountNumber, 
          accountHolder: defaultAcc.accountHolder || '-' 
        }];
      }
    }
  }
  // -----------------------------

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID': 
        return { label: 'LUNAS / PAID', border: 'border-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: <Receipt className="w-3.5 h-3.5"/>, watermark: 'LUNAS' };
      case 'PARTIAL': 
        return { label: 'PEMBAYARAN SEBAGIAN', border: 'border-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', icon: <Clock className="w-3.5 h-3.5"/>, watermark: '' };
      case 'PENDING': 
        return { label: 'BELUM LUNAS', border: 'border-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', icon: <AlertCircle className="w-3.5 h-3.5"/>, watermark: '' };
      case 'OVERDUE': 
        return { label: 'JATUH TEMPO', border: 'border-red-500', text: 'text-red-700', bg: 'bg-red-50', icon: <AlertCircle className="w-3.5 h-3.5"/>, watermark: 'JATUH TEMPO' };
      case 'CANCELLED': 
        return { label: 'DIBATALKAN', border: 'border-slate-400', text: 'text-slate-600', bg: 'bg-slate-50', icon: <AlertCircle className="w-3.5 h-3.5"/>, watermark: 'BATAL' };
      default: 
        return { label: status, border: 'border-slate-300', text: 'text-slate-600', bg: 'bg-slate-50', icon: <Receipt className="w-3.5 h-3.5"/>, watermark: '' };
    }
  };

  const statusConfig = getStatusConfig(invoice.status);

  const instansiName = profile?.name || 'SOLO TECHNOPARK';
  const instansiDesc = profile?.description || 'Badan Layanan Umum Daerah (BLUD)';
  const instansiAddress = profile?.address || 'Jl. Ki Hajar Dewantara No.19, Jebres, Surakarta';
  const instansiPhone = profile?.phone || '(0271) 123456';
  const instansiEmail = profile?.email || 'blud@solotechnopark.id';
  const instansiWeb = profile?.website || 'solotechnopark.id';

  const formattedDate = new Date(invoice.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <div 
        id="print-invoice-wrapper" 
        className="fixed top-0 left-[-9999px] w-[800px] bg-white text-slate-800 text-xs font-sans leading-snug"
      >
        <div className="h-2 w-full bg-slate-900"></div>

        <div className="px-10 pt-8 pb-6 relative block">
          
          {statusConfig.watermark && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0 overflow-hidden">
              <span className={`text-[120px] font-black transform -rotate-45 tracking-widest uppercase ${invoice.status === 'PAID' ? 'text-emerald-900' : 'text-red-900'}`}>
                {statusConfig.watermark}
              </span>
            </div>
          )}

          <div className="relative z-10 block">
            
            <div className="flex flex-row justify-between items-start border-b-2 border-slate-200 pb-5 mb-5">
              <div className="flex flex-row items-start gap-4 w-2/3">
                <img src="/image/LogoInvoice.png" alt="Logo" className="w-14 h-14 object-contain shrink-0" />
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase m-0">{instansiName}</h1>
                  <p className="font-bold text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider m-0">{instansiDesc}</p>
                  <div className="mt-2 space-y-0.5 text-[9px] text-slate-500 font-medium">
                    <p className="flex items-start gap-1 max-w-sm m-0"><MapPin className="w-3 h-3 shrink-0 text-slate-400"/> <span>{instansiAddress}</span></p>
                    <div className="flex flex-wrap items-center gap-x-3 pt-0.5">
                       <p className="flex items-center gap-1 m-0"><Phone className="w-2.5 h-2.5 text-slate-400"/> {instansiPhone}</p>
                       <p className="flex items-center gap-1 m-0"><Mail className="w-2.5 h-2.5 text-slate-400"/> {instansiEmail}</p>
                       <p className="flex items-center gap-1 m-0"><Globe className="w-2.5 h-2.5 text-slate-400"/> {instansiWeb.replace(/^https?:\/\//, '')}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end w-1/3">
                <h2 className="text-2xl font-black text-slate-800 tracking-widest uppercase m-0 leading-none">INVOICE</h2>
                <div className="mt-2 text-right">
                  <p className="font-mono font-bold text-slate-800 text-sm m-0">{invoice.invoiceNumber}</p>
                </div>
                <div className={`mt-2 border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text} font-black px-2.5 py-1 rounded text-[9px] tracking-widest inline-flex items-center gap-1.5 uppercase`}>
                  {statusConfig.icon} {statusConfig.label}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-5 print-avoid-break">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 m-0">Ditagihkan Kepada:</p>
                <p className="font-black text-base text-slate-900 m-0 leading-tight">{invoice.customerName}</p>
                <p className="text-xs text-slate-500 font-semibold m-0">{invoice.customerType}</p>
                <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-600 font-medium">
                  {invoice.customerEmail && <p className="m-0">{invoice.customerEmail}</p>}
                  {invoice.customerPhone && <p className="m-0">{invoice.customerPhone}</p>}
                </div>
              </div>
              
              <div className="flex flex-col justify-end text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Tanggal Terbit</span><span className="font-bold text-slate-800">{invoice.date}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Skema / Termin</span><span className="font-bold text-slate-800 capitalize">{invoice.term.replace('_', ' ').toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="mb-6 block">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-800 print-avoid-break">
                    <th className="py-2 font-bold text-[10px] uppercase tracking-wider">Deskripsi Layanan / Produk</th>
                    <th className="py-2 font-bold text-center w-16 text-[10px] uppercase tracking-wider">Qty</th>
                    <th className="py-2 font-bold text-right w-32 text-[10px] uppercase tracking-wider">Harga Satuan</th>
                    <th className="py-2 font-bold text-right w-40 text-[10px] uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="group print-avoid-break">
                        <td className="py-2.5 text-slate-800 font-semibold leading-tight">{item.description}</td>
                        <td className="py-2.5 text-center text-slate-600 font-medium">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-600 font-medium">{formatRupiah(item.unitPrice)}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">{formatRupiah(item.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-4 text-center text-slate-400 text-[10px] italic">Tidak ada rincian item.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-start mb-6 print-avoid-break">
              
              <div className="w-[55%] pr-8">
                {/* BLOK MULTI-REKENING MINIMALIS MENDAFTAR KE BAWAH */}
                {invoice.remainingAmount > 0 && invoice.status !== 'CANCELLED' && activePaymentAccounts.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 m-0">Instruksi Pembayaran</p>
                    <div className="flex flex-col gap-2">
                      {activePaymentAccounts.map((acc, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                          <div className="text-[10px] leading-snug">
                            <span className="font-bold text-slate-800 uppercase">{acc.bankName || 'Bank'}</span>
                            <span className="mx-1.5 text-slate-300">-</span>
                            <span className="font-mono font-black text-slate-900 text-[11px] tracking-wide">{acc.accountNumber}</span>
                            <div className="text-slate-500 font-medium mt-0.5">a.n {acc.accountHolder}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {invoice.notes && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Catatan Tambahan</span>
                    <div className="text-[10px] text-slate-600 font-medium whitespace-pre-line leading-relaxed border-l-2 border-slate-200 pl-3 py-0.5">
                      {invoice.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-[45%] text-xs flex flex-col justify-start">
                <div className="space-y-1.5 px-2">
                  <div className="flex justify-between text-slate-600 font-medium"><span>Subtotal</span><span>{formatRupiah(invoice.subTotal)}</span></div>
                  {invoice.taxAmount > 0 && <div className="flex justify-between text-slate-600 font-medium"><span>PPN (11%)</span><span>{formatRupiah(invoice.taxAmount)}</span></div>}
                  {invoice.discountAmount > 0 && <div className="flex justify-between text-red-600 font-bold"><span>Diskon</span><span>- {formatRupiah(invoice.discountAmount)}</span></div>}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800 px-2">
                  <div className="flex justify-between items-center font-black text-base text-slate-900"><span>Total Tagihan</span><span>{formatRupiah(invoice.totalAmount)}</span></div>
                </div>
                {invoice.paidAmount > 0 && (
                  <div className="flex justify-between text-slate-600 text-[11px] mt-1.5 border-b border-slate-200 pb-2 px-2">
                    <span className="font-semibold">Telah Dibayar</span><span className="font-bold text-emerald-600">- {formatRupiah(invoice.paidAmount)}</span>
                  </div>
                )}
                <div className={`flex justify-between items-center mt-3 p-2.5 rounded-lg border ${invoice.remainingAmount > 0 ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className={`uppercase text-[9px] font-bold tracking-widest ${invoice.remainingAmount > 0 ? 'text-slate-500' : 'text-emerald-700'}`}>
                    {invoice.remainingAmount > 0 ? 'Sisa Pembayaran' : 'Status'}
                  </span>
                  <span className={`text-sm font-black ${invoice.remainingAmount > 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                    {invoice.remainingAmount > 0 ? formatRupiah(invoice.remainingAmount) : 'LUNAS'}
                  </span>
                </div>
              </div>
            </div>

            {invoice.issuerName && invoice.issuerName.trim() !== '' && (
              <div className="mt-8 flex justify-end print-avoid-break">
                <div className="w-[250px] text-center flex flex-col items-center">
                  <p className="text-[10px] text-slate-700 m-0 mb-1">
                    Surakarta, {formattedDate}
                  </p>
                  <p className="text-[10px] font-bold text-slate-800 m-0">
                    {invoice.issuerRole || 'Bendahara Penerimaan'}
                  </p>
                  
                  <div className="h-20 w-full relative flex items-center justify-center"></div>
                  
                  <p className="text-[11px] font-black text-slate-900 m-0 underline decoration-slate-400 underline-offset-4">
                    {invoice.issuerName}
                  </p>
                  {invoice.issuerNIP && (
                    <p className="text-[9px] font-medium text-slate-600 m-0 mt-1">
                      NIP. {invoice.issuerNIP}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="pt-4 mt-6 border-t border-slate-200 flex items-end justify-between print-avoid-break">
             <div className="flex items-center gap-3">
                <QrCode className="w-8 h-8 text-slate-300" />
                <div>
                  <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest mb-0.5 m-0">Dokumen Elektronik Sah</p>
                  <p className="text-[8px] font-medium text-slate-500 m-0 leading-tight max-w-[280px]">
                    Invoice diterbitkan otomatis oleh sistem dan sah sebagai bukti penagihan resmi tanpa tanda tangan basah.
                  </p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-bold text-slate-400 m-0 mb-0.5 uppercase tracking-widest">Dicetak pada:</p>
                <p className="text-[10px] font-mono font-bold text-slate-800 m-0">{new Date().toLocaleString('id-ID')} WIB</p>
             </div>
          </div>

        </div>
      </div>
    </>
  );
}