import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Clock } from 'lucide-react';

const DailyReportTimeCard = ({ dailyReportTime, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Daily Report Time</CardTitle>
            <CardDescription>
              Set the time when daily reports are generated and sent.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="daily-report-time" className="text-sm font-medium">
            Report time
          </Label>
          <Input
            id="daily-report-time"
            type="time"
            value={dailyReportTime ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-48"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyReportTimeCard;
