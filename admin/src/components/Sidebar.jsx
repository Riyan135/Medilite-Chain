import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FileText, LogOut, User, ShieldCheck, Calendar, Package2, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    { name: 'Doctor Console', icon: ShieldCheck, path: '/dashboard' },
    { name: 'Appointments', icon: Calendar, path: '/appointments' },
    { name: 'Patient Records', icon: FileText, path: '/records' },
    { name: 'Stock', icon: Package2, path: '/medicines' },
    { name: 'Profile', icon: User, path: '/profile' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white text-slate-700 shadow-lg md:hidden"
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 md:sticky md:z-10 ${
          collapsed ? 'w-[92px]' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-2xl font-bold text-[#1d4ed8] dark:text-blue-500">MediLite</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed((current) => !current)}
              className="hidden rounded-xl p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 md:inline-flex"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-xl p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group flex items-center rounded-2xl px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#1d4ed8] to-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-[#f0f4f8] dark:hover:bg-slate-800/50'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <link.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span className="font-semibold">{link.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <div className={`flex items-center rounded-2xl bg-[#f0f4f8] dark:bg-slate-800/50 px-3 py-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-100 dark:bg-blue-500/10 text-sm font-black text-[#1d4ed8] dark:text-blue-400">
              {user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{user?.role?.toLowerCase()} account</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-4 flex w-full items-center rounded-2xl px-4 py-3 font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
