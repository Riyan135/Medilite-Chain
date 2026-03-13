import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, FileText, Bell, Clock, QrCode, LogOut, User, Pill, MessageSquare, ShieldCheck } from 'lucide-react';
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
      { name: 'Inventory', icon: Pill, path: '/inventory' },
      { name: 'Records', icon: FileText, path: '/records' },
      { name: 'Reminders', icon: Bell, path: '/reminders' },
      { name: 'Timeline', icon: Clock, path: '/timeline' },
      { name: 'My QR', icon: QrCode, path: '/qr' },
    ],
    'DOCTOR': [
      { name: 'Dashboard', icon: LayoutGrid, path: '/doctor-dashboard' },
      { name: 'Recent Activity', icon: Clock, path: '/doctor-dashboard' },
    ]
  };

  const links = roleLinks[user?.role] || roleLinks['PATIENT'];

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-slate-200">
      <div className="flex items-center justify-center h-20 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-blue-600">MediLite</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive 
                ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>


      <div className="p-4 border-t border-slate-100 space-y-4">
        <div className="flex items-center px-3 py-3 bg-slate-50 rounded-xl">
          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-200">
            {user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{user?.role?.toLowerCase()} Account</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-semibold"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
