import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('journalist@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg)]" aria-label="Sign in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-[var(--color-text)] mb-1">News Investigation</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-xs font-mono text-[var(--color-text-secondary)] block mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                         px-4 py-3 text-sm text-[var(--color-text)] outline-none
                         focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-mono text-[var(--color-text-secondary)] block mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
                         px-4 py-3 text-sm text-[var(--color-text)] outline-none
                         focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-fg)]
                       font-medium text-sm touch-target disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-6">
          Demo: use any email + password
        </p>
      </div>
    </main>
  );
};
