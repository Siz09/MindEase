'use client';

import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  const navItems = [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/audit-logs', label: 'Audit Logs' },
    { to: '/admin/crisis-flags', label: 'Crisis Flags' },
    { to: '/admin/settings', label: 'Settings' },
  ];

  const navLinkClassName = ({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`;

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">MindEase Admin</div>
      <nav>
        {navItems.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClassName}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="admin-hint">v1.0 • admin-only</div>
    </aside>
  );
}
