import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-outline theme-toggle"
      aria-label={t('theme.toggle', { theme: theme === 'light' ? 'Dark' : 'Light' })}
      title={t('theme.toggle', { theme: theme === 'light' ? 'Dark' : 'Light' })}
      style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', minWidth: '40px' }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;
