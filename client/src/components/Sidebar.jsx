import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Bell, Clock, QrCode, LogOut, User, Pill, MessageSquare, ShieldCheck, Activity, AlertTriangle, Users, Calendar, ClipboardPlus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLinks = {
    'PATIENT': [
      { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
      { name: 'Book Appointment', icon: Calendar, path: '/book-appointment' },
      { name: 'Consultations', icon: ClipboardPlus, path: '/consultations' },
      { name: 'Symptom Checker', icon: Activity, path: '/symptom-checker' },
      { name: 'Records', icon: FileText, path: '/records' },
      { name: 'Reminders', icon: Bell, path: '/reminders' },
      { name: 'Timeline', icon: Clock, path: '/timeline' },
      { name: 'My QR', icon: QrCode, path: '/qr' },
      { name: 'Emergency SOS', icon: AlertTriangle, path: '/emergency' },
    ],
    'DOCTOR': [
      { name: 'Dashboard', icon: LayoutGrid, path: '/doctor-dashboard' },
      { name: 'Recent Activity', icon: Clock, path: '/doctor-dashboard' },
    ]
  };

  const links = roleLinks[user?.role] || roleLinks['PATIENT'];

  return (
    <div className={`flex h-screen flex-col border-r border-slate-200/60 bg-white/70 backdrop-blur-2xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-40 transition-all duration-300 ${isOpen ? 'w-64' : 'w-24'}`}>
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
        {isOpen ? (
          <h1 className="text-2xl font-bold text-blue-600">MediLite</h1>
        ) : (
          <h1 className="text-2xl font-bold text-blue-600 mx-auto">M</h1>
        )}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex rounded-xl p-2 text-slate-500 transition-colors duration-300 hover:bg-slate-100"
          title={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/dashboard' || link.path === '/doctor-dashboard'}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-2xl transition-all duration-300 relative group overflow-hidden border ${
                link.name === 'Emergency SOS'
                  ? 'border-red-200/50 bg-red-50 text-red-600 font-bold shadow-sm hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-md'
                  : isActive 
                    ? 'border-blue-500 bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                    : 'border-transparent text-slate-500 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
            {isOpen && <span className="font-medium">{link.name}</span>}
          </NavLink>
        ))}
      </nav>


      <div className="p-5 border-t border-slate-200/50 space-y-4 bg-slate-50/50 backdrop-blur-sm">
        {isOpen && <LanguageSwitcher className="w-full" />}
        <div className={`flex bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group ${isOpen ? 'items-center px-4 py-3' : 'justify-center px-2 py-3'}`}>
          <div className="h-10 w-10 bg-blue-50 group-hover:bg-blue-600 transition-colors duration-300 rounded-xl flex items-center justify-center text-blue-600 group-hover:text-white font-bold border border-blue-100 group-hover:border-transparent shadow-inner">
            {user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
          </div>
          {isOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role?.toLowerCase()} Account</p>
            </div>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-3 text-red-600 rounded-2xl hover:bg-red-50 hover:text-red-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 font-bold border border-transparent hover:border-red-100"
        >
          <LogOut className={`w-5 h-5 ${isOpen ? 'mr-3' : ''}`} />
          {isOpen && <span>Secure Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
