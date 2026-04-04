/**
 * RegDeskScanner.jsx — Registration Desk Scanner
 *
 * Flow:
 *  1. Enter phone → find participant
 *  2. Review participant card (name, photo, activation status)
 *  3. Scan physical ID card QR → activate
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Camera, CameraOff } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { regDeskFind, regDeskActivate } from '../../utils/volunteerApi';
import { playBeep, normalizeQR } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

const token = () => localStorage.getItem('vtufest_vol_token') || '';
const name = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';

function logout(navigate) {
  ['vtufest_vol_token', 'vtufest_vol_role', 'vtufest_vol_name', 'vtufest_vol_email'].forEach(
    (k) => localStorage.removeItem(k)
  );
  navigate('/volunteer', { replace: true });
}

export default function RegDeskScanner() {
  const navigate = useNavigate();

  // UI state
  const [phone, setPhone] = useState('');
  const [finding, setFinding] = useState(false);
  const [participants, setParticipants] = useState(null); // array from API
  const [selectedP, setSelectedP] = useState(null);
  const [scanMode, setScanMode] = useState(false); // true = camera active for QR scan
  const [activating, setActivating] = useState(false);
  const [flash, setFlash] = useState('');
  const [resultMsg, setResultMsg] = useState(null); // { type, text }
  const [cameraVisible, setCameraVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  // ── QR scan callback ────────────────────────────────────────────────────
  const handleQRScan = useCallback(async (qr) => {
    if (!selectedP || activating) return;
    setFlash('');
    setActivating(true);

    const res = await regDeskActivate(selectedP.id, qr, token());
    setActivating(false);

    if (res.aborted) return;

    if (res.ok) {
      playBeep('success');
      setFlash('success');
      setResultMsg({ type: 'success', text: `✅ ${res.data.message || 'ID card activated!'}` });
      setScanMode(false);
      setCameraVisible(false);
      // Update local state
      setSelectedP((p) => ({ ...p, id_card_activated: true }));
    } else if (res.status === 409) {
      playBeep('error');
      setFlash('warning');
      setResultMsg({ type: 'warning', text: `⚠️ ${res.data.message || 'Already activated'}` });
    } else {
      playBeep('error');
      setFlash('error');
      setResultMsg({ type: 'error', text: `❌ ${res.data.message || 'QR mismatch. Try again.'}` });
    }
  }, [selectedP, activating]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: handleQRScan,
    enabled: scanMode && cameraVisible,
  });

  // ── Find participant by phone ───────────────────────────────────────────
  const handleFind = async (e) => {
    e?.preventDefault();
    const ph = phone.trim().replace(/\D/g, '');
    if (ph.length < 10) return;

    setFinding(true);
    setParticipants(null);
    setSelectedP(null);
    setResultMsg(null);

    const res = await regDeskFind(ph, token());
    setFinding(false);

    if (res.status === 401) { logout(navigate); return; }

    if (res.ok && res.data.participants?.length > 0) {
      setParticipants(res.data.participants);
      if (res.data.participants.length === 1) setSelectedP(res.data.participants[0]);
    } else {
      setResultMsg({ type: 'error', text: res.data?.message || 'No participant found.' });
    }
  };

  const startScanMode = () => {
    setResultMsg(null);
    setScanMode(true);
    setCameraVisible(true);
    setManualVisible(false);
    if (!isSafariBrowser) startCamera();
  };

  const stopScan = () => {
    setScanMode(false);
    setCameraVisible(false);
    stopCamera();
  };

  return (
    <div className="vol-page">
      {/* Header */}
      <div className="vol-header" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <p className="vol-subtitle">Registration Desk</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--vol-text-dim)' }}>{name()}</p>
          </div>
          <button className="vol-logout-btn" onClick={() => logout(navigate)}>
            <LogOut size={14} style={{ marginRight: 4 }} />
            Logout
          </button>
        </div>
      </div>

      <div className="vol-scanner-container">
        {/* Phase 1: Find participant */}
        {!selectedP && (
          <div className="vol-phone-section">
            <label>Find Participant by Phone</label>
            <form onSubmit={handleFind} style={{ display: 'flex', gap: 8 }}>
              <input
                type="tel"
                className="vol-input"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                maxLength={10}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="vol-manual-input-btn"
                disabled={finding || phone.trim().length < 10}
              >
                {finding ? '…' : <Search size={18} />}
              </button>
            </form>

            {/* Multiple participants */}
            {participants && participants.length > 1 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--vol-text-muted)', marginBottom: 8 }}>
                  Multiple participants found — select one:
                </p>
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="vol-event-item"
                    style={{ cursor: 'pointer', marginBottom: 6 }}
                    onClick={() => setSelectedP(p)}
                  >
                    <div className="vol-event-name">{p.full_name}</div>
                    <div className="vol-event-meta">{p.college_name} · {p.person_type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Result message */}
        {resultMsg && (
          <div className={`vol-result-card ${resultMsg.type}`} style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{resultMsg.text}</p>
          </div>
        )}

        {/* Phase 2: Participant found */}
        {selectedP && (
          <div className="vol-result-card" style={{ marginTop: 12 }}>
            <div className="vol-result-header">
              {selectedP.photo_url && (
                <img
                  src={selectedP.photo_url}
                  alt={selectedP.full_name}
                  className="vol-result-photo"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div>
                <p className="vol-result-name">{selectedP.full_name}</p>
                <p className="vol-result-sub">{selectedP.college_name}</p>
                <p className="vol-result-sub">{selectedP.person_type} · {selectedP.gender}</p>
              </div>
            </div>

            <div className="vol-result-row">
              <span className="vol-result-label">QR Code</span>
              <span className="vol-result-value" style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                {selectedP.qr_code || '—'}
              </span>
            </div>
            <div className="vol-result-row">
              <span className="vol-result-label">ID Card Status</span>
              <span className="vol-result-value" style={{
                color: selectedP.id_card_activated ? 'var(--vol-success)' : 'var(--vol-warning)',
              }}>
                {selectedP.id_card_activated ? '✅ Activated' : '⏳ Not Activated'}
              </span>
            </div>

            {!selectedP.id_card_activated && !scanMode && (
              <button className="vol-btn-primary" onClick={startScanMode} style={{ marginTop: 14 }}>
                <Camera size={16} style={{ marginRight: 6 }} />
                Scan ID Card QR
              </button>
            )}

            <button
              className="vol-logout-btn"
              onClick={() => { setSelectedP(null); setParticipants(null); setScanMode(false); stopCamera(); setResultMsg(null); }}
              style={{ width: '100%', marginTop: 10, textAlign: 'center' }}
            >
              Search Another
            </button>
          </div>
        )}

        {/* Phase 3: Camera scanner for QR activation */}
        {scanMode && cameraVisible && (
          <div style={{ marginTop: 14 }}>
            <div className="vol-scanner-header">
              <span className="vol-scanner-title">Scan ID Card QR</span>
              <button className="vol-logout-btn" onClick={stopScan} style={{ padding: '6px 12px' }}>
                <CameraOff size={14} />
              </button>
            </div>

            <div className="vol-video-wrap">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ display: cameraStatus === 'active' ? 'block' : 'none' }}
              />
              <ScannerOverlay flash={flash} cameraStatus={cameraStatus} />
            </div>

            {/* Safari: explicit start button */}
            {isSafariBrowser && cameraStatus === 'idle' && (
              <button className="vol-start-btn" onClick={startCamera}>
                📷 Start Camera
              </button>
            )}

            {/* Fallback if camera denied */}
            {(cameraStatus === 'denied' || cameraStatus === 'error') && (
              <div style={{ marginTop: 8 }}>
                <div className="vol-id-warning">Camera unavailable — enter QR code manually</div>
                <button
                  className="vol-manual-input-btn"
                  onClick={() => setManualVisible((v) => !v)}
                  style={{ width: '100%', padding: 12, marginTop: 8 }}
                >
                  {manualVisible ? 'Hide Manual Input' : 'Show Manual Input'}
                </button>
              </div>
            )}

            <ManualInput
              onScan={handleQRScan}
              visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'}
              placeholder="Enter QR code from ID card"
            />

            {activating && (
              <div className="vol-loading">
                <div className="vol-spinner" />
                Activating…
              </div>
            )}
          </div>
        )}
      </div>

      <div className="vol-bottom-spacer" />
    </div>
  );
}
