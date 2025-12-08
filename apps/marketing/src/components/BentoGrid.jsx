'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart2, BookOpen, Zap, Shield, Globe } from 'lucide-react';
import { getRegisterUrl } from '../utils/appUrls';

export default function BentoGrid() {
  const { t } = useTranslation();

  const bentoItems = [
    {
      key: 'aiChat',
      icon: <MessageCircle size={24} />,
      title: t('bento.aiChat.title'),
      desc: t('bento.aiChat.desc'),
    },
    {
      key: 'mood',
      icon: <BarChart2 size={24} />,
      title: t('bento.mood.title'),
      desc: t('bento.mood.desc'),
    },
    {
      key: 'journal',
      icon: <BookOpen size={24} />,
      title: t('bento.journal.title'),
      desc: t('bento.journal.desc'),
    },
    {
      key: 'mindfulness',
      icon: <Zap size={24} />,
      title: t('bento.mindfulness.title'),
      desc: t('bento.mindfulness.desc'),
    },
    {
      key: 'privacy',
      icon: <Shield size={24} />,
      title: t('bento.privacy.title'),
      desc: t('bento.privacy.desc'),
    },
    {
      key: 'nepal',
      icon: <Globe size={24} />,
      title: t('bento.nepal.title'),
      desc: t('bento.nepal.desc'),
    },
  ];

  return (
    <section id="features" className="me-bento-section">
      <div className="me-bento-header">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="me-bento-eyebrow">{t('features.bento.eyebrow') || 'Key Features'}</div>
          <h2 className="me-bento-title">{t('features.bento.title') || 'Everything You Need'}</h2>
          <p className="me-bento-subtitle">
            {t('features.bento.subtitle') ||
              'Comprehensive features for your mental wellness journey'}
          </p>
        </motion.div>
      </div>

      <div className="me-bento-grid">
        {bentoItems.map((item, idx) => (
          <motion.div
            key={item.key}
            className="me-bento-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5, ease: 'easeOut' }}
          >
            <div className="me-bento-card-icon">{item.icon}</div>
            <h3 className="me-bento-card-title">{item.title}</h3>
            <p className="me-bento-card-desc">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="me-bento-cta">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="me-bento-cta-text"
        >
          {t('bento.cta') || 'Ready to start your wellness journey?'}
        </motion.p>
        <motion.a
          href={getRegisterUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = getRegisterUrl();
            console.log('[BentoGrid] Navigating to:', url);
            window.location.href = url;
          }}
          className="me-button me-button-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('bento.ctaButton') || 'Get Started Now'}
        </motion.a>
      </div>
    </section>
  );
}
