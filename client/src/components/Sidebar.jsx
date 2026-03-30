import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Bell, Clock, QrCode, LogOut, User, Pill, MessageSquare, ShieldCheck, Activity, AlertTriangle, Users, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLinks = {
    'PATIENT': [
      { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
      { name: 'Book Appointment', icon: Calendar, path: '/book-appointment' },
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
    <div className="flex flex-col h-screen w-64 bg-white/70 backdrop-blur-2xl border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-40">
      <div className="flex items-center justify-center h-20 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-blue-600">MediLite</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                link.name === 'Emergency SOS'
                  ? 'bg-red-50 text-red-600 font-bold hover:bg-red-100 hover:shadow-md hover:-translate-y-0.5 border border-red-200/50 shadow-sm'
                  : isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm hover:-translate-y-0.5'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>


      <div className="p-5 border-t border-slate-200/50 space-y-4 bg-slate-50/50 backdrop-blur-sm">
        <div className="flex items-center px-4 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="h-10 w-10 bg-blue-50 group-hover:bg-blue-600 transition-colors duration-300 rounded-xl flex items-center justify-center text-blue-600 group-hover:text-white font-bold border border-blue-100 group-hover:border-transparent shadow-inner">
            {user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role?.toLowerCase()} Account</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-4 py-3 text-red-600 rounded-2xl hover:bg-red-50 hover:text-red-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 font-bold border border-transparent hover:border-red-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Secure Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
