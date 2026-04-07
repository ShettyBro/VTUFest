/**
 * CollegeBuddyDashboard.jsx — Full College Buddy App (mirrors Android)
 *
 * 3 Tabs (bottom nav):
 *   0 - Scanner  : QR scan any participant → full details (same as security)
 *   1 - My Colleges : List of assigned colleges → tap to expand full details
 *                     Each college → sub-tabs Students / Accompanists
 *   2 - Profile  : Volunteer's own name + their own QR code
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, School, User, CameraOff, ChevronDown, ChevronUp, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import ManualInput from '../../components/scanner/ManualInput';
import VolunteerShell, { doLogout, getToken, getVolName, getVolEmail, getVolQr, QRCodeImg, ProfileTab, CameraGate } from './VolunteerShell';
import {
  collegeBuddyLookup,
  collegeBuddyMyColleges,
  collegeBuddyStudents,
  collegeBuddyAccompanists,
} from '../../utils/volunteerApi';
import { playBeep } from '../../utils/scannerUtils';
import '../../styles/volunteer.css';

const token = () => getToken();
const volName = () => getVolName();
const volEmail = () => getVolEmail();


// ── People list (students/accompanists) ────────────────────────────────────

function PersonList({ people, type }) {
  if (!people) return <div className="vol-loading"><div className="vol-spinner" />Loading…</div>;
  if (people.length === 0) return (
    <p style={{ textAlign: 'center', color: 'var(--vol-text-dim)', padding: '16px 0', fontSize: '0.85rem' }}>
      No {type} found.
    </p>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {people.map((p) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '10px 12px',
        }}>
          {/* Photo */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(0,0,0,0.3)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {p.photo_url
              ? <img src={p.photo_url} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
              : <User size={20} color="var(--vol-text-dim)" />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.is_team_manager && <span style={{ color: 'var(--vol-warning)', marginRight: 4 }}>★</span>}
              {p.full_name}
            </p>
            {p.qr_code && (
              <p style={{ margin: 0, fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--vol-accent)', letterSpacing: '0.1em' }}>
                {p.qr_code}
              </p>
            )}
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--vol-text-muted)' }}>
              {type === 'students' ? p.usn || p.department : p.accompanist_type}
              {p.gender && ` · ${p.gender.charAt(0).toUpperCase()}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Single College Expanded Card ────────────────────────────────────────────
function CollegeCard({ entry, token: tkn }) {
  const [subTab, setSubTab] = useState('info'); // 'info' | 'students' | 'accompanists'
  const [students, setStudents] = useState(null);
  const [accompanists, setAccompanists] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  const c = entry.college;

  const loadStudents = async () => {
    if (students !== null) { setSubTab('students'); return; }
    setSubLoading(true);
    const res = await collegeBuddyStudents(tkn, c.id);
    setSubLoading(false);
    if (res.ok) setStudents(res.data.students || []);
    else setStudents([]);
    setSubTab('students');
  };

  const loadAccompanists = async () => {
    if (accompanists !== null) { setSubTab('accompanists'); return; }
    setSubLoading(true);
    const res = await collegeBuddyAccompanists(tkn, c.id);
    setSubLoading(false);
    if (res.ok) setAccompanists(res.data.accompanists || []);
    else setAccompanists([]);
    setSubTab('accompanists');
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Not finalized warning */}
      {!c.is_final_approved && (
        <div className="vol-warning-banner" style={{ marginBottom: 10 }}>
          <span>⚠️</span>
          <span>{entry.message || "This college's registration is not yet final approved."}</span>
        </div>
      )}

      {/* College header */}
      <div className="vol-result-card" style={{ marginBottom: 8 }}>
        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{c.college_name}</p>
        {c.place && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--vol-text-muted)' }}>📍 {c.place}</p>}
        <p style={{ margin: '4px 0 0', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--vol-accent)' }}>
          {c.college_code}
        </p>
      </div>

      {/* Sub-tab selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['info', 'students', 'accompanists'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === 'students') loadStudents();
              else if (tab === 'accompanists') loadAccompanists();
              else setSubTab('info');
            }}
            style={{
              flex: 1, padding: '7px 4px',
              background: subTab === tab ? 'var(--vol-btn-bg)' : 'rgba(255,255,255,0.05)',
              border: '1px solid',
              borderColor: subTab === tab ? 'transparent' : 'rgba(255,255,255,0.1)',
              borderRadius: 8, color: subTab === tab ? 'var(--vol-btn-text)' : 'var(--vol-text-muted)',
              fontWeight: subTab === tab ? 700 : 400,
              fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'info' ? 'Overview' : tab}
          </button>
        ))}
      </div>

      {subLoading && <div className="vol-loading"><div className="vol-spinner" />Loading…</div>}

      {/* INFO tab */}
      {subTab === 'info' && !subLoading && (
        <div>
          {/* Team manager */}
          {entry.team_manager && (
            <div className="vol-result-card" style={{ marginBottom: 8 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Manager</p>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#fff' }}>{entry.team_manager.full_name}</p>
              {entry.team_manager.phone && (
                <a href={`tel:${entry.team_manager.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--vol-accent)', fontSize: '0.82rem', textDecoration: 'none' }}>
                  <Phone size={13} /> {entry.team_manager.phone}
                </a>
              )}
              {entry.team_manager.email && (
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--vol-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={12} /> {entry.team_manager.email}
                </p>
              )}
            </div>
          )}

          {/* Headcount */}
          {entry.counts && (
            <div className="vol-result-card" style={{ marginBottom: 8 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Headcount</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['Students', entry.counts.total_students],
                  ['Accompanists', entry.counts.total_accompanists],
                  ['Faculty', entry.counts.faculty_accompanists],
                  ['Professional', entry.counts.professional_accompanists],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8, padding: '8px 10px', textAlign: 'center',
                  }}>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--vol-accent)' }}>{val || '0'}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--vol-text-muted)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accommodation */}
          {entry.accommodation?.length > 0 && (
            <div className="vol-result-card" style={{ marginBottom: 8 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accommodation</p>
              {entry.accommodation.map((a, i) => (
                <div key={i} style={{ marginBottom: i < entry.accommodation.length - 1 ? 12 : 0 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#fff' }}>{a.accommodation_name}</p>
                  {a.accommodation_type && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-warning)' }}>{a.accommodation_type}</p>}
                  {a.address && (
                    <p style={{ margin: '3px 0', fontSize: '0.78rem', color: 'var(--vol-text-muted)', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {a.address}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                    {a.allotted_boys && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-info)' }}>Boys: {a.allotted_boys}</p>}
                    {a.allotted_girls && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-accent)' }}>Girls: {a.allotted_girls}</p>}
                  </div>
                  {a.contact_name && (
                    <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--vol-text-muted)' }}>
                      📞 {a.contact_name}{a.contact_phone && ` · ${a.contact_phone}`}
                    </p>
                  )}
                  {a.location_url && (
                    <a href={a.location_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 8, padding: '6px 14px', background: 'var(--vol-accent-soft)', color: 'var(--vol-accent)', borderRadius: 8, fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>
                      📍 Open Map
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Events */}
          {entry.events?.length > 0 && (
            <div className="vol-result-card" style={{ marginBottom: 8 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Events ({entry.events.length})
              </p>
              <div className="vol-event-list">
                {entry.events.map((ev, i) => (
                  <div key={i} className="vol-event-item">
                    <div className="vol-event-name">
                      {(ev.event_title || ev.event_name).replace(/_/g, ' ')}
                    </div>
                    <div className="vol-event-meta">
                      {ev.event_venue && `📍 ${ev.event_venue}`}
                      {ev.event_time && ` · ⏰ ${ev.event_time}`}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      {ev.participants > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)' }}>Participants: {ev.participants}</span>}
                      {ev.accompanists > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)' }}>Accompanists: {ev.accompanists}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENTS tab */}
      {subTab === 'students' && !subLoading && (
        <PersonList people={students} type="students" />
      )}

      {/* ACCOMPANISTS tab */}
      {subTab === 'accompanists' && !subLoading && (
        <PersonList people={accompanists} type="accompanists" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function CollegeBuddyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0); // 0=Scanner 1=Colleges 2=Profile

  // ── Tab 0: Scanner state ────────────────────────────────────────────────
  const [flash, setFlash] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  // ── Tab 1: My Colleges state ────────────────────────────────────────────
  const [colleges, setColleges] = useState(null);  // array from API
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegesError, setCollegesError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null); // which college card is open

  // ── Tab 0: QR lookup ───────────────────────────────────────────────────
  const doLookup = useCallback(async (qr) => {
    if (scanning) return;
    setScanning(true);
    setFlash('');
    setScanError('');
    setLookupResult(null);

    const res = await collegeBuddyLookup(qr, token());
    setScanning(false);

    if (res.aborted) return;
    if (res.status === 401) { doLogout(navigate); return; }

    if (res.ok) {
      playBeep('success');
      setFlash('success');
      setLookupResult(res.data);
    } else {
      playBeep('error');
      setFlash('error');
      setScanError(res.data?.message || 'QR code not found.');
    }
  }, [scanning, navigate]);

  const { videoRef, cameraStatus, startCamera, stopCamera, isSafariBrowser } = useScanner({
    onScan: doLookup,
    enabled: cameraStarted,
  });

  // ── Tab 1: Load colleges ───────────────────────────────────────────────
  const loadColleges = useCallback(async (force = false) => {
    if (colleges !== null && !force) return;
    setCollegesLoading(true);
    setCollegesError('');

    const res = await collegeBuddyMyColleges(token());
    setCollegesLoading(false);

    if (res.status === 401) { doLogout(navigate); return; }

    if (res.ok) {
      setColleges(res.data.colleges || []);
    } else {
      setCollegesError(res.data?.message || 'Failed to load colleges.');
    }
  }, [colleges, navigate]);

  useEffect(() => {
    if (activeTab === 1) loadColleges();
  }, [activeTab, loadColleges]);

  const tkn = token();
  const name = volName();
  const email = volEmail();

  // We'll show the volunteer's own QR from the login data if stored
  const volExtra = (() => {
    try { return JSON.parse(localStorage.getItem('vtufest_vol_extra') || '{}'); } catch { return {}; }
  })();
  const volQr = localStorage.getItem('vtufest_vol_qr') || volExtra.qr_code || '';

  return (
    <CameraGate>
    <div className="vol-page" style={{ paddingBottom: 0 }}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 8px',
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
            College Buddy
            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--vol-text-muted)', fontWeight: 400 }}>
              {activeTab === 0 ? '· Scanner' : activeTab === 1 ? '· My Colleges' : '· Profile'}
            </span>
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-text-dim)' }}>{name}</p>
        </div>
        <button className="vol-logout-btn" onClick={() => doLogout(navigate)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.8rem' }}>⏻</span> Logout
        </button>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, width: '100%', maxWidth: 480, padding: '0 16px', overflowY: 'auto', paddingBottom: 80 }}>

        {/* ════════════════════════════════════════════════════════ TAB 0: SCANNER */}
        {activeTab === 0 && (
          <div>
            {/* Camera */}
            <div className="vol-scanner-header">
              <span className="vol-scanner-title">Scan Any QR Code</span>
              <span className={`vol-scanner-badge ${cameraStatus === 'active' ? 'online' : 'offline'}`}>
                {cameraStatus === 'active' ? 'Live' : 'Standby'}
              </span>
            </div>

            <div className="vol-video-wrap">
              <video
                ref={videoRef} autoPlay muted playsInline
                style={{ display: cameraStarted && cameraStatus === 'active' ? 'block' : 'none' }}
              />
              <ScannerOverlay flash={flash} cameraStatus={cameraStarted ? cameraStatus : 'idle'} />
            </div>

            {!cameraStarted ? (
              <button className="vol-start-btn" onClick={() => { setCameraStarted(true); if (!isSafariBrowser) startCamera(); }}>
                📷 Start Scanner
              </button>
            ) : (
              <button className="vol-logout-btn"
                onClick={() => { setCameraStarted(false); stopCamera(); }}
                style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
                <CameraOff size={14} style={{ marginRight: 6 }} /> Stop Scanner
              </button>
            )}

            {isSafariBrowser && cameraStarted && cameraStatus === 'idle' && (
              <button className="vol-start-btn" onClick={startCamera} style={{ marginTop: 8 }}>📷 Tap to Activate Camera</button>
            )}

            <button className="vol-manual-input-btn"
              onClick={() => setManualVisible((v) => !v)}
              style={{ width: '100%', padding: 10, marginTop: 10 }}>
              ⌨️ {manualVisible ? 'Hide Manual Input' : 'Type QR Code'}
            </button>

            <ManualInput onScan={doLookup} visible={manualVisible || cameraStatus === 'denied' || cameraStatus === 'error'} placeholder="Enter 8-char QR code" />

            {scanning && <div className="vol-loading"><div className="vol-spinner" />Looking up…</div>}

            {scanError && (
              <div className={`vol-result-card error`} style={{ marginTop: 12 }}>
                <p style={{ margin: 0, fontSize: '0.88rem' }}>{scanError}</p>
              </div>
            )}

            {/* Lookup result — same as security scanner */}
            {lookupResult && (() => {
              const p = lookupResult.participant;
              return (
                <div style={{ marginTop: 12 }}>
                  {lookupResult.id_card_warning && (
                    <div className="vol-id-warning" style={{ marginBottom: 8 }}>🪪 {lookupResult.id_card_warning}</div>
                  )}
                  <div className="vol-result-card success">
                    <div className="vol-result-header">
                      {p.photo_url && <img src={p.photo_url} alt={p.full_name} className="vol-result-photo" onError={(e) => e.target.style.display = 'none'} />}
                      <div>
                        <p className="vol-result-name">{p.full_name}</p>
                        <p className="vol-result-sub">{p.college_name}</p>
                        <p className="vol-result-sub">{p.person_type} · {p.gender}</p>
                      </div>
                    </div>
                    {[
                      ['QR', p.qr_code, { fontFamily: 'monospace' }],
                      ['Phone', p.phone ? <a href={`tel:${p.phone}`} style={{ color: 'var(--vol-accent)' }}>{p.phone}</a> : null],
                      ['Blood Group', p.blood_group],
                      ['USN', p.usn],
                      ['Dept', p.department],
                      ['ID Card', p.id_card_activated ? '✅ Activated' : '⚠️ Not Activated'],
                    ].filter(([, v]) => v).map(([label, val, style]) => (
                      <div className="vol-result-row" key={label}>
                        <span className="vol-result-label">{label}</span>
                        <span className="vol-result-value" style={style}>{val}</span>
                      </div>
                    ))}

                    {/* ID Proof / College ID */}
                    {(p.id_proof_url || p.college_id_card_url) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {p.id_proof_url && <a href={p.id_proof_url} target="_blank" rel="noopener noreferrer" className="vol-manual-input-btn" style={{ flex: 1, textAlign: 'center', padding: 8 }}>ID Proof</a>}
                        {p.college_id_card_url && <a href={p.college_id_card_url} target="_blank" rel="noopener noreferrer" className="vol-manual-input-btn" style={{ flex: 1, textAlign: 'center', padding: 8 }}>College ID</a>}
                      </div>
                    )}
                  </div>

                  {/* Events */}
                  {lookupResult.events?.length > 0 && (
                    <div className="vol-result-card" style={{ marginTop: 8 }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Events ({lookupResult.events.length})</p>
                      {lookupResult.events.map((ev, i) => (
                        <div key={i} className="vol-event-item" style={{ marginBottom: 6 }}>
                          <div className="vol-event-name">{ev.event_name?.replace(/_/g, ' ')}</div>
                          <div className="vol-event-meta">{ev.event_venue && `📍 ${ev.event_venue}`}{ev.event_time && ` · ⏰ ${ev.event_time}`}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accommodation */}
                  {lookupResult.accommodation && (
                    <div className="vol-result-card" style={{ marginTop: 8 }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--vol-text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accommodation</p>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#fff' }}>{lookupResult.accommodation.accommodation_name}</p>
                      {lookupResult.accommodation.address && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--vol-text-muted)' }}>📍 {lookupResult.accommodation.address}</p>}
                      {lookupResult.accommodation.contact_phone && (
                        <a href={`tel:${lookupResult.accommodation.contact_phone}`} style={{ color: 'var(--vol-accent)', fontSize: '0.78rem' }}>
                          📞 {lookupResult.accommodation.contact_phone}
                        </a>
                      )}
                    </div>
                  )}

                  <button className="vol-logout-btn" onClick={() => { setLookupResult(null); setScanError(''); }} style={{ width: '100%', padding: 10, marginTop: 8, textAlign: 'center' }}>
                    Clear — Scan Next
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════════════════════ TAB 1: MY COLLEGES */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                {colleges ? `${colleges.length} College${colleges.length !== 1 ? 's' : ''} Assigned` : 'My Colleges'}
              </p>
              <button
                onClick={() => { setColleges(null); setExpandedIdx(null); loadColleges(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--vol-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {collegesLoading && <div className="vol-loading"><div className="vol-spinner" />Loading colleges…</div>}

            {collegesError && (
              <div className="vol-result-card error">
                <p style={{ margin: 0 }}>{collegesError}</p>
              </div>
            )}

            {colleges && colleges.length === 0 && (
              <div className="vol-result-card warning">
                <p style={{ margin: 0, fontSize: '0.88rem' }}>⚠️ No colleges assigned yet. Contact admin.</p>
              </div>
            )}

            {/* Expandable college list */}
            {colleges?.map((entry, idx) => {
              const isOpen = expandedIdx === idx;
              return (
                <div key={entry.college?.id || idx} style={{
                  background: 'var(--vol-card-bg)',
                  border: `1px solid ${isOpen ? 'rgba(167,139,250,0.4)' : 'var(--vol-card-border)'}`,
                  borderRadius: 14, marginBottom: 10, overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Collapsed header */}
                  <button
                    onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    style={{
                      width: '100%', background: 'none', border: 'none', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'var(--vol-accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <School size={18} color="var(--vol-accent)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                        {entry.college?.college_name || 'Unknown College'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vol-text-muted)' }}>
                        {entry.college?.place || entry.college?.college_code}
                        {!entry.college?.is_final_approved && (
                          <span style={{ color: 'var(--vol-warning)', marginLeft: 6 }}>⚠️ Not finalised</span>
                        )}
                      </p>
                    </div>
                    {isOpen
                      ? <ChevronUp size={18} color="var(--vol-accent)" />
                      : <ChevronDown size={18} color="var(--vol-text-dim)" />
                    }
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{ padding: '0 14px 14px' }}>
                      <CollegeCard entry={entry} token={tkn} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════════════ TAB 2: PROFILE */}
        {activeTab === 2 && <ProfileTab />}
      </div>

      {/* ── Bottom Tab Bar ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(13,14,28,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
      }}>
        {[
          { icon: QrCode, label: 'Scanner' },
          { icon: School, label: 'My Colleges' },
          { icon: User, label: 'Profile' },
        ].map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex: 1, padding: '12px 8px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? 'var(--vol-accent)' : 'var(--vol-text-dim)',
              transition: 'color 0.2s',
            }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 400 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
    </CameraGate>
  );
}
