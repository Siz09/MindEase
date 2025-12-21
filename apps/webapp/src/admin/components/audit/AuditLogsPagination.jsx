const AuditLogsPagination = ({ page, totalPages, size, onPrev, onNext, onSetSize }) => {
  const currentPage = page + 1;
  const maxPages = Math.max(1, totalPages);
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
            type="button"
            style={{
              padding: '8px 16px',
              background: 'none',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              color: 'var(--gray)',
              transition: 'var(--transition-fast)',
              opacity: page === 0 ? 0.5 : 1,
            }}
            disabled={page === 0}
            onClick={onPrev}
            aria-label="Previous page"
          >
            Prev
          </button>
          <span style={{ fontSize: '14px', color: 'var(--dark)', fontWeight: '500' }}>
            Page {currentPage} / {maxPages}
          </span>
          <span className="sr-only" role="status" aria-live="polite">
            Page {currentPage} of {maxPages}
          </span>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              background: 'none',
              border: '1px solid var(--gray-light)',
              borderRadius: 'var(--radius-md)',
              cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              color: 'var(--gray)',
              transition: 'var(--transition-fast)',
              opacity: page + 1 >= totalPages ? 0.5 : 1,
            }}
            disabled={page + 1 >= totalPages}
            onClick={onNext}
            aria-label="Next page"
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
            htmlFor="page-size-select"
          >
            Page size
            <select
              id="page-size-select"
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPagination;
