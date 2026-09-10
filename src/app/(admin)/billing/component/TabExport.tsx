'use client';

import React, { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Database, Landmark, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Invoice, Expense, Journal, Account } from '@/types';

interface Props {
  invoices: Invoice[];
  expenses: Expense[];
  journals: Journal[];
  accounts: Account[];
}

export default function TabExport({ invoices, expenses, journals, accounts }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Tipe laporan sesuai standar BLUD
  const [exportType, setExportType] = useState<'REKAP_UMUM' | 'BUKU_BANK' | 'BUKU_PENERIMAAN' | 'BUKU_PENGELUARAN'>('REKAP_UMUM');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL'); // Untuk Buku Bank

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);

  // Ambil daftar akun Kas & Bank untuk filter Buku Bank
  const cashAccounts = useMemo(() => accounts.filter(a => a.type === 'KAS_BANK' && a.accountBehavior !== 'HEADER'), [accounts]);

  // --- FILTER DATA BERDASARKAN BULAN & KALKULASI REKAP UMUM ---
  const { filteredInvoices, filteredExpenses, filteredJournals, summary } = useMemo(() => {
    const invs = invoices.filter(inv => inv.date && inv.date.startsWith(selectedMonth));
    const exps = expenses.filter(exp => exp.date && exp.date.startsWith(selectedMonth));
    const jrnls = journals.filter(jrn => jrn.date && jrn.date.startsWith(selectedMonth));

    const totalPendapatan = invs.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const totalPengeluaran = exps
      .filter(e => ['APPROVED', 'PAID'].includes(e.status))
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    return {
      filteredInvoices: invs,
      filteredExpenses: exps,
      filteredJournals: jrnls,
      summary: { totalPendapatan, totalPengeluaran, invCount: invs.length, expCount: exps.length, jrnCount: jrnls.length }
    };
  }, [invoices, expenses, journals, selectedMonth]);

  // --- LOGIKA PEMBENTUKAN BUKU PEMBANTU (SUBSIDIARY LEDGER) ---
  const generateReportData = () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    const monthPrefix = selectedMonth; 

    // Helper: Cari detail akun dengan Type-Safety sesuai Account schema
    const getAccountDetail = (accId: string): { code: string, name: string, type: string } => {
      const found = accounts.find(a => a.id === accId);
      return found 
        ? { code: found.code, name: found.name, type: found.type } 
        : { code: '-', name: 'Tidak Diketahui', type: 'LAINNYA' };
    };

    let rows: any[] = [];
    let saldoAwal = 0;
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    // 1. LOGIKA BUKU BANK / KAS UMUM
    if (exportType === 'BUKU_BANK') {
      journals.forEach(jrn => {
        if (!jrn.date) return;
        const jrnDate = new Date(jrn.date);
        if (jrnDate < startDate) {
          jrn.entries.forEach(entry => {
            if (selectedAccountId === 'ALL' || entry.accountId === selectedAccountId) {
              const accDetail = getAccountDetail(entry.accountId);
              // Asumsi Akun Kas adalah Aktiva (Saldo Normal Debit)
              if (accDetail.type === 'KAS_BANK') {
                 if (entry.type === 'DEBIT') saldoAwal += entry.amount;
                 if (entry.type === 'KREDIT') saldoAwal -= entry.amount;
              }
            }
          });
        }
      });

      let runningBalance = saldoAwal;
      const currentJournals = journals.filter(jrn => jrn.date?.startsWith(monthPrefix)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      currentJournals.forEach((jrn, index) => {
        jrn.entries.forEach(entry => {
           if (selectedAccountId === 'ALL' || entry.accountId === selectedAccountId) {
              const accDetail = getAccountDetail(entry.accountId);
              if (accDetail.type === 'KAS_BANK') {
                const penerimaan = entry.type === 'DEBIT' ? entry.amount : 0;
                const pengeluaran = entry.type === 'KREDIT' ? entry.amount : 0;
                
                runningBalance = runningBalance + penerimaan - pengeluaran;
                totalPenerimaan += penerimaan;
                totalPengeluaran += pengeluaran;

                const rekeningStr = accDetail.code !== '-' ? `${accDetail.code} - ${accDetail.name}` : accDetail.name;

                rows.push({
                  no: index + 1,
                  tanggal: jrn.date,
                  rekeningKode: rekeningStr,
                  nomorBukti: jrn.referenceId || `JRN-${jrn.id?.substring(0,6)}`,
                  uraian: jrn.description,
                  penerimaan: penerimaan,
                  pengeluaran: pengeluaran,
                  saldo: runningBalance
                });
              }
           }
        });
      });
    }

    // 2. LOGIKA BUKU PEMBANTU PENERIMAAN (Hanya Pendapatan)
    else if (exportType === 'BUKU_PENERIMAAN') {
      const currentJournals = journals.filter(jrn => jrn.date?.startsWith(monthPrefix)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      currentJournals.forEach((jrn, index) => {
        jrn.entries.forEach(entry => {
          const accDetail = getAccountDetail(entry.accountId);
          // Pendapatan saldo normalnya Kredit
          if (accDetail.type === 'PENDAPATAN' && entry.type === 'KREDIT') {
            totalPenerimaan += entry.amount;
            const rekeningStr = accDetail.code !== '-' ? `${accDetail.code} - ${accDetail.name}` : accDetail.name;
            
            rows.push({
              no: rows.length + 1,
              tanggal: jrn.date,
              rekeningKode: rekeningStr,
              nomorBukti: jrn.referenceId || `BKM-${jrn.id?.substring(0,6)}`,
              uraian: jrn.description,
              penerimaan: entry.amount,
              pengeluaran: 0,
              saldo: totalPenerimaan
            });
          }
        });
      });
    }

    // 3. LOGIKA BUKU PEMBANTU PENGELUARAN (Hanya Belanja/Beban)
    else if (exportType === 'BUKU_PENGELUARAN') {
      const currentJournals = journals.filter(jrn => jrn.date?.startsWith(monthPrefix)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      currentJournals.forEach((jrn, index) => {
        jrn.entries.forEach(entry => {
          const accDetail = getAccountDetail(entry.accountId);
          // Beban saldo normalnya Debit
          if (accDetail.type === 'BEBAN' && entry.type === 'DEBIT') {
            totalPengeluaran += entry.amount;
            const rekeningStr = accDetail.code !== '-' ? `${accDetail.code} - ${accDetail.name}` : accDetail.name;

            rows.push({
              no: rows.length + 1,
              tanggal: jrn.date,
              rekeningKode: rekeningStr,
              nomorBukti: jrn.referenceId || `BKK-${jrn.id?.substring(0,6)}`,
              uraian: jrn.description,
              penerimaan: 0,
              pengeluaran: entry.amount,
              saldo: totalPengeluaran
            });
          }
        });
      });
    }

    return { rows, saldoAwal, totalPenerimaan, totalPengeluaran, endDate: endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) };
  };


  // --- EKSPOR EXCEL NATIVE (Tanpa Library Eksternal - HTML to XLS Format) ---
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const { rows, saldoAwal, totalPenerimaan, totalPengeluaran, endDate } = generateReportData();
      
      let title = "REKAPITULASI UMUM";
      if (exportType === 'BUKU_BANK') title = "BUKU KAS / BANK UMUM";
      if (exportType === 'BUKU_PENERIMAAN') title = "BUKU PEMBANTU KAS TUNAI BENDAHARA PENERIMAAN";
      if (exportType === 'BUKU_PENGELUARAN') title = "BUKU PEMBANTU KAS TUNAI BENDAHARA PENGELUARAN";

      // Membuat representasi Excel menggunakan HTML Table (Sangat kompatibel & mendukung format header/kolom)
      let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
            th, td { border: 1px solid #000000; padding: 4px 8px; }
            th { background-color: #d1d5db; font-weight: bold; text-align: center; }
            .num { mso-number-format: "\\#\\,\\#\\#0\\.00"; text-align: right; }
            .text-center { text-align: center; }
            .text-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="8" style="text-align: center; font-size: 16px; font-weight: bold; border: none;">${title}</td></tr>
            <tr><td colspan="8" style="text-align: center; font-size: 14px; font-weight: bold; border: none;">Per ${endDate}</td></tr>
            <tr><td colspan="8" style="border: none;"></td></tr>
            <thead>
              <tr>
                <th width="40">No</th>
                <th width="100">Tanggal</th>
                <th width="250">Rekening (Kode)</th>
                <th width="180">Nomor Bukti</th>
                <th width="350">Uraian</th>
                <th width="120">Penerimaan</th>
                <th width="120">Pengeluaran</th>
                <th width="120">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="4"></td>
                <td class="text-bold" style="text-align: right;">Saldo Awal</td>
                <td></td>
                <td></td>
                <td class="num text-bold">${exportType === 'BUKU_BANK' ? saldoAwal : 0}</td>
              </tr>
      `;

      rows.forEach(r => {
        tableHtml += `
              <tr>
                <td class="text-center">${r.no}</td>
                <td class="text-center">${r.tanggal}</td>
                <td>${r.rekeningKode}</td>
                <td>${r.nomorBukti}</td>
                <td>${r.uraian}</td>
                <td class="num">${r.penerimaan > 0 ? r.penerimaan : ''}</td>
                <td class="num">${r.pengeluaran > 0 ? r.pengeluaran : ''}</td>
                <td class="num">${r.saldo}</td>
              </tr>
        `;
      });

      const saldoAkhir = exportType === 'BUKU_BANK' ? (saldoAwal + totalPenerimaan - totalPengeluaran) : rows[rows.length-1]?.saldo || 0;

      tableHtml += `
              <tr>
                <td colspan="4"></td>
                <td class="text-bold" style="text-align: right;">JUMLAH TOTAL</td>
                <td class="num text-bold">${totalPenerimaan}</td>
                <td class="num text-bold">${totalPengeluaran}</td>
                <td class="num text-bold">${saldoAkhir}</td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_${exportType}_${selectedMonth}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      alert("Gagal mengekspor Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // --- EKSPOR PDF (HTML Print Mode) ---
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const { rows, saldoAwal, totalPenerimaan, totalPengeluaran, endDate } = generateReportData();
      
      let title = "REKAPITULASI UMUM";
      if (exportType === 'BUKU_BANK') title = "BUKU BANK";
      if (exportType === 'BUKU_PENERIMAAN') title = "BUKU PEMBANTU KAS TUNAI<br/>BENDAHARA PENERIMAAN";
      if (exportType === 'BUKU_PENGELUARAN') title = "BUKU PEMBANTU KAS TUNAI<br/>BENDAHARA PENGELUARAN";

      let htmlContent = `
        <html>
        <head>
          <title>${title.replace('<br/>', ' ')} - ${selectedMonth}</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: 'Arial', sans-serif; color: #000; font-size: 11px; }
            .header-title { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .header-date { text-align: center; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { font-weight: bold; text-align: center; }
            .th-gray { background-color: #d1d5db; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header-title">${title}</div>
          <div class="header-date">Per ${endDate}</div>
          
          <table>
            <thead>
              <tr>
                <th width="3%">No</th>
                <th width="10%">Tanggal</th>
                <th width="20%">Rekening</th>
                <th width="15%">Nomor</th>
                <th width="20%">Uraian</th>
                <th width="10%">Penerimaan</th>
                <th width="10%">Pengeluaran</th>
                <th width="12%">Saldo Akhir</th>
              </tr>
              <tr class="th-gray">
                <td colspan="7" class="text-right font-bold">Saldo Awal</td>
                <td class="text-right font-bold">${formatRupiah(exportType === 'BUKU_BANK' ? saldoAwal : 0)}</td>
              </tr>
            </thead>
            <tbody>
      `;

      rows.forEach(r => {
        htmlContent += `
          <tr>
            <td class="text-center">${r.no}</td>
            <td class="text-center">${r.tanggal}</td>
            <td>${r.rekeningKode}</td>
            <td>${r.nomorBukti}</td>
            <td>${r.uraian}</td>
            <td class="text-right">${r.penerimaan > 0 ? formatRupiah(r.penerimaan) : '-'}</td>
            <td class="text-right">${r.pengeluaran > 0 ? formatRupiah(r.pengeluaran) : '-'}</td>
            <td class="text-right">${formatRupiah(r.saldo)}</td>
          </tr>
        `;
      });

      const saldoAkhir = exportType === 'BUKU_BANK' ? (saldoAwal + totalPenerimaan - totalPengeluaran) : rows[rows.length-1]?.saldo || 0;

      htmlContent += `
            </tbody>
            <tfoot>
               <tr>
                <td colspan="5" class="text-right font-bold">JUMLAH</td>
                <td class="text-right font-bold">${formatRupiah(totalPenerimaan)}</td>
                <td class="text-right font-bold">${formatRupiah(totalPengeluaran)}</td>
                <td class="text-right font-bold">${formatRupiah(saldoAkhir)}</td>
               </tr>
            </tfoot>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert("Pop-up diblokir. Harap izinkan pop-up browser.");
      }

    } catch (error) {
      alert("Gagal memproses dokumen PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in p-6 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pusat Laporan & Ekspor</h2>
          <p className="text-sm text-slate-500 mt-1">Cetak Buku Kas Umum dan Buku Pembantu berstandar Akuntansi Pemerintahan (BLUD).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: KONFIGURASI EXPORT */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> Parameter Laporan
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Pilih Bulan Transaksi</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Jenis Buku Pembantu</label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${exportType === 'BUKU_BANK' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                    <input type="radio" checked={exportType === 'BUKU_BANK'} onChange={() => setExportType('BUKU_BANK')} className="w-4 h-4 text-indigo-600" />
                    <Landmark className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold">Buku Bank / Kas Umum</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${exportType === 'BUKU_PENERIMAAN' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                    <input type="radio" checked={exportType === 'BUKU_PENERIMAAN'} onChange={() => setExportType('BUKU_PENERIMAAN')} className="w-4 h-4 text-emerald-600" />
                    <ArrowDownToLine className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold">Buku Pembantu Penerimaan</span>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${exportType === 'BUKU_PENGELUARAN' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                    <input type="radio" checked={exportType === 'BUKU_PENGELUARAN'} onChange={() => setExportType('BUKU_PENGELUARAN')} className="w-4 h-4 text-red-600" />
                    <ArrowUpFromLine className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold">Buku Pembantu Pengeluaran</span>
                  </label>
                </div>
              </div>

              {/* Munculkan Pilihan Bank Hanya Jika Buku Bank Dipilih */}
              {exportType === 'BUKU_BANK' && (
                <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-3">
                   <label className="text-xs font-bold text-indigo-800 mb-2 block">Pilih Rekening Kas/Bank</label>
                   <select 
                     value={selectedAccountId} 
                     onChange={(e) => setSelectedAccountId(e.target.value)}
                     className="w-full px-3 py-2 text-sm font-semibold bg-white border border-indigo-200 rounded-lg outline-none cursor-pointer"
                   >
                     <option value="ALL">Semua Rekening Kas</option>
                     {cashAccounts.map(acc => (
                       <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                     ))}
                   </select>
                </div>
              )}

            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleExportExcel} 
              disabled={isExportingExcel || isExportingPDF || exportType === 'REKAP_UMUM'}
              className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-all shadow-sm disabled:opacity-50"
            >
              {isExportingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
              {isExportingExcel ? 'Menyusun Excel...' : 'Unduh Format Excel (.xls)'}
            </button>
            
            <button 
              onClick={handleExportPDF} 
              disabled={isExportingExcel || isExportingPDF || exportType === 'REKAP_UMUM'}
              className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              {isExportingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isExportingPDF ? 'Mencetak Dokumen...' : 'Cetak & Simpan PDF'}
            </button>
          </div>
          
        </div>

        {/* KOLOM KANAN: PREVIEW INFO */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center">
             
             {exportType === 'REKAP_UMUM' ? (
               <div className="opacity-50">
                 <Database className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                 <p className="text-lg font-bold text-slate-700">Pilih Jenis Laporan</p>
                 <p className="text-sm text-slate-500">Silakan pilih Buku Bank atau Buku Pembantu di panel sebelah kiri.</p>
               </div>
             ) : (
               <div className="w-full animate-in zoom-in-95">
                 <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <FileText className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-1">
                   {exportType.replace('_', ' ')}
                 </h3>
                 <p className="text-slate-500 text-sm font-medium mb-8">
                   Periode: {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                 </p>

                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Standarisasi Format Laporan</p>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 text-emerald-600 rounded mt-0.5"><Database className="w-3 h-3"/></div>
                      <p className="text-sm text-slate-700">Laporan ini dihasilkan dari pembacaan <strong>Data Jurnal / Buku Besar</strong> secara real-time, bukan dari rekapitulasi mentah invoice.</p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-100 text-blue-600 rounded mt-0.5"><Filter className="w-3 h-3"/></div>
                      <p className="text-sm text-slate-700"><strong>Buku Pembantu Penerimaan</strong> secara otomatis hanya menampilkan mutasi dari akun ber-tipe "Pendapatan". Sebaliknya, <strong>Buku Pembantu Pengeluaran</strong> memfilter akun "Beban/Belanja".</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-indigo-100 text-indigo-600 rounded mt-0.5"><Landmark className="w-3 h-3"/></div>
                      <p className="text-sm text-slate-700"><strong>Saldo Berjalan (Running Balance)</strong> pada Buku Bank memperhitungkan saldo dari bulan-bulan sebelumnya yang diakumulasikan ke bulan yang Anda pilih saat ini.</p>
                    </div>
                 </div>
               </div>
             )}

          </div>
        </div>

      </div>
    </div>
  );
}