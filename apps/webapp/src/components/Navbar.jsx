'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleProfileClick = () => {
    navigate('/settings');
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      path: '/chat',
      label: t('navigation.chat') || 'Chat',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 8h14M5 12h10m-11 6h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      ),
    },
    {
      path: '/',
      label: t('navigation.mood') || 'Mood',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          <path d="M9 15a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      path: '/journal',
      label: t('navigation.journal') || 'Journal',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      path: '/mindfulness',
      label: t('navigation.mindfulness') || 'Mindfulness',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo and Title */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.1" />
              <path d="M12 16c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="currentColor" />
              <path
                d="M8 16c0-4.4 3.6-8 8-8s8 3.6 8 4"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <span className="brand-title">MindEase</span>
        </div>

        {/* Right: Profile Dropdown (Desktop) or Burger Menu (Mobile) */}
        {currentUser && (
          <>
            <div className="navbar-profile desktop-only" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="User menu"
              >
                <div className="profile-avatar">
                  {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-email">{currentUser.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Profile
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 3l7 7-7 7M23 10H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                    {t('navigation.logout') || 'Logout'}
                  </button>
                </div>
              )}
            </div>

            <div className="navbar-menu mobile-only" ref={menuRef}>
              <button
                className={`burger-button ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {isMobileMenuOpen && (
                <div className="mobile-menu-dropdown">
                  <div className="mobile-menu-header">
                    <p className="mobile-menu-email">{currentUser.email}</p>
                  </div>
                  <div className="mobile-menu-divider" />

                  {/* Navigation Items */}
                  <div className="mobile-nav-section">
                    {navItems.map((item) => (
                      <button
                        key={item.path}
                        className="mobile-menu-item"
                        onClick={() => handleNavClick(item.path)}
                      >
                        <div className="mobile-menu-icon">{item.icon}</div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mobile-menu-divider" />

                  {/* Profile Items */}
                  <div className="mobile-profile-section">
                    <button className="mobile-menu-item" onClick={handleProfileClick}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <path
                          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Profile
                    </button>
                    <button className="mobile-menu-item logout-item" onClick={handleLogout}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 3l7 7-7 7M23 10H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                      {t('navigation.logout') || 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
