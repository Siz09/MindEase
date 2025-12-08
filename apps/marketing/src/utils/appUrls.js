/**
 * Utility functions for generating webapp URLs
 * Centralizes URL construction to make it easier to maintain
 */

/**
 * Get the base URL for the MindEase webapp
 * @returns {string} Base URL for the webapp
 */
export function getWebappBaseUrl() {
  const url = import.meta.env.VITE_MINDEASE_APP_URL || 'http://localhost:5174';
  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('[appUrls] Webapp base URL:', url);
  }
  return url;
}

/**
 * Generate a URL to a specific webapp route
 * @param {string} path - The path to navigate to (e.g., '/login', '/register')
 * @returns {string} Full URL to the webapp route
 */
export function getWebappUrl(path = '/') {
  try {
    const base = getWebappBaseUrl();
    const url = new URL(path, base).href;
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log(`[appUrls] Generated URL for path "${path}":`, url);
    }
    return url;
  } catch (error) {
    console.error('Invalid VITE_MINDEASE_APP_URL:', error);
    const fallback = `${getWebappBaseUrl()}${path}`;
    if (import.meta.env.DEV) {
      console.warn('[appUrls] Using fallback URL:', fallback);
    }
    return fallback;
  }
}

/**
 * Get URL to the login page
 * @returns {string} URL to login page
 */
export function getLoginUrl() {
  return getWebappUrl('/login');
}

/**
 * Get URL to the register page
 * @returns {string} URL to register page
 */
export function getRegisterUrl() {
  return getWebappUrl('/register');
}
