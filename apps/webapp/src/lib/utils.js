import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date for display
 */
export function formatDate(date, locale = 'en-US') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date, locale = 'en-US') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  const now = new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}

/**
 * Get mood color class based on score (1-5)
 */
export function getMoodColor(score) {
  if (score == null || score < 1 || score > 5) return 'mood-3'; // default to neutral
  if (score <= 1) return 'mood-1';
  if (score <= 2) return 'mood-2';
  if (score <= 3) return 'mood-3';
  if (score <= 4) return 'mood-4';
  return 'mood-5';
}

/**
 * Get mood label based on score (1-5)
 */
export function getMoodLabel(score) {
  if (score == null || score < 1 || score > 5) return 'Unknown';
  if (score <= 1) return 'Very Bad';
  if (score <= 2) return 'Bad';
  if (score <= 3) return 'Okay';
  if (score <= 4) return 'Good';
  return 'Great';
}

/**
 * Get safety banner style based on risk level
 */
export function getSafetyBannerClass(riskLevel) {
  switch (riskLevel?.toUpperCase()) {
    case 'LOW':
      return 'safety-banner-low';
    case 'MEDIUM':
      return 'safety-banner-medium';
    case 'HIGH':
      return 'safety-banner-high';
    case 'CRITICAL':
      return 'safety-banner-critical';
    default:
      return '';
  }
}

/**
 * Truncate text to specified length
 */
export function truncate(text, length = 100) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = () => {
      clearTimeout(timeout);
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
