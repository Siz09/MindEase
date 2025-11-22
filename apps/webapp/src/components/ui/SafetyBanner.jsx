import React from 'react';
import { AlertTriangle, Phone, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const SafetyBanner = ({ riskLevel, crisisResources, moderationReason }) => {
  const { t } = useTranslation();

  if (!riskLevel || riskLevel === 'NONE') return null;

  const getBannerClass = () => {
    switch (riskLevel) {
      case 'LOW':
        return 'safety-banner-low';
      case 'MEDIUM':
        return 'safety-banner-medium';
      case 'HIGH':
        return 'safety-banner-high';
      case 'CRITICAL':
        return 'safety-banner-critical';
      default:
        return 'safety-banner-low';
    }
  };

  const getTitle = () => {
    switch (riskLevel) {
      case 'LOW':
        return t('chat.safety.lowRisk');
      case 'MEDIUM':
        return t('chat.safety.mediumRisk');
      case 'HIGH':
        return t('chat.safety.highRisk');
      case 'CRITICAL':
        return t('chat.safety.criticalRisk');
      default:
        return t('chat.safety.notice');
    }
  };

  return (
    <div className={cn('mb-4', getBannerClass())}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{getTitle()}</h4>
          {moderationReason && <p className="text-sm mb-2">{moderationReason}</p>}
          {crisisResources && crisisResources.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">{t('chat.safety.crisisResources')}</p>
              <ul className="space-y-2">
                {crisisResources.map((resource, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Phone className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">{resource.name}</div>
                      {resource.phoneNumber && (
                        <a href={`tel:${resource.phoneNumber}`} className="text-sm hover:underline">
                          {resource.phoneNumber}
                        </a>
                      )}
                      {resource.website && (
                        <a
                          href={resource.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center gap-1 mt-1"
                        >
                          {t('chat.safety.visitWebsite')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {resource.description && (
                        <p className="text-xs mt-1 opacity-90">{resource.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyBanner;
