'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertCircle, Heart, Lightbulb, Users, Code, Palette } from 'lucide-react';
import Stats from '../components/Stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
                background:
                  'linear-gradient(135deg, rgba(21, 128, 61, 0.05), rgba(14, 165, 233, 0.05))',
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
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="h-full">
                    <CardContent>
                      <div className="mb-6 text-primary">{value.icon}</div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
                    </CardContent>
                  </Card>
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
            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2xl)' }}>
              {t('about.team.title')}
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: '1.8',
                marginBottom: 'var(--spacing-2xl)',
              }}
            >
              {t('about.team.desc')}
            </p>
            <div className="me-bento-grid">
              {[
                {
                  icon: <Code size={24} style={{ color: 'var(--color-accent)' }} />,
                  name: t('about.team.dev.name') || 'Development Team',
                  role: t('about.team.dev.role') || 'Building the future of mental wellness',
                },
                {
                  icon: <Palette size={24} style={{ color: 'var(--primary-blue)' }} />,
                  name: t('about.team.design.name') || 'Design Team',
                  role: t('about.team.design.role') || 'Creating compassionate experiences',
                },
                {
                  icon: <Users size={24} style={{ color: 'var(--calm-teal)' }} />,
                  name: t('about.team.health.name') || 'Mental Health Advisors',
                  role: t('about.team.health.role') || 'Ensuring ethical and effective support',
                },
              ].map((member, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="h-full">
                    <CardContent>
                      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                        {member.icon}
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">{member.name}</h3>
                      <p className="text-muted-foreground leading-relaxed">{member.role}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Impact */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
            style={{ marginTop: 'var(--spacing-4xl)' }}
          >
            <Stats />
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
                borderLeft: '4px solid rgba(251, 191, 36, 0.8)',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3
                style={{
                  fontWeight: '600',
                  fontSize: 'var(--font-size-lg)',
                  color: 'rgba(180, 83, 9, 0.9)',
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
          <Button asChild size="lg">
            <a href="/contact">{t('about.cta') || 'Get in Touch'}</a>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
