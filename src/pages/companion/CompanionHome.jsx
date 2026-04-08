/**
 * CompanionHome.jsx — /manager/home
 * Manager name, college, stats, and the same EventsCalendar as ManagerDashboard.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanionLayout from './CompanionLayout';
import EventsCalendar from '../../components/EventsCalendar';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.vtufest2026.acharyahabba.com';

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('vtufest_token');
  return fetch(API + path, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...opts,
  });
}

function Skeleton({ h = 16, w = '100%', r = 8, style = {} }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'rgba(255,255,255,0.07)',
      animation: 'mcPulse 1.6s ease-in-out infinite',
      ...style,
    }} />
  );
}

function StatPill({ label, value, color = '#3b82f6' }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '14px 10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: 'rgba(241,245,249,0.42)', marginTop: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}

export default function CompanionHome() {
  const navigate = useNavigate();
  const [dashData, setDashData] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const name = localStorage.getItem('vtufest_name') || 'Manager';

  useEffect(() => {
    let mounted = true;

    const handleUnauth = () => {
      localStorage.removeItem('vtufest_token');
      localStorage.removeItem('vtufest_role');
      navigate('/manager', { replace: true });
    };

    const p1 = apiFetch('/api/manager/dashboard', { method: 'POST' })
      .then(r => {
        if (r.status === 401) { handleUnauth(); return null; }
        return r.json();
      })
      .then(d => { if (mounted && d?.success) setDashData(d.data); });

    const p2 = fetch(`${API}/api/shared/calendar-events`)
      .then(r => r.json())
      .then(d => {
        if (mounted && d?.success && Array.isArray(d.data?.calendarEvents)) {
          setCalendar(d.data.calendarEvents);
        }
      });

    Promise.all([p1, p2])
      .catch(() => { if (mounted) setError('Failed to load. Please refresh.'); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const logout = () => {
    localStorage.removeItem('vtufest_token');
    localStorage.removeItem('vtufest_role');
    localStorage.removeItem('vtufest_name');
    localStorage.removeItem('vtufest_college_id');
    navigate('/manager', { replace: true });
  };

  const college = dashData?.college;
  const stats   = dashData?.stats;

  return (
    <CompanionLayout>
      <style>{`
        @keyframes mcPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        /* Override calendar card bg to fit dark companion theme */
        .ec-pane-calendar,
        .ec-pane-list {
          background: rgba(15, 23, 42, 0.5) !important;
        }
      `}</style>

      <div style={{ padding: '24px 16px 8px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 22,
          background: 'linear-gradient(135deg, rgba(30,58,138,0.35) 0%, rgba(99,102,241,0.12) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 18,
          padding: '18px 18px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
              Welcome back
            </div>
            {loading
              ? <Skeleton h={20} w={160} style={{ marginBottom: 6 }} />
              : <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9' }}>{name}</div>
            }
            {loading
              ? <Skeleton h={13} w={200} style={{ marginTop: 4 }} />
              : college?.college_name && (
                <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.45)', marginTop: 4, lineHeight: 1.4 }}>
                  {college.college_name}
                  {college.college_code ? ` · ${college.college_code}` : ''}
                </div>
              )
            }
          </div>

          <button
            onClick={logout}
            style={{
              flexShrink: 0,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171',
              fontSize: 11, fontWeight: 700,
              padding: '7px 13px', borderRadius: 20,
              cursor: 'pointer', fontFamily: 'inherit',
              marginLeft: 12,
            }}
          >
            Logout
          </button>
        </div>

        {/* ── Error ── */}
        {error && !loading && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', borderRadius: 12, padding: '11px 14px',
            fontSize: 13, marginBottom: 16, textAlign: 'center',
          }}>{error}</div>
        )}

        {/* ── Stats ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {loading ? (
            <>
              <Skeleton h={72} style={{ flex: 1, borderRadius: 14 }} />
              <Skeleton h={72} style={{ flex: 1, borderRadius: 14 }} />
              <Skeleton h={72} style={{ flex: 1, borderRadius: 14 }} />
            </>
          ) : (
            <>
              <StatPill label="Students"  value={stats?.approved_students ?? '—'} color="#34d399" />
              <StatPill label="Events"    value={stats?.participating_event_count ?? '—'} color="#60a5fa" />
              <StatPill label="Accomp."   value={stats?.accompanists_count ?? '—'} color="#c084fc" />
            </>
          )}
        </div>

        {/* ── Quota bar ── */}
        {!loading && stats && typeof stats.quota_used === 'number' && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(241,245,249,0.5)' }}>Quota Used</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {stats.quota_used} / {college?.max_quota ?? '?'}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (stats.quota_used / (college?.max_quota || 1)) * 100)}%`,
                background: 'linear-gradient(90deg, #d4af37, #f59e0b)',
                borderRadius: 3, transition: 'width 0.6s',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.3)', marginTop: 6 }}>
              {stats.quota_remaining ?? '—'} slots remaining
            </div>
          </div>
        )}

        {/* ── Events Calendar — same component as ManagerDashboard ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: 'rgba(241,245,249,0.4)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
          }}>
            Event Schedule
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton h={220} r={14} />
            </div>
          ) : (
            <EventsCalendar events={calendar} />
          )}
        </div>

        <div style={{ height: 16 }} />
      </div>
    </CompanionLayout>
  );
}
