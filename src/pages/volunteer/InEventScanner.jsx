/**
 * InEventScanner.jsx — Event Attendance Marking
 *
 * Flow:
 *  1. On mount → fetch my assigned events
 *  2. Volunteer selects which event they're managing
 *  3. Scan participant QR → lookup → show events with is_your_event flag
 *  4. If participant belongs to event and not yet marked → "Mark Present" button
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CameraOff } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { inEventMyEvents, inEventLookup, inEventMarkPresent } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

const token = () => localStorage.getItem('vtufest_vol_token') || '';
const volName = () => localStorage.getItem('vtufest_vol_name') || 'Volunteer';

function logout(navigate) {
  ['vtufest_vol_token', 'vtufest_vol_role', 'vtufest_vol_name', 'vtufest_vol_email']
    .forEach((k) => localStorage.removeItem(k));
  navigate('/volunteer', { replace: true });
}

export default function InEventScanner() {
  const navigate = useNavigate();

  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');

  const [flash, setFlash] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanCount, setScanCount] = useState(0);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  // ── Fetch assigned events on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const res = await inEventMyEvents(token());
      setEventsLoading(false);
      if (res.status === 401) { logout(navigate); return; }
      if (res.ok && res.data?.events?.length > 0) {
        setMyEvents(res.data.events);
        setSelectedEvent(res.data.events[0]?.event_name || '');
      } else {
        setEventsError(res.data?.message || 'No events assigned to you.');
      }
    })();
  }, [navigate]);

  // ── QR scan → lookup ─────────────────────────────────────────────────
  const doLookup = useCallback(async (qr) => {
    if (lookupLoading || !selectedEvent) return;
    setLookupLoading(true);
    setFlash('');
    setScanError('');
    setResult(null);

    const res = await inEventLookup(qr, token());
    setLookupLoading(false);

    if (res.aborted) return;
    if (res.status === 401) { logout(navigate); return; }

    if (res.ok) {
      const data = res.data;
      // Check if participant is in our selected event
      const myEventData = data.events?.find(
        (e) => e.event_name === selectedEvent
      );
      if (!myEventData) {
        playBeep('error');
        setFlash('error');
        setScanError(`❌ ${data.participant?.full_name || 'Participant'} is NOT registered for "${selectedEvent}".`);
      } else {
        playBeep('success');
        setFlash('success');
        setResult({ participant: data.participant, eventData: myEventData, allEvents: data.events });
      }
    } else {
      playBeep('error');
      setFlash('error');
      setScanError(res.data?.message || 'QR code not found.');
    }
  }, [lookupLoading, selectedEvent, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doLookup,
    enabled: cameraStarted,
  });

  // ── Mark present ────────────────────────────────────────────────────────
  const handleMarkPresent = async () => {
    if (!result || markingId) return;
    setMarkingId(result.participant?.qr_code);

    const res = await inEventMarkPresent(result.participant?.qr_code, selectedEvent, token());

    if (res.aborted) { setMarkingId(null); return; }
    if (res.status === 401) { logout(navigate); return; }

    setMarkingId(null);

    if (res.ok) {
      playBeep('success');
      setFlash('success');
      setScanCount((c) => c + 1);
      setResult((r) => ({
        ...r,
        eventData: { ...r.eventData, present: true },
      }));
    } else if (res.status === 409) {
      playBeep('error');
      setFlash('warning');
      setResult((r) => ({
        ...r,
        eventData: { ...r.eventData, present: true, alreadyMarked: true },
      }));
    } else {
      playBeep('error');
      setFlash('error');
      setScanError(res.data?.message || 'Failed to mark present. Try again.');
    }
  };

  return (
    <div className="vol-page">
      {/* Header */}
      <div className="vol-header" style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <p className="vol-subtitle">In-Event Scanner</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--vol-text-dim)' }}>{volName()}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {scanCount > 0 && (
              <span style={{
                background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
                color: 'var(--vol-success)', padding: '4px 10px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 600,
              }}>
                Marked: {scanCount}
              </span>
            )}
            <button className="vol-logout-btn" onClick={() => logout(navigate)}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="vol-scanner-container">
        {/* Events loading */}
        {eventsLoading && (
          <div className="vol-loading"><div className="vol-spinner" /> Loading your events…</div>
        )}

        {eventsError && (
          <div className="vol-result-card error">
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{eventsError}</p>
          </div>
        )}

        {/* Event selector */}
        {!eventsLoading && myEvents.length > 0 && (
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--vol-text-muted)', margin: '0 0 6px' }}>
              You are managing:
            </p>
            <select
              className="vol-select"
              value={selectedEvent}
              onChange={(e) => { setSelectedEvent(e.target.value); setResult(null); setScanError(''); }}
            >
              {myEvents.map((ev) => (
                <option key={ev.event_name} value={ev.event_name}>
                  {ev.event_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camera viewport */}
        {!eventsLoading && myEvents.length > 0 && (
          <>
            <div className="vol-scanner-header">
              <span className="vol-scanner-title">Scan QR Code</span>
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
              onScan={doLookup}
              visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'}
              placeholder="Type participant QR code"
            />
          </>
        )}

        {/* Lookup loading */}
        {lookupLoading && (
          <div className="vol-loading"><div className="vol-spinner" /> Looking up…</div>
        )}

        {/* Scan error */}
        {scanError && (
          <div className="vol-result-card error" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{scanError}</p>
            <button
              className="vol-logout-btn"
              onClick={() => setScanError('')}
              style={{ marginTop: 8, padding: '6px 12px' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="vol-result-card success" style={{ marginTop: 12 }}>
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
                <p className="vol-result-sub">{result.participant?.college_name}</p>
              </div>
            </div>

            {/* Event status for selected event */}
            <div style={{
              padding: '12px',
              background: result.eventData?.present
                ? 'rgba(74,222,128,0.08)' : 'rgba(167,139,250,0.08)',
              borderRadius: 10,
              border: `1px solid ${result.eventData?.present ? 'rgba(74,222,128,0.3)' : 'rgba(167,139,250,0.3)'}`,
              marginTop: 8,
            }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                {selectedEvent}
              </p>
              {result.eventData?.present ? (
                <p style={{ margin: 0, color: 'var(--vol-success)', fontSize: '0.82rem' }}>
                  ✅ {result.eventData?.alreadyMarked ? 'Already marked present' : 'Marked present!'}
                </p>
              ) : (
                <button
                  className="vol-event-action-btn"
                  onClick={handleMarkPresent}
                  disabled={!!markingId}
                >
                  {markingId ? 'Marking…' : '✅ Mark Present'}
                </button>
              )}
            </div>

            <button
              className="vol-logout-btn"
              onClick={() => { setResult(null); setScanError(''); }}
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
