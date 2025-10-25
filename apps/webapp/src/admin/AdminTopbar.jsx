'use client';

import { useAuth } from '../contexts/AuthContext';

export default function AdminTopbar({ pathname }) {
  const { currentUser, logout } = useAuth();
  const label =
    pathname === '/admin'
      ? 'Overview'
      : pathname.includes('audit-logs')
        ? 'Audit Logs'
        : pathname.includes('crisis-flags')
          ? 'Crisis Flags'
          : pathname.includes('settings')
            ? 'Settings'
            : 'Admin';

  return (
    <header className="admin-topbar">
      <div className="admin-breadcrumb">{label}</div>
      <div className="admin-topbar-right">
        <div className="admin-user">{currentUser?.email || 'admin'}</div>
        <button className="admin-btn" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
