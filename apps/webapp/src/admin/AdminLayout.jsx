'use client';

import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import '../styles/admin.css';

export default function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminTopbar pathname={pathname} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
