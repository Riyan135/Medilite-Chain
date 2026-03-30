import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { AlertTriangle, Clock, MapPin, Phone, Car, CheckCircle, Navigation } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';

const EmergencySOS = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(null); // null, 'BOOKING', 'SUCCESS'
  const [bookedHospitalId, setBookedHospitalId] = useState(null);

  useEffect(() => {
    activateEmergency();
  }, []);

  const activateEmergency = async () => {
    try {
      // 1. Notify server that emergency is activated
      await api.post('/emergency/activate');
      toast.error('EMERGENCY MODE ACTIVATED', {
        icon: '🚨',
        duration: 5000,
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
      });

      // 2. Fetch nearby hospitals
      fetchHospitals();
    } catch (error) {
      console.error('Error activating emergency:', error);
      toast.error('Failed to connect to emergency services!');
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/emergency/hospitals');
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAmbulance = async (hospital) => {
    if (!window.confirm(`Dispatch an ambulance from ${hospital.name}?`)) return;
    
    setBookingStatus('BOOKING');
    setBookedHospitalId(hospital.id);
    
    try {
      await api.post('/emergency/book', { hospitalId: hospital.id, hospitalName: hospital.name });
      setBookingStatus('SUCCESS');
      toast.success('Ambulance Dispatched! You will receive an SMS confirmation.', { duration: 6000 });
    } catch (error) {
      console.error('Error booking ambulance:', error);
      toast.error('Failed to dispatch ambulance! Please call emergency services directly.');
      setBookingStatus(null);
      setBookedHospitalId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        <header className="mb-8 p-6 bg-red-600 rounded-3xl shadow-xl shadow-red-200 text-white flex flex-col md:flex-row items-center justify-between border-4 border-red-200">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="p-4 bg-white/20 rounded-full mr-5 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">EMERGENCY SOS</h1>
              <p className="text-red-100 font-semibold mt-1 flex items-center">
                <Navigation className="w-4 h-4 mr-2" />
                Location tracking active
              </p>
            </div>
          </div>
          <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm">
            <p className="text-sm font-bold text-red-100 uppercase tracking-widest text-center">Status</p>
            <p className="text-xl font-black text-center animate-pulse">Scanning Proximal Units...</p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-slate-500" />
            Active Ambulances Nearby
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
               <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Locating closest fleets...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {hospitals.map(hospital => (
                <div 
                  key={hospital.id} 
                  className={`bg-white rounded-3xl border-2 transition-all p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6
                    ${bookedHospitalId === hospital.id 
                      ? 'border-emerald-500 shadow-xl shadow-emerald-100 bg-emerald-50/30' 
                      : bookingStatus === 'SUCCESS' ? 'border-slate-100 opacity-50 grayscale' : 'border-slate-200 hover:border-red-200 hover:shadow-lg'}`}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-start justify-between mb-2">
                       <h3 className="text-2xl font-bold text-slate-900">{hospital.name}</h3>
                       {hospital.distance && (
                         <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold font-mono">
                           {hospital.distance} km
                         </span>
                       )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center text-sm font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
                        ETA: <span className="ml-1 text-primary font-black">{hospital.eta} mins</span>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                        <Car className="w-4 h-4 mr-2" />
                        {hospital.availableAmbulances} units available
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
                    {bookedHospitalId === hospital.id && bookingStatus === 'SUCCESS' ? (
                      <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle className="w-6 h-6 mr-3" />
                        DISPATCHED
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBookAmbulance(hospital)}
                        disabled={bookingStatus !== null || hospital.availableAmbulances === 0}
                        className="w-full md:w-auto flex items-center justify-center px-10 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-red-200 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')]"
                      >
                        {bookedHospitalId === hospital.id && bookingStatus === 'BOOKING' ? (
                          <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Phone className="w-5 h-5 mr-3 animate-bounce" />
                            DISPATCH NOW
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmergencySOS;
