'use client';

import AuditLogFilters from '../components/audit/AuditLogFilters';
import AuditLogsPagination from '../components/audit/AuditLogsPagination';
import AuditLogsTable from '../components/audit/AuditLogsTable';
import useAuditLogs from '../hooks/useAuditLogs';

export default function AuditLogs() {
  const {
    rows,
    page,
    setPage,
    size,
    setPageSize,
    totalPages,
    filters,
    updateFilters,
    clearFilters,
    loading,
    error,
    notice,
    exportCSV,
  } = useAuditLogs({ initialPageSize: 25 });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Track all user actions and system events</p>
      </div>

      <AuditLogFilters
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        onExport={exportCSV}
      />

      {notice && !loading && !error && (
        <div
          style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            backgroundColor: '#fef3c7',
            borderRadius: 'var(--radius-md)',
            color: 'var(--dark)',
            fontSize: '14px',
          }}
        >
          {notice}
        </div>
      )}

      <AuditLogsTable rows={rows} loading={loading} error={error} />

      <AuditLogsPagination
        page={page}
        totalPages={totalPages}
        size={size}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        onSetSize={setPageSize}
      />
    </div>
  );
}
