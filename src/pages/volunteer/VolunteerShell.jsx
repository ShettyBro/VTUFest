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

import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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
  );
}
