/**
 * RegDeskScanner.jsx — Registration Desk
 *
 * Android tabs: Find Person · My Profile
 * Tab 0: Scanner (scan QR → lookup + ID activation)
 * Tab 1: Profile (shell handles)
 */

import { useState, useCallback } from 'react';
import { Search, User } from 'lucide-react';
import VolunteerShell, { getToken, doLogout } from './VolunteerShell';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { regDeskScan, activateId } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import { useNavigate } from 'react-router-dom';
import '../../styles/volunteer.css';

const TABS = [
  { icon: Search, label: 'Find Person' },
  { icon: User, label: 'My Profile' },
];

export default function RegDeskScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Scanner state
  const [flash, setFlash] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState('');

  const doScan = useCallback(async (qr) => {
    if (scanning) return;
    setScanning(true); setFlash(''); setError(''); setResult(null); setActivateMsg('');
    const res = await regDeskScan(qr, getToken());
    setScanning(false);
    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }
    if (res.ok) { playBeep('success'); setFlash('success'); setResult(res.data); }
    else { playBeep('error'); setFlash('error'); setError(res.data?.message || 'QR not found.'); }
  }, [scanning, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doScan, enabled: cameraStarted,
  });

  const handleActivate = async () => {
    if (!result?.participant?.qr_code) return;
    setActivating(true); setActivateMsg('');
    const res = await activateId(result.participant.qr_code, getToken());
    setActivating(false);
    if (res.ok) { playBeep('success'); setActivateMsg('✅ ID card activated successfully!'); setResult(r => ({ ...r, participant: { ...r.participant, id_card_activated: true } })); }
    else { playBeep('error'); setActivateMsg(res.data?.message || 'Activation failed.'); }
  };

  const p = result?.participant;

  return (
    <VolunteerShell roleTitle="Registration Desk" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* TAB 0: Scanner */}
      {activeTab === 0 && (
        <div>
          <div className="vol-scanner-header">
            <span className="vol-scanner-title">Scan Participant QR</span>
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
              Stop Scanner
            </button>
          )}
          {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
            <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>📷 Tap to Activate Camera</button>
          )}
          <button className="vol-manual-input-btn" onClick={() => setManualVisible(v => !v)} style={{ width: '100%', padding: 10, marginTop: 10 }}>
            ⌨️ {manualVisible ? 'Hide Manual Input' : 'Type QR Code'}
          </button>
          <ManualInput onScan={doScan} visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'} placeholder="Enter QR code" />

          {scanning && <div className="vol-loading"><div className="vol-spinner" />Looking up…</div>}
          {error && <div className="vol-result-card error" style={{ marginTop: 12 }}><p style={{ margin: 0 }}>{error}</p></div>}

          {p && (
            <div style={{ marginTop: 12 }}>
              <div className={`vol-result-card ${p.id_card_activated ? 'success' : 'warning'}`}>
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

                {!p.id_card_activated && (
                  <button className="vol-start-btn" onClick={handleActivate} disabled={activating} style={{ marginTop: 12, padding: '10px 0', fontSize: '0.9rem' }}>
                    {activating ? '⏳ Activating…' : '🪪 Activate ID Card'}
                  </button>
                )}
                {activateMsg && <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: activateMsg.startsWith('✅') ? 'var(--vol-success)' : 'var(--vol-error)', textAlign: 'center' }}>{activateMsg}</p>}
              </div>

              <button className="vol-logout-btn" onClick={() => { setResult(null); setError(''); setActivateMsg(''); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
                Clear — Scan Next
              </button>
            </div>
          )}
        </div>
      )}
    </VolunteerShell>
  );
}
