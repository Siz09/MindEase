'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  BarChart2,
  BookOpen,
  Zap,
  Shield,
  Globe,
  Lock,
  Heart,
  Smartphone,
} from 'lucide-react';

export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      key: 'aiChat',
      icon: <MessageCircle size={24} />,
      title: t('features.aiChat.title'),
      desc: t('features.aiChat.desc'),
    },
    {
      key: 'mood',
      icon: <BarChart2 size={24} />,
      title: t('features.mood.title'),
      desc: t('features.mood.desc'),
    },
    {
      key: 'journal',
      icon: <BookOpen size={24} />,
      title: t('features.journal.title'),
      desc: t('features.journal.desc'),
    },
    {
      key: 'mindfulness',
      icon: <Zap size={24} />,
      title: t('features.mindfulness.title'),
      desc: t('features.mindfulness.desc'),
    },
    {
      key: 'privacy',
      icon: <Shield size={24} />,
      title: t('features.privacy.title'),
      desc: t('features.privacy.desc'),
    },
    {
      key: 'bilingual',
      icon: <Globe size={24} />,
      title: t('features.bilingual.title'),
      desc: t('features.bilingual.desc'),
    },
  ];

  const highlights = [
    {
      icon: <Lock size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'End-to-End Encrypted',
      desc: 'Your conversations are completely private and encrypted.',
    },
    {
      icon: <Heart size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Supportive AI',
      desc: 'Trained on compassionate communication techniques.',
    },
    {
      icon: <Smartphone size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Always Available',
      desc: 'Access MindEase 24/7 from any device.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <>
      <Helmet>
        <title>MindEase — {t('nav.features')}</title>
        <meta name="description" content={t('features.subtitle')} />
        <meta property="og:title" content={`MindEase - ${t('nav.features')}`} />
        <meta property="og:description" content={t('features.subtitle')} />
      </Helmet>

      <div className="container" style={{ paddingTop: 'var(--spacing-4xl)' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center"
          style={{ marginBottom: 'var(--spacing-4xl)' }}
        >
          <motion.p variants={itemVariants} className="me-bento-eyebrow">
            {t('features.eyebrow') || 'Our Capabilities'}
          </motion.p>
          <motion.h1 variants={itemVariants} className="me-bento-title">
            {t('features.title')}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="me-bento-subtitle"
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            {t('features.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="me-bento-grid"
          style={{
            marginBottom: 'var(--spacing-4xl)',
            maxWidth: '80rem',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {highlights.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="me-bento-card"
              style={{ paddingBottom: 0 }}
            >
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>{item.icon}</div>
              <h3 className="me-bento-card-title">{item.title}</h3>
              <p className="me-bento-card-desc">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Core Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          <h2 className="me-bento-section-title">
            {t('features.coreFeatures') || 'Core Features'}
          </h2>
          <div className="me-bento-grid">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.key}
                variants={itemVariants}
                className="me-bento-card"
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}
              >
                <div className="me-bento-card-icon" style={{ width: '3rem', height: '3rem' }}>
                  {feature.icon}
                </div>
                <h3 className="me-bento-card-title">{feature.title}</h3>
                <p className="me-bento-card-desc">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ delay: 0.6 }}
          className="me-bento-cta"
        >
          <h3 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)' }}>
            {t('features.readyCta') || 'Ready to transform your mental wellness?'}
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            {t('features.ctaDesc') || 'Start your free journey with MindEase today.'}
          </p>
          <a
            href={
              new URL('/login', import.meta.env.VITE_MINDEASE_APP_URL || 'http://localhost:5173')
                .href
            }
            className="me-button me-button-primary"
          >
            {t('features.startFree') || 'Start Free'}
          </a>
        </motion.div>
      </div>
    </>
  );
}
