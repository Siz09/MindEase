import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
import BentoGrid from '../components/BentoGrid';
import Testimonials from '../components/Testimonials';

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>MindEase — {t('hero.title')}</title>
        <meta name="description" content={t('hero.subtitle')} />
        <meta property="og:title" content="MindEase" />
        <meta property="og:description" content={t('hero.subtitle')} />
      </Helmet>
      <Hero />
      <Stats />
      <HowItWorks />
      <BentoGrid />
      <Testimonials />
    </>
  );
}
