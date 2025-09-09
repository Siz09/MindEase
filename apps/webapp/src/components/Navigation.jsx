import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navigation() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #e1e5e9',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ margin: 0, color: '#1a1a1a' }}>{t('header.title')}</h1>
        </Link>
        
        {isAuthenticated && (
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#0ea5e9' }}>
              {t('nav.home')}
            </Link>
            <Link to="/chat" style={{ textDecoration: 'none', color: '#0ea5e9' }}>
              {t('nav.chat')}
            </Link>
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <LanguageSwitcher />
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666'
              }}
            >
              {t('auth.logout')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/login"
              style={{
                textDecoration: 'none',
                color: '#0ea5e9',
                padding: '6px 12px',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {t('auth.login.title')}
            </Link>
            <Link
              to="/register"
              style={{
                textDecoration: 'none',
                color: 'white',
                backgroundColor: '#0ea5e9',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {t('auth.register.title')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}