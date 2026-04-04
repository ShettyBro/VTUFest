/**
 * FoodScanner.jsx — Food Redemption Scanner
 *
 * Flow:
 *  1. On mount → fetch assigned stall (my-stall)
 *  2. Continuous scan mode — scan → redeem meal
 *  3. Handle: success, ALREADY_REDEEMED (409), NO_ACTIVE_MEAL_WINDOW, STALL_NOT_ASSIGNED
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CameraOff } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { foodMyStall, foodScan } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

const token = () =>
  localStorage.getItem('vtufest_food_token') ||
  localStorage.getItem('vtufest_vol_token') || '';
const volName = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';

function logout(navigate) {
  ['vtufest_vol_token', 'vtufest_food_token', 'vtufest_vol_role',
   'vtufest_vol_name', 'vtufest_vol_email', 'vtufest_vol_stall', 'vtufest_vol_food_role']
    .forEach((k) => localStorage.removeItem(k));
  navigate('/volunteer', { replace: true });
}

// Map known error codes to user-friendly messages
const ERROR_MESSAGES = {
  NO_ACTIVE_MEAL_WINDOW: '⏰ No active meal window right now. Please wait for the meal session to start.',
  STALL_NOT_ASSIGNED: '🚫 You are not assigned to any stall. Contact the food coordinator.',
  ALREADY_REDEEMED: '⚠️ Meal already redeemed for this session.',
  INVALID_QR: '❌ QR code not found. Please try again.',
  PARTICIPANT_NOT_FOUND: '❌ Participant not found.',
  ID_NOT_ACTIVATED: '🪪 ID card not activated. Redirect participant to Registration Desk.',
};

export default function FoodScanner() {
  const navigate = useNavigate();

  const [stall, setStall] = useState(null);
  const [stallLoading, setStallLoading] = useState(true);
  const [stallError, setStallError] = useState('');

  const [flash, setFlash] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { type, name, college, meal, message }
  const [scanCount, setScanCount] = useState(0);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  // ── Fetch stall on mount ────────────────────────────────────────────────
  useEffect(() => {
    // Try cached stall first
    const cached = localStorage.getItem('vtufest_vol_stall');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.id) { setStall(parsed); setStallLoading(false); return; }
      } catch { /* ignore */ }
    }

    (async () => {
      const res = await foodMyStall(token());
      setStallLoading(false);
      if (res.status === 401) { logout(navigate); return; }
      if (res.ok && res.data?.stall) {
        setStall(res.data.stall);
        localStorage.setItem('vtufest_vol_stall', JSON.stringify(res.data.stall));
      } else {
        setStallError(res.data?.message || 'No stall assigned. Contact food coordinator.');
      }
    })();
  }, [navigate]);

  // ── Scan → redeem ────────────────────────────────────────────────────────
  const doScan = useCallback(async (qr) => {
    if (scanning || !stall) return;
    setScanning(true);
    setFlash('');

    const res = await foodScan(qr, stall.id, token());
    setScanning(false);

    if (res.aborted) return;
    if (res.status === 401) { logout(navigate); return; }

    if (res.ok) {
      playBeep('success');
      setFlash('success');
      setScanCount((c) => c + 1);
      setLastResult({
        type: 'success',
        name: res.data.participant?.full_name || res.data.full_name || '—',
        college: res.data.participant?.college_name || res.data.college_name || '',
        meal: res.data.meal_type || res.data.meal?.name || '',
        message: res.data.message || 'Meal redeemed successfully!',
      });
    } else if (res.status === 409) {
      playBeep('error');
      setFlash('warning');
      setLastResult({
        type: 'warning',
        name: res.data?.participant?.full_name || res.data?.full_name || '—',
        college: res.data?.participant?.college_name || '',
        meal: '',
        message: ERROR_MESSAGES.ALREADY_REDEEMED,
      });
    } else {
      playBeep('error');
      setFlash('error');
      const code = res.data?.error || res.data?.code || '';
      setLastResult({
        type: 'error',
        name: '',
        college: '',
        meal: '',
        message: ERROR_MESSAGES[code] || res.data?.message || '❌ Scan failed. Please try again.',
      });
    }
  }, [scanning, stall, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doScan,
    enabled: cameraStarted,
  });

  return (
    <div className="vol-page">
      {/* Header */}
      <div className="vol-header" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <p className="vol-subtitle">Food Scanner</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--vol-text-dim)' }}>{volName()}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {scanCount > 0 && (
              <span style={{
                background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
                color: 'var(--vol-success)', padding: '4px 10px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600,
              }}>
                ✅ {scanCount}
              </span>
            )}
            <button className="vol-logout-btn" onClick={() => logout(navigate)}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="vol-scanner-container">
        {/* Stall loading */}
        {stallLoading && (
          <div className="vol-loading"><div className="vol-spinner" /> Loading stall info…</div>
        )}

        {stallError && (
          <div className="vol-result-card error">
            <p style={{ margin: 0, fontSize: '0.88rem' }}>🚫 {stallError}</p>
          </div>
        )}

        {/* Stall info card */}
        {stall && (
          <div style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--vol-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Stall
            </p>
            <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
              {stall.name}
            </p>
            {stall.location && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--vol-text-muted)' }}>
                📍 {stall.location}
              </p>
            )}
          </div>
        )}

        {/* Camera — only show when stall is loaded */}
        {stall && (
          <>
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
              <ScannerOverlay flash={flash} cameraStatus={cameraStarted ? cameraStatus : 'idle'} scanCount={scanCount} />
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
              onScan={doScan}
              visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'}
              placeholder="Type participant QR code"
            />
          </>
        )}

        {/* Scan in progress */}
        {scanning && (
          <div className="vol-loading"><div className="vol-spinner" /> Processing…</div>
        )}

        {/* Last result */}
        {lastResult && (
          <div className={`vol-result-card ${lastResult.type}`} style={{ marginTop: 12 }}>
            {lastResult.name && (
              <div className="vol-result-header" style={{ marginBottom: 8 }}>
                <div>
                  <p className="vol-result-name">{lastResult.name}</p>
                  {lastResult.college && (
                    <p className="vol-result-sub">{lastResult.college}</p>
                  )}
                  {lastResult.meal && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--vol-accent)', marginTop: 2 }}>
                      🍽️ {lastResult.meal}
                    </p>
                  )}
                </div>
              </div>
            )}
            <p style={{
              margin: 0,
              fontSize: '0.88rem',
              color: lastResult.type === 'success' ? 'var(--vol-success)'
                   : lastResult.type === 'warning' ? 'var(--vol-warning)'
                   : 'var(--vol-error)',
            }}>
              {lastResult.message}
            </p>
          </div>
        )}
      </div>

      <div className="vol-bottom-spacer" />
    </div>
  );
}
