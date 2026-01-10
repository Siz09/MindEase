import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wind } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Button from '../ui/Button';

/**
 * Breathing patterns available for selection
 */
export const BREATHING_PATTERNS = {
  478: {
    name: '4-7-8 Breathing',
    description: 'Calming technique for sleep and anxiety',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    icon: '😌',
  },
  box: {
    name: 'Box Breathing',
    description: 'Used by Navy SEALs for stress relief',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    icon: '📦',
  },
  relaxing: {
    name: 'Relaxing Breath',
    description: 'Simple pattern for quick relaxation',
    inhale: 4,
    hold1: 0,
    exhale: 6,
    hold2: 0,
    icon: '🌊',
  },
  energizing: {
    name: 'Energizing Breath',
    description: 'Quick breaths to boost energy',
    inhale: 2,
    hold1: 0,
    exhale: 2,
    hold2: 0,
    icon: '⚡',
  },
};

/**
 * BreathingPatternSelector Component
 * Displays breathing pattern options for user selection in chat
 *
 * @param {Function} onSelect - Callback when a pattern is selected. Receives pattern key and pattern data
 * @param {string} className - Additional CSS classes
 */
const BreathingPatternSelector = ({ onSelect, className = '' }) => {
  const { t } = useTranslation();

  const handleSelect = (patternKey) => {
    if (onSelect) {
      onSelect(patternKey, BREATHING_PATTERNS[patternKey]);
    }
  };

  return (
    <Card className={`max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">
            {t('chat.breathing.selectPattern', 'Choose a Breathing Pattern')}
          </CardTitle>
        </div>
        <CardDescription>
          {t('chat.breathing.selectDescription', 'Select a pattern that suits your current needs')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700
                         hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20
                         transition-all text-left group"
            >
              <span className="text-2xl">{pattern.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400">
                  {pattern.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {pattern.description}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {pattern.inhale}s in
                  {pattern.hold1 > 0 && ` → ${pattern.hold1}s hold`}
                  {` → ${pattern.exhale}s out`}
                  {pattern.hold2 > 0 && ` → ${pattern.hold2}s hold`}
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BreathingPatternSelector;
