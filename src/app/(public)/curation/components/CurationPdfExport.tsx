'use client';

import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface Props {
  trackType: string;
  formData: any;
  aiResult: any;
}

export default function CurationPdfExport({ trackType, formData, aiResult }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const averageScore = Math.round(
    ((aiResult?.scoreBreakdown?.productAndTech || 0) + 
     (aiResult?.scoreBreakdown?.marketAndFinancial || 0) + 
     (aiResult?.scoreBreakdown?.legalAndCompliance || 0)) / 3
  ) || 0;

  const handleDownload = () => {
    setIsGenerating(true);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka laporan. Pastikan Pop-up Blocker browser Anda diizinkan.');
      setIsGenerating(false);
      return;
    }

    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    let stepsHtml = '';
    if (aiResult?.recommendations?.nextActionSteps) {
      stepsHtml = `
        <h3 style="margin-top: 32px; font-size: 18px; font-weight: 900; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; text-transform: uppercase;">Action Plan & Rute</h3>
        <div style="display: flex; gap: 20px;">
          <div style="flex: 2; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">📋 Rencana Tindak Lanjut</div>
            <ul style="margin: 0; padding-left: 16px; color: #334155; font-size: 14px; line-height: 1.6;">
              ${aiResult.recommendations.nextActionSteps.map((step: string) => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
            </ul>
          </div>
          <div style="flex: 1; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Rekomendasi Program</div>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; line-height: 1.3;">
              ${aiResult.recommendations.incubationRoute || '-'}
            </div>
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Kurasi - ${formData?.namaUsaha || 'Bisnis'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { border-bottom: 4px solid #0f172a; padding-bottom: 16px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 32px; font-weight: 900; margin: 0 0 8px 0; text-transform: uppercase; }
          .subtitle { font-size: 16px; font-weight: 800; color: #0284c7; margin: 0; }
          .score-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 32px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
          .score-val { font-size: 56px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1; }
          .badge { background: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; }
          .grid { display: flex; gap: 20px; margin-bottom: 40px; }
          .card { flex: 1; background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; }
          .bar-bg { width: 100%; background: #f1f5f9; height: 8px; border-radius: 4px; margin-top: 12px; }
          .rec-item { margin-bottom: 24px; display: flex; gap: 16px; align-items: flex-start; }
          .rec-icon { font-size: 20px; background: #f1f5f9; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .rec-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0 0 6px 0; }
          .rec-desc { font-size: 14px; color: #475569; margin: 0; line-height: 1.6; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${formData?.namaUsaha || 'Nama Usaha'}</h1>
            <p class="subtitle">■ ${trackType} Readiness Report</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">Dicetak pada:<br><strong style="color: #0f172a; font-size: 14px;">${dateStr}</strong></div>
        </div>
        <div class="score-box">
          <div><div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Final AI Readiness Score</div><div class="score-val">${averageScore} <span style="font-size: 24px; color: #94a3b8;">/ 100</span></div></div>
          <div style="text-align: right;"><div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Status Kesiapan</div><div class="badge">${aiResult?.readinessLevel || 'TBA'}</div></div>
        </div>
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; text-transform: uppercase;">Dimensi Evaluasi</h3>
        <div class="grid">
          <div class="card"><div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Skalabilitas & Tech</div><div style="font-size: 28px; font-weight: 900; color: #2563eb;">${aiResult?.scoreBreakdown?.productAndTech || 0}</div><div class="bar-bg"><div style="height: 100%; border-radius: 4px; background: #2563eb; width: ${aiResult?.scoreBreakdown?.productAndTech || 0}%"></div></div></div>
          <div class="card"><div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Unit Economics</div><div style="font-size: 28px; font-weight: 900; color: #4f46e5;">${aiResult?.scoreBreakdown?.marketAndFinancial || 0}</div><div class="bar-bg"><div style="height: 100%; border-radius: 4px; background: #4f46e5; width: ${aiResult?.scoreBreakdown?.marketAndFinancial || 0}%"></div></div></div>
          <div class="card"><div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">Legal (ESG)</div><div style="font-size: 28px; font-weight: 900; color: #d97706;">${aiResult?.scoreBreakdown?.legalAndCompliance || 0}</div><div class="bar-bg"><div style="height: 100%; border-radius: 4px; background: #d97706; width: ${aiResult?.scoreBreakdown?.legalAndCompliance || 0}%"></div></div></div>
        </div>
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; text-transform: uppercase;">Rekomendasi Strategis AI</h3>
        <div>
          <div class="rec-item"><div class="rec-icon">🎯</div><div><div class="rec-title">Potensi Pasar</div><div class="rec-desc">${aiResult?.recommendations?.targetMarket || '-'}</div></div></div>
          <div class="rec-item"><div class="rec-icon">📈</div><div><div class="rec-title">Strategi Harga</div><div class="rec-desc">${aiResult?.recommendations?.pricingAndMonetization || '-'}</div></div></div>
          <div class="rec-item"><div class="rec-icon">🌍</div><div><div class="rec-title">Distribusi & Pertumbuhan</div><div class="rec-desc">${aiResult?.recommendations?.distributionAndGrowth || '-'}</div></div></div>
          <div class="rec-item"><div class="rec-icon">⚙️</div><div><div class="rec-title">Pengembangan Produk</div><div class="rec-desc">${aiResult?.recommendations?.productImprovement || '-'}</div></div></div>
        </div>
        ${stepsHtml}
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); setIsGenerating(false); }, 500);
  };

  return (
    <button onClick={handleDownload} disabled={isGenerating} className="w-full py-5 bg-white border-2 border-sky-500 text-sky-600 font-bold rounded-2xl hover:bg-sky-50 transition-all shadow-sm flex items-center justify-center gap-2 text-lg disabled:opacity-50">
      {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
      {isGenerating ? 'Menyiapkan Dokumen...' : 'Simpan PDF Laporan'}
    </button>
  );
}