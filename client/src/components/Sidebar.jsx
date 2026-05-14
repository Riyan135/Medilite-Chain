import React from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { 
  LayoutGrid, FileText, Bell, Clock, LogOut, User, Pill, 
  Activity, AlertTriangle, Calendar, ClipboardPlus, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { memberId } = useParams();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const buildPath = (basePath) => {
    if (memberId && memberId !== user?.id) {
      return `${basePath}/${memberId}`;
    }
    return basePath;
  };

  const links = [
    { name: 'Dashboard', icon: LayoutGrid, path: buildPath('/dashboard') },
    { name: 'Book Appointment', icon: Calendar, path: buildPath('/book-appointment') },
    { name: 'Consultations', icon: ClipboardPlus, path: buildPath('/consultations') },
    { name: 'Symptom Checker', icon: Activity, path: buildPath('/symptom-checker') },
    { name: 'Records', icon: FileText, path: buildPath('/records') },
    { name: 'Reminders', icon: Bell, path: buildPath('/reminders') },
    { name: 'Timeline', icon: Clock, path: buildPath('/timeline') },
    { name: 'My Profile', icon: User, path: buildPath('/qr') },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white z-50">
      {/* Logo */}
      <div className="flex h-20 items-center px-6 gap-3">
        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">M</div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight">MediLite</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/dashboard'}
            className={({ isActive }) => 
              `flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            {link.name}
          </NavLink>
        ))}
        
        {/* Emergency SOS - Special Style */}
        <NavLink
          to="/emergency"
          className={({ isActive }) => 
            `flex items-center px-4 py-3 rounded-xl text-sm font-black transition-all mt-4 border border-red-100 ${
              isActive 
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`
          }
        >
          <AlertTriangle className="w-5 h-5 mr-3" />
          Emergency SOS
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        {/* Language Switcher Mock */}
        <button className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
           <div className="flex items-center gap-2">
             <Globe className="w-4 h-4 text-slate-400" />
             English
           </div>
        </button>

        {/* User Profile Card */}
        <div className="flex items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black border border-slate-200 shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{user?.name}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.role} ACCOUNT</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-xs font-black text-red-600 hover:underline uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Secure Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
