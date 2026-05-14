import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Pill, Clock, 
  CheckCircle2, XCircle, AlertCircle, ChevronRight, X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, desc, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-600 text-white',
    white: 'bg-white text-slate-900 border border-slate-100',
    emerald: 'bg-emerald-50/50 text-slate-900 border border-emerald-100',
    amber: 'bg-amber-50/50 text-slate-900 border border-amber-100',
  };

  return (
    <div className={`rounded-[1.5rem] p-8 shadow-sm flex-1 ${colors[color]}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${color === 'blue' ? 'text-blue-100' : 'text-blue-600'}`}>
        {title}
      </p>
      <h2 className="text-4xl font-black tracking-tight mb-2">{value}</h2>
      <p className={`text-[10px] font-bold uppercase tracking-tight ${color === 'blue' ? 'text-blue-100' : 'text-slate-400'}`}>
        {desc}
      </p>
    </div>
  );
};

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await api.get(`/reminders/${user.id}`);
        setReminders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReminders();
  }, [user.id]);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 mb-12">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Daily Care</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Medicine Reminders</h1>
            <p className="text-slate-500 font-bold text-sm">Manage your medication schedule, email alerts, and active doses in one place.</p>
          </div>
          <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-black shadow-xl shadow-blue-600/25 hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </header>

        {/* Stats Grid */}
        <section className="flex flex-wrap gap-6 mb-10">
          <StatCard title="Total" value={reminders.length} desc="All scheduled medicines in your routine." color="blue" />
          <StatCard title="Active" value={reminders.filter(r => r.active).length} desc="Reminders currently sending alerts and due notifications." color="emerald" />
          <StatCard title="Paused" value={reminders.filter(r => !r.active).length} desc="Keep frequently skipped reminders muted until you need them again." color="amber" />
        </section>

        {/* Reminders List Empty State */}
        <div className="rounded-[2rem] bg-white border border-slate-100 p-10 shadow-sm relative overflow-hidden">
          <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-24 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Bell className="w-7 h-7" />
            </div>
            <p className="font-black text-slate-900 text-xl mb-2">No reminders set yet</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm">
              Click the button above to add your first medicine reminder.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reminders;
