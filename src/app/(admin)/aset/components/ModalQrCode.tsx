import { Asset } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface Props {
  asset: Asset;
  baseUrl: string;
  onClose: () => void;
}

export default function ModalQrCode({ asset, baseUrl, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center w-full mb-6">
          <h3 className="font-bold text-slate-800">Scan untuk Lapor</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
          <QRCodeSVG value={`${baseUrl}/lapor-aset/${asset.id}`} size={200} />
        </div>
        <h3 className="text-lg font-black mt-6 text-center text-slate-800 leading-tight">{asset.name}</h3>
        <p className="font-mono text-sm text-slate-500 mt-1 bg-slate-50 px-3 py-1 rounded-lg">{asset.inventoryNumber}</p>
        <button onClick={onClose} className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Tutup</button>
      </div>
    </div>
  );
}