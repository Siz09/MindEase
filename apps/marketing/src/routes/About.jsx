'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';
import { motion } from 'framer-motion';
import { AlertCircle, Heart, Lightbulb } from 'lucide-react';

export default function About() {
  const { t } = useTranslation();

  const values = [
    {
      icon: <Heart className="w-8 h-8 text-accent" />,
      title: 'Compassion First',
      desc: 'We approach every feature with empathy and understanding.',
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-accent" />,
      title: 'Innovation',
      desc: 'Continuously improving through user feedback and research.',
    },
    {
      icon: <AlertCircle className="w-8 h-8 text-accent" />,
      title: 'Transparency',
      desc: 'Clear about our limitations and when professional help is needed.',
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
        <title>MindEase — {t('nav.about')}</title>
        <meta name="description" content={t('about.subtitle')} />
        <meta property="og:title" content={`MindEase - ${t('nav.about')}`} />
        <meta property="og:description" content={t('about.subtitle')} />
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
            Our Story
          </motion.p>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              {t('about.title')}
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-2xl mx-auto text-lg text-slate-300"
          >
            {t('about.subtitle')}
          </motion.p>
        </motion.div>

        <div className="space-y-12 max-w-3xl mx-auto">
          {/* Story */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/50"
            >
              <h2 className="text-2xl font-bold mb-4">{t('about.story.title')}</h2>
              <p className="text-slate-300 leading-relaxed">{t('about.story.desc')}</p>
            </motion.div>
          </motion.div>

          {/* Values */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((value, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-accent/50 transition-all"
                >
                  <div className="mb-4">{value.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-slate-400">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/50"
            >
              <h2 className="text-2xl font-bold mb-4">{t('about.team.title')}</h2>
              <p className="text-slate-300 leading-relaxed">{t('about.team.desc')}</p>
            </motion.div>
          </motion.div>

          {/* Ethical Note */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="p-8 border-l-4 border-red-500 bg-red-500/10 rounded-xl"
            >
              <h3 className="font-semibold text-lg text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {t('about.ethical.title')}
              </h3>
              <p className="text-slate-300">{t('about.ethical.desc')}</p>
              <p className="mt-4 text-sm text-slate-400">
                If you're in crisis, please contact: Nepal Crisis Helpline: 1645 or your local
                emergency services.
              </p>
            </motion.div>
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
          <p className="text-slate-300 mb-6">Have questions? We'd love to hear from you.</p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-accent text-slate-950 rounded-full font-semibold hover:shadow-lg hover:shadow-accent/50 transition-all hover:scale-105"
          >
            Get in Touch
          </a>
        </motion.div>
      </Section>
    </>
  );
}
