'use client';

import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="me-footer">
      <div className="me-footer-grid">
        <div className="me-footer-column">
          <div className="me-footer-brand">
            <div className="me-footer-logo">M</div>
            <span>MindEase</span>
          </div>
          <p className="me-footer-text">
            {t('footer.tagline') ||
              'Your AI-powered mental wellness companion for Nepal and beyond.'}
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {t('footer.disclaimer') ||
              'Not a crisis service. For emergencies, contact local services.'}
          </p>
        </div>

        <div className="me-footer-column">
          <h4 className="me-footer-title">{t('footer.quickLinks') || 'Quick Links'}</h4>
          <ul className="me-footer-links">
            <li>
              <a href="/" className="me-footer-link">
                {t('nav.home')}
              </a>
            </li>
            <li>
              <a href="/features" className="me-footer-link">
                {t('nav.features')}
              </a>
            </li>
            <li>
              <a href="/why-mindease" className="me-footer-link">
                {t('nav.why')}
              </a>
            </li>
            <li>
              <a href="/about" className="me-footer-link">
                {t('nav.about')}
              </a>
            </li>
            <li>
              <a href="/contact" className="me-footer-link">
                {t('nav.contact')}
              </a>
            </li>
          </ul>
        </div>

        <div className="me-footer-column">
          <h4 className="me-footer-title">{t('footer.legal') || 'Legal'}</h4>
          <ul className="me-footer-links">
            <li>
              <a href="#" className="me-footer-link">
                {t('footer.privacy') || 'Privacy Policy'}
              </a>
            </li>
            <li>
              <a href="#" className="me-footer-link">
                {t('footer.terms') || 'Terms of Service'}
              </a>
            </li>
            <li>
              <a href="#" className="me-footer-link">
                {t('footer.cookies') || 'Cookie Policy'}
              </a>
            </li>
            <li>
              <a href="#" className="me-footer-link">
                {t('footer.security') || 'Security'}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="me-footer-bottom">
        <p className="me-footer-copyright">
          {t('footer.made') || 'Made with'} ❤️ {t('footer.inNepal') || 'in Nepal'}
        </p>
        <p className="me-footer-copyright">
          © {year} MindEase. {t('footer.rights') || 'All rights reserved.'}
        </p>
        <p className="me-footer-copyright">
          🌐 {t('footer.languages') || 'Available in'}{' '}
          <strong>{t('footer.langs') || 'English & Nepali'}</strong>
        </p>
      </div>
    </footer>
  );
}
