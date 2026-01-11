import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Search, X } from 'lucide-react';

const UserFilters = ({ filters, onSearch, onStatusChange, onClear }) => {
  const safeFilters = {
    search: filters?.search ?? '',
    status: filters?.status ?? 'all',
  };

  const handleSearch = (value) => {
    if (typeof onSearch === 'function') {
      onSearch(value);
    }
  };

  const handleStatusChange = (value) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(value);
    }
  };

  const handleClear = () => {
    if (typeof onClear === 'function') {
      onClear();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <label htmlFor="user-search-input" className="sr-only">
          Search users by email
        </label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="user-search-input"
          placeholder="Search by email..."
          value={safeFilters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
          aria-label="Search users by email"
        />
      </div>
      <div>
        <label htmlFor="user-status-select" className="sr-only">
          Filter by status
        </label>
        <Select value={safeFilters.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="user-status-select" className="w-[180px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={handleClear} size="icon" aria-label="Clear filters">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UserFilters;
