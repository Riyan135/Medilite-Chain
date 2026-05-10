import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, ShieldCheck, Signature, UserCircle2 } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Profile = () => {
  const { user } = useAuth();
  const [signatureForm, setSignatureForm] = useState({
    medicalLicenseNumber: user?.medicalLicenseNumber || '',
    digitalSignatureName: user?.digitalSignatureName || user?.name || '',
    digitalSignatureUrl: user?.digitalSignatureUrl || '',
  });
  const [savingSignature, setSavingSignature] = useState(false);

  const saveSignature = async (event) => {
    event.preventDefault();
    setSavingSignature(true);
    try {
      const response = await api.patch('/doctors/signature', signatureForm);
      const storedUser =
        localStorage.getItem('medilite_doctor_user') || localStorage.getItem('medilite_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const updatedUser = { ...parsedUser, ...response.data, token: parsedUser.token };
        localStorage.setItem('medilite_doctor_user', JSON.stringify(updatedUser));
        localStorage.setItem('medilite_user', JSON.stringify(updatedUser));
      }
      toast.success('Digital signature details saved');
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature details');
    } finally {
      setSavingSignature(false);
    }
  };

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

          <form onSubmit={saveSignature} className="rounded-[2rem] border border-white bg-white p-8 shadow-sm xl:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Signature className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Prescription Digital Signature</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">Used on downloaded prescriptions after video or clinic consultations.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical License Number</span>
                <input
                  value={signatureForm.medicalLicenseNumber}
                  onChange={(event) => setSignatureForm((current) => ({ ...current, medicalLicenseNumber: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-100 bg-[#f0f4f8] px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="REG-12345"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Signature Name</span>
                <input
                  value={signatureForm.digitalSignatureName}
                  onChange={(event) => setSignatureForm((current) => ({ ...current, digitalSignatureName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-100 bg-[#f0f4f8] px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Dr. Full Name"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Signature Image URL</span>
                <input
                  value={signatureForm.digitalSignatureUrl}
                  onChange={(event) => setSignatureForm((current) => ({ ...current, digitalSignatureUrl: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-100 bg-[#f0f4f8] px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="rounded-2xl border border-slate-100 bg-[#f0f4f8] p-5 md:min-w-72">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview</p>
                {signatureForm.digitalSignatureUrl ? (
                  <img src={signatureForm.digitalSignatureUrl} alt="Doctor signature preview" className="mt-3 h-16 max-w-56 object-contain" />
                ) : (
                  <p className="mt-3 text-2xl font-black text-slate-900">{signatureForm.digitalSignatureName || 'Dr. Signature'}</p>
                )}
                <p className="mt-2 text-sm font-bold text-slate-700">{signatureForm.digitalSignatureName || user?.name || 'Doctor'}</p>
                <p className="text-xs font-semibold text-slate-500">{signatureForm.medicalLicenseNumber || 'License not added'}</p>
              </div>

              <button
                type="submit"
                disabled={savingSignature}
                className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {savingSignature ? 'Saving...' : 'Save Signature'}
              </button>
            </div>
          </form>

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
