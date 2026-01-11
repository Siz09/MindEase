'use client';

import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import { Separator } from '../components/ui/Separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';

// Map routes to breadcrumb labels
const routeLabels = {
  '/admin': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/crisis-monitoring': 'Crisis Monitoring',
  '/admin/content': 'Content Library',
  '/admin/analytics': 'Analytics',
  '/admin/system': 'System Health',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/crisis-flags': 'Crisis Flags',
  '/admin/settings': 'Settings',
};

function getBreadcrumbs(pathname) {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  // Always start with Admin
  if (paths.length > 0 && paths[0] === 'admin') {
    breadcrumbs.push({ label: 'Admin', path: '/admin' });

    // Add current page
    if (paths.length > 1) {
      const currentPath = `/${paths.join('/')}`;
      const currentLabel =
        routeLabels[currentPath] ||
        paths[paths.length - 1]
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      breadcrumbs.push({ label: currentLabel, path: currentPath, isCurrent: true });
    } else {
      breadcrumbs[0].isCurrent = true;
    }
  }

  return breadcrumbs;
}

export default function AdminLayout() {
  // Force light theme for admin UI regardless of system preference
  React.useEffect(() => {
    const adminContainer = document.querySelector('.admin-ui');
    if (adminContainer) {
      adminContainer.setAttribute('data-theme', 'light');
      // Remove dark class if present
      adminContainer.classList.remove('dark');
    }
  }, []);

  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <SidebarProvider>
      <div className="admin-ui flex min-h-screen w-full" data-theme="light">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 animate-in fade-in duration-300">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
