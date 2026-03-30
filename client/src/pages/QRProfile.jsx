import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Info, Download, Share2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const QRProfile = () => {
  const { user } = useAuth();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (user?.id) {
      generateToken();
    }
  }, [user?.id]);

  const generateToken = () => {
    // Generate a direct link to the patient's dashboard that can be scanned
    const qrUrl = `${window.location.origin}/doctor/patient/${user.id}`;
    setToken(qrUrl);
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) {
      toast.error('QR code not ready yet');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `medilite-qr-profile.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Medical QR Code',
          text: 'Scan this QR code to access my medical profile on MediLite.',
          url: token,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      toast.error('Sharing is not supported on this device/browser');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-10 text-center lg:text-left flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Medical QR</h1>
            <p className="text-slate-500 mt-1">Show this code to your doctor for temporary access to your records.</p>
          </div>
          <button 
            onClick={generateToken}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center hover:bg-indigo-100 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Token
          </button>
        </header>

        <div className="max-w-4xl mx-auto lg:mx-0 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 flex flex-col items-center">
            <div className="p-4 bg-primary/5 rounded-3xl mb-8">
              {token ? (
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={token} 
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[240px] h-[240px] bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">
                  Generating...
                </div>
              )}
            </div>
            
            <div className="flex space-x-4 w-full">
              <button onClick={downloadQR} className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                <Download className="w-5 h-5 mr-2" />
                Download
              </button>
              <button onClick={shareQR} className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 mr-3 text-indigo-300" />
                <h3 className="text-xl font-bold">Secure Access Control</h3>
              </div>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                This QR code contains a direct link to your medical profile. When scanned by an authorized MediLite doctor:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mr-3" />
                  It opens your dashboard seamlessly on their device.
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mr-3" />
                  Doctors can view history and add consultation notes.
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mr-3" />
                  Your original records cannot be modified or deleted.
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Info className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Emergency Mode</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                   парамedics can access vital info primarily blood group and allergies in case of emergency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QRProfile;
