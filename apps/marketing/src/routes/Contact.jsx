'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Users } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const { t } = useTranslation();
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormState({ name: '', email: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const contactMethods = [
    {
      icon: <Mail className="w-8 h-8 text-accent" />,
      title: 'Email',
      desc: 'hello@mindease.app',
      link: 'mailto:hello@mindease.app',
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-accent" />,
      title: 'Support',
      desc: 'Get help with the app',
      link: '/',
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: 'Community',
      desc: 'Join our user community',
      link: '/',
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
        <title>MindEase — {t('nav.contact')}</title>
        <meta name="description" content={t('contact.subtitle')} />
        <meta property="og:title" content={`MindEase - ${t('nav.contact')}`} />
        <meta property="og:description" content={t('contact.subtitle')} />
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
            Support
          </motion.p>
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              {t('contact.title')}
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-2xl mx-auto text-lg text-slate-300"
          >
            {t('contact.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {contactMethods.map((method, idx) => (
            <motion.a
              key={idx}
              href={method.link}
              variants={itemVariants}
              className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10"
            >
              <div className="mb-4">{method.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{method.title}</h3>
              <p className="text-slate-400 text-sm">{method.desc}</p>
            </motion.a>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Form */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('contact.form.name')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-white"
                  placeholder="Your name"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('contact.form.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-white"
                  placeholder="your.email@example.com"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  {t('contact.form.message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all text-white resize-none"
                  placeholder="Tell us how we can help..."
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                type="submit"
                className="w-full px-6 py-3 bg-accent text-slate-950 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/50 transition-all hover:scale-105 disabled:opacity-50"
                disabled={submitted}
              >
                {submitted ? 'Message Sent! ✓' : t('contact.form.submit')}
              </motion.button>
            </form>
          </motion.div>

          {/* Partnership info */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="p-8 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700/50 h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-accent" />
                  <h3 className="font-semibold text-lg">{t('contact.partnership.title')}</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {t('contact.partnership.desc')}
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-300">
                      <strong>For NGOs:</strong> Reach out to implement MindEase at your
                      organization.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-300">
                      <strong>For Schools:</strong> Mental health resources for students and staff.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-300">
                      <strong>For Workplaces:</strong> Employee wellness programs available.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="mailto:partnerships@mindease.app"
                className="mt-6 inline-block px-6 py-2 bg-accent/20 text-accent rounded-lg font-semibold hover:bg-accent/30 transition-all"
              >
                Explore Partnership
              </a>
            </motion.div>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
