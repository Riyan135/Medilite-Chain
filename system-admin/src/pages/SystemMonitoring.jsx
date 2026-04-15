import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivitySquare,
  AlertTriangle,
  BellDot,
  ChevronRight,
  Clock3,
  Cpu,
  MailCheck,
  RadioTower,
  RefreshCcw,
  Shield,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const REFRESH_MS = 20000;

const buildServiceCards = (stats, healthOk) => [
  {
    id: 'api-gateway',
    label: 'API Gateway',
    note: `${stats?.totalUsers || 0} total users currently indexed`,
    status: healthOk ? 'Healthy' : 'Watch',
    metric: `${stats?.totalUsers || 0} users`,
    detail:
      'Tracks the core backend reachability for the system-admin portal and platform APIs.',
    icon: Cpu,
    tone: 'blue',
    trend: Math.max(12, Math.min(100, (stats?.totalUsers || 0) * 8)),
    bullets: [
      `${stats?.totalAppointments || 0} total appointments routed`,
      `${stats?.totalConsultations || 0} consultations tracked`,
      `${stats?.totalRecords || 0} records indexed`,
    ],
  },
  {
    id: 'otp-mail',
    label: 'OTP Mail Delivery',
    note: 'Depends on SMTP health and Gmail app-password validity',
    status: 'Watch',
    metric: 'SMTP',
    detail:
      'Watches whether admin OTP delivery is likely to succeed based on current email transport state.',
    icon: MailCheck,
    tone: 'amber',
    trend: 46,
    bullets: [
      'Uses configured SMTP transport',
      'Sensitive to firewall or TLS issues',
      'Should be reviewed if OTP login starts failing',
    ],
  },
  {
    id: 'realtime-transport',
    label: 'Realtime Transport',
    note: `${stats?.activeSessions || 0} estimated socket sessions`,
    status: 'Healthy',
    metric: `${stats?.activeSessions || 0} active`,
    detail:
      'Represents the websocket and realtime layer used for notifications, chat, and call signaling.',
    icon: RadioTower,
    tone: 'emerald',
    trend: Math.max(18, Math.min(100, (stats?.activeSessions || 0) * 15)),
    bullets: [
      'Socket layer available to local portals',
      'Supports notifications and live updates',
      'Best monitored during active doctor/patient sessions',
    ],
  },
  {
    id: 'security-monitoring',
    label: 'Security Monitoring',
    note: `${stats?.pendingDoctors || 0} doctor account(s) awaiting trust review`,
    status: stats?.pendingDoctors ? 'Watch' : 'Healthy',
    metric: `${stats?.pendingDoctors || 0} review`,
    detail:
      'Surfaces pending doctor approvals, governance posture, and access-review needs.',
    icon: Shield,
    tone: 'indigo',
    trend: stats?.pendingDoctors ? 52 : 82,
    bullets: [
      `${stats?.pendingDoctors || 0} pending doctor trust decisions`,
      'Admin-only routes enforced in system-admin',
      'Useful alongside audit logs and access control',
    ],
  },
  {
    id: 'alert-stream',
    label: 'Alert Stream',
    note: `${stats?.lowStockMedicines || 0} low-stock and ${stats?.expiredMedicines || 0} expiry warnings`,
    status: stats?.lowStockMedicines || stats?.expiredMedicines ? 'Watch' : 'Healthy',
    metric: `${(stats?.lowStockMedicines || 0) + (stats?.expiredMedicines || 0)} alerts`,
    detail:
      'Tracks platform-level alerts that require admin attention, especially stock and expiry risk.',
    icon: BellDot,
    tone: 'rose',
    trend: Math.max(
      10,
      Math.min(100, ((stats?.lowStockMedicines || 0) + (stats?.expiredMedicines || 0)) * 22)
    ),
    bullets: [
      `${stats?.lowStockMedicines || 0} low-stock medicines`,
      `${stats?.expiredMedicines || 0} expired medicines`,
      `${stats?.nearExpiryMedicines || 0} near-expiry medicines`,
    ],
  },
  {
    id: 'observability-layer',
    label: 'Observability Layer',
    note: `${stats?.recentLogs?.length || 0} recent platform log entries available`,
    status: 'Healthy',
    metric: `${stats?.recentLogs?.length || 0} logs`,
    detail:
      'Summarizes whether useful recent operational signals are available for the admin team.',
    icon: ActivitySquare,
    tone: 'slate',
    trend: Math.max(20, Math.min(100, (stats?.recentLogs?.length || 0) * 18)),
    bullets: [
      'Recent activity gathered from platform events',
      'Pairs with audit logs for governance review',
      'Useful for triaging unusual admin issues',
    ],
  },
];

