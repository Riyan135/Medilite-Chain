import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Droplet, Phone, User, ShieldAlert, Heart, Calendar } from 'lucide-react';
import api from '../api/api';

const PublicEmergencyProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const response = await api.get(`/patients/public-profile/${id}`);
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Could not load profile. Please call emergency services.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-black mb-2">Emergency Access Failed</h1>
          <p className="text-slate-400 font-medium mb-6">{error}</p>
          <a href="tel:911" className="inline-block px-8 py-4 bg-red-600 text-white font-black rounded-2xl animate-pulse">
            CALL EMERGENCY SERVICES
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-red-600/30 selection:text-red-100">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10 max-w-2xl mx-auto p-6 pt-12 pb-24">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="p-3 bg-red-600/20 rounded-2xl border border-red-500/30 mb-6 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.4em] text-red-500 mb-2">Emergency Medical Profile</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Authorized for first responders only</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl shadow-black/50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-20">
             <Heart className="w-24 h-24 text-red-500 rotate-12" />
          </div>

          <div className="flex items-center gap-6 mb-10">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-800 border-2 border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-600" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{profile.name}</h2>
              <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Patient Identity Verified</p>
              <div className="flex gap-2 mt-3">
                 <span className="bg-red-600/20 text-red-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-red-500/20">SOS ACTIVE</span>
                 <span className="bg-white/5 text-white/60 text-[10px] font-black px-2.5 py-1 rounded-full border border-white/10">ID: #{id.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Vitals Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                 <Droplet className="w-6 h-6 text-red-500 mb-2" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blood Group</p>
                 <p className="text-2xl font-black">{profile.bloodGroup || 'UNKNOWN'}</p>
              </div>
              <div className="bg-white/5 p-5 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                 <Activity className="w-6 h-6 text-emerald-500 mb-2" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                 <p className="text-xl font-black text-emerald-400">EMERGENCY</p>
              </div>
            </div>

            {/* Allergies Section */}
            <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-[2rem]">
               <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Critical Allergies</h3>
               </div>
               <p className="text-lg font-bold text-red-100 leading-relaxed">
                 {profile.allergies || 'No known allergies reported.'}
               </p>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
               <div className="flex items-center gap-3 mb-3">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Emergency Contact</h3>
               </div>
               <p className="text-xl font-black text-white">{profile.emergencyContact || 'Not Updated'}</p>
               <p className="text-xs text-slate-500 font-bold mt-2 italic uppercase tracking-wider">Contact this person immediately</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 space-y-4">
          <a href={`tel:${profile.phone}`} className="flex items-center justify-center gap-4 w-full py-5 bg-white text-slate-950 rounded-3xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/5">
             <Phone className="w-6 h-6" />
             CALL PATIENT
          </a>
          <button onClick={() => window.print()} className="flex items-center justify-center gap-4 w-full py-4 bg-slate-900 text-white rounded-3xl font-black text-sm border border-white/10 transition-all hover:bg-slate-800">
             Print Emergency Record
          </button>
        </div>

        <div className="mt-12 text-center">
           <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase tracking-widest max-w-xs mx-auto">
             This information is provided by MediLite Emergency Services and is for medical use only.
           </p>
        </div>
      </main>
    </div>
  );
};

export default PublicEmergencyProfile;
