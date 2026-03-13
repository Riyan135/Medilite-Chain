import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (isOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, (error) => {
        // console.warn(error);
      });

      return () => {
        scanner.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      };
    }
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors z-10"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>

        <div className="p-8 text-center border-b border-slate-50">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Scan Report QR</h2>
          <p className="text-sm text-slate-500">Position the QR code within the frame to access the medical report.</p>
        </div>

        <div className="p-4 flex justify-center bg-slate-50">
          <div id="reader" className="w-full rounded-2xl overflow-hidden border-4 border-white shadow-inner"></div>
        </div>

        <div className="p-6 bg-white text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Scanning for MediLite compatible codes
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
