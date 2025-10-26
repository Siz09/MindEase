'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { toCSV } from '../../utils/export';

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [f, setF] = useState({ email: '', action: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (f.action) params.set('actionType', f.action);
    if (f.from) params.set('from', new Date(f.from).toISOString());
    if (f.to) params.set('to', new Date(f.to).toISOString());
    return params.toString();
  }, [page, size, f]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/admin/audit-logs?${qs}`);
      setRows(data.content || []);
      setTotalPages(data.totalPages ?? (data.last ? page + 1 : page + 2));
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [qs, page]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  function exportCSV() {
    toCSV(rows, 'audit-logs.csv', [
      { key: 'userId', title: 'User ID' },
      { key: 'actionType', title: 'Action' },
      { key: 'details', title: 'Details' },
      { key: 'createdAt', title: 'When' },
    ]);
  }

  return (
    <div>
      <div className="filters">
        <label>
          Email{' '}
          <input
            placeholder="Email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </label>
        <label>
          Action
          <select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
            <option value="">All</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CHAT_SENT">CHAT_SENT</option>
            <option value="MOOD_ADDED">MOOD_ADDED</option>
            <option value="JOURNAL_ADDED">JOURNAL_ADDED</option>
          </select>
        </label>
        <label>
          From{' '}
          <input
            type="date"
            value={f.from}
            onChange={(e) => setF({ ...f, from: e.target.value })}
          />
        </label>
        <label>
          To <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </label>
        <button
          className="admin-btn"
          onClick={() => setF({ email: '', action: '', from: '', to: '' })}
        >
          Clear
        </button>
        <button className="admin-btn" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
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
                <td colSpan="4">No results</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="4">Loading...</td>
              </tr>
            )}
            {!!error && !loading && (
              <tr>
                <td colSpan="4">{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div>
          <button
            className="admin-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <span style={{ margin: '0 8px' }}>
            Page {page + 1} / {Math.max(1, totalPages)}
          </span>
          <button
            className="admin-btn"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
        <div>
          <label>
            Page size
            <select
              value={size}
              onChange={(e) => {
                setPage(0);
                setSize(Number(e.target.value));
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
}
