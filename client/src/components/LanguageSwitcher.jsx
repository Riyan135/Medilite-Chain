import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, languages, setLanguage } = useLanguage();

  return (
    <div className={`relative ${className}`}>
      <Languages className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="appearance-none bg-white/90 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
