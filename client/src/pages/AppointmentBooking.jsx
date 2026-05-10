import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  ChevronDown,
  RefreshCcw,
  MapPin,
  MessageCircle,
  Siren,
  Video,
  UploadCloud,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';


const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', 
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const appointmentTypes = [
  {
    id: 'CLINIC_VISIT',
    label: 'Clinic Visit',
    description: 'Meet at clinic',
    icon: MapPin,
  },
  {
    id: 'VIDEO_CALL',
    label: 'Video Call',
    description: 'Remote visit',
    icon: Video,
  },
  {
    id: 'CHAT_CONSULTATION',
    label: 'Chat',
    description: 'Text consult',
    icon: MessageCircle,
  },
  {
    id: 'EMERGENCY',
    label: 'Emergency',
    description: 'Urgent review',
    icon: Siren,
  },
];

const AppointmentBooking = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentType, setAppointmentType] = useState('CLINIC_VISIT');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [medicalIntake, setMedicalIntake] = useState({
    symptoms: '',
    illnessDuration: '',
    allergies: '',
    currentMedicines: '',
    pastMedicalHistory: {
      diabetes: false,
      bloodPressure: false,
      asthma: false,
      heartDisease: false,
      kidneyDisease: false,
      liverDisease: false,
      other: '',
    },
    pregnancyStatus: 'NOT_APPLICABLE',
    reportLinks: '',
  });
  const [intakeFiles, setIntakeFiles] = useState([]);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Status mapping: 'idle' | 'booking' | 'waiting' | 'success' | 'rejected'
  const [status, setStatus] = useState('idle');
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const selectedDoctorProfile = doctors.find((doctor) => doctor.id === selectedDoctor);
  const selectedAppointmentType = appointmentTypes.find((type) => type.id === appointmentType);
  const todayDate = formatLocalDate(new Date());
  const tomorrowDate = formatLocalDate(addDays(new Date(), 1));
  const selectedDateAvailability = availabilityByDate[date];
  const bookedSlots = useMemo(
    () => new Set(selectedDateAvailability?.bookedSlots || []),
    [selectedDateAvailability?.bookedSlots]
  );

  useEffect(() => {
    fetchDoctors();
    
    const handleStatusChanged = (e) => {
      const appointmentData = e.detail;
      if (appointmentData.status === 'ACCEPTED') {
        setCurrentAppointment(appointmentData);
        setStatus('success');
      } else if (appointmentData.status === 'REJECTED') {
        setCurrentAppointment(appointmentData);
        setStatus('rejected');
      }
    };

    window.addEventListener('appointment_status_changed', handleStatusChanged);

    return () => {
      window.removeEventListener('appointment_status_changed', handleStatusChanged);
    };
  }, []);

  useEffect(() => {
    if (status !== 'waiting' || !currentAppointment?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await api.get(`/appointments/${currentAppointment.id}`);
        const latestAppointment = response.data;

        if (latestAppointment.status === 'ACCEPTED') {
          setCurrentAppointment(latestAppointment);
          setStatus('success');
          toast.success('Your appointment is booked on the selected time and date.');
        } else if (latestAppointment.status === 'REJECTED') {
          setCurrentAppointment(latestAppointment);
          setStatus('rejected');
          toast.error('Your appointment was rejected. Please select a different time slot or date.');
        }
      } catch (error) {
        console.error('Error checking appointment status:', error);
      }
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status, currentAppointment?.id]);

  useEffect(() => {
    if (!selectedDoctor) {
      setAvailabilityByDate({});
      return;
    }

    const dates = [...new Set([todayDate, tomorrowDate, date].filter(Boolean))];
    let ignore = false;

    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const response = await api.get('/appointments/availability', {
          params: {
            doctorId: selectedDoctor,
            dates: dates.join(','),
          },
        });
        if (!ignore) {
          const nextAvailability = Object.fromEntries(
            response.data.availability.map((item) => [item.date, item])
          );
          setAvailabilityByDate(nextAvailability);
        }
      } catch (error) {
        console.error('Error fetching appointment availability:', error);
        if (!ignore) {
          toast.error('Failed to load slot availability');
        }
      } finally {
        if (!ignore) {
          setLoadingAvailability(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      ignore = true;
    };
  }, [selectedDoctor, date, todayDate, tomorrowDate]);

  useEffect(() => {
    if (time && bookedSlots.has(time)) {
      setTime('');
    }
  }, [bookedSlots, time]);

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
    const autoSelectedTime = selectedDateAvailability?.availableSlots?.[0] || '';
    const bookingTime = time || autoSelectedTime;

    if (!selectedDoctor) {
      return toast.error('Please select a doctor');
    }

    if (!date) {
      return toast.error('Please select an appointment date');
    }

    if (!bookingTime) {
      setShowTimeSlots(true);
      return toast.error('Please select an available time slot');
    }

    if (!time && bookingTime) {
      setTime(bookingTime);
      toast.success(`Using first available slot: ${bookingTime}`);
    }

    setStatus('booking');

    try {
      let uploadedReportLinks = [];

      if (appointmentType === 'VIDEO_CALL' && intakeFiles.length > 0) {
        uploadedReportLinks = await Promise.all(
          intakeFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);
            formData.append('type', file.type === 'application/pdf' ? 'REPORT' : 'REPORT');
            formData.append('description', 'Uploaded during video appointment medical intake');
            if (selectedDoctor) {
              formData.append('doctorId', selectedDoctor);
            }

            const uploadResponse = await api.post('/records/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            return uploadResponse.data.fileUrl;
          })
        );
      }

      const manualReportLinks = medicalIntake.reportLinks
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await api.post('/appointments/book', {
        doctorId: selectedDoctor,
        date,
        time: bookingTime,
        appointmentType,
        reason,
        medicalIntake: appointmentType === 'VIDEO_CALL'
          ? {
              ...medicalIntake,
              reportLinks: [...manualReportLinks, ...uploadedReportLinks],
            }
          : null,
      });

      const appointment = res.data;
      setCurrentAppointment(appointment);

      setStatus('waiting');
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit appointment request");
      setStatus('idle');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setSelectedDoctor('');
    setAppointmentType('CLINIC_VISIT');
    setDate('');
    setTime('');
    setReason('');
    setMedicalIntake({
      symptoms: '',
      illnessDuration: '',
      allergies: '',
      currentMedicines: '',
      pastMedicalHistory: {
        diabetes: false,
        bloodPressure: false,
        asthma: false,
        heartDisease: false,
        kidneyDisease: false,
        liverDisease: false,
        other: '',
      },
      pregnancyStatus: 'NOT_APPLICABLE',
      reportLinks: '',
    });
    setIntakeFiles([]);
    setShowTimeSlots(false);
    setAvailabilityByDate({});
    setCurrentAppointment(null);
  };

  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-[2rem] p-10 shadow-2xl shadow-blue-900/5 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCcw className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Request Sent!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Waiting for the doctor to review and accept your appointment. Please don't close this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-[2rem] p-10 shadow-2xl shadow-emerald-900/5 border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Appointment Confirmed!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Your {appointmentTypes.find((type) => type.id === (currentAppointment?.appointmentType || appointmentType))?.label.toLowerCase()} with Dr. {currentAppointment?.doctor?.name} is scheduled for {currentAppointment?.date || date} at {currentAppointment?.time || time}.
            </p>
            <button
              onClick={resetForm}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 
rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-1"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-[2rem] p-10 shadow-2xl shadow-rose-900/5 border border-slate-100 text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Appointment Declined</h2>
          <p className="text-slate-500 text-sm mb-6">
            The doctor is currently unavailable at this time slot. Please try selecting a different time.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 
rounded-2xl shadow-lg shadow-rose-600/30 transition-all hover:-translate-y-1"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_42%,#f8fafc_100%)] flex items-center justify-center p-5 sm:p-8 lg:p-12 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(120deg,rgba(37,99,235,0.14),rgba(14,165,233,0.08),rgba(16,185,129,0.1))]" />
      <div className="absolute left-8 top-8 hidden h-28 w-28 rotate-[-8deg] rounded-[2rem] border border-white/70 bg-white/60 p-2 shadow-xl shadow-blue-900/10 backdrop-blur-md lg:block animate-[bob_7s_ease-in-out_infinite]">
        <img src="/doctor-stethoscope.jpg" alt="Stethoscope" className="h-full w-full rounded-[1.45rem] object-cover" />
      </div>
      <div className="absolute right-8 bottom-8 hidden h-32 w-44 rotate-3 rounded-[2rem] border border-white/70 bg-white/60 p-2 shadow-xl shadow-indigo-900/10 backdrop-blur-md lg:block animate-[float_8s_ease-in-out_infinite]">
        <img src="/doctor-pocket.jpg" alt="Doctor tools" className="h-full w-full rounded-[1.45rem] object-cover" />
      </div>

      <div className="grid w-full max-w-6xl lg:grid-cols-[0.9fr_1.25fr] bg-white/82 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white relative z-10 overflow-hidden">
        <aside className="relative hidden min-h-full overflow-hidden bg-slate-950 text-white lg:block">
          <img
            src="/doctor-pocket.jpg"
            alt="Doctor appointment preparation"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-blue-950/74 to-slate-900/58" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-100 backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Smart Scheduling
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black leading-tight">Book care that matches your schedule.</h2>
                <p className="mt-4 text-sm font-medium leading-7 text-blue-100">
                  Choose a specialist, appointment mode, date, and preferred slot from one focused booking flow.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  ['Doctor', selectedDoctorProfile ? `Dr. ${selectedDoctorProfile.name}` : 'Choose specialist'],
                  ['Type', selectedAppointmentType?.label || 'Clinic Visit'],
                  ['Time', time || 'Pick a slot'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-200">{label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-[length:180%_180%] p-8 text-center text-white animate-[gradient-shift_14s_ease_infinite]">
            <h2 className="text-3xl font-black tracking-tight mb-2">Book Appointment</h2>
            <p className="text-blue-100 font-medium text-sm">Schedule a consultation with our top specialists.</p>
          </div>

          <form onSubmit={handleBook} className="p-6 sm:p-8 lg:p-10 space-y-6">
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
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name}{doc.specialization ? ` - ${doc.specialization}` : ' - General Physician'}
                  </option>
                ))}
              </select>
            </div>
            {selectedDoctorProfile && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Dr. {selectedDoctorProfile.name}</p>
                  <p className="text-xs font-bold text-indigo-600">
                    {selectedDoctorProfile.specialization || 'General Physician'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Appointment Type */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Appointment Type</label>
            <div className="grid grid-cols-2 gap-3">
              {appointmentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = appointmentType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAppointmentType(type.id)}
                    className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-blue-600 group-hover:bg-white'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black">{type.label}</span>
                      <span className={`block text-xs font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {type.description}
                      </span>
                    </span>
                  </button>
                );
              })}
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
                min={todayDate}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-3 rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Time Slots</label>
              </div>
              <button
                type="button"
                onClick={() => setShowTimeSlots((current) => !current)}
                className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
                aria-expanded={showTimeSlots}
              >
                {time || 'Show slots'}
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showTimeSlots ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ['Today', todayDate],
                ['Tomorrow', tomorrowDate],
                ['Selected Date', date],
              ].map(([label, targetDate]) => {
                const availability = availabilityByDate[targetDate];
                const isActive = targetDate && targetDate === date;

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!targetDate}
                    onClick={() => targetDate && setDate(targetDate)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                    <span className="mt-1 block text-lg font-black text-slate-900">
                      {!selectedDoctor
                        ? '--'
                        : loadingAvailability && !availability
                          ? '...'
                          : availability?.availableCount ?? timeSlots.length}
                      <span className="text-xs font-bold text-slate-400"> / {timeSlots.length}</span>
                    </span>
                    <span className="mt-1 block text-xs font-bold text-emerald-600">slots available</span>
                  </button>
                );
              })}
            </div>
            
            {showTimeSlots && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-[slide-up-fade_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
                {timeSlots.map((slot, index) => {
                  const isBooked = bookedSlots.has(slot);

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!selectedDoctor || !date || isBooked}
                      onClick={() => {
                        setTime(slot);
                        setShowTimeSlots(false);
                      }}
                      className={`group relative overflow-hidden rounded-2xl border px-3 py-3.5 text-left transition-all duration-300
                        ${time === slot 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 scale-[1.03]' 
                          : isBooked
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70'
                            : 'bg-white text-slate-600 border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50'
                        } disabled:hover:translate-y-0`}
                    >
                      <span className="block text-sm font-black">{slot}</span>
                      <span className={`mt-1 block text-[11px] font-bold ${
                        time === slot ? 'text-blue-100' : isBooked ? 'text-rose-400' : 'text-emerald-500'
                      }`}>
                        {isBooked ? 'Booked' : index < 6 ? 'Morning' : 'Afternoon'}
                      </span>
                      {time === slot && (
                        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
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

          {appointmentType === 'VIDEO_CALL' && (
            <div className="space-y-5 rounded-[1.75rem] border border-blue-100 bg-blue-50/50 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-600">Medical Intake Before Call</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  These details help the doctor prepare before joining the video consultation.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Symptoms</span>
                  <textarea
                    rows="3"
                    value={medicalIntake.symptoms}
                    onChange={(event) => setMedicalIntake((current) => ({ ...current, symptoms: event.target.value }))}
                    placeholder="Fever, cough, headache, stomach pain..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Duration of Illness</span>
                  <input
                    value={medicalIntake.illnessDuration}
                    onChange={(event) => setMedicalIntake((current) => ({ ...current, illnessDuration: event.target.value }))}
                    placeholder="Example: 3 days"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Allergies</span>
                  <input
                    value={medicalIntake.allergies}
                    onChange={(event) => setMedicalIntake((current) => ({ ...current, allergies: event.target.value }))}
                    placeholder="Medicine or food allergies"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Medicines</span>
                  <textarea
                    rows="2"
                    value={medicalIntake.currentMedicines}
                    onChange={(event) => setMedicalIntake((current) => ({ ...current, currentMedicines: event.target.value }))}
                    placeholder="Medicine name, dose, and frequency"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Medical History</span>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['diabetes', 'Diabetes'],
                    ['bloodPressure', 'BP'],
                    ['asthma', 'Asthma'],
                    ['heartDisease', 'Heart disease'],
                    ['kidneyDisease', 'Kidney disease'],
                    ['liverDisease', 'Liver disease'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={medicalIntake.pastMedicalHistory[key]}
                        onChange={(event) =>
                          setMedicalIntake((current) => ({
                            ...current,
                            pastMedicalHistory: {
                              ...current.pastMedicalHistory,
                              [key]: event.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 accent-blue-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <input
                  value={medicalIntake.pastMedicalHistory.other}
                  onChange={(event) =>
                    setMedicalIntake((current) => ({
                      ...current,
                      pastMedicalHistory: { ...current.pastMedicalHistory, other: event.target.value },
                    }))
                  }
                  placeholder="Other past medical history"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <label className="space-y-2 block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pregnancy / Breastfeeding Status</span>
                <select
                  value={medicalIntake.pregnancyStatus}
                  onChange={(event) => setMedicalIntake((current) => ({ ...current, pregnancyStatus: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="NOT_APPLICABLE">Not applicable</option>
                  <option value="NO">No</option>
                  <option value="PREGNANT">Pregnant</option>
                  <option value="BREASTFEEDING">Breastfeeding</option>
                  <option value="UNSURE">Unsure</option>
                </select>
              </label>

              <label className="space-y-2 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <UploadCloud className="h-4 w-4" />
                  Previous Prescriptions and Lab Reports Upload
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={(event) => setIntakeFiles(Array.from(event.target.files || []))}
                  className="w-full rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-4 text-sm font-bold text-slate-600 outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:border-blue-300"
                />
                {intakeFiles.length > 0 && (
                  <div className="space-y-2 rounded-2xl border border-blue-100 bg-white p-3">
                    {intakeFiles.map((file) => (
                      <p key={`${file.name}-${file.size}`} className="text-xs font-bold text-slate-600">
                        {file.name}
                      </p>
                    ))}
                  </div>
                )}
                <textarea
                  rows="2"
                  value={medicalIntake.reportLinks}
                  onChange={(event) => setMedicalIntake((current) => ({ ...current, reportLinks: event.target.value }))}
                  placeholder="Optional: paste existing report links, one per line"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
            </div>
          )}

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
    </div>
  );
};

export default AppointmentBooking;
