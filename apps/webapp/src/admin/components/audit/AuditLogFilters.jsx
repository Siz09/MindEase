import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Download, X } from 'lucide-react';

const AuditLogFilters = ({ filters, onChange, onClear, onExport }) => {
  const safeFilters = filters || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="email-filter">Email</Label>
            <Input
              id="email-filter"
              placeholder="Filter by email"
              value={safeFilters.email || ''}
              onChange={(e) => onChange({ ...safeFilters, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="action-filter">Action</Label>
            <Select
              value={safeFilters.action || 'all'}
              onValueChange={(value) =>
                onChange({ ...safeFilters, action: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger id="action-filter" className="mt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="LOGIN">LOGIN</SelectItem>
                <SelectItem value="CHAT_SENT">CHAT_SENT</SelectItem>
                <SelectItem value="MOOD_ADDED">MOOD_ADDED</SelectItem>
                <SelectItem value="JOURNAL_ADDED">JOURNAL_ADDED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="from-filter">From</Label>
            <Input
              id="from-filter"
              type="date"
              value={safeFilters.from || ''}
              onChange={(e) => onChange({ ...safeFilters, from: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="to-filter">To</Label>
            <Input
              id="to-filter"
              type="date"
              value={safeFilters.to || ''}
              onChange={(e) => onChange({ ...safeFilters, to: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onClear} aria-label="Clear filters">
              <X className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogFilters;
