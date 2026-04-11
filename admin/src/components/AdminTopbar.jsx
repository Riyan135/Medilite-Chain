import React, { useMemo, useState } from 'react';
import { Bell, ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const AdminTopbar = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const greeting = useMemo(() => {
    if (!user?.name) return 'Welcome back';
    return `Welcome back, ${user.name}`;
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">{greeting}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 self-start xl:self-auto">
        <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <Bell className="h-5 w-5" />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#facc15]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen((current) => !current)}
            className="flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-sky-500 text-sm font-black text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Doctor'}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{user?.role || 'STAFF'}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 min-w-52 rounded-[1.5rem] border border-slate-100 bg-white p-2 shadow-2xl">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-700 transition-colors hover:bg-slate-50"
              >
                <UserCircle2 className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
