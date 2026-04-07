/**
 * VolunteerShell.jsx — Shared shell for all volunteer dashboards.
 *
 * Provides:
 *  - Top bar (role title + name + logout)
 *  - Bottom tab bar (configurable per role)
 *  - Profile tab (universal — shows name, email, QR code)
 *  - QRCodeImg helper
 *
 * Usage:
 *   <VolunteerShell role="help_desk" tabs={TABS} activeTab={tab} onTabChange={setTab}>
 *     {tab === 0 && <MyScannerPage />}
 *     {tab === 1 && <MyProfileTab />}   ← not needed, shell handles profile tab
 *   </VolunteerShell>
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { isIOS } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

// Universal logout
export function doLogout(navigate) {
  [
    'vtufest_vol_token', 'vtufest_vol_role', 'vtufest_vol_name',
    'vtufest_vol_email', 'vtufest_vol_extra', 'vtufest_vol_qr',
    'vtufest_food_token', 'vtufest_vol_stall', 'vtufest_vol_food_role',
  ].forEach((k) => localStorage.removeItem(k));
  navigate('/volunteer', { replace: true });
}

// Helpers
export const getToken = () => localStorage.getItem('vtufest_vol_token') || '';
export const getVolName = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';
export const getVolEmail = () => localStorage.getItem('vtufest_vol_email') || '';
export const getVolQr = () => localStorage.getItem('vtufest_vol_qr') || '';

// QR code image using api.qrserver.com (no extra dependency)
export function QRCodeImg({ value, size = 180 }) {
  if (!value) return null;
  return (
    <div style={{
      width: size, height: size, background: '#fff',
      borderRadius: 12, padding: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value)}`}
        alt="QR Code"
        width={size - 16}
        height={size - 16}
        style={{ display: 'block' }}
      />
    </div>
  );
}

// Universal Profile tab content
export function ProfileTab() {
  const navigate = useNavigate();
  const name = getVolName();
  const email = getVolEmail();
  const qr = getVolQr();

  const role = localStorage.getItem('vtufest_vol_role') || '';
  const roleLabel = {
    registration_desk: 'Registration Desk',
    help_desk: 'Help Desk',
    in_event: 'In-Event',
    food_volunteer: 'Food Volunteer',
    college_buddy: 'College Buddy',
  }[role] || role;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24 }}>
      <div style={{
        width: '100%',
        background: 'var(--vol-card-bg)',
        border: '1px solid var(--vol-card-border)',
        borderRadius: 20,
        padding: 28,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Role badge */}
        <div style={{
          padding: '5px 14px', borderRadius: 20,
          background: 'rgba(167,139,250,0.15)',
          border: '1px solid rgba(167,139,250,0.35)',
          marginBottom: 14,
        }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--vol-accent)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {roleLabel}
          </span>
        </div>

        <p style={{ margin: '0 0 2px', fontSize: '0.7rem', color: 'var(--vol-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Logged in as
        </p>
        <p style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#fff', textAlign: 'center' }}>
          {name}
        </p>
        {email && (
          <p style={{ margin: '0 0 24px', fontSize: '0.82rem', color: 'var(--vol-text-muted)' }}>{email}</p>
        )}

        {qr ? (
          <>
            <p style={{ margin: '0 0 10px', fontSize: '0.7rem', color: 'var(--vol-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Your QR Code
            </p>
            <QRCodeImg value={qr} size={180} />
            <div style={{
              marginTop: 14, padding: '8px 20px',
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: 10,
            }}>
              <p style={{
                margin: 0, fontSize: '1rem', fontFamily: 'monospace',
                fontWeight: 700, color: 'var(--vol-warning)', letterSpacing: '0.15em',
              }}>
                {qr}
              </p>
            </div>
            <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--vol-text-muted)', textAlign: 'center' }}>
              Show this at the venue entrance on event day.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.2)',
              marginBottom: 14,
            }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--vol-warning)', fontWeight: 500 }}>
                ⚠️ QR code not loaded. Please re-login to sync.
              </p>
            </div>
            <button
              className="vol-start-btn"
              onClick={() => doLogout(navigate)}
              style={{ padding: '12px 24px', fontSize: '0.88rem' }}
            >
              🔄 Re-Login Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Camera Permission Gate ───────────────────────────────────────────────────
/**
 * Shown instead of the app content when camera permission has not been granted.
 * On iOS Safari the only way to re-prompt is a full page reload, so that's what
 * the "Try Again" button does on iOS. On Android / Chrome we can re-call
 * getUserMedia directly and the browser will re-prompt.
 */
function CameraGate({ children }) {
  // 'checking' → 'granted' | 'denied' | 'unavailable'
  const [perm, setPerm] = useState('checking');
  const ios = isIOS();
  const navigate = useNavigate();

  const requestPermission = useCallback(async () => {
    setPerm('checking');
    if (!navigator.mediaDevices?.getUserMedia) {
      setPerm('unavailable');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      // Permission granted — immediately release the test stream
      stream.getTracks().forEach(t => t.stop());
      setPerm('granted');
    } catch (err) {
      const denied =
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError';
      setPerm(denied ? 'denied' : 'unavailable');
    }
  }, []);

  // Wipe all cached app data (Cache API + sessionStorage) then hard-reload.
  // Deliberately keeps localStorage so the volunteer stays logged in.
  // On iOS Safari a fresh page load after cache clear will re-prompt for camera.
  const handleClearAndReset = useCallback(async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch { /* ignore — not all browsers expose Cache API */ }
    try { sessionStorage.clear(); } catch { /* ignore */ }
    window.location.reload();
  }, []);

  useEffect(() => { requestPermission(); }, [requestPermission]);

  // ── Permission granted → render the actual app ───────────────────────────
  if (perm === 'granted') return children;

  // ── Blocking screen ──────────────────────────────────────────────────────
  const isChecking = perm === 'checking';

  return (
    <div className="vol-page" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', minHeight: '100dvh',
    }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: isChecking
          ? 'rgba(167,139,250,0.12)'
          : 'rgba(239,68,68,0.12)',
        border: `2px solid ${isChecking ? 'rgba(167,139,250,0.3)' : 'rgba(239,68,68,0.35)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 24,
      }}>
        {isChecking ? '📷' : '🚫'}
      </div>

      {/* Heading */}
      <p style={{
        margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800,
        color: '#fff', textAlign: 'center',
      }}>
        {isChecking ? 'Checking Camera…' : 'Camera Access Required'}
      </p>

      {/* Sub-text */}
      {!isChecking && (
        <p style={{
          margin: '0 0 24px', fontSize: '0.88rem',
          color: 'var(--vol-text-muted)', textAlign: 'center', lineHeight: 1.55,
          maxWidth: 320,
        }}>
          {perm === 'unavailable'
            ? 'No camera was found on this device. Please use a device with a working camera to scan QR codes.'
            : 'This app needs camera access to scan QR codes. Without it you cannot proceed.'}
        </p>
      )}

      {/* iOS-specific instructions */}
      {perm === 'denied' && ios && (
        <div style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 14, padding: '16px 18px',
          marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--vol-warning)', fontSize: '0.82rem' }}>
            📱 On iPhone / iPad:
          </p>
          <ol style={{
            margin: 0, paddingLeft: 18,
            color: 'var(--vol-text-muted)', fontSize: '0.82rem', lineHeight: 1.7,
          }}>
            <li>Tap <strong style={{ color: '#fff' }}>Reload &amp; Try Again</strong> below — Safari will ask for permission again.</li>
            <li>Tap <strong style={{ color: '#fff' }}>Allow</strong> when Safari asks for camera access.</li>
            <li>If the prompt never appears, go to:<br />
              <strong style={{ color: '#fff' }}>Settings → Safari → Camera → Allow</strong>
            </li>
          </ol>
        </div>
      )}

      {/* Android / Chrome specific hint */}
      {perm === 'denied' && !ios && (
        <div style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 14, padding: '14px 16px',
          marginBottom: 20,
        }}>
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--vol-warning)', fontSize: '0.82rem' }}>
            🔒 If "Allow" prompt doesn't appear:
          </p>
          <p style={{ margin: 0, color: 'var(--vol-text-muted)', fontSize: '0.82rem', lineHeight: 1.65 }}>
            Tap the <strong style={{ color: '#fff' }}>🔒 lock icon</strong> in your browser's address bar →
            tap <strong style={{ color: '#fff' }}>Camera</strong> → set to <strong style={{ color: '#fff' }}>Allow</strong> → reload the page.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {perm === 'denied' && (
        <>
          {/* Primary: reload / re-prompt */}
          <button
            className="vol-start-btn"
            onClick={() => {
              if (ios) {
                window.location.reload();
              } else {
                requestPermission();
              }
            }}
            style={{ width: '100%', maxWidth: 360, padding: '14px 0', fontSize: '0.95rem', marginBottom: 10 }}
          >
            {ios ? '🔄 Reload & Try Again' : '📷 Allow Camera Access'}
          </button>

          {/* Secondary: clear all cached data then reload */}
          <button
            onClick={handleClearAndReset}
            style={{
              width: '100%', maxWidth: 360,
              padding: '12px 0', fontSize: '0.88rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, cursor: 'pointer',
              color: '#f87171', fontWeight: 600,
              marginBottom: 10,
            }}
          >
            🗑️ Clear Cache &amp; Reset Page
          </button>

          {/* What this does — transparent note */}
          <p style={{
            margin: '0 0 18px', fontSize: '0.73rem',
            color: 'var(--vol-text-dim)', textAlign: 'center', maxWidth: 300,
          }}>
            Clears app cache and reloads. Your login is kept. Camera permission will be asked again fresh.
          </p>
        </>
      )}

      {/* Logout link — so they aren't stuck forever */}
      <button
        onClick={() => doLogout(navigate)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--vol-text-muted)', fontSize: '0.82rem',
          textDecoration: 'underline', marginTop: 4,
        }}
      >
        Log out and use a different device
      </button>
    </div>
  );
}

// ─── Main Shell ──────────────────────────────────────────────────────────────
/**
 * @param {string}   roleTitle   - shown in top bar (e.g. "Help Desk")
 * @param {Array}    tabs        - [{ icon: LucideIcon, label: string }]
 * @param {number}   activeTab
 * @param {Function} onTabChange
 * @param {React.ReactNode} children  - content for non-profile tabs
 * @param {number}   profileTabIndex  - which tab index is "Profile" (default: last tab)
 */
export default function VolunteerShell({
  roleTitle,
  tabs,
  activeTab,
  onTabChange,
  children,
  profileTabIndex,
}) {
  const navigate = useNavigate();
  const name = getVolName();
  const profileIdx = profileTabIndex ?? (tabs.length - 1);

  return (
    <CameraGate>
    <div className="vol-page" style={{ paddingBottom: 0 }}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 8px',
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
            {roleTitle}
            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--vol-text-muted)', fontWeight: 400 }}>
              · {tabs[activeTab]?.label || ''}
            </span>
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-text-dim)' }}>{name}</p>
        </div>
        <button
          className="vol-logout-btn"
          onClick={() => doLogout(navigate)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, width: '100%', maxWidth: 480,
        padding: '0 16px', overflowY: 'auto', paddingBottom: 80,
      }}>
        {activeTab === profileIdx ? <ProfileTab /> : children}
      </div>

      {/* ── Bottom Tab Bar ────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(13,14,28,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
      }}>
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button key={i} onClick={() => onTabChange(i)} style={{
              flex: 1, padding: '12px 8px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? 'var(--vol-accent)' : 'var(--vol-text-dim)',
              transition: 'color 0.2s',
            }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 400 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
    </CameraGate>
  );
}
