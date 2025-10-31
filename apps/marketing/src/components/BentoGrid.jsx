'use client';

import { useTranslation } from 'react-i18next';
import BentoCard from './BentoCard';
import { MessageCircle, BarChart2, BookOpen, Zap, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BentoGrid() {
  const { t } = useTranslation();

  const bentoItems = [
    {
      key: 'aiChat',
      icon: <MessageCircle className="w-6 h-6" />,
      title: t('bento.aiChat.title'),
      desc: t('bento.aiChat.desc'),
    },
    {
      key: 'mood',
      icon: <BarChart2 className="w-6 h-6" />,
      title: t('bento.mood.title'),
      desc: t('bento.mood.desc'),
    },
    {
      key: 'journal',
      icon: <BookOpen className="w-6 h-6" />,
      title: t('bento.journal.title'),
      desc: t('bento.journal.desc'),
    },
    {
      key: 'mindfulness',
      icon: <Zap className="w-6 h-6" />,
      title: t('bento.mindfulness.title'),
      desc: t('bento.mindfulness.desc'),
    },
    {
      key: 'privacy',
      icon: <Shield className="w-6 h-6" />,
      title: t('bento.privacy.title'),
      desc: t('bento.privacy.desc'),
    },
    {
      key: 'nepal',
      icon: <Globe className="w-6 h-6" />,
      title: t('bento.nepal.title'),
      desc: t('bento.nepal.desc'),
    },
  ];

  return (
    <section id="features" className="w-full py-16 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-accent/3 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">
            {t('features.bento.eyebrow') || 'Key Features'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
            {t('features.bento.title') || 'Everything You Need'}
          </h2>
          <p className="text-text-light max-w-2xl mx-auto">
            {t('features.bento.subtitle') ||
              'Comprehensive features for your mental wellness journey'}
          </p>
        </motion.div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {bentoItems.map((item, idx) => (
            <BentoCard key={item.key} {...item} custom={idx} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-text-light mb-6">Ready to start your wellness journey?</p>
          <a
            href="http://localhost:5173/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-accent-dark transition-all"
          >
            Get Started Now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
