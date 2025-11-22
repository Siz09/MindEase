import React, { useState } from 'react';
import { Smile, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import Button from './Button';

const MoodPrompt = ({ onSubmit, onDismiss }) => {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState(null);

  const moods = [
    { score: 1, label: t('mood.veryBad'), emoji: '😢' },
    { score: 2, label: t('mood.bad'), emoji: '😟' },
    { score: 3, label: t('mood.neutral'), emoji: '😐' },
    { score: 4, label: t('mood.good'), emoji: '🙂' },
    { score: 5, label: t('mood.veryGood'), emoji: '😊' },
  ];

  const handleSubmit = () => {
    if (selectedMood) {
      onSubmit(selectedMood);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="card mb-4 relative"
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label={t('common.cancel')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Smile className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-lg">{t('chat.moodPrompt.title')}</h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('chat.moodPrompt.description')}
        </p>

        <div className="flex gap-2 mb-4">
          {moods.map((mood) => (
            <button
              key={mood.score}
              onClick={() => setSelectedMood(mood.score)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500',
                selectedMood === mood.score
                  ? `mood-${mood.score} shadow-lg scale-105`
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs font-medium">{mood.label}</span>
            </button>
          ))}
        </div>

        <Button onClick={handleSubmit} disabled={!selectedMood} className="w-full">
          {t('chat.moodPrompt.submit')}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
};

export default MoodPrompt;
