const AuditLogFilters = ({ filters, onChange, onClear, onExport }) => {
  return (
    <div
      className="bento-card"
      style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)' }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-md)',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            Email
          </label>
          <input
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => onChange({ email: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            Action
          </label>
          <select
            value={filters.action}
            onChange={(e) => onChange({ action: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          >
            <option value="">All</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CHAT_SENT">CHAT_SENT</option>
            <option value="MOOD_ADDED">MOOD_ADDED</option>
            <option value="JOURNAL_ADDED">JOURNAL_ADDED</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            From
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => onChange({ from: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            To
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => onChange({ to: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'inherit',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            style={{
              padding: '8px 16px',
              background: 'none',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              color: 'var(--gray)',
              transition: 'var(--transition-fast)',
            }}
            onClick={onClear}
          >
            Clear
          </button>
          <button
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'var(--transition-fast)',
            }}
            onClick={onExport}
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogFilters;

