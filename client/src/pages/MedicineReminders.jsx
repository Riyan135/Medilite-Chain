import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, Pill, Clock, AlertCircle, 
  Trash2, ToggleLeft, ToggleRight, Sparkles, 
  Calendar, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MedicineReminder from '../components/MedicineReminder';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MedicineReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [user.id]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reminders/${user.id}`);
      setReminders(response.data);
    } catch (error) {
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id, currentStatus) => {
    try {
      await api.put(`/reminders/${id}`, { active: !currentStatus });
      setReminders(reminders.map(r => 
        r._id === id ? { ...r, active: !currentStatus } : r
      ));
      toast.success(`Reminder ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await api.delete(`/reminders/${id}`);
      setReminders(reminders.filter(r => r._id !== id));
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans selection:bg-blue-600/20 selection:text-blue-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-6 rounded-[2.25rem] border border-white/60 bg-white/70 p-8 backdrop-blur-2xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black tracking-[0.4em] uppercase border border-blue-100 mb-2">
              <Sparkles className="h-3 w-3" />
              Daily Care
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Medicine Reminders</h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">Manage your medication schedule, email alerts, and active doses in one place.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 mr-3" />
            Add Reminder
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="group rounded-[1.5rem] bg-white border border-white/60 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Total</p>
             <p className="text-4xl font-black text-slate-900 tracking-tight mb-2">{reminders.length}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">All scheduled medicines in your routine.</p>
          </div>
          <div className="group rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Active</p>
             <p className="text-4xl font-black text-slate-900 tracking-tight mb-2">{reminders.filter(r => r.active).length}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Reminders currently sending alerts and due notifications.</p>
          </div>
          <div className="group rounded-[1.5rem] bg-amber-50/50 border border-amber-100 p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-4">Paused</p>
             <p className="text-4xl font-black text-slate-900 tracking-tight mb-2">{reminders.filter(r => !r.active).length}</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Keep frequently skipped reminders muted until you need them again.</p>
          </div>
        </section>

        <div className="rounded-[2.5rem] bg-white/70 border border-white/60 p-10 backdrop-blur-xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : reminders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {reminders.map((reminder) => (
                <div key={reminder._id} className={`group relative rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${reminder.active ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-slate-200 grayscale opacity-75'}`}>
                   <div className="p-8">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${reminder.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                           <Pill className="w-7 h-7" />
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => toggleReminder(reminder._id, reminder.active)} className={`p-3 rounded-xl transition-all ${reminder.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                              {reminder.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                           </button>
                           <button onClick={() => deleteReminder(reminder._id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{reminder.medicineName}</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{reminder.dosage} | {reminder.frequency}</p>
                     
                     <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled Time</p>
                           <p className="text-sm font-black text-slate-800">{reminder.time}</p>
                        </div>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner animate-pulse">
                <Bell className="w-10 h-10" />
              </div>
              <p className="font-black text-slate-900 text-2xl mb-2">No reminders set yet</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] max-w-sm">
                Keep your health routine on track. Click the button above to add your first medicine reminder.
              </p>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <MedicineReminder 
          onClose={() => {
            setShowAddModal(false);
            fetchReminders();
          }} 
        />
      )}
    </div>
  );
};

export default MedicineReminders;
