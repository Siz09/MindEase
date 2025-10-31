'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
      <motion.button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          i18n.language === 'en' ? 'bg-accent text-slate-950' : 'text-slate-300 hover:text-white'
        }`}
        aria-label="Switch to English"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        EN
      </motion.button>
      <motion.button
        onClick={() => changeLanguage('ne')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          i18n.language === 'ne' ? 'bg-accent text-slate-950' : 'text-slate-300 hover:text-white'
        }`}
        aria-label="Switch to Nepali"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ने
      </motion.button>
    </div>
  );
}
