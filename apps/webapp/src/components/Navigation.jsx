'use client';

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import '../styles/Navigation.css';

const Navigation = () => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.1" />
                <path
                  d="M12 16c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z"
                  fill="currentColor"
                />
                <path
                  d="M8 16c0-4.4 3.6-8 8-8s8 3.6 8 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <span className="brand-text">MindEase</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        {currentUser && (
          <div className="nav-links desktop-only">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 9v9h4v-6h6v6h4V9l-7-7z" fill="currentColor" />
              </svg>
              {t('navigation.mood')}
            </Link>
            <Link to="/journal" className={`nav-link ${isActive('/journal') ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="2" />
              </svg>
              {t('navigation.journal')}
            </Link>
            <Link
              to="/mindfulness"
              className={`nav-link ${isActive('/mindfulness') ? 'active' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              {t('navigation.mindfulness')}
            </Link>
            <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
                <path
                  d="M10 1l3 6 6-3-3 6 3 6-6-3-3 6-3-6-6 3 3-6-3-6 6 3 3-6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              {t('navigation.settings')}
            </Link>
            <Link to="/chat" className={`nav-link ${isActive('/chat') ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 8h10M5 12h6m-9-6.5V14a2 2 0 002 2h10a2 2 0 002-2V5.5a2 2 0 00-2-2H4a2 2 0 00-2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {t('navigation.chat')}
            </Link>
          </div>
        )}

        {/* Right Side Actions */}
        <div className="nav-actions">
          <LanguageSwitcher />

          {currentUser ? (
            <div className="user-menu">
              <div className="user-info desktop-only">
                <span className="user-email">{currentUser.email}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline logout-btn">
                {t('navigation.logout')}
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-outline">
                {t('navigation.login')}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t('navigation.register')}
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle mobile-only"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {isMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {currentUser && (
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <Link
              to="/"
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 9v9h4v-6h6v6h4V9l-7-7z" fill="currentColor" />
              </svg>
              {t('navigation.mood')}
            </Link>
            <Link
              to="/journal"
              className={`mobile-nav-link ${isActive('/journal') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="2" />
              </svg>
              {t('navigation.journal')}
            </Link>
            <Link
              to="/mindfulness"
              className={`mobile-nav-link ${isActive('/mindfulness') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              {t('navigation.mindfulness')}
            </Link>
            <Link
              to="/settings"
              className={`mobile-nav-link ${isActive('/settings') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
                <path
                  d="M10 1l3 6 6-3-3 6 3 6-6-3-3 6-3-6-6 3 3-6-3-6 6 3 3-6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              {t('navigation.settings')}
            </Link>
            <Link
              to="/chat"
              className={`mobile-nav-link ${isActive('/chat') ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 8h10M5 12h6m-9-6.5V14a2 2 0 002 2h10a2 2 0 002-2V5.5a2 2 0 00-2-2H4a2 2 0 00-2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {t('navigation.chat')}
            </Link>
            <div className="mobile-user-info">
              <span className="user-email">{currentUser.email}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
