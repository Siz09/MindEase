import { Button, FilterBar } from '../shared';

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
    <FilterBar>
      <label htmlFor="user-search-input" className="sr-only">
        Search by email
      </label>
      <input
        id="user-search-input"
        placeholder="Search by email..."
        value={safeFilters.search}
        onChange={(e) => handleSearch(e.target.value)}
        className="form-input"
        style={{ maxWidth: '320px' }}
      />
      <label htmlFor="user-status-select" className="sr-only">
        User status
      </label>
      <select
        id="user-status-select"
        value={safeFilters.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="form-select"
        style={{ maxWidth: '220px' }}
      >
        <option value="all">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="banned">Banned</option>
      </select>
      <Button variant="secondary" onClick={handleClear}>
        Clear
      </Button>
    </FilterBar>
  );
};

export default UserFilters;
