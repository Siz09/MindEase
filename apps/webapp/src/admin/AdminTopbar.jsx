'use client';

import { useAdminAuth } from './AdminAuthContext';

export default function AdminTopbar({ pathname }) {
  const { adminUser: currentUser, logout } = useAdminAuth();
  const p = pathname ?? '';
  const label =
    p === '/admin'
      ? 'Overview'
      : p.includes('audit-logs')
        ? 'Audit Logs'
        : p.includes('crisis-flags')
          ? 'Crisis Flags'
          : p.includes('settings')
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
