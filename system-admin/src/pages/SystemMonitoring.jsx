import React, { useEffect, useMemo, useState } from 'react';
import { ActivitySquare, BellDot, Cpu, MailCheck, RadioTower, Shield } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const SystemMonitoring = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((response) => setStats(response.data)).catch((error) => {
      console.error('Error loading monitoring stats:', error);
    });
  }, []);

  const services = useMemo(
    () => [
      { label: 'API Gateway', note: `${stats?.totalUsers || 0} total users currently indexed`, status: 'Healthy', icon: Cpu },
      { label: 'OTP Mail Delivery', note: 'Depends on SMTP health and Gmail app-password validity', status: 'Watch', icon: MailCheck },
      { label: 'Realtime Transport', note: `${stats?.activeSessions || 0} estimated socket sessions`, status: 'Healthy', icon: RadioTower },
      { label: 'Security Monitoring', note: `${stats?.pendingDoctors || 0} doctor account(s) awaiting trust review`, status: 'Healthy', icon: Shield },
      { label: 'Alert Stream', note: `${stats?.lowStockMedicines || 0} low-stock and ${stats?.expiredMedicines || 0} expiry warnings`, status: 'Watch', icon: BellDot },
      { label: 'Observability Layer', note: `${stats?.recentLogs?.length || 0} recent platform log entries available`, status: 'Healthy', icon: ActivitySquare },
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

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {services.map((service) => (
            <div key={service.label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{service.label}</h2>
                    <p className="mt-2 text-sm text-slate-500">{service.note}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${service.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default SystemMonitoring;
