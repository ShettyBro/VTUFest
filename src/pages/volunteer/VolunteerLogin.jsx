/**
 * VolunteerLogin.jsx — Role-based login page.
 *
 * Matches Screenshots 2 & 3: Back arrow, logo strip, role tabs, email/password, login button.
 *
 * FORCE_RESET flow:
 *   - On FORCE_RESET → stores force_reset_* keys in localStorage
 *   - Redirects to /force-reset-password (uses existing ForceResetPassword.jsx)
 *   - ForceResetPassword already supports portal = "volunteer" via buildResetUrl()
 *     which routes to /api/auth/reset-password/volunteer (ChangePassword.jsx flow)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { volunteerLogin, foodLogin } from '../../utils/volunteerApi';
import { initAudio } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

// Department → role tabs
const DEPT_CONFIG = {
  event_ops: {
    label: 'Event Operations',
    roles: [
      { id: 'registration_desk', label: 'Registration' },
      { id: 'help_desk', label: 'Help Desk' },
      { id: 'in_event', label: 'In Event' },
    ],
  },
  logistics: {
    label: 'Logistics & Services',
    roles: [
      { id: 'college_buddy', label: 'College Buddy' },
      { id: 'food_volunteer', label: 'Food Dept.' },
    ],
  },
  admin: {
    label: 'Administration',
    roles: [
      { id: 'general', label: 'Security' },
    ],
  },
};

// Role → dashboard route (post-login redirect)
const ROLE_ROUTES = {
  registration_desk: '/volunteer/reg-desk',
  help_desk: '/volunteer/help-desk',
  in_event: '/volunteer/in-event',
  food_volunteer: '/volunteer/food',
  college_buddy: '/volunteer/college-buddy',
  general: '/volunteer/security',
};

export default function VolunteerLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dept = searchParams.get('dept') || 'event_ops';
  const deptConfig = DEPT_CONFIG[dept] || DEPT_CONFIG.event_ops;

  const [selectedRole, setSelectedRole] = useState(deptConfig.roles[0].id);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset selected role when department changes
  useEffect(() => {
    const cfg = DEPT_CONFIG[dept] || DEPT_CONFIG.event_ops;
    setSelectedRole(cfg.roles[0].id);
  }, [dept]);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('vtufest_vol_token');
    const role = localStorage.getItem('vtufest_vol_role');
    if (token && role && ROLE_ROUTES[role]) {
      navigate(ROLE_ROUTES[role], { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    // Initialize audio on user gesture (Safari requirement)
    initAudio();

    let res;

    if (selectedRole === 'food_volunteer') {
      // Food uses separate auth endpoint
      res = await foodLogin(email, password);
    } else {
      // All other roles use volunteer auth
      res = await volunteerLogin(email, password, selectedRole);
    }

    setLoading(false);

    if (!res.ok) {
      setError(res.data?.message || 'Login failed. Please check your credentials.');
      return;
    }

    const d = res.data;

    // ── FORCE_RESET flow ─────────────────────────────────────────────────
    if (d.status === 'FORCE_RESET') {
      localStorage.setItem('force_reset_token', d.reset_token);
      localStorage.setItem('force_reset_email', d.email);
      // Must be 'volunteer' — ForceResetPassword calls /api/auth/reset-password/{role}
      // and the volunteer auth reset endpoint expects role=volunteer
      localStorage.setItem('force_reset_role', 'volunteer');
      localStorage.setItem('force_reset_portal', 'volunteer');
      navigate('/force-reset-password');
      return;
    }

    // ── Normal login success ─────────────────────────────────────────────
    if (d.token) {
      localStorage.setItem('vtufest_vol_token', d.token);
      localStorage.setItem('vtufest_vol_role', d.role || selectedRole);
      localStorage.setItem('vtufest_vol_name', d.full_name || d.name || '');
      localStorage.setItem('vtufest_vol_email', d.email || email);

      // Food-specific: also store as food token for food API calls
      if (selectedRole === 'food_volunteer') {
        localStorage.setItem('vtufest_food_token', d.token);
        if (d.assigned_stall) {
          localStorage.setItem('vtufest_vol_stall', JSON.stringify(d.assigned_stall));
        }
        if (d.role_type) {
          localStorage.setItem('vtufest_vol_food_role', d.role_type);
        }
      }

      // College buddy: store allocated colleges
      if (selectedRole === 'college_buddy' && d.allocated_colleges) {
        localStorage.setItem('vtufest_vol_extra', JSON.stringify({
          allocated_colleges: d.allocated_colleges,
          allocated_college: d.allocated_college,
        }));
      }

      const target = ROLE_ROUTES[selectedRole] || '/volunteer';
      navigate(target, { replace: true });
    } else {
      setError('Unexpected server response. Please try again.');
    }
  };

  return (
    <div className="vol-page">
      {/* ── Back Button ────────────────────────────────────────────────── */}
      <div className="vol-back-row">
        <button className="vol-back-btn" onClick={() => navigate('/volunteer')}>
          <ArrowLeft size={16} />
          {deptConfig.label}
        </button>
      </div>

      {/* ── Header / Branding ──────────────────────────────────────────── */}
      <div className="vol-header" style={{ paddingTop: '16px' }}>
        <div className="vol-logo-strip">
          <img src="/main.webp" alt="Acharya VTU Habba 2026 Logos" />
        </div>
        <h1 className="vol-title">Acharya VTU HABBA 2026</h1>
        <p className="vol-subtitle-accent">{deptConfig.label}</p>
      </div>

      {/* ── Login Card ─────────────────────────────────────────────────── */}
      <div className="vol-login-card">
        {/* Role Selector Label */}
        {deptConfig.roles.length > 1 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--vol-text-muted)', marginBottom: '8px' }}>
            Select Your Role
          </p>
        )}

        {/* Role Tabs */}
        <div className="vol-role-tabs">
          {deptConfig.roles.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`vol-role-tab ${selectedRole === r.id ? 'active' : ''}`}
              onClick={() => setSelectedRole(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && <div className="vol-error-msg">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="vol-input-group">
            <label>Email</label>
            <input
              type="email"
              className="vol-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="vol-input-group">
            <label>Password</label>
            <div className="vol-input-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="vol-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="vol-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="vol-forgot-link"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password?
          </button>

          <button className="vol-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>

      <div className="vol-bottom-spacer" />
    </div>
  );
}
