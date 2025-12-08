'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-toastify';
import adminApi from './adminApi';

const AdminAuthContext = createContext();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  ''
);

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(true);

  // Helper to decode JWT payload safely
  const decodeJwt = (tkn) => {
    try {
      const base64 = tkn.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64));
      return json || null;
    } catch (_) {
      return null;
    }
  };

  // On mount, if we have an admin token try to resolve user
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const stored = localStorage.getItem('adminToken');
        if (!stored) {
          if (!cancelled) setLoading(false);
          return;
        }
        // Set token state early so consumers know we have a session candidate
        if (!cancelled) setAdminToken(stored);

        // Optimistically bootstrap role/email from JWT claims to avoid redirect flicker on new tabs
        const claims = decodeJwt(stored);
        // If token can't be decoded or doesn't have admin role, clear it immediately
        if (!claims || (!claims.role && !claims.authority)) {
          localStorage.removeItem('adminToken');
          if (!cancelled) {
            setAdminToken(null);
            setAdminUser(null);
            setLoading(false);
          }
          return;
        }

        if (
          !cancelled &&
          (claims.role === 'ADMIN' ||
            claims.role === 'ROLE_ADMIN' ||
            claims.authority === 'ROLE_ADMIN')
        ) {
          setAdminUser({
            email: claims.sub || claims.email || 'admin',
            role:
              claims.role === 'ADMIN' || claims.role === 'ROLE_ADMIN'
                ? claims.role
                : claims.authority === 'ROLE_ADMIN'
                  ? 'ROLE_ADMIN'
                  : undefined,
          });
        } else {
          // Token exists but user is not admin - clear it
          localStorage.removeItem('adminToken');
          if (!cancelled) {
            setAdminToken(null);
            setAdminUser(null);
            setLoading(false);
          }
          return;
        }

        const { data } = await adminApi.get('/auth/me');
        if (!cancelled) {
          // Handle both old format (data.user) and new format (data directly)
          const userData = data.user || data;
          setAdminUser(userData);
          setAdminToken(stored);
        }
      } catch (e) {
        console.error('Admin auth check failed:', e);
        const status = e?.response?.status;
        // If API call fails, clear token and user to prevent infinite loading
        // The optimistic user from JWT is just for UI flicker prevention
        // If the real API call fails, we should treat it as auth failure
        if (status === 401 || status === 403 || !e?.response) {
          // Auth error or network error - clear everything
          localStorage.removeItem('adminToken');
          if (!cancelled) {
            setAdminToken(null);
            setAdminUser(null);
          }
        } else {
          // For other server errors (500, etc.), also clear to prevent stuck state
          // User can retry by logging in again
          localStorage.removeItem('adminToken');
          if (!cancelled) {
            setAdminToken(null);
            setAdminUser(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const toastId = toast.loading('Signing in as admin...');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await cred.user.getIdToken();
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, { firebaseToken });
      const token = data.token;
      const user = data.user;

      if (
        !(user?.role === 'ADMIN' || user?.authority === 'ROLE_ADMIN' || user?.role === 'ROLE_ADMIN')
      ) {
        try {
          await auth.signOut();
        } catch (_e) {
          /* ignore */
        }
        toast.update(toastId, {
          render: 'Not an admin account',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
        return { success: false, error: 'Not an admin account' };
      }

      localStorage.setItem('adminToken', token);
      setAdminToken(token);
      setAdminUser(user);
      toast.update(toastId, {
        render: 'Admin signed in',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
      return { success: true };
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Admin login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Adopt an already-minted admin JWT without reauthenticating
  const adopt = (token, user) => {
    if (!token || !user) return { success: false, error: 'Missing token or user' };
    if (
      !(user?.role === 'ADMIN' || user?.authority === 'ROLE_ADMIN' || user?.role === 'ROLE_ADMIN')
    ) {
      return { success: false, error: 'Not an admin account' };
    }
    localStorage.setItem('adminToken', token);
    setAdminToken(token);
    setAdminUser(user);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setAdminUser(null);
    // Do NOT sign out of Firebase here to avoid impacting user session
  };

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, adminToken, loading, login, adopt, logout, isAuthenticated: !!adminUser }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
