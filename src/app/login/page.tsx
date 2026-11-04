
'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function getRedirect() {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('redirect') || '/dashboard';

    return path.startsWith('/') && !path.startsWith('//')
      ? path
      : '/dashboard';
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      window.location.assign(getRedirect());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setLoading(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setMessage(
        'If an account exists for this email, a password reset link has been requested. Check your inbox and spam folder.'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to send reset email.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#145c2b', marginBottom: 5 }}>BODHI RURAL</h1>
        <p style={{ color: '#6b7280', marginBottom: 28 }}>
          Livelihood & Agriculture Platform
        </p>

        <h2>{forgotMode ? 'Reset Your Password' : 'Sign In'}</h2>

        <form onSubmit={forgotMode ? handleForgotPassword : handleLogin}>
          <label style={labelStyle}>Registered Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
            style={inputStyle}
          />

          {!forgotMode && (
            <>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={inputStyle}
              />

              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError('');
                    setMessage('');
                  }}
                  style={textButton}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {error && <p style={errorStyle}>{error}</p>}
          {message && <p style={successStyle}>{message}</p>}

          <button type="submit" disabled={loading} style={submitStyle}>
            {loading
              ? 'Please wait...'
              : forgotMode
              ? 'Send Reset Link'
              : 'Sign In'}
          </button>
        </form>

        {forgotMode && (
          <button
            type="button"
            onClick={() => {
              setForgotMode(false);
              setError('');
              setMessage('');
            }}
            style={{ ...textButton, marginTop: 18 }}
          >
            ← Back to Login
          </button>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: '#f5f7f4',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  padding: 32,
  borderRadius: 16,
  boxShadow: '0 10px 35px rgba(0,0,0,0.08)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  marginTop: 18,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  border: '1px solid #d1d5db',
  borderRadius: 8,
};

const submitStyle: React.CSSProperties = {
  width: '100%',
  padding: 13,
  marginTop: 22,
  border: 0,
  borderRadius: 8,
  background: '#145c2b',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const textButton: React.CSSProperties = {
  background: 'none',
  border: 0,
  color: '#145c2b',
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  color: '#b91c1c',
  background: '#fef2f2',
  padding: 10,
  borderRadius: 8,
  marginTop: 15,
};

const successStyle: React.CSSProperties = {
  color: '#166534',
  background: '#ecfdf5',
  padding: 10,
  borderRadius: 8,
  marginTop: 15,
};
