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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 flex flex-col items-center max-w-sm w-full max-h-[92vh] sm:max-h-[88vh] my-auto border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center w-full mb-4 sm:mb-6">
          <h3 className="font-bold text-sm sm:text-base text-slate-800">Scan untuk Lapor</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 sm:p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>
        <div className="bg-white p-4 sm:p-5 border border-slate-200 rounded-2xl shadow-sm">
          <QRCodeSVG value={`${baseUrl}/lapor-aset/${asset.id}`} size={170} className="sm:w-[190px] sm:h-[190px]" />
        </div>
        <h3 className="text-base sm:text-lg font-black mt-4 sm:mt-6 text-center text-slate-800 leading-tight">{asset.name}</h3>
        <p className="font-mono text-xs sm:text-sm text-slate-500 mt-1 bg-slate-50 px-2.5 py-1 rounded-lg">{asset.inventoryNumber}</p>
        <button onClick={onClose} className="mt-6 sm:mt-8 w-full py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors">Tutup</button>
      </div>
    </div>
  );
}