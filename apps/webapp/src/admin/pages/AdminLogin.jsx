'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '../AdminAuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const alive = useRef(true);

  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res?.success) {
        navigate('/admin');
      } else {
        setError(res?.error || 'Login failed');
      }
    } catch (err) {
      setError(err?.message || 'Login error');
    } finally {
      if (alive.current) setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h2>Admin Login</h2>
      <form onSubmit={onSubmit}>
        {error && <div style={{ color: '#b00020', marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="admin-btn" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
