/**
 * HelpDeskScanner.jsx — Help Desk QR Lookup
 *
 * Scan QR → display participant details, events, accommodation.
 * Read-only — no mutations.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CameraOff } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { helpDeskLookup } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

const token = () => localStorage.getItem('vtufest_vol_token') || '';
const volName = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';

function logout(navigate) {
  ['vtufest_vol_token', 'vtufest_vol_role', 'vtufest_vol_name', 'vtufest_vol_email']
    .forEach((k) => localStorage.removeItem(k));
  navigate('/volunteer', { replace: true });
}

export default function HelpDeskScanner() {
  const navigate = useNavigate();
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);    // { participant, events, accommodation }
  const [error, setError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  const doLookup = useCallback(async (qr) => {
    if (loading) return;
    setLoading(true);
    setError('');
    setFlash('');

    const res = await helpDeskLookup(qr, token());
    setLoading(false);

    if (res.aborted) return;

    if (res.status === 401) { logout(navigate); return; }

    if (res.ok) {
      playBeep('success');
      setFlash('success');
      setResult(res.data);
    } else if (res.status === 403 && res.data?.blocked) {
      playBeep('error');
      setFlash('warning');
      setError(`⚠️ ID card not activated — ${res.data.full_name || 'participant'} must visit Registration Desk first.`);
      setResult(null);
    } else {
      playBeep('error');
      setFlash('error');
      setError(res.data?.message || 'QR code not found.');
      setResult(null);
    }
  }, [loading, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doLookup,
    enabled: cameraStarted,
  });

  const handleStartCamera = () => {
    setCameraStarted(true);
    if (!isSafariBrowser) startCamera();
  };

  const handleStopCamera = () => {
    setCameraStarted(false);
    stopCamera();
  };

  const handleScan = (qr) => {
    doLookup(qr);
  };

  return (
    <div className="vol-page">
      {/* Header */}
      <div className="vol-header" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <p className="vol-subtitle">Help Desk</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--vol-text-dim)' }}>{volName()}</p>
          </div>
          <button className="vol-logout-btn" onClick={() => logout(navigate)}>
            <LogOut size={14} style={{ marginRight: 4 }} />
            Logout
          </button>
        </div>
      </div>

      <div className="vol-scanner-container">
        {/* Camera scanner */}
        <div className="vol-scanner-header">
          <span className="vol-scanner-title">Scan Participant QR</span>
          <span className={`vol-scanner-badge ${cameraStatus === 'active' ? 'online' : 'offline'}`}>
            {cameraStatus === 'active' ? 'Live' : 'Standby'}
          </span>
        </div>

        <div className="vol-video-wrap">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ display: cameraStarted && cameraStatus === 'active' ? 'block' : 'none' }}
          />
          <ScannerOverlay flash={flash} cameraStatus={cameraStarted ? cameraStatus : 'idle'} />
        </div>

        {/* Controls */}
        {!cameraStarted ? (
          <button className="vol-start-btn" onClick={handleStartCamera}>
            📷 Start Scanner
          </button>
        ) : (
          <button
            className="vol-logout-btn"
            onClick={handleStopCamera}
            style={{ width: '100%', padding: '10px', marginTop: '8px', textAlign: 'center' }}
          >
            <CameraOff size={14} style={{ marginRight: 6 }} />
            Stop Scanner
          </button>
        )}

        {/* Safari explicit start */}
        {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
          <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>
            📷 Tap to Activate Camera
          </button>
        )}

        {/* Toggle manual input */}
        <button
          className="vol-manual-input-btn"
          onClick={() => setManualVisible((v) => !v)}
          style={{ width: '100%', padding: 10, marginTop: 10 }}
        >
          ⌨️ {manualVisible ? 'Hide Manual Input' : 'Enter QR Manually'}
        </button>

        <ManualInput
          onScan={handleScan}
          visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'}
          placeholder="Type QR code (e.g. AB12CD34)"
        />

        {/* Loading */}
        {loading && (
          <div className="vol-loading">
            <div className="vol-spinner" />
            Looking up participant…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="vol-result-card error" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 14 }}>
            {/* Participant card */}
            <div className="vol-result-card success">
              <div className="vol-result-header">
                {result.participant?.photo_url && (
                  <img
                    src={result.participant.photo_url}
                    alt={result.participant.full_name}
                    className="vol-result-photo"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                )}
                <div>
                  <p className="vol-result-name">{result.participant?.full_name}</p>
                  <p className="vol-result-sub">
                    {result.participant?.college_name}
                  </p>
                  <p className="vol-result-sub">
                    {result.participant?.person_type} · {result.participant?.gender}
                  </p>
                </div>
              </div>

              <div className="vol-result-row">
                <span className="vol-result-label">QR Code</span>
                <span className="vol-result-value" style={{ fontFamily: 'monospace' }}>
                  {result.participant?.qr_code}
                </span>
              </div>

              <div className="vol-result-row">
                <span className="vol-result-label">College Code</span>
                <span className="vol-result-value">{result.participant?.college_code}</span>
              </div>

              <div className="vol-result-row">
                <span className="vol-result-label">ID Card</span>
                <span className="vol-result-value" style={{
                  color: result.participant?.id_card_activated ? 'var(--vol-success)' : 'var(--vol-warning)'
                }}>
                  {result.participant?.id_card_activated ? '✅ Activated' : '⚠️ Not Activated'}
                </span>
              </div>
            </div>

            {/* Events */}
            {result.events?.length > 0 && (
              <div className="vol-result-card" style={{ marginTop: 10 }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--vol-text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  📅 Events ({result.events.length})
                </p>
                <div className="vol-event-list">
                  {result.events.map((ev, i) => (
                    <div key={i} className="vol-event-item">
                      <div className="vol-event-name">{ev.event_name}</div>
                      <div className="vol-event-meta">
                        {ev.event_venue ? `📍 ${ev.event_venue}` : ''}
                        {ev.event_time ? ` · ⏰ ${ev.event_time}` : ''}
                        {ev.event_date ? ` · 📅 ${new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodation */}
            {result.accommodation?.length > 0 && (
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
                        <span className="vol-result-value">{ac.address}</span>
                      </div>
                    )}
                    {ac.contact_phone && (
                      <div className="vol-result-row">
                        <span className="vol-result-label">Contact</span>
                        <span className="vol-result-value">
                          <a href={`tel:${ac.contact_phone}`} style={{ color: 'var(--vol-accent)' }}>
                            {ac.contact_phone}
                          </a>
                        </span>
                      </div>
                    )}
                    {ac.location_url && (
                      <a
                        href={ac.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vol-manual-input-btn"
                        style={{ display: 'block', textAlign: 'center', padding: '8px', marginTop: 8 }}
                      >
                        📍 View on Map
                      </a>
                    )}
                  </div>
                ))}
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
