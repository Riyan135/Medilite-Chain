import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, ArrowLeft, Shield, Search, User, Info } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

const DoctorScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const startScanner = () => {
    setIsScanning(true);
    // Use a small delay to ensure the div is in the DOM
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "doctor-full-scanner",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0 
        },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);

      function onScanSuccess(decodedText) {
        scanner.clear();
        handleScanResult(decodedText);
      }

      function onScanFailure(error) {
        // quiet fail
      }
    }, 100);
  };

  const handleScanResult = (decodedText) => {
    // Expected format: http://localhost:5173/scan/USER_ID
    if (decodedText.includes('/scan/')) {
      const id = decodedText.split('/scan/')[1].split('?')[0];
      if (id) {
        toast.success('Patient ID Identified');
        navigate(`/patient/${id}?view=consultation`);
      } else {
        toast.error('Invalid QR Code Format');
        setIsScanning(false);
      }
    } else if (decodedText.length > 20) {
      // Fallback for raw IDs if they are scanned
      toast.success('Patient ID Detected');
      navigate(`/patient/${decodedText}?view=consultation`);
    } else {
      toast.error('Not a valid MediLite QR Code');
      setIsScanning(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Patient Scanner</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Scan a patient's medical QR to instantly retrieve clinical history.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </button>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Scanner Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col items-center">
              {!isScanning ? (
                <div className="flex flex-col items-center text-center py-12">
                  <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-[2rem] flex items-center justify-center mb-6 ring-4 ring-blue-50/50 dark:ring-blue-500/5">
                    <QrCode className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Ready to Scan</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-[280px]">
                    Position the patient's medical QR code within the camera frame to proceed.
                  </p>
                  <button 
                    onClick={startScanner}
                    className="w-full bg-blue-600 text-white py-4 px-8 rounded-2xl font-black shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                  >
                    <QrCode className="w-5 h-5" />
                    Activate Camera
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <div id="doctor-full-scanner" className="overflow-hidden rounded-3xl border-4 border-slate-50 dark:border-slate-800 shadow-inner" />
                  <button 
                    onClick={() => {
                        setIsScanning(false);
                        window.location.reload(); // Hard reset for the library instance
                    }}
                    className="mt-6 w-full py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Cancel Scanning
                  </button>
                </div>
              )}
            </div>

            {/* Right: Instructions & Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-3 mb-4">
                   <Shield className="w-6 h-6 text-indigo-200" />
                   <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Secure Protocol</span>
                </div>
                <h3 className="text-2xl font-black mb-4">Clinical Identification</h3>
                <p className="text-indigo-100 font-medium leading-relaxed opacity-90">
                  This scanner is protected by doctor-only access. Decrypting the QR code will instantly link you to:
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'AI-Summarized Health History',
                    'Medication & Allergy Records',
                    'Previous Consultation Notes',
                    'Lab Reports & Attachments'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold">
                      <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 dark:bg-slate-800/50 rounded-[2.5rem] p-8 text-white shadow-xl border border-white/5">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <Info className="w-6 h-6 text-blue-400" />
                   </div>
                   <div>
                     <h4 className="font-bold">Manual Search</h4>
                     <p className="text-xs text-slate-400 font-medium">Alternative access method</p>
                   </div>
                 </div>
                 <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed">
                   If the QR code is damaged or the camera is unavailable, use the patient search in the Clinical Center.
                 </p>
                 <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/5"
                 >
                   <Search className="w-4 h-4" />
                   Go to Search
                 </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorScanner;
