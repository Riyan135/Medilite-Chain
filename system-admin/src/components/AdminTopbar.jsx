import React, { useMemo, useState } from 'react';
import { ActivitySquare, Bell, ChevronDown, DatabaseBackup, LogOut, Settings, ShieldAlert, Stethoscope, TriangleAlert, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const AdminTopbar = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const greeting = useMemo(() => {
    if (!user?.name) return 'Welcome back';
    return `Welcome back, ${user.name}`;
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notificationItems = [
    {
      id: 'doctor-approval',
      title: 'Doctor approval queue',
      body: 'Review recently registered doctors and confirm account access.',
      meta: 'User governance',
      icon: Stethoscope,
      tone: 'blue',
      path: '/user-governance',
    },
    {
      id: 'stock-alert',
      title: 'Inventory stock alerts',
      body: 'Low-stock and expired medicine warnings need platform review.',
      meta: 'Monitoring',
      icon: TriangleAlert,
      tone: 'amber',
      path: '/system-monitoring',
    },
    {
      id: 'security-audit',
      title: 'Security audit activity',
      body: 'Track role changes, failed access attempts, and sensitive actions.',
      meta: 'Audit logs',
      icon: ShieldAlert,
      tone: 'rose',
      path: '/audit-logs',
    },
    {
      id: 'service-health',
      title: 'Service health snapshot',
      body: 'Realtime, database, upload, and AI service status can be reviewed.',
      meta: 'System health',
      icon: ActivitySquare,
      tone: 'emerald',
      path: '/system-monitoring',
    },
    {
      id: 'backup-check',
      title: 'Backup readiness',
      body: 'Confirm recovery plans and critical service backup status.',
      meta: 'Recovery',
      icon: DatabaseBackup,
      tone: 'slate',
      path: '/reports',
    },
  ];

  const hasUnreadNotifications = notificationItems.length > 0 && !notificationsRead;
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">{greeting}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 self-start xl:self-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setOpen(false);
            }}
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            title="System alerts"
          >
            <Bell className="h-5 w-5" />
            {hasUnreadNotifications && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#facc15] ring-2 ring-white" />}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-sm font-black text-slate-900">System Alerts</p>
                  <p className="text-xs font-semibold text-slate-400">{notificationItems.length} platform alert checks</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsRead(true)}
                  className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Mark read
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {notificationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate(item.path);
                      }}
                      className="flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses[item.tone]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-slate-800">{item.title}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.body}</span>
                        <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{item.meta}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-sky-500 text-sm font-black text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Admin'}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{user?.role || 'ADMIN'}</p>
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
