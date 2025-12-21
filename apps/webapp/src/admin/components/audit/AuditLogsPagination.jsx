const AuditLogsPagination = ({ page, totalPages, size, onPrev, onNext, onSetSize }) => {
  return (
    <div className="bento-card" style={{ padding: 'var(--spacing-lg)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
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
            disabled={page === 0}
            onClick={onPrev}
          >
            Prev
          </button>
          <span style={{ fontSize: '14px', color: 'var(--dark)', fontWeight: '500' }}>
            Page {page + 1} / {Math.max(1, totalPages)}
          </span>
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
            disabled={page + 1 >= totalPages}
            onClick={onNext}
          >
            Next
          </button>
        </div>
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              fontWeight: '500',
            }}
          >
            Page size
            <select
              value={size}
              onChange={(e) => onSetSize(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                border: '1px solid var(--gray-light)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            >
              <option>10</option>
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPagination;

