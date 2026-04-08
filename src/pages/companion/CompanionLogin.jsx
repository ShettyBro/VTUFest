/**
 * CompanionLogin.jsx — /manager
 * Dedicated login for Manager Companion System.
 * Theme: matches VTU Habba — deep blue gradient + gold accent.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.vtufest2026.acharyahabba.com';

export default function CompanionLogin() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);

  // Already logged in
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
        setError(data.message || 'Invalid credentials.');
        return;
      }

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mc-page {
          min-height: 100dvh;
          background: linear-gradient(170deg, #1e3a8a 0%, #1a237e 30%, #0f172a 65%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 20px 48px;
          font-family: 'Outfit', 'Segoe UI', system-ui, sans-serif;
          color: #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        /* Subtle radial glow behind the card */
        .mc-page::before {
          content: '';
          position: absolute;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .mc-card {
          position: relative;
          width: 100%;
          max-width: 400px;
          background: rgba(15, 23, 42, 0.72);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 36px 30px 32px;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.12),
            0 32px 80px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
        }

        .mc-logo-wrap {
          text-align: center;
          margin-bottom: 28px;
        }

        .mc-logo {
          height: 56px;
          object-fit: contain;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 12px rgba(99,102,241,0.3));
        }

        .mc-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(212,175,55,0.12);
          border: 1px solid rgba(212,175,55,0.35);
          color: #fbbf24;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 20px;
          margin-bottom: 14px;
        }

        .mc-chip::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fbbf24;
          box-shadow: 0 0 6px #fbbf24;
        }

        .mc-title {
          font-size: 26px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 6px;
        }

        .mc-subtitle {
          font-size: 13px;
          color: rgba(241,245,249,0.4);
          font-weight: 500;
        }

        .mc-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          margin: 24px 0;
        }

        .mc-field {
          margin-bottom: 18px;
        }

        .mc-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(241,245,249,0.45);
          margin-bottom: 8px;
        }

        .mc-input-wrap {
          position: relative;
        }

        .mc-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 13px;
          color: #f1f5f9;
          font-size: 15px;
          font-family: inherit;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .mc-input:focus {
          border-color: #d4af37;
          background: rgba(212,175,55,0.05);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
        }

        .mc-input::placeholder {
          color: rgba(241,245,249,0.2);
          font-weight: 400;
        }

        .mc-pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(241,245,249,0.35);
          cursor: pointer;
          padding: 4px;
          font-size: 11px;
          font-family: inherit;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.15s;
        }

        .mc-pw-toggle:hover { color: rgba(241,245,249,0.7); }

        .mc-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #d4af37 0%, #f59e0b 100%);
          border: none;
          border-radius: 13px;
          color: #0f172a;
          font-size: 15px;
          font-weight: 800;
          font-family: inherit;
          letter-spacing: 0.02em;
          cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(212,175,55,0.35);
        }

        .mc-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(212,175,55,0.45);
        }

        .mc-btn:not(:disabled):active { transform: translateY(0); }

        .mc-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .mc-error {
          margin-top: 18px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 12px;
          padding: 13px 16px;
          color: #fca5a5;
          font-size: 13px;
          text-align: center;
          font-weight: 500;
          line-height: 1.4;
        }

        .mc-footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: rgba(241,245,249,0.2);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .mc-footer span {
          color: rgba(212,175,55,0.4);
        }
      `}</style>

      <div className="mc-page">
        <div className="mc-card">

          {/* Logo + badge + title */}
          <div className="mc-logo-wrap">
            <img src="/main.webp" alt="VTU Habba" className="mc-logo" />
            <div className="mc-chip">Manager Companion</div>
            <h1 className="mc-title">Welcome Back</h1>
            <p className="mc-subtitle">VTU HABBA 2026 · Event Day Portal</p>
          </div>

          <div className="mc-divider" />

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="mc-field">
              <label className="mc-label">Email Address</label>
              <input
                type="email"
                className="mc-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@college.edu"
                autoComplete="email"
                inputMode="email"
                disabled={loading}
              />
            </div>

            <div className="mc-field">
              <label className="mc-label">Password</label>
              <div className="mc-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="mc-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 60 }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="mc-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="mc-btn" disabled={disabled}>
              {loading
                ? <span style={{ opacity: 0.8 }}>Signing in…</span>
                : 'Sign In →'}
            </button>
          </form>

          {error && <div className="mc-error">{error}</div>}
        </div>

        <p className="mc-footer">
          Acharya Institute of Technology · Bengaluru&nbsp;&nbsp;
          <span>·</span>&nbsp;&nbsp;vtufest2026.acharyahabba.com
        </p>
      </div>
    </>
  );
}
