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
import { getRegisterUrl } from '../utils/appUrls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      key: 'aiChat',
      icon: <MessageCircle size={24} />,
      title: t('features.aiChat.title'),
      desc: t('features.aiChat.desc'),
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
    },
    {
      key: 'mood',
      icon: <BarChart2 size={24} />,
      title: t('features.mood.title'),
      desc: t('features.mood.desc'),
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    },
    {
      key: 'journal',
      icon: <BookOpen size={24} />,
      title: t('features.journal.title'),
      desc: t('features.journal.desc'),
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
    },
    {
      key: 'mindfulness',
      icon: <Zap size={24} />,
      title: t('features.mindfulness.title'),
      desc: t('features.mindfulness.desc'),
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    },
    {
      key: 'privacy',
      icon: <Shield size={24} />,
      title: t('features.privacy.title'),
      desc: t('features.privacy.desc'),
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80',
    },
    {
      key: 'bilingual',
      icon: <Globe size={24} />,
      title: t('features.bilingual.title'),
      desc: t('features.bilingual.desc'),
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
    },
  ];

  const highlights = [
    {
      icon: <Lock size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'End-to-End Encrypted',
      desc: 'Your conversations are completely private and encrypted.',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80',
    },
    {
      icon: <Heart size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Supportive AI',
      desc: 'Trained on compassionate communication techniques.',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
    },
    {
      icon: <Smartphone size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Always Available',
      desc: 'Access MindEase 24/7 from any device.',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&q=80',
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
            <motion.div key={idx} variants={itemVariants}>
              <Card className="h-full">
                <CardContent>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
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
            {features.map((feature, _idx) => (
              <motion.div key={feature.key} variants={itemVariants}>
                <Card className="h-full">
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
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
          <Button asChild size="lg">
            <a href={getRegisterUrl()}>{t('features.startFree') || 'Start Free'}</a>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
