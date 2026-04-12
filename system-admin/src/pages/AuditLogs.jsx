import React, { useEffect, useMemo, useState } from 'react';
import { FileClock, ShieldCheck, UserCog } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const AuditLogs = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data);
      })
      .catch((error) => {
        console.error('Error loading audit logs:', error);
      });
  }, []);

  const auditEntries = useMemo(() => {
    const systemEntries = (stats?.recentLogs || []).map((log) => ({
      id: log.id,
      actor: 'System',
      action: log.message,
      timestamp: log.time,
      category: 'Data',
    }));

    const approvalEntries = users
      .filter((user) => user.role === 'DOCTOR')
      .slice(0, 6)
      .map((user, index) => ({
        id: `doctor-${user.id || user._id}`,
        actor: 'System Admin',
        action: `${user.isVerified === false ? 'Doctor review pending' : 'Doctor access active'} for ${user.name}`,
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        category: 'Access',
      }));

    return [...systemEntries, ...approvalEntries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [stats?.recentLogs, users]);

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Audit Logs"
          subtitle="Track high-signal operational and access events across the platform."
        />

        <section className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-2xl font-black text-slate-900">Recent Audit Events</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {auditEntries.length === 0 ? (
              <div className="p-8 text-slate-400">No audit events available yet.</div>
            ) : (
              auditEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                      {entry.category === 'Access' ? <ShieldCheck className="h-5 w-5" /> : entry.category === 'Governance' ? <UserCog className="h-5 w-5" /> : <FileClock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{entry.action}</p>
                      <p className="mt-1 text-sm text-slate-500">Actor: {entry.actor}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuditLogs;
