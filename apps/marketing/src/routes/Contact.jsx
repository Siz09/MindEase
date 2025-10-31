import { Helmet } from '@dr.pogodin/react-helmet';
import { useTranslation } from 'react-i18next';
import Section from '../components/Section';

export default function Contact() {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for form submission
    alert('Thank you for your message!');
  };

  return (
    <>
      <Helmet>
        <title>MindEase — {t('nav.contact')}</title>
        <meta name="description" content={t('contact.subtitle')} />
      </Helmet>
      <Section>
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold">{t('contact.title')}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300">{t('contact.subtitle')}</p>
        </div>
        <div className="mt-16 max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">{t('contact.form.name')}</label>
              <input type="text" id="name" className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">{t('contact.form.email')}</label>
              <input type="email" id="email" className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-300">{t('contact.form.message')}</label>
              <textarea id="message" rows="4" className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"></textarea>
            </div>
            <button type="submit" className="px-6 py-2 bg-accent text-slate-950 rounded-full font-medium">
              {t('contact.form.submit')}
            </button>
          </form>
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
            <h3 className="font-semibold text-lg">{t('contact.partnership.title')}</h3>
            <p className="mt-2 text-slate-400">{t('contact.partnership.desc')}</p>
          </div>
        </div>
      </Section>
    </>
  );
}
