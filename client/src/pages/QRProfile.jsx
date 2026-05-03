import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Info, Download, Share2, RefreshCw, User, Mail, Phone, Droplet, IdCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';

const QRProfile = () => {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (user?.id) {
      generateToken();
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/patients/profile/${user.id}`);
      setProfile(response.data.patientProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const generateToken = () => {
    // Generate a direct link to the patient's dashboard that can be scanned
    const qrUrl = `${window.location.origin}/doctor/patient/${user.id}`;
    setToken(qrUrl);
  };

  const downloadMedicalCard = async () => {
    const card = document.getElementById('medical-id-card-content');
    if (!card) {
      toast.error('Card not ready yet');
      return;
    }

    try {
      // Create a clean options object without hacking the styles
      const options = { 
        cacheBust: true,
        pixelRatio: 3,
        skipFonts: true,
        backgroundColor: '#ffffff'
      };

      // Double-render trick for SVG warmup
      await toPng(card, options);
      const dataUrl = await toPng(card, options);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `MediLite_ID_${user?.name?.replace(/\s+/g, '_') || 'Card'}.png`;
      link.click();
      toast.success('Medical Card downloaded successfully!');
    } catch (error) {
      console.error('Error generating card image:', error);
      toast.error('Failed to download card');
    }
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
    <div className="flex h-screen bg-transparent">
      <Sidebar role="patient" />
      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4 }} className="flex-1 overflow-y-auto p-8">
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
              <button onClick={downloadMedicalCard} className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors">
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
      </motion.main>

      {/* Floating Medical ID Card */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          onClick={() => setShowCard(!showCard)}
          className={`w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center ${showCard ? 'bg-indigo-800' : ''}`}
          title="Show Medical ID Card"
        >
          <IdCard className="w-8 h-8" />
        </motion.button>
        
        <AnimatePresence>
          {showCard && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="absolute bottom-24 right-0 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden origin-bottom-right flex flex-col"
            >
          {/* This is the exact element captured by html-to-image */}
          <div id="medical-id-card-content" className="w-[480px] bg-white relative flex shrink-0">
            {/* Left Side: Profile & Details */}
            <div className="w-[60%] p-8 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                  <User className="w-7 h-7 text-indigo-600" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xl font-bold text-slate-900 truncate">{user?.name}</h3>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    MediLite Patient
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Email Address</p>
                  <div className="flex items-center text-slate-700 text-[13px] font-medium">
                    <Mail className="w-3.5 h-3.5 mr-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Phone Number</p>
                  <div className="flex items-center text-slate-700 text-[13px] font-medium">
                    <Phone className="w-3.5 h-3.5 mr-2.5 text-slate-400 shrink-0" />
                    {user?.phone || 'Not provided'}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Blood Group</p>
                  <div className="flex items-center text-slate-700 text-[13px] font-medium">
                    <Droplet className="w-3.5 h-3.5 mr-2.5 text-rose-400 shrink-0" />
                    <span className="text-slate-900 font-bold">{profile?.bloodGroup || 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: QR Code */}
            <div className="w-[40%] bg-slate-50/80 border-l border-slate-100 p-8 flex flex-col items-center justify-center relative">
              <div className="bg-white p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 transition-transform duration-500 hover:scale-105">
                {token ? (
                  <QRCodeSVG value={token} size={110} level="H" />
                ) : (
                  <div className="w-[110px] h-[110px] bg-slate-100 animate-pulse rounded-xl" />
                )}
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-6 text-center">Scan to connect</p>
            </div>
          </div>
          
          {/* Action Buttons (External to the card so they are not captured) */}
          <div className="w-full bg-slate-50 border-t border-slate-100 p-3.5 flex justify-end gap-3 px-6">
            <button onClick={downloadMedicalCard} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-wider">
              <Download className="w-3.5 h-3.5 mr-2" />
              Save Card
            </button>
            <button onClick={shareQR} className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5 mr-2" />
              Share
            </button>
          </div>
        </motion.div>
        )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default QRProfile;
