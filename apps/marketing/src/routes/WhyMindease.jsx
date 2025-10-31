'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Lock } from 'lucide-react';

export default function WhyMindease() {
  const { t } = useTranslation();

  const differentiators = [
    {
      icon: <Lock className="w-8 h-8 text-accent" />,
      title: 'Privacy Focused',
      desc: "Your data never leaves your device. We don't sell your information.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-accent" />,
      title: 'Evidence-Based',
      desc: 'Built on research in cognitive behavioral therapy and mindfulness.',
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: 'Culturally Aware',
      desc: 'Designed by and for Nepali communities who understand local context.',
    },
    {
      icon: <Zap className="w-8 h-8 text-accent" />,
      title: 'Always Accessible',
      desc: 'Works offline and requires minimal data. Made for unreliable connections.',
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
        <title>MindEase — {t('nav.why')}</title>
        <meta name="description" content={t('why.subtitle')} />
        <meta property="og:title" content={`MindEase - ${t('nav.why')}`} />
        <meta property="og:description" content={t('why.subtitle')} />
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
            Our Mission
          </motion.p>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              {t('why.title')}
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-2xl mx-auto text-lg text-slate-300"
          >
            {t('why.subtitle')}
          </motion.p>
        </motion.div>

        <div className="space-y-16">
          {/* Problem */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold mb-4">{t('why.problem.title')}</h2>
              <p className="text-slate-300 text-lg leading-relaxed">{t('why.problem.desc')}</p>
              <ul className="mt-6 space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">•</span>
                  <span className="text-slate-400">
                    Limited access to professional mental health services
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">•</span>
                  <span className="text-slate-400">
                    Social stigma surrounding mental health discussions
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">•</span>
                  <span className="text-slate-400">High cost of therapy and counseling</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">•</span>
                  <span className="text-slate-400">Lack of culturally relevant resources</span>
                </li>
              </ul>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="p-8 bg-red-500/10 rounded-2xl border border-red-500/20"
            >
              <p className="text-red-400 text-center font-semibold">The Challenge</p>
              <p className="mt-4 text-slate-300 text-center">
                Millions in Nepal and beyond lack access to quality mental health support they
                deserve.
              </p>
            </motion.div>
          </motion.div>

          {/* Solution */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              variants={itemVariants}
              className="p-8 bg-accent/10 rounded-2xl border border-accent/20 order-2 md:order-1"
            >
              <p className="text-accent text-center font-semibold">Our Solution</p>
              <p className="mt-4 text-slate-300 text-center">
                AI-powered technology combined with human-centered design for accessible, affordable
                mental wellness.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="order-1 md:order-2">
              <h2 className="text-3xl font-bold mb-4">{t('why.solution.title')}</h2>
              <p className="text-slate-300 text-lg leading-relaxed">{t('why.solution.desc')}</p>
              <ul className="mt-6 space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">✓</span>
                  <span className="text-slate-400">24/7 availability with zero judgment</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">✓</span>
                  <span className="text-slate-400">
                    Affordable alternative to traditional therapy
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">✓</span>
                  <span className="text-slate-400">Culturally sensitive and multilingual</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-accent font-bold">✓</span>
                  <span className="text-slate-400">Private and completely secure</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Trust section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4 text-center">{t('why.trust.title')}</h2>
            <p className="text-slate-300 text-lg text-center mb-12 max-w-2xl mx-auto">
              {t('why.trust.desc')}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {differentiators.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-accent/50 transition-all"
                >
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <a
            href="http://localhost:5173/login"
            className="inline-block px-8 py-4 bg-accent text-slate-950 rounded-full font-semibold hover:shadow-lg hover:shadow-accent/50 transition-all hover:scale-105"
          >
            {t('why.cta')}
          </a>
        </motion.div>
      </Section>
    </>
  );
}
