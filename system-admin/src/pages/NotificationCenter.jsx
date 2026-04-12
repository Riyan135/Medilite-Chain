import React from 'react';
import { BellRing, Mail, MessageSquareText, ShieldAlert, Siren } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const channels = [
  {
    title: 'OTP Email Channel',
    note: 'Used for admin and staff OTP authentication workflows.',
    icon: Mail,
    status: 'Primary',
  },
  {
    title: 'Reminder Notifications',
    note: 'Medicine reminders, due notices, and patient follow-up messaging.',
    icon: BellRing,
    status: 'Managed',
  },
  {
    title: 'Emergency Escalation',
    note: 'High-priority alerts for ambulance booking and critical operations.',
    icon: Siren,
    status: 'Escalated',
  },
  {
    title: 'Security Announcements',
    note: 'Account review, suspicious activity alerts, and role changes.',
    icon: ShieldAlert,
    status: 'Governed',
  },
];

const NotificationCenter = () => (
  <div className="flex min-h-screen bg-[#f0f4f8]">
    <Sidebar />
    <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <AdminTopbar
        title="Notification Center"
        subtitle="Control how platform messages, alerts, and high-priority communication flows are organized."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {channels.map((channel) => (
          <div key={channel.title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <channel.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{channel.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{channel.note}</p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">{channel.status}</span>
            </div>
          </div>
        ))}

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Admin Message Rules</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Rule text="Priority 1 events should fan out to email and in-app admin alerts." />
            <Rule text="OTP delivery failures should surface inside system monitoring immediately." />
            <Rule text="Low stock and expiry warnings should feed both reports and alert center pages." />
          </div>
        </div>
      </section>
    </main>
  </div>
);

const Rule = ({ text }) => <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">{text}</div>;

export default NotificationCenter;
