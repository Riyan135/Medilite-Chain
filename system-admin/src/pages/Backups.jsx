import React from 'react';
import { Download, HardDriveDownload, History, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const Backups = () => (
  <div className="flex min-h-screen bg-transparent">
    <Sidebar />
    <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <AdminTopbar
        title="Backups & Recovery"
        subtitle="Track backup posture, export readiness, and recovery planning for the platform."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BackupCard delay={0.1} title="Snapshot Status" value="Ready" note="Last internal snapshot window completed successfully." icon={HardDriveDownload} />
        <BackupCard delay={0.2} title="Recovery Drill" value="Planned" note="Quarterly recovery validation is recommended for system-admin." icon={ShieldCheck} />
        <BackupCard delay={0.3} title="Export Queue" value="Manual" note="Reports and governance exports should be initiated by admins." icon={Download} />
      </section>

      <section className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-3 text-slate-700 shadow-inner">
            <History className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Recovery Notes</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <BackupNote text="Document which services must return first: auth, database, notifications, realtime transport." />
          <BackupNote text="Store encrypted config and environment references separately from user-facing apps." />
          <BackupNote text="System-admin should own export history, recovery checklists, and backup policy reviews." />
        </div>
      </section>
    </motion.main>
  </div>
);

const BackupCard = ({ title, value, note, icon: Icon, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-5 text-sm font-bold tracking-wide text-slate-400 uppercase">{title}</p>
    <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight">{value}</p>
    <p className="mt-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4">{note}</p>
  </motion.div>
);

const BackupNote = ({ text }) => <div className="rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors duration-300 px-5 py-4 text-sm font-medium text-slate-600 border border-slate-100 hover:border-slate-300 shadow-sm">{text}</div>;

export default Backups;
