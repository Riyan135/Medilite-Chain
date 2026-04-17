import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Mail, Phone, ShieldAlert, Stethoscope, UserRound, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  customDoctorId: '',
};

const UserGovernance = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  const [createdDoctor, setCreatedDoctor] = useState(null);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load user governance');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const doctors = useMemo(
    () => users.filter((user) => user.role === 'DOCTOR').sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  const patients = useMemo(() => users.filter((user) => user.role === 'PATIENT'), [users]);
  const admins = useMemo(() => users.filter((user) => user.role === 'ADMIN'), [users]);

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const generateUuid = () => {
    // Generate 8-character uppercase alphanumeric UUID
    const uuid = Math.random().toString(36).substring(2, 10).toUpperCase();
    updateField('customDoctorId', `DOC-${uuid}`);
  };

  const handleCreateDoctor = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.specialization.trim()) {
      toast.error('Enter doctor name, email, and specialization');
      return;
    }

    setCreatingDoctor(true);
    try {
      const response = await api.post('/admin/doctors', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        customDoctorId: formData.customDoctorId.trim(),
      });

      setCreatedDoctor(response.data);
      setFormData(initialFormState);
      toast.success(`Doctor created with ID ${response.data.doctorId}`);
      await loadUsers();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create doctor account';
      console.error('Error creating doctor account:', error);
      toast.error(message);
    } finally {
      setCreatingDoctor(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="User Governance"
          subtitle="Provision doctor access from one place, issue permanent Doctor IDs, and keep the account roster clean and auditable."
        />

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Metric title="Admin Accounts" value={admins.length} icon={ShieldAlert} />
          <Metric title="Doctor Accounts" value={doctors.length} icon={Stethoscope} />
          <Metric title="Patient Accounts" value={patients.length} icon={UsersRound} />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">Create Doctor Account</h2>
              <p className="mt-2 text-sm text-slate-500">
                Doctors are provisioned only from this console. A permanent Doctor ID is generated and emailed after creation.
              </p>
            </div>

            <form onSubmit={handleCreateDoctor} className="grid gap-4">
              <FormField label="Doctor Name" icon={<UserRound className="h-5 w-5 text-blue-600" />}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Enter doctor name"
                  required
                />
              </FormField>

              <FormField label="Email Address" icon={<Mail className="h-5 w-5 text-blue-600" />}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="doctor@medilite.com"
                  required
                />
              </FormField>

              <FormField label="Phone Number" icon={<Phone className="h-5 w-5 text-blue-600" />}>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Optional contact number"
                />
              </FormField>

              <FormField label="Specialization" icon={<Stethoscope className="h-5 w-5 text-blue-600" />}>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(event) => updateField('specialization', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Cardiology, Orthopedics, etc."
                  required
                />
              </FormField>

              <FormField label="Custom Doctor ID" icon={<BadgeCheck className="h-5 w-5 text-blue-600" />}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.customDoctorId}
                    onChange={(event) => updateField('customDoctorId', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pl-12 font-semibold text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Leave blank for auto ID"
                  />
                  <button
                    type="button"
                    onClick={generateUuid}
                    className="shrink-0 rounded-2xl bg-blue-100 px-5 py-4 font-black text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    Generate UUID
                  </button>
                </div>
              </FormField>

              <button
                type="submit"
                disabled={creatingDoctor}
                className="mt-2 rounded-2xl bg-[#1d4ed8] px-5 py-4 font-black text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creatingDoctor ? 'Creating Doctor...' : 'Create Doctor'}
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              {createdDoctor ? (
                <>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">Latest Doctor ID</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{createdDoctor.doctorId}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {createdDoctor.name} is ready to log in with this Doctor ID. The ID was also sent to {createdDoctor.email}.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  New doctor IDs will appear here right after account creation.
                </p>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8">
            <UserTable title="Doctor Governance" rows={doctors} emptyText="No doctor accounts available yet." />
            <UserTable title="Patient Governance" rows={patients} emptyText="No patient accounts available yet." />
          </div>
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

const FormField = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {icon}
      </div>
      {children}
    </div>
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
          <div key={row.id || row._id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{row.name}</p>
                <p className="text-sm text-slate-500">{row.email || 'No email available'}</p>
                {row.role === 'DOCTOR' && (
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                    {row.doctorId || 'Doctor ID pending'} {row.specialization ? `• ${row.specialization}` : ''}
                  </p>
                )}
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
