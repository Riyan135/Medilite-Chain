import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';

const CONTENT_KEY = 'system-admin-content-center';

const defaultContent = {
  faqTitle: 'Platform Help Center',
  faqSummary: 'System-admin controls help articles, legal copy, and operational guidance.',
  supportedLanguages: 'English, Hindi, Kannada, Tamil, Telugu, Marathi, Urdu, Gujarati, Arabic',
  legalNotice: 'Protect patient privacy, platform security, and regulated access at all times.',
};

const ContentCenter = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const raw = window.localStorage.getItem(CONTENT_KEY);
    if (raw) {
      try {
        setContent({ ...defaultContent, ...JSON.parse(raw) });
      } catch (error) {
        console.error('Failed to parse content center data:', error);
      }
    }
  }, []);

  const saveContent = () => {
    window.localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
    toast.success('Content center updated locally');
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Content Center"
          subtitle="Manage guidance, FAQ copy, supported-language notes, and platform governance messaging."
        />

        <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="grid gap-5">
            <Field delay={0.1} label="FAQ Title">
              <input value={content.faqTitle} onChange={(event) => setContent((current) => ({ ...current, faqTitle: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </Field>
            <Field delay={0.2} label="FAQ Summary">
              <textarea rows="4" value={content.faqSummary} onChange={(event) => setContent((current) => ({ ...current, faqSummary: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white resize-none" />
            </Field>
            <Field delay={0.3} label="Supported Languages">
              <textarea rows="3" value={content.supportedLanguages} onChange={(event) => setContent((current) => ({ ...current, supportedLanguages: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white resize-none" />
            </Field>
            <Field delay={0.4} label="Legal / Privacy Notice">
              <textarea rows="4" value={content.legalNotice} onChange={(event) => setContent((current) => ({ ...current, legalNotice: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white resize-none" />
            </Field>
          </div>

          <div className="mt-10 flex justify-end">
            <button onClick={saveContent} className="rounded-2xl bg-slate-900 px-8 py-3.5 font-black text-white hover:bg-indigo-600 hover:shadow-lg transition-all duration-300 active:scale-95">
              Save Content
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
    <div className="relative transition-all duration-300 focus-within:scale-[1.01] focus-within:shadow-md rounded-2xl">
      {children}
    </div>
  </motion.label>
);

export default ContentCenter;
