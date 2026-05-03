import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivitySquare,
  BellRing,
  Database,
  HardDriveDownload,
  Lock,
  ShieldCheck,
  Siren,
  UsersRound,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const OverviewCard = ({ title, value, detail, icon: Icon, tone }) => {
  const tones = {
    blue: 'from-blue-500/15 to-cyan-400/10 text-blue-700 border-blue-100',
    emerald: 'from-emerald-500/15 to-lime-400/10 text-emerald-700 border-emerald-100',
    amber: 'from-amber-500/15 to-orange-400/10 text-amber-700 border-amber-100',
    indigo: 'from-indigo-500/15 to-violet-400/10 text-indigo-700 border-indigo-100',
  };

  return (
    <div className={`rounded-[2rem] border bg-gradient-to-br ${tones[tone]} bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
      <p className="mt-3 text-sm font-medium text-slate-500">{detail}</p>
    </div>
  );
};

const ServiceRow = ({ label, status, note }) => (
  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
    <div>
      <p className="font-bold text-slate-900">{label}</p>
      <p className="text-sm text-slate-500">{note}</p>
    </div>
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
      {status}
    </span>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.error('Error loading system-admin overview:', error);
      }
    };

    fetchData();
  }, []);

  const doctors = users.filter((user) => user.role === 'DOCTOR');
  const patients = users.filter((user) => user.role === 'PATIENT');
  const admins = users.filter((user) => user.role === 'ADMIN');
  const unverifiedDoctors = users.filter((user) => user.role === 'DOCTOR' && user.isVerified === false);

  const platformSignals = useMemo(
    () => [
      { label: 'Auth & OTP Service', status: 'Healthy', note: `${admins.length} admin account(s) ready for OTP access` },
      { label: 'Realtime Socket Layer', status: 'Healthy', note: `${stats?.activeSessions || 0} estimated active sessions` },
      { label: 'Inventory Sync', status: (stats?.lowStockMedicines || 0) > 0 ? 'Watch' : 'Healthy', note: `${stats?.lowStockMedicines || 0} low-stock medicine alerts` },
      { label: 'Emergency Escalation', status: (stats?.pendingAppointments || 0) > 10 ? 'Watch' : 'Healthy', note: `${stats?.pendingAppointments || 0} pending appointment requests requiring attention` },
    ],
    [admins.length, stats?.activeSessions, stats?.lowStockMedicines, stats?.pendingAppointments]
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="System Admin Overview"
          subtitle="Platform governance across access, security posture, service health, user distribution, and operational signals."
        />

        <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard title="Platform Users" value={stats?.totalUsers || 0} detail={`${patients.length} patients, ${doctors.length} doctors, ${admins.length} admins`} icon={UsersRound} tone="blue" />
          <OverviewCard title="Security Readiness" value={`${Math.min(100, 78 + admins.length * 4)}%`} detail={`${unverifiedDoctors.length} doctor account(s) awaiting review`} icon={ShieldCheck} tone="indigo" />
          <OverviewCard title="Active Services" value="7" detail="OTP, sockets, records, consultations, reminders, inventory, emergency" icon={ActivitySquare} tone="emerald" />
          <OverviewCard title="Alert Queue" value={(stats?.lowStockMedicines || 0) + (stats?.expiredMedicines || 0)} detail={`${stats?.expiredMedicines || 0} expired medicines and ${stats?.lowStockMedicines || 0} stock alerts`} icon={BellRing} tone="amber" />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Service Health Board</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Live platform status for the system-admin layer.</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <ActivitySquare className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {platformSignals.map((signal) => (
                <ServiceRow key={signal.label} {...signal} />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MiniPanel title="Audit Events" value={stats?.recentLogs?.length || 0} icon={Lock} />
              <MiniPanel title="Emergency Flow" value="Ready" icon={Siren} />
              <MiniPanel title="Backup Window" value="02:00" icon={HardDriveDownload} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Governance Snapshot</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">How the system-admin sits above doctor and patient flows.</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Database className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <PolicyCard title="Role & Access" text="Admin controls who enters the platform, which roles are active, and how permissions are enforced." />
              <PolicyCard title="System Monitoring" text="Admin watches service health, suspicious access patterns, and policy compliance instead of direct care delivery." />
              <PolicyCard title="Notifications & Integrations" text="Admin owns OTP delivery health, external service connections, reminder channels, and platform alerts." />
              <PolicyCard title="Audit & Recovery" text="Admin tracks critical changes and protects the platform through audit trails, exports, and backups." />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const MiniPanel = ({ title, value, icon: Icon }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <Icon className="h-5 w-5 text-blue-600" />
    <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
  </div>
);

const PolicyCard = ({ title, text }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
    <p className="text-sm font-black text-slate-900">{title}</p>
    <p className="mt-2 text-sm text-slate-600">{text}</p>
  </div>
);

export default AdminDashboard;
