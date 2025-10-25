'use client';

import { useMemo, useState } from 'react';

// Display-only redaction; real PII protection must happen server-side.
const redactEmail = (email) => {
  if (!email || typeof email !== 'string') return 'user';
  const at = email.indexOf('@');
  if (at <= 0) return 'user';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  const localVisible = local.slice(0, 2);
  const localMaskLen = Math.max(local.length - localVisible.length, 1);

  const parts = domain.split('.');
  if (parts.length >= 2) {
    const tld = parts.pop();
    const domName = parts.join('.');
    const domVisible = domName ? domName[0] : '';
    const domMaskLen = Math.max((domName?.length || 0) - (domVisible ? 1 : 0), 1);
    const maskedDomain = `${domVisible}${'*'.repeat(domMaskLen)}.${tld}`;
    return `${localVisible}${'*'.repeat(localMaskLen)}@${maskedDomain}`;
  }

  const domVisible = domain[0] || '';
  const domMaskLen = Math.max(domain.length - (domVisible ? 1 : 0), 1);
  return `${localVisible}${'*'.repeat(localMaskLen)}@${domVisible}${'*'.repeat(domMaskLen)}`;
};

const DATA = [
  {
    id: '1',
    user: 'alice@example.com',
    action: 'LOGIN',
    details: 'User logged in',
    createdAt: '2025-10-24T09:12:00Z',
  },
  {
    id: '2',
    user: 'bob@example.com',
    action: 'CHAT_SENT',
    details: 'Chat message sent',
    createdAt: '2025-10-24T10:01:00Z',
  },
  {
    id: '3',
    user: 'alice@example.com',
    action: 'MOOD_ADDED',
    details: 'Mood entry added',
    createdAt: '2025-10-24T11:25:00Z',
  },
  {
    id: '4',
    user: 'carol@example.com',
    action: 'JOURNAL_ADDED',
    details: 'Journal entry added',
    createdAt: '2025-10-24T12:45:00Z',
  },
];

export default function AuditLogs() {
  const [f, setF] = useState({ email: '', action: '', from: '', to: '' });

  const rows = useMemo(
    () =>
      DATA.filter((r) => {
        const e = f.email ? r.user.toLowerCase().includes(f.email.toLowerCase()) : true;
        const a = f.action ? r.action === f.action : true;
        const from = f.from ? new Date(r.createdAt) >= new Date(f.from) : true;
        const to = f.to ? new Date(r.createdAt) <= new Date(f.to) : true;
        return e && a && from && to;
      }),
    [f]
  );

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
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{redactEmail(r.user)}</td>
                <td>{r.action}</td>
                <td title={r.details}>{r.details}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
