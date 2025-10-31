import { useTranslation } from 'react-i18next';
import BentoCard from './BentoCard';
import { MessageCircle, BarChart2, BookOpen, Zap, Shield, Globe } from 'lucide-react';

export default function BentoGrid() {
  const { t } = useTranslation();

  const bentoItems = [
    {
      key: 'aiChat',
      icon: <MessageCircle className="w-8 h-8 text-accent" />,
      title: t('bento.aiChat.title'),
      desc: t('bento.aiChat.desc'),
    },
    {
      key: 'mood',
      icon: <BarChart2 className="w-8 h-8 text-accent" />,
      title: t('bento.mood.title'),
      desc: t('bento.mood.desc'),
    },
    {
      key: 'journal',
      icon: <BookOpen className="w-8 h-8 text-accent" />,
      title: t('bento.journal.title'),
      desc: t('bento.journal.desc'),
    },
    {
      key: 'mindfulness',
      icon: <Zap className="w-8 h-8 text-accent" />,
      title: t('bento.mindfulness.title'),
      desc: t('bento.mindfulness.desc'),
    },
    {
      key: 'privacy',
      icon: <Shield className="w-8 h-8 text-accent" />,
      title: t('bento.privacy.title'),
      desc: t('bento.privacy.desc'),
    },
    {
      key: 'nepal',
      icon: <Globe className="w-8 h-8 text-accent" />,
      title: t('bento.nepal.title'),
      desc: t('bento.nepal.desc'),
    },
  ];

  return (
    <section id="features" className="w-full py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {bentoItems.map((item, idx) => (
            <BentoCard key={item.key} {...item} custom={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
