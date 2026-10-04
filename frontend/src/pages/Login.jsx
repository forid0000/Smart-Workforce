import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@smartworkforce.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  if (user) return <Navigate to={user.role === 'EMPLOYEE' ? '/me' : '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const u = await login(email, password);
      // Employee → /me dashboard; Admin → main admin dashboard
      navigate(u?.role === 'EMPLOYEE' ? '/me' : '/');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-brand-600 text-white grid place-items-center text-xl font-bold">
            SW
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">Smart Workforce</div>
            <div className="text-sm text-slate-500">Task Allocation System</div>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-slate-800 mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-6">
          Use your admin credentials to continue.
        </p>

        <ErrorBanner message={error} />

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600">
          <div className="font-medium text-slate-700 mb-1">Demo Credentials</div>
          <div>Admin: <code>admin@smartworkforce.com</code> / <code>admin123</code></div>
          <div>Employee: <code>rahim@example.com</code> / <code>employee123</code></div>
        </div>
      </div>
    </div>
  );
}