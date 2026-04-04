/**
 * CollegeBuddyDashboard.jsx — College Buddy Info Dashboard
 *
 * No scan endpoints exist for this role.
 * Shows allocated colleges and coordinator contact info.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Phone } from 'lucide-react';
import '../../styles/volunteer.css';

const volName = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';

function logout(navigate) {
  ['vtufest_vol_token', 'vtufest_vol_role', 'vtufest_vol_name',
   'vtufest_vol_email', 'vtufest_vol_extra'].forEach((k) => localStorage.removeItem(k));
  navigate('/volunteer', { replace: true });
}

export default function CollegeBuddyDashboard() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    try {
      const extra = JSON.parse(localStorage.getItem('vtufest_vol_extra') || '{}');
      if (extra.allocated_colleges?.length > 0) {
        setColleges(extra.allocated_colleges);
      } else if (extra.allocated_college) {
        setColleges([extra.allocated_college]);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="vol-page">
      {/* Header */}
      <div className="vol-header" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <p className="vol-subtitle">College Buddy</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--vol-text-dim)' }}>{volName()}</p>
          </div>
          <button className="vol-logout-btn" onClick={() => logout(navigate)}>
            <LogOut size={14} style={{ marginRight: 4 }} />
            Logout
          </button>
        </div>
      </div>

      <div className="vol-scanner-container">
        {colleges.length === 0 ? (
          <div className="vol-result-card warning" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              ⚠️ No colleges assigned to you yet. Contact the event coordinator.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--vol-text-muted)', margin: '0 0 8px' }}>
                Your Assigned Colleges ({colleges.length})
              </p>
              {colleges.map((c, i) => (
                <div key={i} className="vol-result-card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, minWidth: 40,
                      background: 'var(--vol-accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Users size={18} color="var(--vol-accent)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="vol-result-name" style={{ fontSize: '0.95rem' }}>
                        {c.college_name || c.name}
                      </p>
                      {c.place && (
                        <p className="vol-result-sub">📍 {c.place}</p>
                      )}
                      {c.principal_name && (
                        <p className="vol-result-sub">Principal: {c.principal_name}</p>
                      )}
                      {c.contact_phone && (
                        <a
                          href={`tel:${c.contact_phone}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: 'var(--vol-accent)', fontSize: '0.82rem',
                            textDecoration: 'none', marginTop: 6,
                          }}
                        >
                          <Phone size={13} />
                          {c.contact_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="vol-warning-banner">
              <span>ℹ️</span>
              <span>
                Assist your assigned college participants throughout the event.
                Help them navigate venues, find accommodation, and resolve issues.
              </span>
            </div>
          </>
        )}
      </div>

      <div className="vol-bottom-spacer" />
    </div>
  );
}
