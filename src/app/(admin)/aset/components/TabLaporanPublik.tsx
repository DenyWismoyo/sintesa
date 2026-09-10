import { Asset } from '@/types';
import { CheckCircle } from 'lucide-react';

interface Props {
  reports: any[];
  assets: Asset[];
  onOpenDetail: (asset: Asset) => void;
}

export default function TabLaporanPublik({ reports, assets, onOpenDetail }: Props) {
  const handleTindakLanjut = (assetId: string) => {
    const targetAsset = assets.find((a: Asset) => a.id === assetId);
    if (targetAsset) {
      onOpenDetail(targetAsset);
    } else {
      alert('Data aset tidak ditemukan atau sudah dihapus.');
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Semua Laporan Terselesaikan!</h3>
            <p className="text-sm text-slate-500 mt-1">Tidak ada laporan kerusakan aset baru dari masyarakat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 font-semibold bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Aset Dilaporkan</th>
                  <th className="px-6 py-4">Pelapor</th>
                  <th className="px-6 py-4">Keluhan / Catatan</th>
                  <th className="px-6 py-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-5 text-slate-600 font-medium">
                      {new Date(report.createdAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800">{report.assetName}</p>
                      <p className="font-mono text-xs text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded-md w-fit">{report.inventoryNumber}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-700">{report.reporterName}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{report.reporterContact}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 text-[11px] font-bold rounded-md mb-2">{report.reportedCondition}</span>
                      <p className="text-slate-600 text-sm line-clamp-2">"{report.notes || '-'}"</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">📍 {report.currentLocation}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button onClick={() => handleTindakLanjut(report.assetId)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-200">
                        Tindak Lanjuti
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}