const SystemMonitoring = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [healthOk, setHealthOk] = useState(true);

  const loadMonitoring = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);

      const [statsRes, healthRes] = await Promise.all([
        api.get('/admin/stats'),
        fetch('http://localhost:5000/health').catch(() => null),
      ]);

      setStats(statsRes.data);
      setHealthOk(Boolean(healthRes?.ok));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
      setHealthOk(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoring();
    const interval = window.setInterval(() => loadMonitoring(), REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [loadMonitoring]);

  const services = useMemo(() => buildServiceCards(stats, healthOk), [stats, healthOk]);

  const criticalIssues = useMemo(() => {
    const issues = [];

    if (!healthOk) {
      issues.push({
        title: 'API health endpoint is not responding cleanly',
        severity: 'critical',
      });
    }

    if ((stats?.lowStockMedicines || 0) > 0) {
      issues.push({
        title: `${stats.lowStockMedicines} medicine stock alert(s) need review`,
        severity: 'watch',
      });
    }

    if ((stats?.expiredMedicines || 0) > 0) {
      issues.push({
        title: `${stats.expiredMedicines} expired medicine item(s) detected`,
        severity: 'critical',
      });
    }

    if ((stats?.pendingDoctors || 0) > 0) {
      issues.push({
        title: `${stats.pendingDoctors} doctor account(s) are still pending approval`,
        severity: 'watch',
      });
    }

    if (services.find((service) => service.id === 'otp-mail')?.status === 'Watch') {
      issues.push({
        title: 'OTP mail delivery should be verified before admin sign-in testing',
        severity: 'watch',
      });
    }

    return issues.slice(0, 4);
  }, [healthOk, services, stats]);

  const trendBars = useMemo(
    () => [
      {
        label: 'Users',
        value: stats?.totalUsers || 0,
        width: Math.max(18, Math.min(100, (stats?.totalUsers || 0) * 8)),
      },
      {
        label: 'Sessions',
        value: stats?.activeSessions || 0,
        width: Math.max(18, Math.min(100, (stats?.activeSessions || 0) * 15)),
      },
      {
        label: 'Alerts',
        value: (stats?.lowStockMedicines || 0) + (stats?.expiredMedicines || 0),
        width: Math.max(
          12,
          Math.min(100, ((stats?.lowStockMedicines || 0) + (stats?.expiredMedicines || 0)) * 20)
        ),
      },
      {
        label: 'Logs',
        value: stats?.recentLogs?.length || 0,
        width: Math.max(16, Math.min(100, (stats?.recentLogs?.length || 0) * 20)),
      },
    ],
    [stats]
  );

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="System Monitoring"
          subtitle="Watch platform health, traffic posture, alert load, and service readiness from a single governance page."
        />

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  Critical Issues
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Priority Watchlist
                </h2>
              </div>

              <button
                onClick={() => loadMonitoring(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-black text-white"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Now
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-slate-500">
                  Loading monitoring signals...
                </div>
              ) : criticalIssues.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-700">
                  No critical issues are flagged right now.
                </div>
              ) : (
                criticalIssues.map((issue) => (
                  <div
                    key={issue.title}
                    className={`flex items-center justify-between rounded-2xl px-4 py-4 ${
                      issue.severity === 'critical'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold">{issue.title}</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">
                      {issue.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Live Pulse
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Quick Metrics</h2>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-5">
              {trendBars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>{bar.label}</span>
                    <span>{bar.value}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500"
                      style={{ width: `${bar.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Last updated:{' '}
              <span className="font-semibold text-slate-700">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Waiting for first refresh'}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setSelectedService(service)}
              className="rounded-[2rem] border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900">{service.label}</h2>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{service.note}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Metric: {service.metric}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    service.status === 'Healthy'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {service.status}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
                  <span>Stability</span>
                  <span>{service.trend}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      service.status === 'Healthy'
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${service.trend}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </section>

        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <selectedService.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Service Detail
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">
                      {selectedService.label}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">{selectedService.detail}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedService(null)}
                  className="rounded-2xl bg-slate-100 px-4 py-2 font-bold text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Current Status
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {selectedService.status}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Metric: {selectedService.metric}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Stability Score
                  </p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {selectedService.trend}%
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Updated with each monitoring refresh cycle.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Notes
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {selectedService.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-xl bg-white px-4 py-3">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SystemMonitoring;
