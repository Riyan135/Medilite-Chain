import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, FileBarChart2, PieChart, TrendingUp } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const ReportsCenter = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data);
      })
      .catch((error) => {
        console.error('Error loading reports data:', error);
      });
  }, []);

  const roleBreakdown = useMemo(() => {
    const roles = ['ADMIN', 'DOCTOR', 'PATIENT'];
    return roles.map((role) => ({
      role,
      count: users.filter((user) => user.role === role).length,
    }));
  }, [users]);

  const maxCount = Math.max(...roleBreakdown.map((item) => item.count), 1);

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Reports Center"
          subtitle="View platform analytics, user distribution, operational load, and trend-ready summary blocks."
        />

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ReportStat title="Total Appointments" value={stats?.totalAppointments || 0} icon={BarChart3} />
          <ReportStat title="Consultations" value={stats?.totalConsultations || 0} icon={TrendingUp} />
          <ReportStat title="Records" value={stats?.totalRecords || 0} icon={FileBarChart2} />
          <ReportStat title="Medicines" value={stats?.totalMedicines || 0} icon={PieChart} />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">Role Distribution</h2>
            <div className="mt-6 space-y-5">
              {roleBreakdown.map((item) => (
                <div key={item.role}>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>{item.role}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">Executive Summary</h2>
            <div className="mt-6 space-y-4">
              <Insight text={`${stats?.loggedInPatients || 0} patients have logged into the platform recently.`} />
              <Insight text={`${stats?.pendingAppointments || 0} appointments are waiting in the queue.`} />
              <Insight text={`${stats?.lowStockMedicines || 0} medicines are below threshold and ${stats?.expiredMedicines || 0} are expired.`} />
              <Insight text={`${stats?.pendingDoctors || 0} doctor accounts require admin review or approval.`} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const ReportStat = ({ title, value, icon: Icon }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
    <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
  </div>
);

const Insight = ({ text }) => <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">{text}</div>;

export default ReportsCenter;
