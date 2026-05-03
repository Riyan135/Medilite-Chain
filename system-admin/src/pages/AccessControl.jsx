import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, Lock, ShieldCheck, ShieldOff, UserCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const AccessControl = () => {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users for access control:', error);
      toast.error('Failed to load access control data');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const pendingDoctors = useMemo(
    () => users.filter((user) => user.role === 'DOCTOR' && user.isVerified === false),
    [users]
  );

  const handleApproveDoctor = async (id) => {
    try {
      await api.patch(`/admin/user/${id}/approve`);
      toast.success('Doctor approved');
      loadUsers();
    } catch (error) {
      console.error('Error approving doctor:', error);
      toast.error('Failed to approve doctor');
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Access Control"
          subtitle="Manage platform roles, account trust, approval queues, and permission posture."
        />

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <AccessStat title="Admins" value={users.filter((user) => user.role === 'ADMIN').length} icon={ShieldCheck} tone="blue" />
          <AccessStat title="Doctors" value={users.filter((user) => user.role === 'DOCTOR').length} icon={UserCheck} tone="emerald" />
          <AccessStat title="Patients" value={users.filter((user) => user.role === 'PATIENT').length} icon={UserPlus} tone="indigo" />
          <AccessStat title="Pending Approval" value={pendingDoctors.length} icon={Lock} tone="amber" />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-2xl font-black text-slate-900">Doctor Approval Queue</h2>
              <p className="mt-1 text-sm text-slate-500">Review doctor accounts before granting trusted clinical access.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingDoctors.length === 0 ? (
                <div className="p-8 text-slate-400">No pending doctor approvals right now.</div>
              ) : (
                pendingDoctors.map((doctor) => (
                  <div key={doctor.id || doctor._id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-900">{doctor.name}</p>
                      <p className="text-sm text-slate-500">{doctor.email || 'No email available'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-700">Pending</span>
                      <button
                        onClick={() => handleApproveDoctor(doctor.id || doctor._id)}
                        className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white"
                      >
                        Approve Doctor
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <Panel
              title="Permission Model"
              icon={KeyRound}
              items={[
                'Patients only access personal care tools and their own records.',
                'Doctors access consultations, appointments, and clinical workflows.',
                'System-admin controls approvals, policies, alerts, and platform-wide settings.',
              ]}
            />
            <Panel
              title="Protection Rules"
              icon={ShieldOff}
              items={[
                'Sensitive routes stay locked behind ADMIN-only access in the system-admin app.',
                'Unverified doctor accounts stay visible in the approval queue until promoted.',
                'Permission changes should be reflected in audit logs and notification rules.',
              ]}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

const AccessStat = ({ title, value, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-4xl font-black text-slate-900">{value}</p>
    </div>
  );
};

const Panel = ({ title, items, icon: Icon }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
    </div>
    <ul className="mt-5 space-y-3 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">{item}</li>
      ))}
    </ul>
  </div>
);

export default AccessControl;
