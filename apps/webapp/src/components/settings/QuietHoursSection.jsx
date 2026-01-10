import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useQuietHours } from '../../hooks/useQuietHours';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Separator } from '../ui/Separator';
import Button from '../ui/Button';
import { Clock, Moon, Sun } from 'lucide-react';

const QuietHoursSection = ({ currentUser }) => {
  const { t } = useTranslation();
  const { quietStart, setQuietStart, quietEnd, setQuietEnd, quietHoursLoading, saveQuietHours } =
    useQuietHours({ currentUser, t });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.quietHours.title')}</CardTitle>
          <CardDescription>{t('settings.notifications.quietHours.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Settings Display */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('settings.notifications.quietHours.startTimeLabel')}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {quietStart || '--:--'}
                </div>
              </div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('settings.notifications.quietHours.endTimeLabel')}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {quietEnd || '--:--'}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Time Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                {t('settings.notifications.quietHours.startTime')}
              </label>
              <input
                type="time"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                value={quietStart || ''}
                onChange={(e) => setQuietStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                {t('settings.notifications.quietHours.endTime')}
              </label>
              <input
                type="time"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition-all"
                value={quietEnd || ''}
                onChange={(e) => setQuietEnd(e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              onClick={saveQuietHours}
              disabled={quietHoursLoading}
              className="w-full"
            >
              {quietHoursLoading
                ? t('settings.notifications.quietHours.saving')
                : t('settings.notifications.quietHours.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

QuietHoursSection.propTypes = {
  currentUser: PropTypes.shape({
    quietHoursStart: PropTypes.string,
    quietHoursEnd: PropTypes.string,
  }),
};

export default QuietHoursSection;
