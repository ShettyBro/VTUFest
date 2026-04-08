/**
 * CompanionFacilities.jsx — /manager/facilities
 * Read-only view of: Accommodation · Green Room
 * Both APIs called in parallel on mount. Collapsible cards.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanionLayout from './CompanionLayout';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.vtufest2026.acharyahabba.com';

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('vtufest_token');
  return fetch(API + path, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...opts,
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  const map = {
    PENDING:   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
    APPROVED:  { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.3)'  },
    ALLOTTED:  { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.3)'  },
    REJECTED:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
    CANCELLED: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  };
  const m = map[s] || { bg: 'rgba(255,255,255,0.07)', color: 'rgba(241,245,249,0.5)', border: 'rgba(255,255,255,0.15)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {s || '—'}
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: 12, padding: '9px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.42)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', wordBreak: 'break-word', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

// ── Collapsible card ──────────────────────────────────────────────────────────
function FacilityCard({ icon, title, status, loading, open, onToggle, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 18,
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit', color: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, fontSize: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
            {loading
              ? <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.3)' }}>Loading…</div>
              : status && <StatusBadge status={status} />
            }
          </div>
        </div>
        <span style={{
          fontSize: 22, color: 'rgba(241,245,249,0.3)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s', display: 'inline-block', flexShrink: 0,
        }}>
          ⌄
        </span>
      </button>

      {open && (
        <div style={{ padding: '4px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {loading
            ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(241,245,249,0.3)', fontSize: 13 }}>Loading…</div>
            : children
          }
        </div>
      )}
    </div>
  );
}

// ── Accommodation panel ───────────────────────────────────────────────────────
// API: POST /api/manager/accommodation { action: get_accommodation_status }
// Returns: { accommodation: { status, total_boys, total_girls, contact_person_name, ... }, allotments: [] }
function AccommodationPanel({ data }) {
  if (!data?.accommodation) {
    return (
      <div style={{ padding: '20px 0', color: 'rgba(241,245,249,0.3)', fontSize: 13, textAlign: 'center' }}>
        No accommodation request submitted yet.
      </div>
    );
  }
  const { accommodation: a, allotments = [] } = data;
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div style={{ marginTop: 14 }}>
      <InfoRow label="Status"    value={<StatusBadge status={a.status} />} />
      <InfoRow label="Boys"      value={a.total_boys} />
      <InfoRow label="Girls"     value={a.total_girls} />
      <InfoRow label="Contact"   value={a.contact_person_name} />
      <InfoRow label="Phone"     value={a.contact_person_phone} />
      <InfoRow label="Applied"   value={fmt(a.applied_at)} />
      {a.special_requirements && <InfoRow label="Requirements" value={a.special_requirements} />}
      {a.admin_remarks && <InfoRow label="Admin Note" value={a.admin_remarks} />}

      {allotments.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(241,245,249,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Allotments ({allotments.length})
          </div>
          {allotments.map((al, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 13, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                {al.accommodation_name || `Allotment ${i + 1}`}
              </div>
              <InfoRow label="Type"    value={al.accommodation_type} />
              <InfoRow label="Boys"    value={al.allotted_boys} />
              <InfoRow label="Girls"   value={al.allotted_girls} />
              <InfoRow label="Contact" value={al.contact_name} />
              <InfoRow label="Phone"   value={al.contact_phone} />
              <InfoRow label="Address" value={al.address} />
              {al.notes && <InfoRow label="Notes" value={al.notes} />}
              {al.location_url && (
                <a
                  href={al.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginTop: 10, color: '#60a5fa', fontSize: 12, fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  📍 View on Map
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Green Room panel ──────────────────────────────────────────────────────────
// API: GET /api/manager/green-room
// Returns: { college, participant_count, existing_request: { ...fields, allocations: [] } }
function GreenRoomPanel({ data }) {
  const req = data?.existing_request;
  if (!req) {
    return (
      <div style={{ padding: '20px 0', color: 'rgba(241,245,249,0.3)', fontSize: 13, textAlign: 'center' }}>
        No green room request submitted yet.
      </div>
    );
  }
  const allocations = req.allocations || [];

  return (
    <div style={{ marginTop: 14 }}>
      <InfoRow label="Status"       value={<StatusBadge status={req.status} />} />
      <InfoRow label="Participants"  value={req.total_participants} />
      <InfoRow label="Contact"      value={req.contact_person_name} />
      <InfoRow label="Phone"        value={req.contact_person_phone} />
      {req.special_requirements && <InfoRow label="Requirements" value={req.special_requirements} />}
      {req.rejection_reason && <InfoRow label="Reason" value={req.rejection_reason} />}

      {allocations.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(241,245,249,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Rooms Allocated ({allocations.length})
          </div>
          {allocations.map((a, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 13, padding: '14px 16px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                Room {a.room_number || i + 1}
                {a.building_name ? ` — ${a.building_name}` : ''}
              </div>
              {a.floor_number != null && <InfoRow label="Floor" value={a.floor_number} />}
              {a.notes && <InfoRow label="Notes" value={a.notes} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CompanionFacilities() {
  const navigate = useNavigate();
  const [open, setOpen] = useState({ accommodation: true, greenRoom: false });

  const [accommodation, setAccommodation] = useState(null);
  const [greenRoom, setGreenRoom]         = useState(null);
  const [loadingAccom, setLoadingAccom]   = useState(true);
  const [loadingGR, setLoadingGR]         = useState(true);

  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    let mounted = true;
    const handleUnauth = () => { localStorage.removeItem('vtufest_token'); navigate('/manager', { replace: true }); };

    apiFetch('/api/manager/accommodation', {
      method: 'POST',
      body: JSON.stringify({ action: 'get_accommodation_status' }),
    })
      .then(r => { if (r.status === 401) { handleUnauth(); return null; } return r.json(); })
      .then(d => { if (mounted && d?.success) setAccommodation(d.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingAccom(false); });

    apiFetch('/api/manager/green-room')
      .then(r => { if (r.status === 401) { handleUnauth(); return null; } return r.json(); })
      .then(d => { if (mounted && d?.success) setGreenRoom(d.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingGR(false); });

    return () => { mounted = false; };
  }, []);

  return (
    <CompanionLayout>
      <div style={{ padding: '24px 16px 8px' }}>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Facilities</div>
          <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>
            Your accommodation &amp; green room status
          </div>
        </div>

        <FacilityCard
          icon="🏨"
          title="Accommodation"
          status={accommodation?.accommodation?.status}
          loading={loadingAccom}
          open={open.accommodation}
          onToggle={() => toggle('accommodation')}
        >
          <AccommodationPanel data={accommodation} />
        </FacilityCard>

        <FacilityCard
          icon="🎭"
          title="Green Room"
          status={greenRoom?.existing_request?.status}
          loading={loadingGR}
          open={open.greenRoom}
          onToggle={() => toggle('greenRoom')}
        >
          <GreenRoomPanel data={greenRoom} />
        </FacilityCard>

        <div style={{ height: 16 }} />
      </div>
    </CompanionLayout>
  );
}
