"use client"

export default function Pagination({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  return (
    <div className="pagination">
      <div className="pagination-buttons">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </button>
        <span>Page {currentPage + 1} of {Math.max(1, totalPages)}</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage + 1 >= totalPages}
        >
          Next
        </button>
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          Page size:
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="form-select select-field"
            style={{ width: 'auto' }}
          >
            <option>10</option>
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
        </label>
      </div>
    </div>
  )
}
