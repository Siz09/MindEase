const AuditLogsTable = ({ rows, loading, error }) => {
  return (
    <div className="bento-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <div className="table-wrap">
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.userId}</td>
                <td>{r.actionType}</td>
                <td title={r.details}>{r.details}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
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
                  {error}
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

