import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>MindEase — {t('nav.about')}</title>
        <meta name="description" content={t('about.subtitle')} />
      </Helmet>
      <Section>
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold">{t('about.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300">{t('about.subtitle')}</p>
        </div>
        <div className="mt-16 max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">{t('about.story.title')}</h2>
            <p className="mt-2 text-slate-400">{t('about.story.desc')}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t('about.team.title')}</h2>
            <p className="mt-2 text-slate-400">{t('about.team.desc')}</p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
            <h3 className="font-semibold">{t('about.ethical.title')}</h3>
            <p className="mt-1 text-sm text-slate-400">{t('about.ethical.desc')}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
