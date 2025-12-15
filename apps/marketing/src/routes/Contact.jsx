'use client';

import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Users } from 'lucide-react';
import { useState } from 'react';
import FAQ from '../components/FAQ';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      icon: <Mail size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Email',
      desc: 'hello@mindease.app',
      link: 'mailto:hello@mindease.app',
    },
    {
      icon: <MessageSquare size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Support',
      desc: 'Get help with the app',
      link: '#',
    },
    {
      icon: <Users size={32} style={{ color: 'var(--color-accent)' }} />,
      title: 'Community',
      desc: 'Join our user community',
      link: '#',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
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

      <div className="container" style={{ paddingTop: 'var(--spacing-4xl)' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          className="text-center"
          style={{ marginBottom: 'var(--spacing-4xl)' }}
        >
          <motion.p variants={itemVariants} className="me-bento-eyebrow">
            {t('contact.eyebrow') || 'Support'}
          </motion.p>
          <motion.h1 variants={itemVariants} className="me-bento-title">
            {t('contact.title')}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="me-bento-subtitle"
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            {t('contact.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          className="me-bento-grid"
          style={{ marginBottom: 'var(--spacing-3xl)' }}
        >
          {contactMethods.map((method, idx) => (
            <motion.a key={idx} href={method.link} variants={itemVariants} className="no-underline">
              <Card className="h-full">
                <CardContent>
                  <div className="mb-6 text-primary">{method.icon}</div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{method.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{method.desc}</p>
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--spacing-3xl)',
            maxWidth: '64rem',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
          className="lg:grid-cols-2"
        >
          {/* Form */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  variants={itemVariants}
                >
                  <Alert className="bg-primary/10 border-primary text-primary">
                    <AlertDescription>
                      Message sent successfully! We'll get back to you soon.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name">{t('contact.form.name')}</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email">{t('contact.form.email')}</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="message">{t('contact.form.message')}</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Tell us how we can help..."
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button type="submit" size="lg" className="w-full" disabled={submitted}>
                  {t('contact.form.submit')}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* Partnership info */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            viewport={{ once: true }}
          >
            <motion.div
              variants={itemVariants}
              className="me-bento-card"
              style={{
                background:
                  'linear-gradient(135deg, rgba(21, 128, 61, 0.05), rgba(14, 165, 233, 0.05))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '100%',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                  }}
                >
                  <Users size={24} style={{ color: 'var(--color-accent)' }} />
                  <h3 style={{ fontWeight: '600', fontSize: 'var(--font-size-lg)' }}>
                    {t('contact.partnership.title')}
                  </h3>
                </div>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: '1.8',
                    marginBottom: 'var(--spacing-lg)',
                  }}
                >
                  {t('contact.partnership.desc')}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  <div
                    style={{
                      padding: 'var(--spacing-lg)',
                      background: 'rgba(21, 128, 61, 0.08)',
                      border: '1px solid rgba(21, 128, 61, 0.2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <strong>For NGOs:</strong> Reach out to implement MindEase at your
                      organization.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: 'var(--spacing-lg)',
                      background: 'rgba(21, 128, 61, 0.08)',
                      border: '1px solid rgba(21, 128, 61, 0.2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <strong>For Schools:</strong> Mental health resources for students and staff.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: 'var(--spacing-lg)',
                      background: 'rgba(21, 128, 61, 0.08)',
                      border: '1px solid rgba(21, 128, 61, 0.2)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <strong>For Workplaces:</strong> Employee wellness programs available.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="mailto:partnerships@mindease.app"
                style={{
                  marginTop: 'var(--spacing-xl)',
                  display: 'inline-block',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  background: 'rgba(21, 128, 61, 0.2)',
                  color: 'var(--color-accent)',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all var(--transition-base)',
                }}
                onMouseEnter={(e) => (e.target.style.background = 'rgba(21, 128, 61, 0.3)')}
                onMouseLeave={(e) => (e.target.style.background = 'rgba(21, 128, 61, 0.2)')}
              >
                Explore Partnership
              </a>
            </motion.div>
          </motion.div>
        </div>

        <FAQ />
      </div>
    </>
  );
}
