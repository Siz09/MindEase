import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';

export default function WhyMindease() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>MindEase — {t('nav.why')}</title>
        <meta name="description" content={t('why.subtitle')} />
      </Helmet>
      <Section>
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold">{t('why.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300">{t('why.subtitle')}</p>
        </div>
        <div className="mt-16 max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">{t('why.problem.title')}</h2>
            <p className="mt-2 text-slate-400">{t('why.problem.desc')}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t('why.solution.title')}</h2>
            <p className="mt-2 text-slate-400">{t('why.solution.desc')}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{t('why.trust.title')}</h2>
            <p className="mt-2 text-slate-400">{t('why.trust.desc')}</p>
          </div>
        </div>
        <div className="text-center mt-16">
          <a href="/about" className="px-6 py-3 bg-accent text-slate-950 rounded-full font-medium">
            {t('why.cta')}
          </a>
        </div>
      </Section>
    </>
  );
}
