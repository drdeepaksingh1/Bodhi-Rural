
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function verifyRecoverySession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setError(
          'This reset link is invalid or expired. Please request a new password reset link.'
        );
      } else {
        setReady(true);
      }
    }

    verifyRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
        setError('');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setMessage('Password updated successfully. You can now sign in.');

      await supabase.auth.signOut();
      setReady(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update password.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#145c2b' }}>BODHI RURAL</h1>
        <h2>Set New Password</h2>

        {ready ? (
          <form onSubmit={handleReset}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              style={inputStyle}
              placeholder="Enter new password"
            />

            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              style={inputStyle}
              placeholder="Confirm new password"
            />

            <button disabled={loading} type="submit" style={submitStyle}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <p style={{ color: '#6b7280' }}>
            {message || error || 'Verifying reset link...'}
          </p>
        )}

        {error && ready && <p style={errorStyle}>{error}</p>}
        {message && <p style={successStyle}>{message}</p>}

        {(message || error) && (
          <a href="/login" style={{ color: '#145c2b', fontWeight: 600 }}>
            Return to Login
          </a>
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
  marginTop: 18,
  marginBottom: 8,
  fontWeight: 600,
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
};

const errorStyle: React.CSSProperties = {
  color: '#b91c1c',
  background: '#fef2f2',
  padding: 10,
  borderRadius: 8,
};

const successStyle: React.CSSProperties = {
  color: '#166534',
  background: '#ecfdf5',
  padding: 10,
  borderRadius: 8,
};

