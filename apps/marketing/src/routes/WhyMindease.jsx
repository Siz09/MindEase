'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Lock } from 'lucide-react';
import { getRegisterUrl } from '../utils/appUrls';

export default function WhyMindease() {
  const { t } = useTranslation();

  const differentiators = [
    {
      icon: <Lock size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Privacy Focused',
      desc: "Your data never leaves your device. We don't sell your information.",
    },
    {
      icon: <TrendingUp size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Evidence-Based',
      desc: 'Built on research in cognitive behavioral therapy and mindfulness.',
    },
    {
      icon: <Users size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Culturally Aware',
      desc: 'Designed by and for Nepali communities who understand local context.',
    },
    {
      icon: <Zap size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Always Accessible',
      desc: 'Works offline and requires minimal data. Made for unreliable connections.',
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
        <title>MindEase — {t('nav.why')}</title>
        <meta name="description" content={t('why.subtitle')} />
        <meta property="og:title" content={`MindEase - ${t('nav.why')}`} />
        <meta property="og:description" content={t('why.subtitle')} />
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
            {t('why.eyebrow') || 'Our Mission'}
          </motion.p>
          <motion.h1 variants={itemVariants} className="me-bento-title">
            {t('why.title') || 'Why MindEase'}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="me-bento-subtitle"
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            {t('why.subtitle') || 'Accessible mental health support for everyone'}
          </motion.p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4xl)' }}>
          {/* Problem */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--spacing-3xl)',
              alignItems: 'center',
            }}
            className="md:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <h2 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-lg)' }}>
                {t('why.problem.title')}
              </h2>
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-lg)',
                  lineHeight: '1.8',
                }}
              >
                {t('why.problem.desc')}
              </p>
              <ul
                style={{
                  marginTop: 'var(--spacing-2xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)',
                }}
              >
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>•</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.problem.point1') ||
                      'Limited access to professional mental health services'}
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>•</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.problem.point2') ||
                      'Social stigma surrounding mental health discussions'}
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>•</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.problem.point3') || 'High cost of therapy and counseling'}
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>•</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.problem.point4') || 'Lack of culturally relevant resources'}
                  </span>
                </li>
              </ul>
            </motion.div>
            <motion.div
              variants={itemVariants}
              style={{
                padding: 'var(--spacing-2xl)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-2xl)',
              }}
            >
              <p
                style={{ color: 'rgba(239, 68, 68, 0.8)', textAlign: 'center', fontWeight: '600' }}
              >
                {t('why.problemTitle') || 'The Challenge'}
              </p>
              <p
                style={{
                  marginTop: 'var(--spacing-lg)',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                }}
              >
                {t('why.problemDesc') ||
                  'Millions in Nepal and beyond lack access to quality mental health support they deserve.'}
              </p>
            </motion.div>
          </motion.div>

          {/* Solution */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--spacing-3xl)',
              alignItems: 'center',
            }}
            className="md:grid-cols-2"
          >
            <motion.div
              variants={itemVariants}
              style={{
                padding: 'var(--spacing-2xl)',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-2xl)',
                order: 2,
              }}
              className="md:order-1"
            >
              <p style={{ color: 'var(--color-accent)', textAlign: 'center', fontWeight: '600' }}>
                {t('why.solutionTitle') || 'Our Solution'}
              </p>
              <p
                style={{
                  marginTop: 'var(--spacing-lg)',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                }}
              >
                {t('why.solutionDesc') ||
                  'AI-powered technology combined with human-centered design for accessible, affordable mental wellness.'}
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="md:order-2">
              <h2 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-lg)' }}>
                {t('why.solution.title') || 'Our Solution'}
              </h2>
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-lg)',
                  lineHeight: '1.8',
                }}
              >
                {t('why.solution.desc') ||
                  'Private, affordable, and accessible support powered by AI.'}
              </p>
              <ul
                style={{
                  marginTop: 'var(--spacing-2xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)',
                }}
              >
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>✓</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.solution.point1') || '24/7 availability with zero judgment'}
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>✓</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.solution.point2') || 'Affordable alternative to traditional therapy'}
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>✓</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.solution.point3') || 'Culturally sensitive and multilingual'}
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>✓</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {t('why.solution.point4') || 'Private and completely secure'}
                  </span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Trust section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-3xl)',
                marginBottom: 'var(--spacing-lg)',
                textAlign: 'center',
              }}
            >
              {t('why.trust.title') || 'Trust and Privacy'}
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-lg)',
                textAlign: 'center',
                marginBottom: 'var(--spacing-3xl)',
                maxWidth: '42rem',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {t('why.trust.desc') ||
                'Your conversations are private. Anonymous mode lets you express yourself freely without judgment.'}
            </p>

            <div className="me-bento-grid">
              {differentiators.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants} className="me-bento-card">
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>{item.icon}</div>
                  <h3 className="me-bento-card-title">{item.title}</h3>
                  <p className="me-bento-card-desc">{item.desc}</p>
                </motion.div>
              ))}
            </div>
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
          <a
            href={getRegisterUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = getRegisterUrl();
              console.log('[WhyMindease] Navigating to:', url);
              window.location.href = url;
            }}
            className="me-button me-button-primary"
          >
            {t('why.cta')}
          </a>
        </motion.div>
      </div>
    </>
  );
}
