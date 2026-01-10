'use client';

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="pagination">
      {totalItems !== undefined && (
        <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
          Total: {totalItems}
        </div>
      )}
      <div className="pagination-buttons">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {Math.max(1, totalPages)}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage + 1 >= totalPages}
        >
          Next
        </button>
      </div>
      {onPageSizeChange && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            Page size:
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="form-select select-field"
              style={{ width: 'auto' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
