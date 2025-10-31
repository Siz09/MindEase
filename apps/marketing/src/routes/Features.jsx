'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';
import FeatureIcon from '../components/FeatureIcon';
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
      icon: <MessageCircle className="w-6 h-6" />,
      title: t('features.aiChat.title'),
      desc: t('features.aiChat.desc'),
    },
    {
      key: 'mood',
      icon: <BarChart2 className="w-6 h-6" />,
      title: t('features.mood.title'),
      desc: t('features.mood.desc'),
    },
    {
      key: 'journal',
      icon: <BookOpen className="w-6 h-6" />,
      title: t('features.journal.title'),
      desc: t('features.journal.desc'),
    },
    {
      key: 'mindfulness',
      icon: <Zap className="w-6 h-6" />,
      title: t('features.mindfulness.title'),
      desc: t('features.mindfulness.desc'),
    },
    {
      key: 'privacy',
      icon: <Shield className="w-6 h-6" />,
      title: t('features.privacy.title'),
      desc: t('features.privacy.desc'),
    },
    {
      key: 'bilingual',
      icon: <Globe className="w-6 h-6" />,
      title: t('features.bilingual.title'),
      desc: t('features.bilingual.desc'),
    },
  ];

  const highlights = [
    {
      icon: <Lock className="w-8 h-8 text-accent" />,
      title: 'End-to-End Encrypted',
      desc: 'Your conversations are completely private and encrypted.',
    },
    {
      icon: <Heart className="w-8 h-8 text-accent" />,
      title: 'Supportive AI',
      desc: 'Trained on compassionate communication techniques.',
    },
    {
      icon: <Smartphone className="w-8 h-8 text-accent" />,
      title: 'Always Available',
      desc: 'Access MindEase 24/7 from any device.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
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

      <Section>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.p
            variants={itemVariants}
            className="text-accent text-sm font-semibold tracking-widest uppercase mb-3"
          >
            {t('features.eyebrow') || 'Our Capabilities'}
          </motion.p>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              {t('features.title')}
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-2xl mx-auto text-lg text-slate-300"
          >
            {t('features.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-20"
        >
          {highlights.map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-accent/50 transition-all"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold mb-12">Core Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.key}
                variants={itemVariants}
                className="group p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10"
              >
                <div className="flex gap-4 items-start">
                  <FeatureIcon icon={feature.icon} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center p-8 bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl border border-accent/20"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to transform your mental wellness?</h3>
          <p className="text-slate-300 mb-6">Start your free journey with MindEase today.</p>
          <a
            href="http://localhost:5173/login"
            className="inline-block px-8 py-3 bg-accent text-slate-950 rounded-full font-semibold hover:shadow-lg hover:shadow-accent/50 transition-all hover:scale-105"
          >
            Start Free
          </a>
        </motion.div>
      </Section>
    </>
  );
}
