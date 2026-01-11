import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Label } from '../../../components/ui/Label';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Mail } from 'lucide-react';

const EmailNotificationsCard = ({ emailNotifications, onChange = () => {} }) => {
  const options = [
    {
      value: 'all',
      title: 'All events',
      description: 'Receive notifications for all system events.',
    },
    {
      value: 'critical',
      title: 'Critical only',
      description: 'Only receive notifications for critical events.',
    },
    {
      value: 'none',
      title: 'None',
      description: 'Disable all email notifications.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Mail className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Choose which events trigger email notifications.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={emailNotifications} onValueChange={onChange} className="space-y-3">
          <Label className="text-sm font-medium">Notification level</Label>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                emailNotifications === opt.value
                  ? 'border-primary-200 bg-primary-50/50'
                  : 'border-border bg-background hover:bg-accent'
              }`}
            >
              <RadioGroupItem value={opt.value} id={opt.value} className="mt-1" />
              <Label htmlFor={opt.value} className="flex-1 cursor-pointer">
                <div className="text-sm font-medium">{opt.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{opt.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default EmailNotificationsCard;
