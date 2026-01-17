import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Zap, Lock, Target, Check } from 'lucide-react';

const AIProviderSection = ({ currentUser }) => {
  const { t } = useTranslation();
  const [aiProvider, setAiProvider] = useState(null);
  const [aiProviderLoading, setAiProviderLoading] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchAIProvider = async () => {
      try {
        const response = await api.get('/chat/provider');
        if (isMountedRef.current) {
          setAiProvider(response.data.currentProvider || 'OPENAI');
        }
      } catch {
        if (isMountedRef.current) {
          setAiProvider(null);
          toast.error(t('settings.notifications.aiProviderLoadFailed'));
        }
      }
    };

    if (currentUser) fetchAIProvider();
  }, [currentUser, t]);

  const handleAIProviderChange = async (newProvider) => {
    setAiProviderLoading(true);
    try {
      await api.put('/chat/provider', { provider: newProvider });
      if (isMountedRef.current) {
        setAiProvider(newProvider);
        toast.success(t('settings.notifications.aiProviderUpdated'));
      }
    } catch {
      if (isMountedRef.current) {
        toast.error(t('settings.notifications.aiProviderUpdateFailed'));
      }
    } finally {
      if (isMountedRef.current) {
        setAiProviderLoading(false);
      }
    }
  };

  const providers = [
    {
      id: 'OPENAI',
      icon: Zap,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      name: t('settings.aiProvider.providers.openai.name'),
      description: t('settings.aiProvider.providers.openai.description'),
      badge: t('settings.aiProvider.providers.openai.badge'),
      badgeVariant: 'success',
    },
    {
      id: 'LOCAL',
      icon: Lock,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      name: t('settings.aiProvider.providers.local.name'),
      description: t('settings.aiProvider.providers.local.description'),
      badge: t('settings.aiProvider.providers.local.badge'),
      badgeVariant: 'secondary',
    },
    {
      id: 'AUTO',
      icon: Target,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      name: t('settings.aiProvider.providers.auto.name'),
      description: t('settings.aiProvider.providers.auto.description'),
      badge: t('settings.aiProvider.providers.auto.badge'),
      badgeVariant: 'outline',
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.aiProvider.title')}</CardTitle>
          <CardDescription>{t('settings.aiProvider.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {providers.map((provider) => {
              const isSelected = aiProvider === provider.id;
              const Icon = provider.icon;

              return (
                <button
                  key={provider.id}
                  onClick={() => !aiProviderLoading && handleAIProviderChange(provider.id)}
                  disabled={aiProviderLoading || isSelected}
                  className={`
                    relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left
                    ${
                      isSelected
                        ? `${provider.borderColor} ${provider.bgColor}`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }
                    ${aiProviderLoading ? 'cursor-not-allowed opacity-50' : isSelected ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div
                    className={`flex-shrink-0 p-2 rounded-lg ${isSelected ? provider.bgColor : 'bg-gray-100 dark:bg-gray-700'}`}
                  >
                    <Icon
                      className={`h-6 w-6 ${isSelected ? provider.iconColor : 'text-gray-600 dark:text-gray-400'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {provider.name}
                      </h3>
                      {isSelected && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {provider.description}
                    </p>
                    <Badge variant={provider.badgeVariant} className="text-xs">
                      {provider.badge}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviderSection;
