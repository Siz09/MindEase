import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-surface-secondary/50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12 mb-8">
          {/* Brand section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold">
                M
              </span>
              <span className="font-bold text-text">MindEase</span>
            </div>
            <p className="text-text-light text-sm mb-4">
              {t('footer.tagline') ||
                'Your AI-powered mental wellness companion for Nepal and beyond.'}
            </p>
            <p className="text-text-light text-xs">
              Not a crisis service. For emergencies, contact local services.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-text mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-text-light hover:text-accent transition-colors">
                  {t('nav.home')}
                </a>
              </li>
              <li>
                <a href="/features" className="text-text-light hover:text-accent transition-colors">
                  {t('nav.features')}
                </a>
              </li>
              <li>
                <a
                  href="/why-mindease"
                  className="text-text-light hover:text-accent transition-colors"
                >
                  {t('nav.why')}
                </a>
              </li>
              <li>
                <a href="/about" className="text-text-light hover:text-accent transition-colors">
                  {t('nav.about')}
                </a>
              </li>
              <li>
                <a href="/contact" className="text-text-light hover:text-accent transition-colors">
                  {t('nav.contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-semibold text-text mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-text-light hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-text-light hover:text-accent transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-text-light hover:text-accent transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-text-light hover:text-accent transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-light text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-accent fill-accent" /> in Nepal
          </p>
          <p className="text-text-light text-sm">&copy; {year} MindEase. All rights reserved.</p>
          <p className="text-text-light text-sm">
            <span className="inline-flex items-center gap-2">
              🌐 Available in <span className="font-semibold">English & Nepali</span>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
