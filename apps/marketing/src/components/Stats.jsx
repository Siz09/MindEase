'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, MessageCircle, Globe, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const { t } = useTranslation();

  const stats = [
    {
      icon: <Users size={32} style={{ color: 'var(--color-accent)' }} />,
      value: 10000,
      suffix: '+',
      label: t('stats.users') || 'Active Users',
    },
    {
      icon: <MessageCircle size={32} style={{ color: 'var(--primary-blue)' }} />,
      value: 50000,
      suffix: '+',
      label: t('stats.messages') || 'Messages Exchanged',
    },
    {
      icon: <Globe size={32} style={{ color: 'var(--calm-teal)' }} />,
      value: 15,
      suffix: '+',
      label: t('stats.countries') || 'Countries',
    },
    {
      icon: <Heart size={32} style={{ color: 'var(--color-accent)' }} />,
      value: 95,
      suffix: '%',
      label: t('stats.satisfaction') || 'User Satisfaction',
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
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      className="me-stats-section"
      style={{ padding: 'var(--spacing-4xl) var(--spacing-lg)' }}
    >
      <div className="container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="me-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-2xl)',
            maxWidth: '80rem',
            margin: '0 auto',
          }}
        >
          {stats.map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="text-center">
                <CardContent>
                  <div className="mb-6 flex justify-center text-primary">{stat.icon}</div>
                  <div className="text-4xl font-bold text-primary mb-3 leading-none">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-base text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
