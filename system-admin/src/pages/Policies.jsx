import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Policies"
          subtitle="Control rule thresholds and governance defaults that shape platform behavior."
        />

        <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="grid gap-5 md:grid-cols-2">
            <Field delay={0.1} label="Low Stock Threshold">
              <input type="number" value={policies.lowStockThreshold} onChange={(event) => setPolicies((current) => ({ ...current, lowStockThreshold: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </Field>
            <Field delay={0.2} label="Expiry Warning Days">
              <input type="number" value={policies.expiryWarningDays} onChange={(event) => setPolicies((current) => ({ ...current, expiryWarningDays: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </Field>
            <Field delay={0.3} label="Consultation Window Minutes">
              <input type="number" value={policies.consultationWindowMinutes} onChange={(event) => setPolicies((current) => ({ ...current, consultationWindowMinutes: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </Field>
            <Field delay={0.4} label="Audit Retention Days">
              <input type="number" value={policies.auditRetentionDays} onChange={(event) => setPolicies((current) => ({ ...current, auditRetentionDays: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </Field>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Toggle delay={0.5} label="Auto Escalate Emergency Requests" checked={policies.autoEscalateEmergency} onChange={() => setPolicies((current) => ({ ...current, autoEscalateEmergency: !current.autoEscalateEmergency }))} />
            <Toggle delay={0.6} label="Strict Admin OTP Enforcement" checked={policies.strictAdminOtp} onChange={() => setPolicies((current) => ({ ...current, strictAdminOtp: !current.strictAdminOtp }))} />
          </div>

          <div className="mt-10 flex justify-end">
            <button onClick={savePolicies} className="rounded-2xl bg-slate-900 px-8 py-3.5 font-black text-white hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 active:scale-95">
              Save Policies
            </button>
          </div>
        </section>
      </motion.main>
    </div>
  );
};

const Field = ({ label, children, delay = 0 }) => (
  <motion.label initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.3 }} className="space-y-2 block group">
    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 group-hover:text-indigo-500 transition-colors duration-300">{label}</span>
    <div className="relative transition-all duration-300 focus-within:scale-[1.02] focus-within:shadow-md rounded-2xl">
      {children}
    </div>
  </motion.label>
);

const Toggle = ({ label, checked, onChange, delay = 0 }) => (
  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }} onClick={onChange} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-5 py-4 text-left transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md">
    <span className="font-semibold text-slate-700">{label}</span>
    <span className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 ${checked ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>
      {checked ? 'On' : 'Off'}
    </span>
  </motion.button>
);

export default Policies;
