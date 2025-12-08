'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { getLoginUrl } from '../utils/appUrls';

export default function Navbar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/features', label: t('nav.features') },
    { to: '/why-mindease', label: t('nav.why') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <nav className={`me-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="me-navbar-inner">
        <NavLink to="/" className="me-navbar-brand">
          <div className="me-navbar-logo">M</div>
          <span>MindEase</span>
        </NavLink>

        <ul className="me-navbar-links">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `me-navbar-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="me-navbar-actions">
          <LanguageSwitcher />
          <a
            href={getLoginUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = getLoginUrl();
              console.log('[Navbar] Navigating to:', url);
              window.location.href = url;
            }}
            className="me-button me-button-primary"
          >
            {t('nav.openApp')}
          </a>
          <button
            className="me-navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`me-navbar-mobile ${isOpen ? 'open' : ''}`}>
        <div className="me-navbar-mobile-content">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `me-navbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href={getLoginUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = getLoginUrl();
              console.log('[Navbar Mobile] Navigating to:', url);
              window.location.href = url;
            }}
            className="me-button me-button-primary"
          >
            {t('nav.openApp')}
          </a>
        </div>
      </div>
    </nav>
  );
}
