'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UserPlus, MessageCircle, Heart, TrendingUp } from 'lucide-react';
import { getRegisterUrl } from '../utils/appUrls';
import { Button } from '@/components/ui/button';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <UserPlus size={32} style={{ color: 'var(--color-accent)' }} />,
      title: t('howItWorks.step1.title') || 'Sign Up',
      description:
        t('howItWorks.step1.desc') ||
        'Create your free account in seconds. No credit card required.',
      number: '1',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&q=80',
    },
    {
      icon: <MessageCircle size={32} style={{ color: 'var(--primary-blue)' }} />,
      title: t('howItWorks.step2.title') || 'Start Chatting',
      description:
        t('howItWorks.step2.desc') ||
        'Begin a conversation with our AI companion. Express yourself freely.',
      number: '2',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
    },
    {
      icon: <Heart size={32} style={{ color: 'var(--calm-teal)' }} />,
      title: t('howItWorks.step3.title') || 'Track Your Progress',
      description:
        t('howItWorks.step3.desc') ||
        'Use mood tracking, journaling, and mindfulness exercises to support your journey.',
      number: '3',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
    },
    {
      icon: <TrendingUp size={32} style={{ color: 'var(--color-accent)' }} />,
      title: t('howItWorks.step4.title') || 'Grow & Improve',
      description:
        t('howItWorks.step4.desc') ||
        'See your progress over time with insights and personalized recommendations.',
      number: '4',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      className="me-how-it-works-section"
      style={{ padding: 'var(--spacing-4xl) var(--spacing-lg)' }}
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center"
          style={{ marginBottom: 'var(--spacing-4xl)' }}
        >
          <p className="me-bento-eyebrow">{t('howItWorks.eyebrow') || 'Getting Started'}</p>
          <h2 className="me-bento-title">{t('howItWorks.title') || 'How MindEase Works'}</h2>
          <p className="me-bento-subtitle" style={{ marginTop: 'var(--spacing-lg)' }}>
            {t('howItWorks.subtitle') || 'Start your mental wellness journey in four simple steps'}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-2xl)',
            maxWidth: '80rem',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="me-how-it-works-step"
              style={{
                position: 'relative',
                padding: 'var(--spacing-2xl)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center',
                transition: 'all var(--transition-base)',
              }}
              whileHover={{
                transform: 'translateY(-4px)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-1.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-accent), var(--primary-blue))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-white)',
                  fontWeight: '700',
                  fontSize: 'var(--font-size-xl)',
                  border: '4px solid var(--color-bg)',
                }}
              >
                {step.number}
              </div>
              <div
                style={{
                  marginTop: 'var(--spacing-lg)',
                  marginBottom: 'var(--spacing-lg)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {step.icon}
              </div>
              <h3
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: '600',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.8',
                  fontSize: 'var(--font-size-base)',
                }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ delay: 0.6 }}
          className="text-center"
          style={{ marginTop: 'var(--spacing-4xl)' }}
        >
          <Button asChild size="lg">
            <a href={getRegisterUrl()}>{t('howItWorks.cta') || 'Get Started Now'}</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
