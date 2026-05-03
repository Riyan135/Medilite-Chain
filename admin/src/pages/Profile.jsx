import React from 'react';
import { Mail, ShieldCheck, UserCircle2 } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Profile"
          subtitle="Review your account information and staff access details."
        />

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
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
              <InfoCard icon={Mail} label="Email" value={user?.email || 'Not available'} />
              <InfoCard icon={ShieldCheck} label="Role" value={user?.role || 'STAFF'} />
              <InfoCard icon={UserCircle2} label="Account Type" value="Portal Access Enabled" />
              <InfoCard icon={ShieldCheck} label="Status" value="Verified Access" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-extrabold text-slate-900">Quick Notes</h3>
            <div className="mt-6 space-y-4">
              <QuickNote title="Navigation" body="Use the sidebar to move between dashboard, appointments, patients, stock, and profile." />
              <QuickNote title="Security" body="Your staff session stays stored locally until you sign out from the profile menu." />
              <QuickNote title="Portal Access" body="Doctors and admins share the same visual shell with role-based access to modules." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-[1.5rem] border border-slate-100 bg-[#f0f4f8] p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1d4ed8] shadow-sm">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
  </div>
);

const QuickNote = ({ title, body }) => (
  <div className="rounded-[1.5rem] border border-slate-100 bg-[#f0f4f8] p-5">
    <h4 className="text-base font-bold text-slate-900">{title}</h4>
    <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
  </div>
);

export default Profile;
