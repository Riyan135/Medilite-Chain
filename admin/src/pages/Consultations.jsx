import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ClipboardPlus, MessageSquare, Search, Stethoscope, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import AdminTopbar from '../components/AdminTopbar';
import Sidebar from '../components/Sidebar';
import api from '../api/api';

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  ONGOING: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const typeLabels = {
  ONLINE_CHAT: 'Online Chat',
  VIDEO_CALL: 'Video Call',
  VOICE_CALL: 'Voice Call',
  IN_PERSON: 'In Person',
};

const historyLabels = {
  diabetes: 'Diabetes',
  bloodPressure: 'BP',
  asthma: 'Asthma',
  heartDisease: 'Heart',
  kidneyDisease: 'Kidney',
  liverDisease: 'Liver',
};

const getMedicalHistoryItems = (history = {}) =>
  Object.entries(historyLabels)
    .filter(([key]) => history?.[key])
    .map(([, label]) => label);

const Consultations = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await api.get('/consultations');
        setConsultations(response.data || []);
      } catch (error) {
        console.error('Error fetching consultations:', error);
        toast.error('Failed to load consultations');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const filteredConsultations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return consultations.filter((consultation) => {
      const patientName = consultation.patient?.name?.toLowerCase() || '';
      const symptoms = consultation.symptoms?.toLowerCase() || '';
      const diagnosis = consultation.diagnosis?.toLowerCase() || '';
      const matchesSearch =
        !normalizedSearch ||
        patientName.includes(normalizedSearch) ||
        symptoms.includes(normalizedSearch) ||
        diagnosis.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'ALL' || consultation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [consultations, searchTerm, statusFilter]);

  const counts = useMemo(
    () => ({
      total: consultations.length,
      pending: consultations.filter((item) => item.status === 'PENDING').length,
      ongoing: consultations.filter((item) => item.status === 'ONGOING').length,
      completed: consultations.filter((item) => item.status === 'COMPLETED').length,
    }),
    [consultations]
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Consultations"
          subtitle="View all consultation requests, ongoing cases, and completed patient visits."
          showNotifications={false}
        />

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Stat title="Total Consultations" value={counts.total} icon={ClipboardPlus} tone="blue" />
          <Stat title="Pending" value={counts.pending} icon={CalendarClock} tone="amber" />
          <Stat title="Ongoing" value={counts.ongoing} icon={MessageSquare} tone="indigo" />
          <Stat title="Completed" value={counts.completed} icon={Stethoscope} tone="emerald" />
        </section>

        <section className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by patient, symptoms, or diagnosis..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-12 pr-4 font-semibold text-slate-700 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-600 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center font-bold text-slate-400 shadow-sm">
            Loading consultations...
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <ClipboardPlus className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-xl font-black text-slate-800">No consultations found</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">New patient consultations will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {filteredConsultations.map((consultation) => (
              <button
                key={consultation.id}
                type="button"
                onClick={() => consultation.patient?.id && navigate(`/patient/${consultation.patient.id}`)}
                className="group rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <UserRound className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-900">{consultation.patient?.name || 'Unknown Patient'}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {typeLabels[consultation.consultationType] || consultation.consultationType || 'Consultation'}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusStyles[consultation.status] || statusStyles.PENDING}`}>
                    {consultation.status || 'PENDING'}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <Info label="Date" value={consultation.scheduledDate || consultation.appointment?.date || 'Not scheduled'} />
                  <Info label="Time" value={consultation.scheduledTime || consultation.appointment?.time || 'Not set'} />
                  <Info label="Symptoms" value={consultation.symptoms || consultation.notes || 'No symptoms added'} />
                  <Info label="Diagnosis" value={consultation.diagnosis || 'Not added yet'} />
                </div>

                {consultation.medicalIntake && (
                  <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Medical Intake Before Call</p>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                      <Info label="Duration" value={consultation.medicalIntake.illnessDuration || 'Not added'} />
                      <Info label="Allergies" value={consultation.medicalIntake.allergies || 'None reported'} />
                      <Info label="Current Medicines" value={consultation.medicalIntake.currentMedicines || 'None reported'} />
                      <Info
                        label="Past History"
                        value={[
                          ...getMedicalHistoryItems(consultation.medicalIntake.pastMedicalHistory),
                          consultation.medicalIntake.pastMedicalHistory?.other,
                        ].filter(Boolean).join(', ') || 'No history reported'}
                      />
                      <Info label="Pregnancy/Breastfeeding" value={consultation.medicalIntake.pregnancyStatus?.replace('_', ' ') || 'Not applicable'} />
                      <Info label="Reports" value={`${consultation.medicalIntake.reportLinks?.length || 0} link(s)`} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const Stat = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 truncate font-bold text-slate-800">{value}</p>
  </div>
);

export default Consultations;
