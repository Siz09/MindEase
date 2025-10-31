'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Languages, Zap } from 'lucide-react';

export default function Hero() {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <section className="me-hero">
      <div className="me-hero-bg">
        <div className="me-hero-gradient" style={{ top: '10%', right: '-10%', opacity: 0.5 }} />
        <div className="me-hero-gradient" style={{ bottom: '20%', left: '-15%', opacity: 0.3 }} />
      </div>

      <div className="me-hero-content">
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="me-hero-badge">
            {t('hero.eyebrow') || 'Mental Wellness for Everyone'}
          </motion.div>

          <motion.h1 variants={itemVariants} className="me-hero-title">
            {t('hero.title')}
          </motion.h1>

          <motion.p variants={itemVariants} className="me-hero-subtitle">
            {t('hero.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="me-hero-actions"
        >
          <motion.a
            href={
              new URL('/login', import.meta.env.VITE_MINDEASE_APP_URL || 'http://localhost:5173')
                .href
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="me-button me-button-primary"
          >
            {t('hero.primaryCta')}
            <ArrowRight size={20} />
          </motion.a>

          <motion.a
            href="#features"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="me-button me-button-secondary"
          >
            {t('hero.secondaryCta')}
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="me-hero-features"
        >
          <p className="me-hero-features-label">
            {t('hero.badge') || 'Trusted by users across Nepal'}
          </p>
          <ul className="me-hero-features-list">
            <li className="me-hero-features-item">
              🔒 {t('hero.feature1') || 'End-to-end encrypted'}
            </li>
            <li className="me-hero-features-item">
              🌍 {t('hero.feature2') || 'Bilingual support'}
            </li>
            <li className="me-hero-features-item">⚡ {t('hero.feature3') || 'Always available'}</li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
