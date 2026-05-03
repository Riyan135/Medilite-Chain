import React from 'react';
import { Bot, Mail, MapPinned, MessageSquareMore, PlugZap } from 'lucide-react';
import { motion } from 'framer-motion';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const integrations = [
  { title: 'Email SMTP', note: 'OTP delivery, reminder notifications, emergency confirmations', icon: Mail, status: 'Connected' },
  { title: 'Maps / Places', note: 'Nearby hospitals and emergency route awareness', icon: MapPinned, status: 'Optional' },
  { title: 'Realtime Socket Layer', note: 'Consultation chat, appointment status notifications, live call signaling', icon: MessageSquareMore, status: 'Connected' },
  { title: 'AI Clinical Services', note: 'Symptom checker and record summarization integrations', icon: Bot, status: 'Configured' },
];

const Integrations = () => (
  <div className="flex min-h-screen bg-transparent">
    <Sidebar />
    <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
      <AdminTopbar
        title="Integrations"
        subtitle="See the external capabilities the platform depends on and where system-admin oversight matters."
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {integrations.map((integration, index) => (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1, duration: 0.3 }} key={integration.title} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-3 text-indigo-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <integration.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{integration.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{integration.note}</p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">{integration.status}</span>
            </div>
          </motion.div>
        ))}

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-3 text-slate-700 shadow-inner">
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
    </motion.main>
  </div>
);

const Note = ({ text }) => <div className="rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors duration-300 px-5 py-4 text-sm font-medium text-slate-600 border border-slate-100 hover:border-slate-300 shadow-sm">{text}</div>;

export default Integrations;
