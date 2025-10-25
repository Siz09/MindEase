'use client';

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;

  const roles = []
    .concat(currentUser?.role || [])
    .concat(currentUser?.authority || [])
    .concat(currentUser?.authorities || []);

  const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  return isAdmin ? children : <Navigate to="/" replace />;
}
