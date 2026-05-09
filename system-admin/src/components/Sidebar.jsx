import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ActivitySquare,
  BarChart3,
  BellRing,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  User,
  UsersRound,
  X,
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
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'User Governance', icon: UsersRound, path: '/user-governance' },
    { name: 'Monitoring', icon: ActivitySquare, path: '/system-monitoring' },
    { name: 'Audit Logs', icon: ScrollText, path: '/audit-logs' },
    { name: 'Notifications', icon: BellRing, path: '/notifications' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
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
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 md:sticky md:z-10 ${
          collapsed ? 'w-[92px]' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className={`flex h-20 items-center justify-between border-b border-slate-100 ${collapsed ? 'px-3' : 'px-5'}`}>
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="flex items-center gap-2">
              <MediLiteLogo />
              <h1 className="text-2xl font-bold text-[#1d4ed8]">System Admin</h1>
            </div>
          </div>
          {collapsed && <MediLiteLogo />}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed((current) => !current)}
              className="hidden rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 md:inline-flex"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
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
                    ? 'bg-gradient-to-r from-[#1d4ed8] to-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-600 hover:bg-[#f0f4f8]'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <link.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span className="font-semibold">{link.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className={`flex items-center rounded-2xl bg-[#f0f4f8] px-3 py-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 text-sm font-black text-[#1d4ed8]">
              {user?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="truncate text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">platform governance</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-4 flex w-full items-center rounded-2xl px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 ${collapsed ? 'justify-center' : ''}`}
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
