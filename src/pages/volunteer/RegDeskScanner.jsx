/**
 * RegDeskScanner.jsx — Registration Desk
 *
 * Flow:
 *   1. Volunteer enters phone number or USN → GET /find?q=
 *   2. Student details are shown.
 *   3. Volunteer clicks "Activate QR Code" → camera scanner opens.
 *   4. Volunteer scans the physical ID card QR → POST /activate { participant_id, scanned_qr }
 *   5. Backend verifies QR matches → marks ID card active.
 */

import { useState, useCallback } from 'react';
import { Search, User } from 'lucide-react';
import VolunteerShell, { getToken, doLogout } from './VolunteerShell';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import { regDeskFindByQuery, activateId } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import { useNavigate } from 'react-router-dom';
import '../../styles/volunteer.css';

const TABS = [
  { icon: Search, label: 'Find Person' },
  { icon: User,   label: 'My Profile' },
];

// ─── Participant result card ──────────────────────────────────────────────────
function ParticipantCard({ p, onActivate, activating }) {
  return (
    <div className={`vol-result-card ${p.id_card_activated ? 'success' : 'warning'}`}>
      <div className="vol-result-header">
        {p.photo_url && (
          <img
            src={p.photo_url}
            alt={p.full_name}
            className="vol-result-photo"
            onError={e => (e.target.style.display = 'none')}
          />
        )}
        <div>
          <p className="vol-result-name">{p.full_name}</p>
          <p className="vol-result-sub">{p.college_code}</p>
          <p className="vol-result-sub">
            {p.person_type}{p.gender ? ` · ${p.gender}` : ''}
          </p>
        </div>
      </div>

      {[
        ['QR Code', p.qr_code,   { fontFamily: 'monospace' }],
        ['ID Card', p.id_card_activated ? '✅ Activated' : '⚠️ Not Activated'],
        ['USN',    p.usn],
        ['Phone',  p.phone
          ? <a href={`tel:${p.phone}`} style={{ color: 'var(--vol-accent)' }}>{p.phone}</a>
          : null],
      ].filter(([, v]) => v).map(([label, val, style]) => (
        <div className="vol-result-row" key={label}>
          <span className="vol-result-label">{label}</span>
          <span className="vol-result-value" style={style}>{val}</span>
        </div>
      ))}

      {!p.id_card_activated && (
        <button
          className="vol-start-btn"
          onClick={() => onActivate(p)}
          disabled={activating}
          style={{ marginTop: 12, padding: '10px 0', fontSize: '0.9rem' }}
        >
          {activating ? '⏳ Activating…' : '🪪 Activate QR Code'}
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegDeskScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching,   setSearching]   = useState(false);
  const [searchError, setSearchError] = useState('');

  // Results
  const [participants, setParticipants] = useState(null); // array from /find
  const [selected,     setSelected]     = useState(null); // single participant

  // Activation scanner state
  const [activationTarget,  setActivationTarget]  = useState(null); // participant being activated
  const [activationStarted, setActivationStarted] = useState(false);
  const [activationFlash,   setActivationFlash]   = useState('');
  const [activating,        setActivating]        = useState(false);
  const [activateMsg,       setActivateMsg]       = useState('');

  // ── Activation QR scan handler ────────────────────────────────────────────
  const doActivationScan = useCallback(async (scannedQr) => {
    if (!activationTarget) return;
    setActivationFlash('');
    setActivateMsg('');
    setActivating(true);

    const res = await activateId(activationTarget.id, scannedQr, getToken());
    setActivating(false);

    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }

    if (res.ok) {
      playBeep('success');
      setActivationFlash('success');
      setActivateMsg('✅ ID card activated successfully!');
      // Update card state
      const patch = p => p.id === activationTarget.id ? { ...p, id_card_activated: true } : p;
      setSelected(s => s ? { ...s, id_card_activated: true } : s);
      setParticipants(ps => ps ? ps.map(patch) : ps);
      // Auto-close scanner after success
      setTimeout(() => {
        setActivationStarted(false);
        stopActivationCamera();
        setActivationTarget(null);
      }, 1800);
    } else {
      playBeep('error');
      setActivationFlash('error');
      setActivateMsg(res.data?.message || 'QR mismatch. Please scan the correct ID card.');
    }
  }, [activationTarget, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    videoRef: activationVideoRef,
    cameraStatus: activationCameraStatus,
    startCamera: startActivationCamera,
    stopCamera: stopActivationCamera,
    isSafariBrowser,
  } = useScanner({ onScan: doActivationScan, enabled: activationStarted });

  // ── Phone / USN search → /find ────────────────────────────────────────────
  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    setParticipants(null);
    setSelected(null);
    setActivateMsg('');
    closeActivationScanner();

    const res = await regDeskFindByQuery(q, getToken());
    setSearching(false);
    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }
    if (res.ok) {
      const list = res.data.participants || [];
      if (list.length === 1) setSelected(list[0]);
      else setParticipants(list);
    } else {
      setSearchError(res.data?.message || 'No participant found.');
    }
  };

  // ── Open activation scanner for a participant ─────────────────────────────
  const handleActivate = (participant) => {
    setActivationTarget(participant);
    setActivationFlash('');
    setActivateMsg('');
    setActivationStarted(true);
    if (!isSafariBrowser) startActivationCamera();
  };

  const closeActivationScanner = () => {
    setActivationStarted(false);
    stopActivationCamera();
    setActivationTarget(null);
    setActivationFlash('');
    setActivateMsg('');
  };

  const clearAll = () => {
    setParticipants(null);
    setSelected(null);
    setSearchError('');
    setActivateMsg('');
    closeActivationScanner();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <VolunteerShell roleTitle="Registration Desk" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 0 && (
        <div>

          {/* ── Phone / USN Search ── */}
          <div style={{
            marginBottom: 16, padding: '14px 16px',
            background: 'var(--vol-card-bg)', border: '1px solid var(--vol-card-border)', borderRadius: 14,
          }}>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
              🔍 Search by Phone or USN
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--vol-text-muted)' }}>
              Enter a 10-digit mobile number or USN (e.g. 4VV22CS001)
            </p>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Phone number or USN"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                className="vol-manual-input-field"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="vol-manual-input-btn"
                disabled={!searchQuery.trim() || searching}
              >
                {searching ? '…' : 'Find'}
              </button>
            </form>
          </div>

          {/* ── Search error ── */}
          {searchError && (
            <div className="vol-result-card error" style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}>{searchError}</p>
            </div>
          )}

          {/* ── Multiple results — pick one ── */}
          {participants && participants.length > 1 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--vol-text-muted)' }}>
                {participants.length} participants found — select one:
              </p>
              {participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setParticipants(null); }}
                  style={{
                    width: '100%', textAlign: 'left', marginBottom: 8,
                    background: 'var(--vol-card-bg)', border: '1px solid var(--vol-card-border)',
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{p.full_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--vol-text-muted)' }}>
                    {p.college_code} · {p.person_type} · {p.usn || p.phone}
                  </p>
                </button>
              ))}
              <button
                className="vol-logout-btn"
                onClick={clearAll}
                style={{ width: '100%', padding: 10, marginTop: 4, textAlign: 'center' }}
              >
                Clear
              </button>
            </div>
          )}

          {/* ── Single participant result ── */}
          {selected && (
            <div style={{ marginTop: 12 }}>
              <ParticipantCard
                p={selected}
                onActivate={handleActivate}
                activating={activating}
              />

              {/* ── Activation scanner (shown after clicking Activate QR Code) ── */}
              {activationStarted && activationTarget?.id === selected.id && (
                <div style={{
                  marginTop: 12, padding: '14px 16px',
                  background: 'var(--vol-card-bg)', border: '1px solid var(--vol-card-border)', borderRadius: 14,
                }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    📷 Scan ID Card QR for {selected.full_name}
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--vol-text-muted)' }}>
                    Point the camera at the QR code printed on their physical ID card.
                  </p>

                  <div className="vol-scanner-header">
                    <span className="vol-scanner-title">ID Card Scanner</span>
                    <span className={`vol-scanner-badge ${activationCameraStatus === 'active' ? 'online' : 'offline'}`}>
                      {activationCameraStatus === 'active' ? 'Live' : 'Standby'}
                    </span>
                  </div>
                  <div className="vol-video-wrap">
                    <video
                      ref={activationVideoRef}
                      autoPlay muted playsInline
                      style={{ display: activationCameraStatus === 'active' ? 'block' : 'none' }}
                    />
                    <ScannerOverlay flash={activationFlash} cameraStatus={activationCameraStatus} />
                  </div>

                  {isSafariBrowser && activationCameraStatus === 'idle' && (
                    <button
                      className="vol-start-btn"
                      onClick={startActivationCamera}
                      style={{ marginTop: 8 }}
                    >
                      📷 Tap to Activate Camera
                    </button>
                  )}

                  {activateMsg && (
                    <p style={{
                      margin: '10px 0 0', fontSize: '0.85rem', textAlign: 'center',
                      color: activateMsg.startsWith('✅') ? 'var(--vol-success)' : 'var(--vol-error)',
                    }}>
                      {activateMsg}
                    </p>
                  )}

                  <button
                    className="vol-logout-btn"
                    onClick={closeActivationScanner}
                    style={{ width: '100%', padding: 10, marginTop: 12, textAlign: 'center' }}
                  >
                    Cancel Scan
                  </button>
                </div>
              )}

              {/* Activation success message when scanner is closed */}
              {!activationStarted && activateMsg && (
                <p style={{
                  margin: '10px 0 0', fontSize: '0.85rem', textAlign: 'center',
                  color: activateMsg.startsWith('✅') ? 'var(--vol-success)' : 'var(--vol-error)',
                }}>
                  {activateMsg}
                </p>
              )}

              <button
                className="vol-logout-btn"
                onClick={clearAll}
                style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}
              >
                Clear — Search Next
              </button>
            </div>
          )}
        </div>
      )}
    </VolunteerShell>
  );
}
