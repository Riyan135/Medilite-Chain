import React from 'react';
import { Download, HardDriveDownload, History, ShieldCheck } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const Backups = () => (
  <div className="flex min-h-screen bg-[#f0f4f8]">
    <Sidebar />
    <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <AdminTopbar
        title="Backups & Recovery"
        subtitle="Track backup posture, export readiness, and recovery planning for the platform."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BackupCard title="Snapshot Status" value="Ready" note="Last internal snapshot window completed successfully." icon={HardDriveDownload} />
        <BackupCard title="Recovery Drill" value="Planned" note="Quarterly recovery validation is recommended for system-admin." icon={ShieldCheck} />
        <BackupCard title="Export Queue" value="Manual" note="Reports and governance exports should be initiated by admins." icon={Download} />
      </section>

      <section className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
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
    </main>
  </div>
);

const BackupCard = ({ title, value, note, icon: Icon }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
    <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
    <p className="mt-3 text-sm text-slate-500">{note}</p>
  </div>
);

const BackupNote = ({ text }) => <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">{text}</div>;

export default Backups;
