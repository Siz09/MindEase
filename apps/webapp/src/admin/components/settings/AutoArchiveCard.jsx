import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch';
import { Archive } from 'lucide-react';

const AutoArchiveCard = ({ autoArchive, autoArchiveDays, onToggle, onDaysChange, onDaysBlur }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Archive className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Auto-archive Crisis Flags</CardTitle>
            <CardDescription>
              Automatically archive crisis flags after a specified period.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label className="text-sm font-medium">Enable auto-archive</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Automatically archive old crisis flags to keep the system clean.
            </p>
          </div>
          <Switch checked={autoArchive} onCheckedChange={onToggle} />
        </div>

        {autoArchive && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="admin-auto-archive-days" className="text-sm font-medium">
              Archive after
            </Label>
            <div className="flex w-full max-w-xs items-center gap-2">
              <Input
                id="admin-auto-archive-days"
                type="number"
                min="1"
                max="365"
                value={autoArchiveDays}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!Number.isNaN(value) && value >= 1 && value <= 365) {
                    onDaysChange(value);
                  }
                }}
                onBlur={onDaysBlur}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoArchiveCard;
