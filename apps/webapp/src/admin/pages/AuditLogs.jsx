'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../adminApi';
import { toCSV } from '../../utils/export';

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [f, setF] = useState({ email: '', action: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (f.email) params.set('email', f.email);
    if (f.action) params.set('actionType', f.action);
    if (f.from) {
      const fromDate = new Date(f.from);
      if (!isNaN(fromDate.getTime())) params.set('from', fromDate.toISOString());
    }
    if (f.to) {
      const toDate = new Date(f.to);
      if (!isNaN(toDate.getTime())) params.set('to', toDate.toISOString());
    }
    return params.toString();
  }, [page, size, f]);

  // For privacy, avoid including email in URL during fallback GET
  const qsNoEmail = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (f.action) params.set('actionType', f.action);
    if (f.from) {
      const fromDate = new Date(f.from);
      if (!isNaN(fromDate.getTime())) params.set('from', fromDate.toISOString());
    }
    if (f.to) {
      const toDate = new Date(f.to);
      if (!isNaN(toDate.getTime())) params.set('to', toDate.toISOString());
    }
    return params.toString();
  }, [page, size, f.action, f.from, f.to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (f.email) {
        const body = {
          page,
          size,
          email: f.email,
          actionType: f.action || undefined,
          from: f.from && !isNaN(new Date(f.from)) ? new Date(f.from).toISOString() : undefined,
          to: f.to && !isNaN(new Date(f.to)) ? new Date(f.to).toISOString() : undefined,
        };
        try {
          ({ data } = await api.post('/admin/audit-logs/search', body));
          setNotice('');
        } catch (err) {
          if (err?.response?.status === 404 || err?.response?.status === 405) {
            // Inform user that email filter could not be applied to avoid leaking PII in URL
            setNotice(
              'Email filter could not be applied (server does not support POST search). Showing results without email filter.'
            );
            ({ data } = await api.get(`/admin/audit-logs?${qsNoEmail}`));
          } else {
            throw err;
          }
        }
      } else {
        ({ data } = await api.get(`/admin/audit-logs?${qs}`));
        setNotice('');
      }
      setRows(data.content || []);
      setTotalPages(data.totalPages ?? (data.last ? page + 1 : page + 2));
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [qs, qsNoEmail]);

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
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Track all user actions and system events</p>
      </div>

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
            <label
              style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}
            >
              Email
            </label>
            <input
              placeholder="Filter by email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
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
            <label
              style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}
            >
              Action
            </label>
            <select
              value={f.action}
              onChange={(e) => setF({ ...f, action: e.target.value })}
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
            <label
              style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}
            >
              From
            </label>
            <input
              type="date"
              value={f.from}
              onChange={(e) => setF({ ...f, from: e.target.value })}
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
            <label
              style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}
            >
              To
            </label>
            <input
              type="date"
              value={f.to}
              onChange={(e) => setF({ ...f, to: e.target.value })}
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
              onClick={() => setF({ email: '', action: '', from: '', to: '' })}
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
              onClick={exportCSV}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

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
              onClick={() => setPage((p) => Math.max(0, p - 1))}
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
              onClick={() => setPage((p) => p + 1)}
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
                onChange={(e) => {
                  setPage(0);
                  setSize(Number(e.target.value));
                }}
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
    </div>
  );
}
