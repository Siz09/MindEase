'use client';

import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useState, useEffect } from 'react';

function Navbar() {
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
    <nav
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md bg-white/90 border-b border-border shadow-sm'
          : 'backdrop-blur-sm bg-white/50 border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-lg">
            M
          </span>
          <span className="font-bold text-text hidden sm:inline">MindEase</span>
        </NavLink>

        <div className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `font-medium transition-colors hover:text-accent ${isActive ? 'text-accent font-semibold' : 'text-text-light'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="http://localhost:5173/login"
            className="hidden sm:inline-block px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-dark transition-all hover:shadow-md"
          >
            {t('nav.openApp')}
          </a>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-text-light hover:text-text transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-text-light hover:bg-surface-secondary'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <a
              href="http://localhost:5173/login"
              className="block px-4 py-2 mt-4 bg-accent text-white rounded-lg text-center font-semibold hover:bg-accent-dark transition-all"
            >
              {t('nav.openApp')}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
