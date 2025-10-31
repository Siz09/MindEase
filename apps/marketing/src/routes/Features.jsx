import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';
import FeatureIcon from '../components/FeatureIcon';
import { MessageCircle, BarChart2, BookOpen, Zap, Shield, Globe } from 'lucide-react';

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

  return (
    <>
      <Helmet>
        <title>MindEase — {t('nav.features')}</title>
        <meta name="description" content={t('features.subtitle')} />
      </Helmet>
      <Section>
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold">{t('features.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300">{t('features.subtitle')}</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.key} className="flex gap-4">
              <FeatureIcon icon={feature.icon} />
              <div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="mt-1 text-slate-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
