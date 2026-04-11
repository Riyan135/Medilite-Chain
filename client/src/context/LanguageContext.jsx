import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const GOOGLE_COOKIE_NAME = 'googtrans';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'Kannada' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'ar', label: 'Arabic' },
];

const LanguageContext = createContext(null);

const getStoredLanguage = () => {
  const stored = window.localStorage.getItem('medilite_language');
  return stored || 'en';
};

const setGoogleTranslateCookie = (languageCode) => {
  const cookieValue = `/en/${languageCode}`;
  document.cookie = `${GOOGLE_COOKIE_NAME}=${cookieValue};path=/`;
  document.cookie = `${GOOGLE_COOKIE_NAME}=${cookieValue};path=/;domain=${window.location.hostname}`;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const currentLanguage = getStoredLanguage();
    setLanguageState(currentLanguage);
    setGoogleTranslateCookie(currentLanguage);

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: LANGUAGE_OPTIONS.map((option) => option.code).join(','),
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    if (!document.querySelector('script[data-google-translate]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.dataset.googleTranslate = 'true';
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, []);

  const setLanguage = (nextLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('medilite_language', nextLanguage);
    setGoogleTranslateCookie(nextLanguage);
    window.location.reload();
  };

  const value = useMemo(
    () => ({
      language,
      languages: LANGUAGE_OPTIONS,
      setLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <div id="google_translate_element" style={{ display: 'none' }} />
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
