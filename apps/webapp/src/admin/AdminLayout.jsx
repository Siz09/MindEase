'use client';

import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../styles/admin-base.css';
import '../styles/admin-layout.css';
import '../styles/admin-bento.css';
import '../styles/admin-animations.css';
import '../styles/admin-responsive.css';
// Ensure core component styles are loaded for buttons, inputs, selects, and tables
import '../styles/admin-components.css';
import '../styles/admin-tables.css';
import '../styles/admin-header.css';
import { useState } from 'react';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell">
      <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
