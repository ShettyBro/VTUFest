/**
 * CompanionLogin.jsx
 * /manager — Dedicated login for Manager Companion System
 * Hardcodes role = "manager". No registration, forgot-password, or role selector.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.vtufest2026.acharyahabba.com';

const S = {
  page: {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, #0d1424 0%, #0a0e1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#f1f5f9',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20,
    padding: '32px 28px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 28,
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    padding: '4px 12px',
    borderRadius: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(241,245,249,0.45)',
    marginTop: 6,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(241,245,249,0.55)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 15,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 8,
    transition: 'opacity 0.2s',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 11,
    color: 'rgba(241,245,249,0.25)',
  },
};

export default function CompanionLogin() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Redirect if already logged in as manager
  const token = localStorage.getItem('vtufest_token');
  const role  = localStorage.getItem('vtufest_role');
  if (token && role === 'manager') {
    navigate('/manager/home', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: 'manager' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid credentials. Please try again.');
        return;
      }

      // Force-reset flow
      if (data.status === 'FORCE_RESET') {
        localStorage.setItem('force_reset_token', data.reset_token);
        localStorage.setItem('force_reset_email', data.email);
        navigate('/force-reset-password');
        return;
      }

      if (!data.token) {
        setError('Login failed. Please try again.');
        return;
      }

      // Store credentials — same keys as the main app
      localStorage.setItem('vtufest_token', data.token);
      localStorage.setItem('vtufest_role', 'manager');
      localStorage.setItem('vtufest_name', data.name || '');
      if (data.college_id) localStorage.setItem('vtufest_college_id', String(data.college_id));

      navigate('/manager/home', { replace: true });
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !email.trim() || !password || loading;

  return (
    <div style={S.page}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(241,245,249,0.25); }
        input:focus { border-color: #3b82f6 !important; }
      `}</style>

      <div style={S.card}>
        <div style={S.logo}>
          <img src="/main.webp" alt="VTU Habba" style={{ height: 52, objectFit: 'contain', marginBottom: 14 }} />
          <div style={S.badge}>Manager Companion</div>
          <h1 style={S.title}>Sign In</h1>
          <p style={S.subtitle}>VTU HABBA 2026 · Event Day App</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={S.fieldGroup}>
            <label style={S.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="manager@college.edu"
              autoComplete="email"
              inputMode="email"
              style={S.input}
              disabled={loading}
            />
          </div>

          <div style={S.fieldGroup}>
            <label style={S.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...S.input, paddingRight: 48 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(241,245,249,0.4)',
                  cursor: 'pointer', padding: 4, fontSize: 13,
                }}
                tabIndex={-1}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled}
            style={{ ...S.btn, ...(disabled ? S.btnDisabled : {}) }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {error && <div style={S.error}>{error}</div>}
      </div>

      <div style={S.footer}>
        Acharya Institute of Technology · Bengaluru
      </div>
    </div>
  );
}
