'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQ() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('faq.q1.question') || 'Is MindEase free to use?',
      answer:
        t('faq.q1.answer') ||
        'Yes! MindEase offers a free tier with access to core features. Premium features are available for enhanced support.',
    },
    {
      question: t('faq.q2.question') || 'Is my data private and secure?',
      answer:
        t('faq.q2.answer') ||
        'Absolutely. We use end-to-end encryption and never share your conversations. Your privacy is our top priority.',
    },
    {
      question: t('faq.q3.question') || 'Can I use MindEase offline?',
      answer:
        t('faq.q3.answer') ||
        'Yes, MindEase works offline for many features. Your data syncs when you reconnect to the internet.',
    },
    {
      question: t('faq.q4.question') || 'Is MindEase a replacement for therapy?',
      answer:
        t('faq.q4.answer') ||
        'No. MindEase is a supportive tool, not a replacement for professional mental health care. We always recommend consulting professionals for serious concerns.',
    },
    {
      question: t('faq.q5.question') || 'What languages does MindEase support?',
      answer:
        t('faq.q5.answer') ||
        'MindEase currently supports English and Nepali, with plans to add more languages in the future.',
    },
    {
      question: t('faq.q6.question') || 'How do I get started?',
      answer:
        t('faq.q6.answer') ||
        'Simply sign up with your email, create a profile, and start chatting. No credit card required for the free tier.',
    },
  ];

  return (
    <section className="me-faq-section" style={{ padding: 'var(--spacing-4xl) var(--spacing-lg)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center"
          style={{ marginBottom: 'var(--spacing-4xl)' }}
        >
          <p className="me-bento-eyebrow">{t('faq.eyebrow') || 'Help Center'}</p>
          <h2 className="me-bento-title">{t('faq.title') || 'Frequently Asked Questions'}</h2>
          <p className="me-bento-subtitle" style={{ marginTop: 'var(--spacing-lg)' }}>
            {t('faq.subtitle') || 'Find answers to common questions about MindEase'}
          </p>
        </motion.div>

        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
