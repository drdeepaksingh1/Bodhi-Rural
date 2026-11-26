'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'en' | 'hi';
const LanguageContext = createContext<Language>('en');
const preferenceKey = 'bodhimart-language';

export function useBodhiMartLanguage() {
  return useContext(LanguageContext);
}

export function Copy({ en, hi }: { en: string; hi: string }) {
  return useBodhiMartLanguage() === 'hi' ? hi : en;
}

export function SiteLanguage({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    try {
      if (localStorage.getItem(preferenceKey) === 'hi') setLanguage('hi');
    } catch {
      // The selector still works without storage.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function changeLanguage(language: Language) {
    setLanguage(language);
    try {
      localStorage.setItem(preferenceKey, language);
    } catch {
      // Keep the preference for this visit.
    }
  }

  return (
    <LanguageContext.Provider value={language}>
        <div className="mx-auto flex max-w-[1320px] justify-end px-4 py-2 print:hidden">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <Copy en="Language" hi="भाषा" />
            <select className="min-h-11 rounded-lg border border-gray-300 bg-white px-3"
              value={language} onChange={(event) => changeLanguage(event.target.value === 'hi' ? 'hi' : 'en')}>
              <option value="en" lang="en">English</option>
              <option value="hi" lang="hi">हिन्दी</option>
            </select>
          </label>
        </div>
        {children}
    </LanguageContext.Provider>
  );
}
