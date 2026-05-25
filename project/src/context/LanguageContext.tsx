import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  isTelugu: boolean;
  toggleLanguage: () => void;
  t: (english: string, telugu: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo(
    () => ({
      language,
      isTelugu: language === 'te',
      toggleLanguage: () => setLanguage((current) => (current === 'en' ? 'te' : 'en')),
      t: (english: string, telugu: string) => (language === 'te' ? telugu : english),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
