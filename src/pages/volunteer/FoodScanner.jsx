/**
 * FoodScanner.jsx — Food Volunteer
 *
 * Android tabs: Scan · Schedule · History · Profile
 * Tab 0: Scanner (meal redemption)
 * Tab 1: Schedule (meal windows)
 * Tab 2: Session scan history
 * Tab 3: Profile (shell handles)
 */

import { useState, useCallback, useEffect } from 'react';
import { QrCode, Clock, History, User, CameraOff } from 'lucide-react';
import VolunteerShell, { getToken, doLogout } from './VolunteerShell';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { foodScan, foodMyStall } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import { useNavigate } from 'react-router-dom';
import '../../styles/volunteer.css';

const TABS = [
  { icon: QrCode, label: 'Scan' },
  { icon: Clock, label: 'Schedule' },
  { icon: History, label: 'History' },
  { icon: User, label: 'Profile' },
];

const MEAL_WINDOWS = [
  { meal: 'Breakfast', time: '7:30 AM – 9:00 AM', icon: '🌅' },
  { meal: 'Lunch', time: '12:30 PM – 2:00 PM', icon: '☀️' },
  { meal: 'Snacks', time: '4:30 PM – 5:30 PM', icon: '🍪' },
  { meal: 'Dinner', time: '7:30 PM – 9:00 PM', icon: '🌙' },
];

const foodToken = () => localStorage.getItem('vtufest_food_token') || getToken();
const stallData = () => { try { return JSON.parse(localStorage.getItem('vtufest_vol_stall') || 'null'); } catch { return null; } };

