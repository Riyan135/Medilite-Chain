import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardPlus, FileText, LogOut, User, ShieldCheck, 
  Calendar, Package2, PanelLeftClose, PanelLeftOpen, 
  Settings, X, Heart, Globe, MapPin 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MediLiteLogo = ({ className = '' }) => (
  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#06b6d4] text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/70 ${className}`}>
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <path fill="currentColor" fillOpacity="0.22" d="M16 2.8 27.2 8v8.4c0 6.1-4.5 10.8-11.2 12.8C9.3 27.2 4.8 22.5 4.8 16.4V8L16 2.8Z" />
      <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M8.5 18.1h3.1l2-5.2 4.1 8.4 2.2-5h3.6" />
      <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M10 10.8v9.4M22 10.8v9.4" opacity="0.82" />
    </svg>
  </span>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { name: 'Clinical Center', icon: ShieldCheck, path: '/dashboard' },
    { name: 'Appointments', icon: Calendar, path: '/appointments' },
    { name: 'Consultations', icon: ClipboardPlus, path: '/consultations' },
    { name: 'Health Records', icon: FileText, path: '/records' },
    { name: 'Pharmacy Stock', icon: Package2, path: '/medicines' },
    { name: 'Dr. Profile', icon: User, path: '/profile' },
    { name: 'Core Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white/80 backdrop-blur-xl text-slate-700 shadow-2xl md:hidden"
      >
        <PanelLeftOpen className="h-6 w-6" />
      </button>

      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      <motion.aside
        animate={{ width: collapsed ? 100 : 300 }}
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 md:sticky md:z-10 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className={`flex h-24 items-center justify-between border-b border-slate-100 dark:border-slate-800/50 ${collapsed ? 'px-4' : 'px-7'}`}>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <MediLiteLogo />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">MediLite</h1>
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Health Sys</p>
                </div>
              </motion.div>
            )}
            {collapsed && <MediLiteLogo />}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed((current) => !current)}
            className="hidden rounded-2xl p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all md:inline-flex"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-4 py-8">
          {!collapsed && (
            <p className="px-3 mb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest opacity-70">Management</p>
          )}
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `group flex items-center rounded-2xl px-5 py-3.5 transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <link.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-4'} ${collapsed ? '' : 'opacity-80'}`} />
              {!collapsed && <span className="font-semibold text-sm tracking-tight">{link.name}</span>}
            </NavLink>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800/50">
          {!collapsed && (
            <div className="mb-5 px-3 flex items-center gap-2 text-slate-400">
              <MapPin className="w-3 h-3" />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Central Hospital v2</span>
            </div>
          )}
          <div className={`flex items-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-3.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm text-blue-600 font-bold text-base">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="ml-3 min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">Dr. {user?.name?.split(' ')[0]}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Online</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-4 flex w-full items-center rounded-xl px-5 py-3 font-semibold text-xs uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-4'}`} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
