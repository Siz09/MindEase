'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AuditLogs() {
  const [f, setF] = useState({ email: '', action: '', from: '', to: '' });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const params = {};
        if (f.email) params.email = f.email;
        if (f.action) params.action = f.action;
        if (f.from) params.from = f.from;
        if (f.to) params.to = f.to;
        const { data } = await axios.get('/api/admin/audit-logs', { params });
        if (!mounted) return;
        const items = Array.isArray(data) ? data : data?.items || [];
        setRows(items);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load audit logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [f.email, f.action, f.from, f.to]);

  return (
    <div>
      <div className="filters">
        <label htmlFor="email-filter">Email</label>
        <input
          id="email-filter"
          placeholder="Email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
        <label htmlFor="action-filter">Action</label>
        <select
          id="action-filter"
          value={f.action}
          onChange={(e) => setF({ ...f, action: e.target.value })}
        >
          <option value="">All actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CHAT_SENT">CHAT_SENT</option>
          <option value="MOOD_ADDED">MOOD_ADDED</option>
          <option value="JOURNAL_ADDED">JOURNAL_ADDED</option>
        </select>
        <label htmlFor="from-filter">From</label>
        <input
          id="from-filter"
          type="date"
          value={f.from}
          onChange={(e) => setF({ ...f, from: e.target.value })}
        />
        <label htmlFor="to-filter">To</label>
        <input
          id="to-filter"
          type="date"
          value={f.to}
          onChange={(e) => setF({ ...f, to: e.target.value })}
        />
        <button
          className="admin-btn"
          onClick={() => setF({ email: '', action: '', from: '', to: '' })}
        >
          Clear
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
            {!loading &&
              !error &&
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.userAlias || r.user || 'user'}</td>
                  <td>{r.action}</td>
                  <td title={r.details}>{r.details}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            {loading && (
              <tr>
                <td colSpan="4">Loading...</td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan="4">{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
