'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageTransitionWrapper({ children }) {
  const { i18n } = useTranslation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevLanguage, setPrevLanguage] = useState(i18n.language);

  useEffect(() => {
    if (i18n.language !== prevLanguage) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevLanguage(i18n.language);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [i18n.language, prevLanguage]);

  return (
    <div
      className={
        isTransitioning ? 'lang-transition-wrapper transitioning' : 'lang-transition-wrapper'
      }
    >
      {children}
    </div>
  );
}
