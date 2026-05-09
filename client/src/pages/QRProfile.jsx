import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Download, Share2, User, Mail, Phone, Droplet, IdCard, BadgeCheck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';

const QRProfile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [scanUrl, setScanUrl] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      setScanUrl(`${window.location.origin}/doctor/patient/${user.id}`);
      setProfilePhoto(user.profileImageUrl || localStorage.getItem(`medilite_profile_photo_${user.id}`) || '');
    }
  }, [user?.id, user?.profileImageUrl]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/patients/profile/${user.id}`);
      setProfile(response.data.patientProfile);
      if (response.data.profileImageUrl) {
        setProfilePhoto(response.data.profileImageUrl);
        localStorage.setItem(`medilite_profile_photo_${user.id}`, response.data.profileImageUrl);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfilePhoto(previewUrl);

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await api.post(`/patients/profile-picture/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const imageUrl = response.data.profileImageUrl;
      setProfilePhoto(imageUrl);
      localStorage.setItem(`medilite_profile_photo_${user.id}`, imageUrl);
      login({ ...user, profileImageUrl: imageUrl });
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setProfilePhoto(user.profileImageUrl || localStorage.getItem(`medilite_profile_photo_${user.id}`) || '');
      toast.error(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
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

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My MediLite Profile',
          text: `${user?.name || 'Patient'}'s MediLite profile details are ready to share.`,
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
            <h1 className="text-3xl font-extrabold text-slate-900">My Profile</h1>
            <p className="text-slate-500 mt-1">View your patient details and keep your medical ID card ready.</p>
          </div>
        </header>

        <div className="mx-auto flex max-w-2xl justify-center">
          <div className="w-full bg-white p-10 sm:p-12 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col items-center">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blue-50 to-indigo-100 shadow-xl shadow-blue-100">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={`${user?.name || 'Patient'} profile`} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-14 w-14 text-blue-600" />
                )}
                <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-md ring-1 ring-blue-100">
                  <BadgeCheck className="h-4 w-4" />
                </div>
              </div>
              <label
                onClick={(event) => event.stopPropagation()}
                className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition-all hover:bg-blue-100"
              >
                <Camera className="h-4 w-4" />
                {profilePhoto ? 'Change Photo' : 'Add Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <h2 className="text-2xl font-black text-slate-900">{user?.name || 'Patient'}</h2>
              <p className="mt-1 text-sm font-bold text-blue-600">MediLite Patient Profile</p>
              <p className="mt-2 max-w-sm text-xs font-medium leading-5 text-slate-400">
                Keep your details updated for faster medical access.
              </p>
            </div>

            <div className="mb-8 grid w-full gap-3">
              <ProfileInfo icon={User} label="Full Name" value={user?.name || 'Not provided'} />
              <ProfileInfo icon={Mail} label="Email Address" value={user?.email || 'Not provided'} />
              <ProfileInfo icon={Phone} label="Phone Number" value={user?.phone || 'Not provided'} />
              <ProfileInfo icon={Droplet} label="Blood Group" value={profile?.bloodGroup || 'Not set'} tone="rose" />
              <ProfileInfo icon={IdCard} label="Patient ID" value={user?.id ? `#${user.id.slice(-8).toUpperCase()}` : 'Not available'} />
            </div>

            <button
              type="button"
              onClick={() => setShowCard(true)}
              className="mb-8 w-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-5 text-left text-white shadow-xl shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-100">Medical ID Card</p>
                  <h3 className="mt-2 text-xl font-black">{user?.name || 'Patient'}</h3>
                  <p className="mt-1 text-xs font-bold text-blue-100">
                    {profile?.bloodGroup || 'Blood group not set'} • {user?.phone || 'Phone not provided'}
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/18 backdrop-blur">
                  <IdCard className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/12 px-4 py-3 text-xs font-bold">
                <span>Click to view details</span>
                <span>View card</span>
              </div>
            </button>
          </div>
        </div>
      </motion.main>

      {/* Floating Medical ID Card */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <AnimatePresence>
          {showCard && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="absolute bottom-0 right-0 bg-white rounded-3xl shadow-[0_24px_70px_-16px_rgba(15,23,42,0.35)] border border-slate-100 overflow-hidden origin-bottom-right flex flex-col"
            >
          {/* This is the exact element captured by html-to-image */}
          <div id="medical-id-card-content" className="w-[620px] bg-white relative flex shrink-0">
            {/* Left Side: Profile & Details */}
            <div className="w-[60%] p-8 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={`${user?.name || 'Patient'} profile`} className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-9 h-9 text-indigo-600" />
                  )}
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

            {/* Right Side: Scan Code */}
            <div className="w-[40%] bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-l border-slate-100 p-8 flex flex-col items-center justify-center relative">
              <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
                {scanUrl ? (
                  <QRCodeSVG value={scanUrl} size={122} level="H" includeMargin />
                ) : (
                  <div className="h-[122px] w-[122px] animate-pulse rounded-2xl bg-slate-100" />
                )}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-indigo-600 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em]">Verified</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-4 text-center">Scan medical ID</p>
              <p className="mt-2 text-center text-[11px] font-semibold leading-4 text-slate-500">
                Doctor can scan this card
              </p>
            </div>
          </div>
          
          {/* Action Buttons (External to the card so they are not captured) */}
          <div className="w-full bg-slate-50 border-t border-slate-100 p-3.5 flex justify-end gap-3 px-6">
            <button onClick={() => setShowCard(false)} className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-wider">
              Close
            </button>
            <button onClick={downloadMedicalCard} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-wider">
              <Download className="w-3.5 h-3.5 mr-2" />
              Save Card
            </button>
            <button onClick={shareProfile} className="flex items-center px-4 py-2 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-wider">
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

const ProfileInfo = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const toneClass = tone === 'rose' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-left">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default QRProfile;
