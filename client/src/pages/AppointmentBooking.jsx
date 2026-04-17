import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, UserCheck, CheckCircle2, FileText, AlertCircle, RefreshCcw } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', 
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const AppointmentBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/auth/doctors');
      setDoctors(res.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error("Failed to load doctors");
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !date || !time) {
      return toast.error("Please fill in all required fields");
    }

    setStatus('booking');

    try {
      await api.post('/appointments/book', {
        doctorId: selectedDoctor,
        date,
        time,
        reason
      });

      toast.success("Appointment request sent! It is now pending doctor approval.");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error("Failed to submit appointment request");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-emerald-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-indigo-400/20 to-cyan-400/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white relative z-10 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Book Appointment</h2>
          <p className="text-blue-100 font-medium text-sm">Schedule a consultation with our top specialists.</p>
        </div>

        <form onSubmit={handleBook} className="p-8 space-y-6">
          {/* Patient Details (Read Only) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Patient Name</label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <User className="h-5 w-5 text-blue-500" />
               </div>
               <input
                 type="text"
                 value={user?.name || ''}
                 readOnly
                 className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none"
               />
            </div>
          </div>

          {/* Connect Doctor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Select Specialist</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserCheck className="h-5 w-5 text-indigo-500" />
              </div>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Choose a doctor...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>Dr. {doc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Select Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <input
                 type="date"
                 required
                 value={date}
                 min={new Date().toISOString().split('T')[0]}
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
               />
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Time Slots</label>
            </div>
            
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
               {timeSlots.map(slot => (
                 <button
                   key={slot}
                   type="button"
                   onClick={() => setTime(slot)}
                   className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border
                     ${time === slot 
                       ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 scale-105' 
                       : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                     }`}
                 >
                   {slot}
                 </button>
               ))}
             </div>
          </div>

          {/* Reason */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Reason for Visit (Optional)</label>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 pointer-events-none">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <textarea
                 rows="3"
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 placeholder="Briefly describe your symptoms or reason for visit..."
                 className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
               ></textarea>
            </div>
          </div>

          {/* Submit */}
          <button
             type="submit"
             disabled={status === 'booking'}
             className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:pointer-events-none mt-4 text-lg"
           >
             {status === 'booking' ? 'Booking...' : 'Book Appointment'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentBooking;