export default function FoodScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Stall
  const [stall, setStall] = useState(stallData());
  const [stallLoading, setStallLoading] = useState(!stall);
  const [stallError, setStallError] = useState('');

  // Scanner
  const [flash, setFlash] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  // History (session only)
  const [history, setHistory] = useState([]);

  // Load stall info if not cached
  useEffect(() => {
    if (stall) return;
    (async () => {
      setStallLoading(true);
      const res = await foodMyStall(foodToken());
      setStallLoading(false);
      if (res.status === 401) { doLogout(navigate); return; }
      if (res.ok && res.data.assignedStall) {
        const s = res.data.assignedStall;
        setStall(s);
        localStorage.setItem('vtufest_vol_stall', JSON.stringify(s));
        if (res.data.roleType) localStorage.setItem('vtufest_vol_food_role', res.data.roleType);
      } else {
        setStallError(res.data?.message || 'No stall assigned. Contact coordinator.');
      }
    })();
  }, [navigate, stall]);

  const doScan = useCallback(async (qr) => {
    if (scanning || !stall) return;
    setScanning(true); setFlash(''); setScanError(''); setResult(null);
    const res = await foodScan(qr, stall.id, foodToken());
    setScanning(false);
    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }
    if (res.ok && res.data.success) {
      playBeep('success'); setFlash('success');
      const data = res.data.data || res.data;
      setResult(data);
      const time = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
      setHistory(h => [{ data, time }, ...h].slice(0, 50));
    } else {
      playBeep('error'); setFlash('error');
      setScanError(res.data?.message || 'Scan failed.');
    }
  }, [scanning, stall, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doScan, enabled: cameraStarted,
  });

  const isZonal = localStorage.getItem('vtufest_vol_food_role') === 'zonal';

  if (stallLoading) {
    return (
      <VolunteerShell roleTitle="Food" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="vol-loading" style={{ marginTop: 40 }}><div className="vol-spinner" />Loading stall info…</div>
      </VolunteerShell>
    );
  }

  if (stallError) {
    return (
      <VolunteerShell roleTitle="Food" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="vol-result-card error" style={{ marginTop: 16 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>⚠️ Stall Not Assigned</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{stallError}</p>
        </div>
      </VolunteerShell>
    );
  }

  return (
    <VolunteerShell roleTitle={`Food${isZonal ? ' · Zonal' : ''}`} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* TAB 0: Scanner */}
      {activeTab === 0 && (
        <div>
          {/* Stall info bar */}
          {stall && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              padding: '10px 14px', background: isZonal ? 'rgba(251,191,36,0.1)' : 'var(--vol-card-bg)',
              border: `1px solid ${isZonal ? 'rgba(251,191,36,0.3)' : 'var(--vol-card-border)'}`,
              borderRadius: 12,
            }}>
              <span style={{ fontSize: '1.2rem' }}>🍽️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{stall.name}</p>
                {stall.location && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-text-muted)' }}>{stall.location}</p>}
              </div>
              {isZonal && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--vol-warning)', background: 'rgba(251,191,36,0.15)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.3)' }}>ZONAL</span>}
            </div>
          )}

          <div className="vol-scanner-header">
            <span className="vol-scanner-title">Scan Meal QR</span>
            <span className={`vol-scanner-badge ${cameraStatus === 'active' ? 'online' : 'offline'}`}>
              {cameraStatus === 'active' ? 'Live' : 'Standby'}
            </span>
          </div>
          <div className="vol-video-wrap">
            <video ref={videoRef} autoPlay muted playsInline style={{ display: cameraStarted && cameraStatus === 'active' ? 'block' : 'none' }} />
            <ScannerOverlay flash={flash} cameraStatus={cameraStarted ? cameraStatus : 'idle'} />
          </div>
          {!cameraStarted ? (
            <button className="vol-start-btn" onClick={() => { setCameraStarted(true); if (!isSafariBrowser) startCamera(); }}>📷 Start Scanner</button>
          ) : (
            <button className="vol-logout-btn" onClick={() => { setCameraStarted(false); stopCamera(); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
              <CameraOff size={14} style={{ marginRight: 6 }} /> Stop Scanner
            </button>
          )}
          {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
            <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>📷 Tap to Activate Camera</button>
          )}
          <button className="vol-manual-input-btn" onClick={() => setManualVisible(v => !v)} style={{ width: '100%', padding: 10, marginTop: 10 }}>
            ⌨️ {manualVisible ? 'Hide Manual Input' : 'Type QR Code'}
          </button>
          <ManualInput onScan={doScan} visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'} placeholder="Enter QR code" />

          {scanning && <div className="vol-loading"><div className="vol-spinner" />Verifying…</div>}
          {scanError && (
            <div className={`vol-result-card ${scanError.includes('Already') ? 'error' : 'error'}`} style={{ marginTop: 12 }}>
              <p style={{ margin: 0, fontWeight: 600, color: scanError.includes('Already') ? 'var(--vol-error)' : 'var(--vol-error)' }}>
                {scanError.includes('Already') ? '🚫 Already Redeemed' : '❌ Error'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{scanError}</p>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 12 }}>
              <div className="vol-result-card success" style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--vol-success)' }}>✅ Redeemed Successfully</p>
                <p style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  {result.participant?.fullName || result.participant?.full_name}
                </p>
                {result.redemption?.mealType && (
                  <div style={{
                    display: 'inline-block', marginTop: 10, padding: '8px 20px',
                    background: 'rgba(105,240,174,0.12)', border: '1px solid rgba(105,240,174,0.3)',
                    borderRadius: 10,
                  }}>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--vol-success)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      🍽️ {result.redemption.mealType}
                    </p>
                  </div>
                )}
                {result.overrideUsed && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--vol-warning)' }}>⚠ Override Used</p>
                )}
              </div>
              <button className="vol-logout-btn" onClick={() => { setResult(null); setScanError(''); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
                Clear — Scan Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: Schedule */}
      {activeTab === 1 && (
        <div>
          <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Meal Schedule</p>
          {MEAL_WINDOWS.map(({ meal, time, icon }) => (
            <div key={meal} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--vol-card-bg)', border: '1px solid var(--vol-card-border)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 10,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
              }}>{icon}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{meal}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--vol-text-muted)' }}>{time}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--vol-text-muted)', lineHeight: 1.6 }}>
              ⚠️ Only scan within the active meal window. Coordinator override required outside windows.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: History */}
      {activeTab === 2 && (
        <div>
          <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
            Session History ({history.length})
          </p>
          {history.length === 0 ? (
            <div className="vol-result-card warning">
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No scans yet in this session.</p>
            </div>
          ) : (
            history.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--vol-card-bg)', border: '1px solid var(--vol-card-border)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(105,240,174,0.12)', border: '1px solid rgba(105,240,174,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                }}>✅</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.data?.participant?.fullName || item.data?.participant?.full_name || '—'}
                  </p>
                  {item.data?.redemption?.mealType && (
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-success)', textTransform: 'uppercase', fontWeight: 600 }}>
                      {item.data.redemption.mealType}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--vol-text-dim)', flexShrink: 0 }}>{item.time}</span>
              </div>
            ))
          )}
        </div>
      )}
    </VolunteerShell>
  );
}
