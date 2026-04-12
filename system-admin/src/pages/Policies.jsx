import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const POLICY_STORAGE_KEY = 'system-admin-policies';

const defaultPolicies = {
  lowStockThreshold: 10,
  expiryWarningDays: 30,
  autoEscalateEmergency: true,
  strictAdminOtp: true,
  consultationWindowMinutes: 45,
  auditRetentionDays: 180,
};

const Policies = () => {
  const [policies, setPolicies] = useState(defaultPolicies);

  useEffect(() => {
    const raw = window.localStorage.getItem(POLICY_STORAGE_KEY);
    if (raw) {
      try {
        setPolicies({ ...defaultPolicies, ...JSON.parse(raw) });
      } catch (error) {
        console.error('Failed to parse stored policies:', error);
      }
    }
  }, []);

  const savePolicies = () => {
    window.localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policies));
    toast.success('System policies updated locally');
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Policies"
          subtitle="Control rule thresholds and governance defaults that shape platform behavior."
        />

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Low Stock Threshold">
              <input type="number" value={policies.lowStockThreshold} onChange={(event) => setPolicies((current) => ({ ...current, lowStockThreshold: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
            <Field label="Expiry Warning Days">
              <input type="number" value={policies.expiryWarningDays} onChange={(event) => setPolicies((current) => ({ ...current, expiryWarningDays: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
            <Field label="Consultation Window Minutes">
              <input type="number" value={policies.consultationWindowMinutes} onChange={(event) => setPolicies((current) => ({ ...current, consultationWindowMinutes: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
            <Field label="Audit Retention Days">
              <input type="number" value={policies.auditRetentionDays} onChange={(event) => setPolicies((current) => ({ ...current, auditRetentionDays: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Toggle label="Auto Escalate Emergency Requests" checked={policies.autoEscalateEmergency} onChange={() => setPolicies((current) => ({ ...current, autoEscalateEmergency: !current.autoEscalateEmergency }))} />
            <Toggle label="Strict Admin OTP Enforcement" checked={policies.strictAdminOtp} onChange={() => setPolicies((current) => ({ ...current, strictAdminOtp: !current.strictAdminOtp }))} />
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={savePolicies} className="rounded-2xl bg-slate-900 px-6 py-3 font-black text-white">
              Save Policies
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="space-y-2 block">
    <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</span>
    {children}
  </label>
);

const Toggle = ({ label, checked, onChange }) => (
  <button onClick={onChange} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left">
    <span className="font-semibold text-slate-700">{label}</span>
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${checked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
      {checked ? 'On' : 'Off'}
    </span>
  </button>
);

export default Policies;
