import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Content Center"
          subtitle="Manage guidance, FAQ copy, supported-language notes, and platform governance messaging."
        />

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid gap-5">
            <Field label="FAQ Title">
              <input value={content.faqTitle} onChange={(event) => setContent((current) => ({ ...current, faqTitle: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
            <Field label="FAQ Summary">
              <textarea rows="4" value={content.faqSummary} onChange={(event) => setContent((current) => ({ ...current, faqSummary: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
            <Field label="Supported Languages">
              <textarea rows="3" value={content.supportedLanguages} onChange={(event) => setContent((current) => ({ ...current, supportedLanguages: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
            <Field label="Legal / Privacy Notice">
              <textarea rows="4" value={content.legalNotice} onChange={(event) => setContent((current) => ({ ...current, legalNotice: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </Field>
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={saveContent} className="rounded-2xl bg-slate-900 px-6 py-3 font-black text-white">
              Save Content
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

export default ContentCenter;
