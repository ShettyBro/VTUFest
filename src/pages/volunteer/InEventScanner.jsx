/**
 * InEventScanner.jsx — In-Event Volunteer
 *
 * Android tabs: My Events · Scan QR · My Profile
 * Tab 0: My Events (list of assigned events)
 * Tab 1: Camera QR scanner (marks attendance for assigned events)
 * Tab 2: Profile (shell handles)
 */

import { useState, useCallback, useEffect } from 'react';
import { CalendarDays, QrCode, User, RefreshCw } from 'lucide-react';
import VolunteerShell, { getToken, doLogout } from './VolunteerShell';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import { inEventScan, getMyEvents } from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import { useNavigate } from 'react-router-dom';
import '../../styles/volunteer.css';

const TABS = [
  { icon: CalendarDays, label: 'My Events' },
  { icon: QrCode, label: 'Scan QR' },
  { icon: User, label: 'My Profile' },
];

export default function InEventScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Tab 0: events
  const [events, setEvents] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  // Tab 1: scanner
  const [flash, setFlash] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  const loadEvents = useCallback(async (force = false) => {
    if (events !== null && !force) return;
    setEventsLoading(true); setEventsError('');
    const res = await getMyEvents(getToken());
    setEventsLoading(false);
    if (res.status === 401) { doLogout(navigate); return; }
    if (res.ok) setEvents(res.data.events || res.data.assigned_events || []);
    else setEventsError(res.data?.message || 'Failed to load events.');
  }, [events, navigate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const doScan = useCallback(async (qr) => {
    if (scanning) return;
    setScanning(true); setFlash(''); setScanError(''); setResult(null);
    const res = await inEventScan(qr, getToken());
    setScanning(false);
    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }
    if (res.ok) { playBeep('success'); setFlash('success'); setResult(res.data); }
    else { playBeep('error'); setFlash('error'); setScanError(res.data?.message || 'Scan failed.'); }
  }, [scanning, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doScan, enabled: cameraStarted,
  });

  return (
    <VolunteerShell roleTitle="In-Event" tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* TAB 0: My Events */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
              {events ? `${events.length} Assigned Event${events.length !== 1 ? 's' : ''}` : 'My Events'}
            </p>
            <button onClick={() => { setEvents(null); loadEvents(true); }}
              style={{ background: 'none', border: 'none', color: 'var(--vol-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {eventsLoading && <div className="vol-loading"><div className="vol-spinner" />Loading events…</div>}
          {eventsError && <div className="vol-result-card error"><p style={{ margin: 0 }}>{eventsError}</p></div>}
          {events?.length === 0 && (
            <div className="vol-result-card warning">
              <p style={{ margin: 0, fontSize: '0.88rem' }}>⚠️ No events assigned. Contact coordinator.</p>
            </div>
          )}

          <div className="vol-event-list">
            {events?.map((ev, i) => (
              <div key={i} className="vol-event-item" style={{
                background: 'var(--vol-card-bg)',
                border: '1px solid var(--vol-card-border)',
                borderRadius: 12, padding: '14px 16px', marginBottom: 10,
              }}>
                <div className="vol-event-name" style={{ fontSize: '0.95rem', marginBottom: 6 }}>
                  🎭 {(ev.event_title || ev.event_name || '').replace(/_/g, ' ')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ev.event_venue && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--vol-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      📍 {ev.event_venue}
                    </span>
                  )}
                  {ev.event_time && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--vol-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⏰ {ev.event_time}
                    </span>
                  )}
                  {ev.event_date && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--vol-text-muted)' }}>
                      📅 {ev.event_date}
                    </span>
                  )}
                </div>
                {ev.scanned_count !== undefined && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--vol-accent)', fontWeight: 600 }}>
                    ✅ {ev.scanned_count} scanned
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 8, padding: '12px 16px',
            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 12, borderLeft: '3px solid var(--vol-accent)',
          }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--vol-text-muted)', lineHeight: 1.6 }}>
              💡 Go to <strong style={{ color: 'var(--vol-accent)' }}>Scan QR</strong> tab to mark attendance for your assigned events.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: Scan QR */}
      {activeTab === 1 && (
        <div>
          <div className="vol-scanner-header">
            <span className="vol-scanner-title">Mark Attendance</span>
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
            <button className="vol-logout-btn" onClick={() => { setCameraStarted(false); stopCamera(); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>Stop Scanner</button>
          )}
          {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
            <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>📷 Tap to Activate Camera</button>
          )}
          <button className="vol-manual-input-btn" onClick={() => setManualVisible(v => !v)} style={{ width: '100%', padding: 10, marginTop: 10 }}>
            ⌨️ {manualVisible ? 'Hide Manual Input' : 'Type QR Code'}
          </button>
          <ManualInput onScan={doScan} visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'} placeholder="Enter 8-char QR code" maxLength={8} alphanumericOnly />

          {scanning && <div className="vol-loading"><div className="vol-spinner" />Marking attendance…</div>}
          {scanError && <div className="vol-result-card error" style={{ marginTop: 12 }}><p style={{ margin: 0 }}>{scanError}</p></div>}

          {result && (
            <div style={{ marginTop: 12 }}>
              <div className="vol-result-card success">
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1rem', color: 'var(--vol-success)' }}>✅ Attendance Marked</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>{result.participant?.full_name || result.full_name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--vol-text-muted)' }}>
                  {result.participant?.college_name || result.college_name}
                </p>
                {result.event_name && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--vol-accent)' }}>
                    🎭 {result.event_name.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
              <button className="vol-logout-btn" onClick={() => { setResult(null); setScanError(''); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
                Clear — Scan Next
              </button>
            </div>
          )}
        </div>
      )}
    </VolunteerShell>
  );
}
