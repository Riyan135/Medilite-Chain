import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Trash2, UserRound, Stethoscope } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments/history');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (appointmentId) => {
    try {
      await api.delete(`/appointments/${appointmentId}`);
      toast.success('Appointment deleted');
      setAppointments((current) => current.filter((appointment) => appointment.id !== appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const counts = {
    total: appointments.length,
    pending: appointments.filter((appointment) => appointment.status === 'PENDING').length,
    accepted: appointments.filter((appointment) => appointment.status === 'ACCEPTED').length,
    rejected: appointments.filter((appointment) => appointment.status === 'REJECTED').length,
  };

  const getAppointmentTone = (appointment) => {
    const reason = appointment.reason?.toLowerCase() || '';
    if (reason.includes('urgent') || reason.includes('emergency')) return 'urgent';
    if (appointment.status === 'ACCEPTED') return 'completed';
    return 'pending';
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title={user?.role === 'DOCTOR' ? 'Doctor Appointments' : 'Appointments'}
          subtitle="Track appointment requests, accepted slots, urgent follow-ups, and appointment history."
        />

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Stat title="Total Appointments" value={counts.total} icon={Calendar} />
          <Stat title="Pending" value={counts.pending} icon={Clock} />
          <Stat title="Accepted" value={counts.accepted} icon={Stethoscope} />
          <Stat title="Rejected" value={counts.rejected} icon={UserRound} />
        </section>

        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Appointment History</h3>
            <p className="text-sm text-slate-400 font-medium">{counts.total} Records</p>
          </div>

          {loading ? (
            <div className="p-10 text-slate-400">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="p-10 text-slate-400">No appointments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {appointment.patient?.user?.name || 'Unknown Patient'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {appointment.date} at {appointment.time}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          getAppointmentTone(appointment) === 'completed'
                            ? 'bg-green-100 text-[#16a34a]'
                            : getAppointmentTone(appointment) === 'urgent'
                              ? 'bg-red-100 text-[#dc2626]'
                              : 'bg-yellow-100 text-[#b45309]'
                        }`}>
                          {getAppointmentTone(appointment) === 'completed'
                            ? 'Completed'
                            : getAppointmentTone(appointment) === 'urgent'
                              ? 'Urgent'
                              : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                        {appointment.reason || 'No reason provided'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(appointment.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const Stat = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <p className="text-sm font-semibold text-slate-500">{title}</p>
    <h2 className="text-4xl font-extrabold text-slate-900 mt-2">{value}</h2>
  </div>
);

export default Appointments;
