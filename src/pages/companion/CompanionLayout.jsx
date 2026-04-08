/**
 * CompanionLayout.jsx
 * Wraps all /manager/* protected pages.
 * — Route guard: redirects to /manager if no token or wrong role
 * — Persistent bottom navigation bar
 */
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/manager/home',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#3b82f6' : 'none'}
        stroke={active ? '#3b82f6' : 'rgba(241,245,249,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/manager/events',
    label: 'Events',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'rgba(59,130,246,0.15)' : 'none'}
        stroke={active ? '#3b82f6' : 'rgba(241,245,249,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    path: '/manager/facilities',
    label: 'Facilities',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#3b82f6' : 'rgba(241,245,249,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <circle cx="12" cy="13" r="3" fill={active ? '#3b82f6' : 'none'} strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    path: '/manager/help',
    label: 'Help',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#3b82f6' : 'rgba(241,245,249,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
      </svg>
    ),
  },
];

export default function CompanionLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('vtufest_token');
  const role  = localStorage.getItem('vtufest_role');

  if (!token || role !== 'manager') {
    return <Navigate to="/manager" replace />;
  }

  const activePath = location.pathname;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0d1424 0%, #0a0e1a 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Scrollable page content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72, WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>

      {/* Bottom navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: '#0d1424',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                height: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 4px',
                color: isActive ? '#3b82f6' : 'rgba(241,245,249,0.45)',
                transition: 'color 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {item.icon(isActive)}
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
