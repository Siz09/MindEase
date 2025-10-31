import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="w-full py-20 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold text-white"
        >
          {t('hero.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 max-w-2xl mx-auto text-lg text-slate-300"
        >
          {t('hero.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex justify-center gap-4"
        >
          <a
            href="http://localhost:5173/login"
            className="px-6 py-3 bg-accent text-slate-950 rounded-full font-medium"
          >
            {t('hero.primaryCta')}
          </a>
          <a
            href="#features"
            className="px-6 py-3 bg-slate-800 text-white rounded-full font-medium"
          >
            {t('hero.secondaryCta')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
