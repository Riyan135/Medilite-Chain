import React, { useEffect, useState } from 'react';
import { ShieldAlert, Stethoscope, UserRound, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const UserGovernance = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/admin/users')
      .then((response) => setUsers(response.data))
      .catch((error) => {
        console.error('Error loading users:', error);
        toast.error('Failed to load user governance');
      });
  }, []);

  const doctors = users.filter((user) => user.role === 'DOCTOR');
  const patients = users.filter((user) => user.role === 'PATIENT');
  const admins = users.filter((user) => user.role === 'ADMIN');

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="User Governance"
          subtitle="Govern the ecosystem of admins, doctors, and patients without stepping into direct care delivery."
        />

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Metric title="Admin Accounts" value={admins.length} icon={ShieldAlert} />
          <Metric title="Doctor Accounts" value={doctors.length} icon={Stethoscope} />
          <Metric title="Patient Accounts" value={patients.length} icon={UsersRound} />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <UserTable title="Doctor Governance" rows={doctors} emptyText="No doctor accounts available yet." />
          <UserTable title="Patient Governance" rows={patients} emptyText="No patient accounts available yet." />
        </div>
      </main>
    </div>
  );
};

const Metric = ({ title, value, icon: Icon }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
    <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
  </div>
);

const UserTable = ({ title, rows, emptyText }) => (
  <section className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
    <div className="border-b border-slate-100 px-6 py-5">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
    </div>
    {rows.length === 0 ? (
      <div className="p-8 text-slate-400">{emptyText}</div>
    ) : (
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.id || row._id} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{row.name}</p>
                <p className="text-sm text-slate-500">{row.email || 'No email available'}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${row.isVerified === false ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {row.isVerified === false ? 'Review' : 'Active'}
            </span>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default UserGovernance;
