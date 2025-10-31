import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero';
import BentoGrid from '../components/BentoGrid';

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
      <BentoGrid />
    </>
  );
}
