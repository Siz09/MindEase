'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, BarChart2, BookOpen, Zap, Shield, Globe } from 'lucide-react';
import { getRegisterUrl } from '../utils/appUrls';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BentoGrid() {
  const { t } = useTranslation();

  const bentoItems = [
    {
      key: 'aiChat',
      icon: <MessageCircle size={24} />,
      title: t('bento.aiChat.title'),
      desc: t('bento.aiChat.desc'),
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
    },
    {
      key: 'mood',
      icon: <BarChart2 size={24} />,
      title: t('bento.mood.title'),
      desc: t('bento.mood.desc'),
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    },
    {
      key: 'journal',
      icon: <BookOpen size={24} />,
      title: t('bento.journal.title'),
      desc: t('bento.journal.desc'),
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
    },
    {
      key: 'mindfulness',
      icon: <Zap size={24} />,
      title: t('bento.mindfulness.title'),
      desc: t('bento.mindfulness.desc'),
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
    },
    {
      key: 'privacy',
      icon: <Shield size={24} />,
      title: t('bento.privacy.title'),
      desc: t('bento.privacy.desc'),
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80',
    },
    {
      key: 'nepal',
      icon: <Globe size={24} />,
      title: t('bento.nepal.title'),
      desc: t('bento.nepal.desc'),
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80',
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5, ease: 'easeOut' }}
          >
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
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button asChild size="lg">
            <a href={getRegisterUrl()}>{t('bento.ctaButton') || 'Get Started Now'}</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
