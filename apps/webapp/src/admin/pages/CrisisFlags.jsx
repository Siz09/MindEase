'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const pct = (n) => `${Math.round((n || 0) * 100)}%`;
const safe = (v) => v ?? '-';
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date.toLocaleString();
};

export default function CrisisFlags() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/admin/crisis-flags');
        if (!mounted) return;
        setRows(Array.isArray(data) ? data : data?.items || []);
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load crisis flags');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="panel">
        <div className="panel-body">{error}</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">Loading...</div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="panel">
        <div className="panel-body">No crisis flags found.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Chat ID</th>
            <th>Keyword</th>
            <th>Risk</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td>{safe(f.userAlias || f.user || 'user')}</td>
              <td>{safe(f.chatId)}</td>
              <td>{safe(f.keyword || f.keywordDetected)}</td>
              <td>{pct(f.risk || f.riskScore)}</td>
              <td>{safe(formatDate(f.createdAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
