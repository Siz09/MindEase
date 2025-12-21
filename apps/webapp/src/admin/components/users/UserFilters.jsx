import { Button, Input, Select } from '../shared';

const UserFilters = ({ filters, onSearch, onStatusChange, onClear }) => {
  return (
    <div className="admin-user-filters">
      <Input
        placeholder="Search by email..."
        value={filters.search}
        onChange={(e) => onSearch(e.target.value)}
        style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
      />
      <Select
        value={filters.status}
        onChange={(e) => onStatusChange(e.target.value)}
        options={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'banned', label: 'Banned' },
        ]}
        style={{ minWidth: '150px' }}
      />
      <Button variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
};

export default UserFilters;

