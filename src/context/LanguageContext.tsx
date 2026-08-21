"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from '@/data/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('TR');

  useEffect(() => {
    const savedLang = localStorage.getItem('elisam_language') as Language;
    if (savedLang && (savedLang === 'TR' || savedLang === 'EN' || savedLang === 'RU')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('elisam_language', lang);
  };

  const t = translations[language] || translations.TR;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'TR',
      setLanguage: () => {},
      t: translations.TR
    };
  }
  return context;
};
