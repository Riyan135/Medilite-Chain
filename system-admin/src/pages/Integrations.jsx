import React from 'react';
import { Bot, Mail, MapPinned, MessageSquareMore, PlugZap } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const integrations = [
  { title: 'Email SMTP', note: 'OTP delivery, reminder notifications, emergency confirmations', icon: Mail, status: 'Connected' },
  { title: 'Maps / Places', note: 'Nearby hospitals and emergency route awareness', icon: MapPinned, status: 'Optional' },
  { title: 'Realtime Socket Layer', note: 'Consultation chat, appointment status notifications, live call signaling', icon: MessageSquareMore, status: 'Connected' },
  { title: 'AI Clinical Services', note: 'Symptom checker and record summarization integrations', icon: Bot, status: 'Configured' },
];

const Integrations = () => (
  <div className="flex min-h-screen bg-[#f0f4f8]">
    <Sidebar />
    <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <AdminTopbar
        title="Integrations"
        subtitle="See the external capabilities the platform depends on and where system-admin oversight matters."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <integration.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{integration.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{integration.note}</p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">{integration.status}</span>
            </div>
          </div>
        ))}

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <PlugZap className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Integration Governance Notes</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Note text="System-admin should own whether integrations are enabled, required, optional, or degraded." />
            <Note text="Failed third-party services should surface through monitoring and audit pages." />
            <Note text="Secrets and provider config should be treated as platform configuration, not doctor workflow." />
          </div>
        </div>
      </section>
    </main>
  </div>
);

const Note = ({ text }) => <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">{text}</div>;

export default Integrations;
