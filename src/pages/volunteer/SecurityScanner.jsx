/**
 * SecurityScanner.jsx — Security / General Lookup
 *
 * Full participant details including sensitive fields.
 * Read-only — no mutations.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CameraOff } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { securityLookup } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

const token = () => localStorage.getItem('vtufest_vol_token') || '';
const volName = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';

function logout(navigate) {
  ['vtufest_vol_token', 'vtufest_vol_role', 'vtufest_vol_name', 'vtufest_vol_email']
    .forEach((k) => localStorage.removeItem(k));
  navigate('/volunteer', { replace: true });
}

export default function SecurityScanner() {
  const navigate = useNavigate();

  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  const doLookup = useCallback(async (qr) => {
    if (loading) return;
    setLoading(true);
    setFlash('');
    setError('');
    setResult(null);

    const res = await securityLookup(qr, token());
    setLoading(false);

    if (res.aborted) return;
    if (res.status === 401) { logout(navigate); return; }

    if (res.ok) {
      playBeep('success');
      setFlash('success');
      setResult(res.data);
    } else {
      playBeep('error');
      setFlash('error');
      setError(res.data?.message || 'QR code not found.');
    }
  }, [loading, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doLookup,
    enabled: cameraStarted,
  });

  const p = result?.participant;

  return (
    <div className="vol-page">
      {/* Header */}
      <div className="vol-header" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <p className="vol-subtitle">Security Scanner</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--vol-text-dim)' }}>{volName()}</p>
          </div>
          <button className="vol-logout-btn" onClick={() => logout(navigate)}>
            <LogOut size={14} style={{ marginRight: 4 }} />
            Logout
          </button>
        </div>
      </div>

      <div className="vol-scanner-container">
        {/* Camera */}
        <div className="vol-scanner-header">
          <span className="vol-scanner-title">Scan Participant QR</span>
          <span className={`vol-scanner-badge ${cameraStatus === 'active' ? 'online' : 'offline'}`}>
            {cameraStatus === 'active' ? 'Live' : 'Standby'}
          </span>
        </div>

        <div className="vol-video-wrap">
          <video
            ref={videoRef}
            autoPlay muted playsInline
            style={{ display: cameraStarted && cameraStatus === 'active' ? 'block' : 'none' }}
          />
          <ScannerOverlay flash={flash} cameraStatus={cameraStarted ? cameraStatus : 'idle'} />
        </div>

        {!cameraStarted ? (
          <button className="vol-start-btn" onClick={() => { setCameraStarted(true); if (!isSafariBrowser) startCamera(); }}>
            📷 Start Scanner
          </button>
        ) : (
          <button
            className="vol-logout-btn"
            onClick={() => { setCameraStarted(false); stopCamera(); }}
            style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}
          >
            <CameraOff size={14} style={{ marginRight: 6 }} />
            Stop Scanner
          </button>
        )}

        {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
          <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>
            📷 Tap to Activate Camera
          </button>
        )}

        <button
          className="vol-manual-input-btn"
          onClick={() => setManualVisible((v) => !v)}
          style={{ width: '100%', padding: 10, marginTop: 10 }}
        >
          ⌨️ {manualVisible ? 'Hide Manual Input' : 'Enter QR Manually'}
        </button>

        <ManualInput
          onScan={doLookup}
          visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'}
          placeholder="Type participant QR code"
        />

        {loading && (
          <div className="vol-loading"><div className="vol-spinner" /> Looking up…</div>
        )}

        {error && (
          <div className="vol-result-card error" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{error}</p>
          </div>
        )}

        {/* Full result */}
        {p && (
          <div className="vol-results-scroll" style={{ marginTop: 14 }}>
            {/* ID Card Warning */}
            {result?.id_card_warning && (
              <div className="vol-id-warning">
                🪪 ID card NOT activated. Direct participant to Registration Desk.
              </div>
            )}

            {/* Main details */}
            <div className="vol-result-card success">
              <div className="vol-result-header">
                {p.photo_url && (
                  <img
                    src={p.photo_url}
                    alt={p.full_name}
                    className="vol-result-photo"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
                <div>
                  <p className="vol-result-name">{p.full_name}</p>
                  <p className="vol-result-sub">{p.college_name}</p>
                  <p className="vol-result-sub">{p.person_type} · {p.gender}</p>
                </div>
              </div>

              {[
                ['QR Code', p.qr_code, { fontFamily: 'monospace', letterSpacing: '0.1em' }],
                ['Phone', p.phone ? <a href={`tel:${p.phone}`} style={{ color: 'var(--vol-accent)' }}>{p.phone}</a> : '—'],
                ['Blood Group', p.blood_group],
                ['College Code', p.college_code],
                ['USN', p.usn],
                ['ID Card', p.id_card_activated ? '✅ Activated' : '⚠️ Not Activated'],
              ].map(([label, val, style]) => val ? (
                <div className="vol-result-row" key={label}>
                  <span className="vol-result-label">{label}</span>
                  <span className="vol-result-value" style={style}>{val}</span>
                </div>
              ) : null)}
            </div>

            {/* Events */}
            {result?.events?.length > 0 && (
              <div className="vol-result-card" style={{ marginTop: 10 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--vol-text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  📅 Registered Events ({result.events.length})
                </p>
                <div className="vol-event-list">
                  {result.events.map((ev, i) => (
                    <div key={i} className={`vol-event-item ${ev.present ? 'marked' : ''}`}>
                      <div className="vol-event-name">{ev.event_name}</div>
                      <div className="vol-event-meta">
                        {ev.event_venue && `📍 ${ev.event_venue}`}
                        {ev.present && ' · ✅ Present'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodation */}
            {result?.accommodation?.length > 0 && (
              <div className="vol-result-card" style={{ marginTop: 10 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--vol-text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  🏨 Accommodation
                </p>
                {result.accommodation.map((ac, i) => (
                  <div key={i}>
                    <div className="vol-result-row">
                      <span className="vol-result-label">Venue</span>
                      <span className="vol-result-value">{ac.accommodation_name}</span>
                    </div>
                    {ac.address && (
                      <div className="vol-result-row">
                        <span className="vol-result-label">Address</span>
                        <span className="vol-result-value" style={{ fontSize: '0.78rem' }}>{ac.address}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ID proof */}
            {p.id_proof_url && (
              <div className="vol-result-card" style={{ marginTop: 10 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--vol-text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  🪪 ID Proof
                </p>
                <a
                  href={p.id_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vol-manual-input-btn"
                  style={{ display: 'block', textAlign: 'center', padding: 10 }}
                >
                  View ID Proof
                </a>
              </div>
            )}

            <button
              className="vol-logout-btn"
              onClick={() => { setResult(null); setError(''); }}
              style={{ width: '100%', marginTop: 10, padding: 10, textAlign: 'center' }}
            >
              Clear — Scan Next
            </button>
          </div>
        )}
      </div>

      <div className="vol-bottom-spacer" />
    </div>
  );
}
