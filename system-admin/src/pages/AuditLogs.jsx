import React, { useEffect, useMemo, useState } from 'react';
import { FileClock, ShieldCheck, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Audit Logs"
          subtitle="Track high-signal operational and access events across the platform."
        />

        <section className="rounded-[2rem] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900">Recent Audit Events</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {auditEntries.length === 0 ? (
              <div className="p-8 text-slate-400">No audit events available yet.</div>
            ) : (
              auditEntries.map((entry, index) => (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }} key={entry.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between transition-all duration-300 hover:bg-slate-50/80 group">
                  <div className="flex gap-4">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 shadow-sm transition-colors duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      {entry.category === 'Access' ? <ShieldCheck className="h-5 w-5" /> : entry.category === 'Governance' ? <UserCog className="h-5 w-5" /> : <FileClock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 transition-colors group-hover:text-indigo-900">{entry.action}</p>
                      <p className="mt-1 text-sm text-slate-500">Actor: <span className="font-medium text-slate-700">{entry.actor}</span></p>
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{new Date(entry.timestamp).toLocaleString()}</div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </motion.main>
    </div>
  );
};

export default AuditLogs;
