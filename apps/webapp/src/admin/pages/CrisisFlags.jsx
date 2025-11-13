'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../adminApi';
import { useAdminAuth } from '../AdminAuthContext';
import { toCSV } from '../../utils/export';

const pct = (n) => `${Math.round((n || 0) * 100)}%`;

export default function CrisisFlags() {
  const { adminToken } = useAdminAuth();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const esRef = useRef(null);
  const inFlightRef = useRef(false);
  const debounceRef = useRef(null);

  const query = () => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) params.set('from', d.toISOString());
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) params.set('to', d.toISOString());
    }
    return params.toString();
  };

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/crisis-flags?${query()}`);
      setRows(data.content || []);
      setTotalPages(data.totalPages ?? (data.last ? page + 1 : page + 2));
    } catch (err) {
      if (!(err && err.response && err.response.status === 404)) {
        console.error('Failed to load crisis flags:', err);
      }
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [page, size, from, to]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    // Close previous stream/poller
    if (esRef.current && typeof esRef.current.close === 'function') {
      esRef.current.close();
    }

    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const sseUrl = adminToken
      ? `${base}/api/admin/crisis-flags/stream?access_token=${encodeURIComponent(adminToken)}`
      : `${base}/api/admin/crisis-flags/stream`;
    let startedPolling = false;

    function startPolling() {
      if (startedPolling) return;
      startedPolling = true;
      const id = setInterval(load, 10000);
      esRef.current = { close: () => clearInterval(id) };
    }

    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      let opened = false;
      const fallbackTimer = setTimeout(() => {
        if (!opened) {
          es.close();
          startPolling();
        }
      }, 2500);
      es.onopen = () => {
        opened = true;
        clearTimeout(fallbackTimer);
      };
      const onFlag = (ev) => {
        try {
          const flag = JSON.parse(ev.data);
          if (page === 0 && !from && !to) {
            setRows((prev) => [flag, ...prev].slice(0, size));
          } else {
            // Debounce reloads to avoid spamming requests when many events arrive
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (!inFlightRef.current) {
                load();
              }
            }, 500);
          }
        } catch {
          return;
        }
      };
      // Support both default and named events ('flag') from server
      es.onmessage = onFlag;
      es.addEventListener('flag', onFlag);
      es.onerror = () => {
        // network/server issue: fallback to polling
        es.close();
        startPolling();
      };
      esRef.current = es;
    } catch {
      startPolling();
    }

    return () => {
      if (esRef.current && typeof esRef.current.close === 'function') {
        esRef.current.close();
      }
    };
  }, [size, page, from, to, load, adminToken]);

  function exportCSV() {
    toCSV(rows, 'crisis-flags.csv', [
      { key: 'userId', title: 'User ID' },
      { key: 'chatId', title: 'Chat ID' },
      { key: 'keywordDetected', title: 'Keyword' },
      { key: 'riskScore', title: 'Risk' },
      { key: 'createdAt', title: 'When' },
    ]);
  }

  return (
    <div>
      <div className="filters">
        <label>
          From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          className="admin-btn"
          onClick={() => {
            setFrom('');
            setTo('');
            setPage(0);
          }}
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
              <th>Chat ID</th>
              <th>Keyword</th>
              <th>Risk</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.userId}</td>
                <td>{r.chatId}</td>
                <td>{r.keywordDetected ?? r.keyword}</td>
                <td>{r.riskScore != null ? pct(r.riskScore) : '—'}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan="5">No results</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="5">Loading...</td>
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
