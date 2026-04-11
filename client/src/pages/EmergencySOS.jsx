import React, { useEffect, useState } from 'react';
import { AlertTriangle, Car, CheckCircle, Clock, ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import api from '../api/api';

const EmergencySOS = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookedHospitalId, setBookedHospitalId] = useState(null);

  useEffect(() => {
    activateEmergency();
  }, []);

  const activateEmergency = async () => {
    try {
      await api.post('/emergency/activate');
      toast.error('EMERGENCY MODE ACTIVATED', {
        icon: '🚨',
        duration: 5000,
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' },
      });

      fetchHospitals();
    } catch (error) {
      console.error('Error activating emergency:', error);
      toast.error('Failed to connect to emergency services');
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const position = await new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (coords) => resolve(coords),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      const params = position
        ? `?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
        : '';
      const response = await api.get(`/emergency/hospitals${params}`);
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Unable to fetch emergency hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAmbulance = async (hospital) => {
    if (!window.confirm(`Dispatch an ambulance from ${hospital.name}?`)) return;

    setBookingStatus('BOOKING');
    setBookedHospitalId(hospital.id);

    try {
      await api.post('/emergency/book', {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
      });
      setBookingStatus('SUCCESS');
      toast.success('Ambulance dispatched. A confirmation email has been sent to your saved email address.', { duration: 6000 });
    } catch (error) {
      console.error('Error booking ambulance:', error);
      toast.error(error.response?.data?.error || 'Failed to dispatch ambulance. Please call emergency services directly.');
      setBookingStatus(null);
      setBookedHospitalId(null);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-rose-300/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(127,29,29,0.92),rgba(30,41,59,0.96))]" />
      </div>
      <Sidebar role="patient" />
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col items-center justify-between rounded-[2rem] border border-white/15 bg-white/10 p-6 text-white shadow-2xl shadow-red-950/30 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-red-900/30 md:flex-row">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="mr-5 rounded-full bg-white/15 p-4 shadow-lg shadow-red-950/20 ring-1 ring-white/10 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">EMERGENCY SOS</h1>
              <p className="mt-1 flex items-center font-semibold text-red-100/90">
                <Navigation className="w-4 h-4 mr-2" />
                Location tracking active
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-500 hover:scale-[1.02]">
            <p className="text-center text-sm font-bold uppercase tracking-widest text-red-100">Status</p>
            <p className="text-center text-xl font-black animate-pulse">Scanning emergency network...</p>
          </div>
        </header>

        <div className="mx-auto max-w-5xl">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-white shadow-xl shadow-red-950/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/15">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-100/80">Response</p>
              <p className="mt-3 text-3xl font-black">{loading ? '--' : hospitals.length}</p>
              <p className="mt-2 text-sm text-slate-200">Nearby hospitals loaded for emergency access.</p>
            </div>
            <div className="rounded-3xl border border-red-200/20 bg-gradient-to-br from-red-500/30 to-orange-400/20 p-5 text-white shadow-xl shadow-red-950/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-100/80">Dispatch</p>
              <p className="mt-3 text-3xl font-black">{bookingStatus === 'SUCCESS' ? 'Live' : 'Ready'}</p>
              <p className="mt-2 text-sm text-red-50/90">One-tap ambulance booking with instant confirmation email.</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-white shadow-xl shadow-red-950/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:bg-white/15">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-100/80">Care Team</p>
              <p className="mt-3 text-3xl font-black">24/7</p>
              <p className="mt-2 text-sm text-slate-200">Track urgent options and dispatch faster from one page.</p>
            </div>
          </div>

          <h2 className="mb-6 flex items-center text-xl font-bold text-white md:text-2xl">
            <MapPin className="w-5 h-5 mr-2 text-red-200" />
            Nearby Hospitals And Ambulance Availability
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 py-20 backdrop-blur-xl">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-red-100">Locating closest hospitals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className={`group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-500 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6
                    ${
                      bookedHospitalId === hospital.id
                        ? 'border-emerald-400 bg-emerald-400/15 shadow-2xl shadow-emerald-950/20'
                        : bookingStatus === 'SUCCESS'
                          ? 'border-white/10 bg-white/5 opacity-50 grayscale'
                          : 'border-white/15 bg-white/10 shadow-xl shadow-red-950/10 hover:-translate-y-1 hover:border-red-200/40 hover:bg-white/15 hover:shadow-2xl hover:shadow-red-950/20'
                    }`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-red-200/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex-1 w-full">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <h3 className="text-2xl font-bold text-white">{hospital.name}</h3>
                      {hospital.distance && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold font-mono text-red-50 ring-1 ring-white/10">
                          {hospital.distance} {hospital.distance === 'Live' ? '' : 'km'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
                        ETA: <span className="ml-1 text-primary font-black">{hospital.eta} mins</span>
                      </div>
                      <div className="flex items-center rounded-xl border border-amber-200/20 bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-100">
                        <Car className="w-4 h-4 mr-2" />
                        {hospital.ambulanceStatus === 'UNKNOWN'
                          ? 'Ambulance status requires live provider feed'
                          : `${hospital.availableAmbulances} units available`}
                      </div>
                      {hospital.address && (
                        <div className="flex items-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-white/10">
                          <MapPin className="w-4 h-4 mr-2 text-red-200" />
                          {hospital.address}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
                    {hospital.mapsUrl && (
                      <a
                        href={hospital.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 md:w-auto"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Map
                      </a>
                    )}

                    {bookedHospitalId === hospital.id && bookingStatus === 'SUCCESS' ? (
                      <div className="flex items-center justify-center rounded-2xl bg-emerald-500 px-8 py-4 font-black text-white shadow-lg shadow-emerald-950/30 animate-pulse">
                        <CheckCircle className="w-6 h-6 mr-3" />
                        DISPATCHED
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBookAmbulance(hospital)}
                        disabled={bookingStatus !== null || hospital.ambulanceStatus === 'UNAVAILABLE'}
                        className="w-full md:w-auto flex items-center justify-center px-10 py-4 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white rounded-2xl font-black transition-all duration-300 shadow-xl shadow-red-950/30 hover:-translate-y-0.5 hover:from-red-400 hover:to-rose-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
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
