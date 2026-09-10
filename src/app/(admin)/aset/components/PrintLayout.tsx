import { Asset } from '@/types';
import { QRCodeCanvas } from 'qrcode.react';

interface Props {
  assets: Asset[];
  selectedIds: string[];
  baseUrl: string;
}

export default function PrintLayout({ assets, selectedIds, baseUrl }: Props) {
  if (selectedIds.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, nav, .print\\:hidden {
            display: none !important;
          }

          html, body, #root, main, .min-h-screen, .h-screen, .overflow-hidden, .overflow-auto, .flex-1 {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
          }

          #print-layout-wrapper {
            position: relative !important;
            z-index: 9999 !important;
            width: 100% !important;
            display: block !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}} />

      <div 
        id="print-layout-wrapper" 
        className="fixed top-0 left-0 w-[794px] -z-50 bg-white print:static print:z-auto print:w-full"
      >
        <div 
          id="print-layout-container" 
          className="w-full flex flex-wrap gap-5 justify-start content-start p-8 bg-white"
        >
          {assets.filter(a => a.id && selectedIds.includes(a.id)).map(asset => (
            <div 
              key={asset.id} 
              className="border-[3px] border-slate-800 p-4 w-[210px] h-[300px] flex flex-col items-center justify-between text-center rounded-2xl break-inside-avoid bg-white"
            >
              <QRCodeCanvas 
                value={`${baseUrl}/lapor-aset/${asset.id}`} 
                size={140} 
                level="H" 
                includeMargin={false}
              />
              
              <div className="mt-3 w-full border-t-[3px] border-slate-800 pt-3 flex-1 flex flex-col justify-start items-center">
                <p className="font-extrabold text-[14px] text-slate-900 leading-snug mb-1.5 line-clamp-2">
                  {asset.name}
                </p>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[12px] font-mono bg-slate-900 text-white px-2.5 py-1 rounded-md inline-block">
                    {asset.inventoryNumber}
                  </p>
                  {asset.registerNumber && (
                    <p className="text-[10px] font-bold text-slate-700">
                      REG: {asset.registerNumber}
                    </p>
                  )}
                </div>
              </div>
              
              <p className="text-[10px] mt-2 text-slate-500 uppercase tracking-widest font-black">
                Scan Untuk Lapor
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}