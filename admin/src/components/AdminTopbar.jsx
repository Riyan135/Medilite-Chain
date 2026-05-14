import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, ChevronDown, LogOut, Settings, UserCircle2, Search, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const AdminTopbar = ({ title, subtitle, notificationMode = 'appointments', inventorySummary = null, showNotifications = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);

  const greeting = useMemo(() => {
    if (!user?.name) return 'WELCOME BACK';
    return `WELCOME BACK, ${user.name.toUpperCase()}`;
  }, [user?.name]);

  useEffect(() => {
    const fetchPendingAppointments = async () => {
      if (!user?.id || !showNotifications || notificationMode !== 'appointments') return;
      try {
        const response = await api.get('/appointments/pending');
        setPendingAppointments(response.data || []);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    fetchPendingAppointments();
  }, [user?.id, notificationMode, showNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="mb-12 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between relative z-30">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-slate-500 font-normal text-sm leading-relaxed opacity-80">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 self-start xl:self-auto">
        <div className="hidden lg:flex items-center gap-4 px-5 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patient ID..." 
            className="bg-transparent border-none outline-none text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 w-40"
          />
        </div>

        {showNotifications && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-sm transition-all overflow-hidden group"
            >
              <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <Bell className="h-4 w-4" />
              {pendingAppointments.length > 0 && (
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-950" />
              )}
            </motion.button>
          </div>
        )}

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-full border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 pl-1.5 pr-4 py-1.5 shadow-sm transition-all group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">{user?.name || 'Doctor'}</p>
              <div className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-blue-600" fill="currentColor" />
                <p className="text-[8px] font-medium uppercase tracking-widest text-slate-400">{user?.role || 'DOCTOR'}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {open && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-56 rounded-3xl border border-white dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-2 shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</p>
                </div>
                <button
                  onClick={() => { setOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Clinical Profile
                </button>
                <button
                  onClick={() => { setOpen(false); navigate('/settings'); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </button>
                <div className="h-1 bg-slate-50 dark:bg-slate-800 my-2 mx-2 rounded-full opacity-50" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
