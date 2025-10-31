'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertCircle, Heart, Lightbulb } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  const values = [
    {
      icon: <Heart size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Compassion First',
      desc: 'We approach every feature with empathy and understanding.',
    },
    {
      icon: <Lightbulb size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Innovation',
      desc: 'Continuously improving through user feedback and research.',
    },
    {
      icon: <AlertCircle size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Transparency',
      desc: 'Clear about our limitations and when professional help is needed.',
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
        <title>MindEase — {t('nav.about')}</title>
        <meta name="description" content={t('about.subtitle')} />
        <meta property="og:title" content={`MindEase - ${t('nav.about')}`} />
        <meta property="og:description" content={t('about.subtitle')} />
      </Helmet>

      <div className="container" style={{ paddingTop: 'var(--spacing-4xl)' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          className="text-center"
          style={{ marginBottom: 'var(--spacing-4xl)' }}
        >
          <motion.p variants={itemVariants} className="me-bento-eyebrow">
            {t('about.eyebrow') || 'Our Story'}
          </motion.p>
          <motion.h1 variants={itemVariants} className="me-bento-title">
            {t('about.title')}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="me-bento-subtitle"
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            {t('about.subtitle')}
          </motion.p>
        </motion.div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-3xl)',
            maxWidth: '48rem',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {/* Story */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="me-bento-card"
              style={{
                background: 'linear-gradient(135deg, rgba(22, 33, 62, 0.3), rgba(11, 18, 32, 0.3))',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)' }}>
                {t('about.story.title')}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                {t('about.story.desc')}
              </p>
            </motion.div>
          </motion.div>

          {/* Values */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2xl)' }}>
              {t('about.values') || 'Our Values'}
            </h2>
            <div className="me-bento-grid">
              {values.map((value, idx) => (
                <motion.div key={idx} variants={itemVariants} className="me-bento-card">
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>{value.icon}</div>
                  <h3 className="me-bento-card-title">{value.title}</h3>
                  <p className="me-bento-card-desc">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="me-bento-card"
              style={{
                background: 'linear-gradient(135deg, rgba(22, 33, 62, 0.3), rgba(11, 18, 32, 0.3))',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-lg)' }}>
                {t('about.team.title')}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                {t('about.team.desc')}
              </p>
            </motion.div>
          </motion.div>

          {/* Ethical Note */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              style={{
                padding: 'var(--spacing-2xl)',
                borderLeft: '4px solid rgba(239, 68, 68, 0.8)',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3
                style={{
                  fontWeight: '600',
                  fontSize: 'var(--font-size-lg)',
                  color: 'rgba(239, 68, 68, 0.8)',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <AlertCircle size={20} />
                {t('about.ethical.title')}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>{t('about.ethical.desc')}</p>
              <p
                style={{
                  marginTop: 'var(--spacing-lg)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {t('about.crisis') ||
                  "If you're in crisis, please contact: Nepal Crisis Helpline: 1645 or your local emergency services."}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 'var(--spacing-4xl)', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            {t('about.questions') || "Have questions? We'd love to hear from you."}
          </p>
          <a href="/contact" className="me-button me-button-primary">
            {t('about.cta') || 'Get in Touch'}
          </a>
        </motion.div>
      </div>
    </>
  );
}
