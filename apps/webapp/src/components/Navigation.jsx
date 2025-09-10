import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navigation() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Common link style
  const linkStyle = {
    textDecoration: 'none',
    color: '#0ea5e9',
    fontSize: '14px',
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '1px solid #e1e5e9',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ margin: 0, color: '#1a1a1a' }}>{t('header.title')}</h1>
        </NavLink>

        {isAuthenticated && (
          <nav style={{ display: 'flex', gap: '16px' }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                ...linkStyle,
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: isActive ? 'underline' : 'none',
              })}
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/chat"
              style={({ isActive }) => ({
                ...linkStyle,
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: isActive ? 'underline' : 'none',
              })}
            >
              {t('nav.chat')}
            </NavLink>
            <NavLink
              to="/mood"
              style={({ isActive }) => ({
                ...linkStyle,
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: isActive ? 'underline' : 'none',
              })}
            >
              {t('nav.mood')}
            </NavLink>
            <NavLink
              to="/journal"
              style={({ isActive }) => ({
                ...linkStyle,
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: isActive ? 'underline' : 'none',
              })}
            >
              {t('nav.journal')}
            </NavLink>
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <LanguageSwitcher />

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>{user?.email}</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666',
              }}
            >
              {t('auth.logout')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <NavLink to="/login" style={linkStyle}>
              {t('auth.login.title')}
            </NavLink>
            <NavLink
              to="/register"
              style={{
                textDecoration: 'none',
                color: 'white',
                backgroundColor: '#0ea5e9',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              {t('auth.register.title')}
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
