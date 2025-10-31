'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section className="w-full py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-light/5 pointer-events-none" />
      <div className="absolute top-40 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-light/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.p
            variants={itemVariants}
            className="text-accent text-sm font-semibold tracking-widest uppercase mb-6"
          >
            {t('hero.eyebrow') || 'Mental Wellness for Everyone'}
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-text leading-tight mb-6"
          >
            <span className="bg-gradient-to-r from-accent via-accent-dark to-accent bg-clip-text text-transparent">
              {t('hero.title')}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-text-light leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
        >
          <motion.a
            href="http://localhost:5173/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-accent-dark transition-all"
          >
            {t('hero.primaryCta')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </motion.a>

          <motion.a
            href="#features"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center px-8 py-4 bg-surface-secondary text-text rounded-lg font-semibold border border-border hover:bg-surface-secondary/80 transition-colors"
          >
            {t('hero.secondaryCta')}
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 pt-12 border-t border-border"
        >
          <p className="text-text-light text-sm mb-6">Trusted by users across Nepal</p>
          <div className="flex flex-wrap justify-center items-center gap-6 text-text-light text-sm">
            <span className="flex items-center gap-2">🔒 End-to-end encrypted</span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-2">🌍 Bilingual support</span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-2">⚡ Always available</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
