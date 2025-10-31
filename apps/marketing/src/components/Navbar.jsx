import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
  const { t } = useTranslation();

  return (
    <nav className="w-full fixed top-0 z-50 backdrop-blur bg-slate-950/40 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">M</span>
          <span className="font-semibold">MindEase</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-200">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-accent' : ''}>{t('nav.home')}</NavLink>
          <NavLink to="/features" className={({ isActive }) => isActive ? 'text-accent' : ''}>{t('nav.features')}</NavLink>
          <NavLink to="/why-mindease" className={({ isActive }) => isActive ? 'text-accent' : ''}>{t('nav.why')}</NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? 'text-accent' : ''}>{t('nav.about')}</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? 'text-accent' : ''}>{t('nav.contact')}</NavLink>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a href="http://localhost:5173/login" className="px-4 py-1.5 bg-accent text-slate-950 rounded-full text-sm font-medium">
            {t('nav.openApp')}
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
