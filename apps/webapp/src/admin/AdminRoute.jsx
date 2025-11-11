'use client';

import { Navigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminRoute({ children }) {
  const { adminUser: currentUser, adminToken, loading } = useAdminAuth();

  // Wait for auth resolution before deciding
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    // If we have an admin token but user isn't resolved yet, keep waiting
    if (adminToken) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          Loading...
        </div>
      );
    }
    return <Navigate to="/login" replace />;
  }

  const roles = []
    .concat(currentUser?.role || [])
    .concat(currentUser?.authority || [])
    .concat(currentUser?.authorities || []);

  const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  return isAdmin ? children : <Navigate to="/login" replace />;
}
