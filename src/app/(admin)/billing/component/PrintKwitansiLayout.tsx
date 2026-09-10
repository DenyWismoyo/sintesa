// Lokasi file: src/app/billing/component/PrintKwitansiLayout.tsx
import React from 'react';
import { Invoice } from '@/types';
import { useSetting } from '@/hooks/useSetting';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { formatTerbilangRupiah } from '@/utils/terbilang';

export const downloadKwitansiPDF = async (invoiceNumber: string, paymentId: string, onComplete?: () => void) => {
  const element = document.getElementById('print-kwitansi-wrapper');
  if (!element) {
    if (onComplete) onComplete();
    return;
  }

  try {
    // Tampilkan elemen ke layar (tapi di z-index jauh agar tak terlihat user)
    element.style.left = '0px';
    element.style.zIndex = '-9999';
    element.style.opacity = '1';

    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(element, {
      scale: 2, // Resolusi 2x lipat agar teks tajam
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: 900 // Lebar container
    });

    element.style.left = '-9999px';

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // FORMAT KERTAS: Envelope C5 (229 x 162 mm) - Landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [229, 162] 
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const yPos = pdf.internal.pageSize.getHeight() > pdfHeight ? (pdf.internal.pageSize.getHeight() - pdfHeight) / 2 : 0;

    pdf.addImage(imgData, 'JPEG', 0, yPos, pdfWidth, pdfHeight);
    
    // FORMAT NAMA FILE YANG RAPI
    const safeInvoiceName = invoiceNumber.replace(/\//g, '_');
    const fileName = `Kwitansi_${safeInvoiceName}_${paymentId.substring(0, 6).toUpperCase()}.pdf`;
    
    // LANGSUNG DOWNLOAD FILE DENGAN NAMA YANG BENAR
    pdf.save(fileName);
    
  } catch (error) {
    console.error("Gagal mengekspor PDF Kwitansi:", error);
    alert("Terjadi kesalahan saat membuat Kwitansi PDF. Silakan coba lagi.");
  } finally {
    if (onComplete) onComplete();
  }
};

interface Props {
  invoice: Invoice | null;
  payment: any | null; 
  penyetorName?: string;
  penerimaName?: string;
}

export default function PrintKwitansiLayout({ invoice, payment, penyetorName, penerimaName }: Props) {
  const { profile } = useSetting();

  if (!invoice || !payment) return null;

  const instansiName = profile?.name || 'SOLO TECHNOPARK';
  const instansiDesc = profile?.description || 'Badan Layanan Umum Daerah (BLUD)';
  const instansiAddress = profile?.address || 'Jl. Ki Hajar Dewantara No.19, Jebres, Surakarta';

  const invoiceDesc = invoice.items && invoice.items.length > 0 ? invoice.items.map(i => i.description).join(', ') : 'Pembayaran Tagihan';

  return (
    <div 
      id="print-kwitansi-wrapper" 
      // Ukuran proporsional dengan C5 Landscape (229x162 = rasio ~1.41) => 900x636 px
      className="fixed top-0 left-[-9999px] w-[900px] h-[636px] bg-white text-slate-800 font-sans leading-snug p-12 border border-slate-100"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0 overflow-hidden">
         <img src="/image/LogoInvoice.png" alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        
        {/* HEADER KWITANSI - MINIMALIS */}
        <div className="flex justify-between items-end border-b border-slate-300 pb-6 mb-8">
          <div className="flex items-center gap-5">
            <img src="/image/LogoInvoice.png" alt="Logo" className="w-14 h-14 object-contain shrink-0" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-widest uppercase m-0">{instansiName}</h1>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider m-0 mt-0.5">{instansiDesc}</p>
              <p className="text-[10px] text-slate-400 font-medium m-0 mt-1">{instansiAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-light text-slate-400 tracking-[0.2em] uppercase m-0 mb-2">KWITANSI</h2>
            <div className="flex flex-col items-end gap-1 text-xs text-slate-600">
              <span className="font-semibold tracking-wider">NO. {invoice.invoiceNumber}/KW/{payment.id.substring(0, 4).toUpperCase()}</span>
              <span className="text-[10px] text-slate-400">TANGGAL: {payment.date}</span>
            </div>
          </div>
        </div>

        {/* BODY KWITANSI - CLEAN TYPOGRAPHY */}
        <div className="flex-1 space-y-6 pt-2">
          <div className="flex items-end">
            <div className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest pb-1">Telah Terima Dari</div>
            <div className="flex-1 border-b border-slate-300 pb-1 px-2">
              <span className="font-black text-lg text-slate-900 uppercase tracking-wide">{penyetorName || invoice.customerName}</span>
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest pb-1">Uang Sejumlah</div>
            <div className="flex-1 border-b border-slate-300 pb-1 px-2">
              <span className="font-bold text-base italic text-slate-700 capitalize leading-relaxed">
                 === {formatTerbilangRupiah(payment.amount)} ===
              </span>
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-widest pb-1">Untuk Pembayaran</div>
            <div className="flex-1 border-b border-slate-300 pb-1 px-2">
              <span className="font-medium text-sm text-slate-800 leading-relaxed">
                 {invoiceDesc} 
                 {invoice.term === 'INSTALLMENT' || invoice.term === 'DOWN_PAYMENT' ? ` (Sesuai dengan Invoice No. ${invoice.invoiceNumber})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER KWITANSI */}
        <div className="mt-12 flex justify-between items-end">
          
          {/* NOMINAL BOX - MINIMALIST */}
          <div className="bg-slate-50 border border-slate-200 px-8 py-4 rounded-2xl shrink-0">
            <span className="text-2xl font-black text-slate-900 tracking-wider">Rp {payment.amount.toLocaleString('id-ID')}</span>
          </div>

          <div className="flex gap-16">
            <div className="text-center w-48 flex flex-col items-center">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-16">Yang Menyerahkan</p>
              <p className="font-bold text-sm text-slate-800 border-b border-slate-400 pb-1 w-full uppercase truncate tracking-wide" title={penyetorName || invoice.customerName}>
                 {penyetorName || invoice.customerName}
              </p>
            </div>

            <div className="text-center w-48 flex flex-col items-center">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-16">Penerima / Kasir</p>
              <p className="font-bold text-sm text-slate-800 border-b border-slate-400 pb-1 w-full uppercase truncate tracking-wide" title={penerimaName || profile?.name || 'KASIR / BENDAHARA'}>
                 {penerimaName || profile?.name || 'KASIR / BENDAHARA'}
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}