import { useState } from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  selectedCount: number;
  onCancel: () => void;
}

export default function FloatingPrintBar({ selectedCount, onCancel }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (selectedCount === 0) return null;

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('print-layout-container');
      if (!element) throw new Error("Layout print tidak ditemukan");

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Label-QR-Aset-STP-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error(error);
      alert('Gagal mengekstrak PDF. Pastikan browser Anda mendukung kanvas.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-8 z-40 animate-in slide-in-from-bottom-10 border border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm">{selectedCount}</div>
        <span className="font-bold text-sm tracking-wide">Aset Terpilih</span>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-sm font-semibold transition-colors text-slate-300">
          Batal
        </button>

        <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold flex items-center gap-2 text-sm transition-colors border border-slate-600">
          <Printer size={16}/> Cetak (Print)
        </button>

        <button 
          onClick={handleGeneratePdf} 
          disabled={isGenerating}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold flex items-center gap-2 text-sm transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70"
        >
          {isGenerating ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={16}/>}
          {isGenerating ? 'Mengekstrak PDF...' : 'Unduh File PDF'}
        </button>
      </div>
    </div>
  );
}