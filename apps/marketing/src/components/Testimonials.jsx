'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t('testimonials.user1.name') || 'Sarah K.',
      role: t('testimonials.user1.role') || 'Student, Kathmandu',
      content:
        t('testimonials.user1.content') ||
        'MindEase has been a game-changer for me. Having someone to talk to anytime, without judgment, has helped me manage my anxiety so much better.',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    },
    {
      name: t('testimonials.user2.name') || 'Rajesh M.',
      role: t('testimonials.user2.role') || 'Professional, Pokhara',
      content:
        t('testimonials.user2.content') ||
        'The bilingual support is amazing. I can express myself better in Nepali, and the AI understands the cultural context perfectly.',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    {
      name: t('testimonials.user3.name') || 'Priya S.',
      role: t('testimonials.user3.role') || 'Teacher, Lalitpur',
      content:
        t('testimonials.user3.content') ||
        'As someone who works with students, I appreciate how MindEase makes mental health support accessible. The privacy features give me confidence.',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
      className="me-testimonials-section"
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
          <p className="me-bento-eyebrow">{t('testimonials.eyebrow') || 'User Stories'}</p>
          <h2 className="me-bento-title">{t('testimonials.title') || 'What Our Users Say'}</h2>
          <p className="me-bento-subtitle" style={{ marginTop: 'var(--spacing-lg)' }}>
            {t('testimonials.subtitle') || 'Real experiences from people using MindEase'}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="me-testimonials-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-2xl)',
            maxWidth: '80rem',
            margin: '0 auto',
          }}
        >
          {testimonials.map((testimonial, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="h-full relative">
                <Quote size={32} className="absolute top-6 right-6 text-primary opacity-20 z-0" />
                <CardContent>
                  <div className="flex gap-1 mb-4 relative z-10">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6 relative z-10">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-0 border-t relative z-10">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
