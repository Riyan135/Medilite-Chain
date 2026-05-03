import React from 'react';
import { Mail, ShieldCheck, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Profile"
          subtitle="Review your account information and staff access details."
        />

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#1d4ed8] to-sky-500 text-3xl font-black text-white shadow-lg">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">{user?.name || 'Staff User'}</h2>
                <p className="mt-2 text-slate-500">This section keeps your basic staff information in one place.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <InfoCard delay={0.1} icon={Mail} label="Email" value={user?.email || 'Not available'} />
              <InfoCard delay={0.2} icon={ShieldCheck} label="Role" value={user?.role || 'STAFF'} />
              <InfoCard delay={0.3} icon={UserCircle2} label="Account Type" value="Portal Access Enabled" />
              <InfoCard delay={0.4} icon={ShieldCheck} label="Status" value="Verified Access" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
            <h3 className="text-2xl font-extrabold text-slate-900">Quick Notes</h3>
            <div className="mt-6 space-y-4">
              <QuickNote delay={0.1} title="Navigation" body="Use the sidebar to move between dashboard, appointments, patients, stock, and profile." />
              <QuickNote delay={0.2} title="Security" body="Your staff session stays stored locally until you sign out from the profile menu." />
              <QuickNote delay={0.3} title="Portal Access" body="Doctors and admins share the same visual shell with role-based access to modules." />
            </div>
          </div>
        </section>
      </motion.main>
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.3 }} className="rounded-[1.5rem] border border-slate-100 bg-[#f0f4f8] p-5 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1d4ed8] shadow-sm group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors duration-300">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-400 transition-colors duration-300">{label}</p>
    <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
  </motion.div>
);

const QuickNote = ({ title, body, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.3 }} className="rounded-[1.5rem] border border-slate-100 bg-[#f0f4f8] hover:bg-slate-50 hover:border-slate-300 transition-colors duration-300 p-5 shadow-sm">
    <h4 className="text-base font-bold text-slate-900">{title}</h4>
    <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
  </motion.div>
);

export default Profile;
