import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Check } from 'lucide-react';

const LanguageSettingsSection = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    setCurrentLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const handleLanguageChange = async (newLanguage) => {
    try {
      await i18n.changeLanguage(newLanguage);
      localStorage.setItem('i18nextLng', newLanguage);
      toast.success(t('settings.notifications.languageChanged'));
    } catch {
      toast.error(t('settings.notifications.languageChangeFailed'));
    }
  };

  const languages = [
    { code: 'en', name: t('settings.language.english'), flag: '🇺🇸', nativeName: 'English' },
    { code: 'ne', name: t('settings.language.nepali'), flag: '🇳🇵', nativeName: 'नेपाली' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language.title')}</CardTitle>
          <CardDescription>Choose your preferred language for the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => {
              const isActive = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isActive}
                  className={`
                    relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                    ${
                      isActive
                        ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 bg-white dark:bg-gray-800'
                    }
                    ${isActive ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {lang.flag}
                  </span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{lang.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {lang.nativeName}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSettingsSection;
