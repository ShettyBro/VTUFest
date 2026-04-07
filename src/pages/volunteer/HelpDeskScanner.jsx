/**
 * HelpDeskScanner.jsx — Help Desk
 *
 * Android tabs: Enter QR · Scan QR · My Profile
 * Tab 0: Manual input (primary for Help Desk)
 * Tab 1: Camera scanner
 * Tab 2: Profile (shell handles)
 */

import { useState, useCallback } from 'react';
import { Keyboard, QrCode, User } from 'lucide-react';
import VolunteerShell, { getToken, doLogout } from './VolunteerShell';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { helpDeskScan } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import { useNavigate } from 'react-router-dom';
import '../../styles/volunteer.css';

const TABS = [
  { icon: Keyboard, label: 'Enter QR' },
  { icon: QrCode, label: 'Scan QR' },
  { icon: User, label: 'My Profile' },
];

function ResultCard({ result, onClear }) {
  const p = result?.participant;
  if (!p) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="vol-result-card success">
        <div className="vol-result-header">
          {p.photo_url && <img src={p.photo_url} alt={p.full_name} className="vol-result-photo" onError={e => e.target.style.display = 'none'} />}
          <div>
            <p className="vol-result-name">{p.full_name}</p>
            <p className="vol-result-sub">{p.college_name}</p>
            <p className="vol-result-sub">{p.person_type}{p.gender && ` · ${p.gender}`}</p>
          </div>
        </div>
        {[
          ['QR Code', p.qr_code, { fontFamily: 'monospace' }],
          ['ID Card', p.id_card_activated ? '✅ Activated' : '⚠️ Not Activated'],
          ['USN', p.usn],
          ['Dept', p.department],
          ['Phone', p.phone ? <a href={`tel:${p.phone}`} style={{ color: 'var(--vol-accent)' }}>{p.phone}</a> : null],
          ['Blood Group', p.blood_group],
        ].filter(([, v]) => v).map(([label, val, style]) => (
          <div className="vol-result-row" key={label}>
            <span className="vol-result-label">{label}</span>
            <span className="vol-result-value" style={style}>{val}</span>
          </div>
        ))}
      </div>

      {/* Events */}
      {result.events?.length > 0 && (
        <div className="vol-result-card" style={{ marginTop: 8 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Events ({result.events.length})
          </p>
          {result.events.map((ev, i) => (
            <div key={i} className="vol-event-item" style={{ marginBottom: 6 }}>
              <div className="vol-event-name">{ev.event_name?.replace(/_/g, ' ')}</div>
              <div className="vol-event-meta">{ev.event_venue && `📍 ${ev.event_venue}`}{ev.event_time && ` · ⏰ ${ev.event_time}`}</div>
            </div>
          ))}
        </div>
      )}

      <button className="vol-logout-btn" onClick={onClear} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
        Clear — Next Lookup
      </button>
    </div>
  );
}

export default function HelpDeskScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const [flash, setFlash] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);

  const doScan = useCallback(async (qr) => {
    if (scanning) return;
    setScanning(true); setFlash(''); setError(''); setResult(null);
    const res = await helpDeskScan(qr, getToken());
    setScanning(false);
    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }
    if (res.ok) { playBeep('success'); setFlash('success'); setResult(res.data); }
    else { playBeep('error'); setFlash('error'); setError(res.data?.message || 'QR not found.'); }
  }, [scanning, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doScan, enabled: cameraStarted,
  });

  const clear = () => { setResult(null); setError(''); };

  return (
    <VolunteerShell roleTitle="Help Desk" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* TAB 0: Enter QR (manual input, primary) */}
      {activeTab === 0 && (
        <div>
          <div style={{ marginBottom: 12, padding: '12px 16px', background: 'var(--vol-card-bg)', border: '1px solid var(--vol-card-border)', borderRadius: 12 }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Manual QR Lookup</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--vol-text-muted)' }}>Type or paste the 8-character QR code.</p>
          </div>
          <ManualInput onScan={doScan} visible={true} placeholder="Enter QR code (e.g. AB12CD34)" maxLength={8} alphanumericOnly />
          {scanning && <div className="vol-loading"><div className="vol-spinner" />Looking up…</div>}
          {error && <div className="vol-result-card error" style={{ marginTop: 12 }}><p style={{ margin: 0 }}>{error}</p></div>}
          <ResultCard result={result} onClear={clear} />
        </div>
      )}

      {/* TAB 1: Camera scanner */}
      {activeTab === 1 && (
        <div>
          <div className="vol-scanner-header">
            <span className="vol-scanner-title">Camera QR Scan</span>
            <span className={`vol-scanner-badge ${cameraStatus === 'active' ? 'online' : 'offline'}`}>
              {cameraStatus === 'active' ? 'Live' : 'Standby'}
            </span>
          </div>
          <div className="vol-video-wrap">
            <video ref={videoRef} autoPlay muted playsInline style={{ display: cameraStarted && cameraStatus === 'active' ? 'block' : 'none' }} />
            <ScannerOverlay flash={flash} cameraStatus={cameraStarted ? cameraStatus : 'idle'} />
          </div>
          {!cameraStarted ? (
            <button className="vol-start-btn" onClick={() => { setCameraStarted(true); if (!isSafariBrowser) startCamera(); }}>📷 Start Camera</button>
          ) : (
            <button className="vol-logout-btn" onClick={() => { setCameraStarted(false); stopCamera(); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>Stop Camera</button>
          )}
          {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
            <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>📷 Tap to Activate Camera</button>
          )}
          {scanning && <div className="vol-loading"><div className="vol-spinner" />Looking up…</div>}
          {error && <div className="vol-result-card error" style={{ marginTop: 12 }}><p style={{ margin: 0 }}>{error}</p></div>}
          <ResultCard result={result} onClear={clear} />
        </div>
      )}
    </VolunteerShell>
  );
}
