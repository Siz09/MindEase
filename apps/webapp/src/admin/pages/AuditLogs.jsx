'use client';

import AuditLogFilters from '../components/audit/AuditLogFilters';
import AuditLogsPagination from '../components/audit/AuditLogsPagination';
import AuditLogsTable from '../components/audit/AuditLogsTable';
import useAuditLogs from '../hooks/useAuditLogs';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { AlertCircle } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Track all user actions and system events</p>
      </div>

      <AuditLogFilters
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        onExport={exportCSV}
      />

      {notice && !loading && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
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
