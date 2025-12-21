import { Button, Input, Select } from '../shared';

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
    <div className="admin-user-filters">
      <Input
        placeholder="Search by email..."
        value={safeFilters.search}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
      />
      <Select
        value={safeFilters.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        options={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'banned', label: 'Banned' },
        ]}
        style={{ minWidth: '150px' }}
      />
      <Button variant="ghost" onClick={handleClear}>
        Clear
      </Button>
    </div>
  );
};

export default UserFilters;
