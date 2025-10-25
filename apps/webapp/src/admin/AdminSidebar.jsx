'use client';

import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">MindEase Admin</div>
      <nav>
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}
        >
          Overview
        </NavLink>
        <NavLink
          to="/admin/audit-logs"
          className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}
        >
          Audit Logs
        </NavLink>
        <NavLink
          to="/admin/crisis-flags"
          className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}
        >
          Crisis Flags
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}
        >
          Settings
        </NavLink>
      </nav>
      <div className="admin-hint">v1.0 • admin-only</div>
    </aside>
  );
}
