const AuditLogsTable = ({ rows, loading, error }) => {
  const safeRows = Array.isArray(rows) ? rows : [];

  const formatCreatedAt = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
  };

  return (
    <div className="bento-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div className="table-wrap">
        <table className="table" style={{ width: '100%' }} aria-label="Audit logs">
          <caption className="sr-only">Audit log entries</caption>
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Action</th>
              <th scope="col">Details</th>
              <th scope="col">When</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((r) => (
              <tr key={r.id}>
                <td>{r.userId}</td>
                <td>{r.actionType}</td>
                <td title={r.details}>{r.details}</td>
                <td>{formatCreatedAt(r.createdAt)}</td>
              </tr>
            ))}
            {!loading && safeRows.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: 'center',
                    color: 'var(--gray)',
                    padding: 'var(--spacing-lg)',
                  }}
                >
                  No results
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: 'center',
                    color: 'var(--gray)',
                    padding: 'var(--spacing-lg)',
                  }}
                >
                  Loading...
                </td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: 'center',
                    color: 'var(--danger)',
                    padding: 'var(--spacing-lg)',
                  }}
                >
                  {typeof error === 'string' ? error : error?.message || 'An error occurred'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsTable;
