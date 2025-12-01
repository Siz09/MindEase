import React, { useState } from 'react';
import { Smile, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import Button from './Button';

const MoodPrompt = ({ onSubmit, onDismiss }) => {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState(null);

  // Updated to use 1-10 scale to match MoodInput component
  const moods = [
    { score: 1, label: t('mood.terrible'), emoji: '😭', color: '#dc2626' },
    { score: 2, label: t('mood.veryBad'), emoji: '😢', color: '#ea580c' },
    { score: 3, label: t('mood.bad'), emoji: '😔', color: '#f97316' },
    { score: 4, label: t('mood.poor'), emoji: '😕', color: '#fb923c' },
    { score: 5, label: t('mood.neutral'), emoji: '😐', color: '#eab308' },
    { score: 6, label: t('mood.okay'), emoji: '🙂', color: '#a3e635' },
    { score: 7, label: t('mood.good'), emoji: '😊', color: '#84cc16' },
    { score: 8, label: t('mood.veryGood'), emoji: '😄', color: '#65a30d' },
    { score: 9, label: t('mood.great'), emoji: '😁', color: '#16a34a' },
    { score: 10, label: t('mood.amazing'), emoji: '🤩', color: '#15803d' },
  ];

  const handleSubmit = () => {
    if (selectedMood) {
      // Submit the entire mood object (with score, label, emoji, color)
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

        <div className="grid grid-cols-5 gap-2 mb-4">
          {moods.map((mood) => (
            <button
              key={mood.score}
              onClick={() => setSelectedMood(mood)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500',
                selectedMood?.score === mood.score
                  ? 'shadow-lg scale-105 border-2'
                  : 'bg-gray-100 dark:bg-gray-800 border border-transparent'
              )}
              style={
                selectedMood?.score === mood.score
                  ? { borderColor: mood.color, backgroundColor: `${mood.color}20` }
                  : {}
              }
            >
              <span className="text-xl">{mood.emoji}</span>
              <span className="text-xs font-medium">{mood.score}</span>
              <span className="text-[10px] text-center leading-tight">{mood.label}</span>
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
