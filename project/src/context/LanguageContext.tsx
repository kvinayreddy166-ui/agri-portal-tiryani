import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  isTelugu: boolean;
  toggleLanguage: () => void;
  t: (english: string, telugu: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_KEY = 'tiryani-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    return stored === 'te' ? 'te' : 'en';
  });

  const value = useMemo(
    () => ({
      language,
      isTelugu: language === 'te',
      toggleLanguage: () =>
        setLanguage((current) => {
          const next = current === 'en' ? 'te' : 'en';
          window.localStorage.setItem(LANGUAGE_KEY, next);
          return next;
        }),
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

// Context modules intentionally export both the provider and hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
