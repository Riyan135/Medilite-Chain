import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';
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
    if (!user?.name) return 'Welcome back';
    return `Welcome back, ${user.name}`;
  }, [user?.name]);

  useEffect(() => {
    const fetchPendingAppointments = async () => {
      if (!user?.id || !showNotifications || notificationMode !== 'appointments') return;

      try {
        const response = await api.get('/appointments/pending');
        setPendingAppointments(response.data || []);
        setNotificationsRead(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    fetchPendingAppointments();
  }, [user?.id, notificationMode, showNotifications]);

  const notificationItems = useMemo(() => {
    if (notificationMode === 'inventory' && inventorySummary) {
      return [
        {
          id: 'expiring-stock',
          title: 'Expiring Soon',
          body: `${inventorySummary.expiringPercent}% of medicines expire within 30 days.`,
          meta: `${inventorySummary.expiringCount} of ${inventorySummary.total} medicines`,
          icon: CalendarClock,
          tone: 'amber',
          path: '/medicines',
        },
        {
          id: 'expired-stock',
          title: 'Expired',
          body: `${inventorySummary.expiredPercent}% of medicines are already expired.`,
          meta: `${inventorySummary.expiredCount} of ${inventorySummary.total} medicines`,
          icon: AlertTriangle,
          tone: 'rose',
          path: '/medicines',
        },
        {
          id: 'safe-stock',
          title: 'Safe Stock',
          body: `${inventorySummary.safePercent}% of medicines are safe from expiry risk.`,
          meta: `${inventorySummary.safeCount} of ${inventorySummary.total} medicines`,
          icon: CheckCircle2,
          tone: 'emerald',
          path: '/medicines',
        },
      ];
    }

    return pendingAppointments.slice(0, 5).map((appointment) => ({
      id: appointment.id,
      title: 'New appointment request',
      body: `${appointment.patient?.user?.name || 'Patient'} requested ${appointment.date || 'a date'} at ${appointment.time || 'a time'}.`,
      meta: appointment.appointmentType?.replace('_', ' ') || 'Appointment',
      icon: CalendarClock,
      tone: 'blue',
      path: '/appointments',
    }));
  }, [inventorySummary, notificationMode, pendingAppointments]);

  const hasUnreadNotifications = notificationItems.length > 0 && !notificationsRead;
  const notificationTitle = notificationMode === 'inventory' ? 'Stock Expiry Status' : 'Notifications';
  const notificationSubtitle =
    notificationMode === 'inventory'
      ? `${inventorySummary?.total || 0} medicine${inventorySummary?.total === 1 ? '' : 's'} tracked`
      : `${notificationItems.length} pending alert${notificationItems.length === 1 ? '' : 's'}`;
  const emptyNotificationText =
    notificationMode === 'inventory'
      ? 'Stock percentages will appear after medicines are added.'
      : 'Appointment requests and consultation alerts will appear here.';
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

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
        {showNotifications && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setOpen(false);
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#facc15] ring-2 ring-white" />}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">{notificationTitle}</p>
                    <p className="text-xs font-semibold text-slate-400">{notificationSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsRead(true)}
                    className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Mark read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {notificationItems.length > 0 ? (
                    notificationItems.map((item) => {
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
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClasses[item.tone] || toneClasses.blue}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-800">{item.title}</span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.body}</span>
                            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{item.meta}</span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                        <Bell className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-black text-slate-800">No new alerts</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
                        {emptyNotificationText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
