import React, { useState } from 'react';
import { MoonStar, RefreshCcw, SunMedium } from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { getStoredAdminTheme, persistAdminTheme } from '../lib/theme';

const themeChoices = [
  {
    id: 'light',
    title: 'Light Theme',
    description: 'Bright dashboard with soft gray backgrounds and white cards.',
    icon: SunMedium,
  },
  {
    id: 'dark',
    title: 'Dark Theme',
    description: 'Low-light dashboard with deeper panels and stronger contrast.',
    icon: MoonStar,
  },
];

const Settings = () => {
  const [selectedTheme, setSelectedTheme] = useState(getStoredAdminTheme());
  const [updating, setUpdating] = useState(false);

  const handleUpdateTheme = () => {
    setUpdating(true);
    persistAdminTheme(selectedTheme);
    toast.success('Theme updated. Restarting page...');
    window.setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="Settings"
          subtitle="Choose your preferred admin theme and apply it across the full dashboard."
        />

        <section className="max-w-4xl rounded-[2rem] border border-white bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-900">Theme Preferences</h2>
          <p className="mt-2 text-slate-500">
            Toggle between light and dark mode, then press update to restart the admin interface.
          </p>

          <div className="mt-8 grid gap-4">
            {themeChoices.map((choice) => {
              const Icon = choice.icon;
              const active = selectedTheme === choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setSelectedTheme(choice.id)}
                  className={`flex items-start gap-4 rounded-[1.5rem] border px-5 py-5 text-left transition-all duration-300 ${
                    active
                      ? 'border-[#1d4ed8] bg-blue-50 shadow-md'
                      : 'border-slate-200 bg-[#f0f4f8] hover:-translate-y-0.5 hover:border-slate-300'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-[#1d4ed8] text-white' : 'bg-white text-slate-600'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{choice.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{choice.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUpdateTheme}
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-6 py-4 font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-200 disabled:opacity-70"
            >
              <RefreshCcw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
