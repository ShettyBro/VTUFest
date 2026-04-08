/**
 * CompanionFacilities.jsx — /manager/facilities
 * Read-only view of: Accommodation · Green Room · Transport
 * All 3 APIs called in parallel on mount. Collapsible cards.
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
  const map = {
    PENDING:   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
    APPROVED:  { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.3)'  },
    REJECTED:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
    ALLOTTED:  { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.3)'  },
    CANCELLED: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
    SUBMITTED: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  };
  const s = status?.toUpperCase();
  const m = map[s] || { bg: 'rgba(255,255,255,0.07)', color: 'rgba(241,245,249,0.5)', border: 'rgba(255,255,255,0.15)' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {s || '—'}
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: 'rgba(241,245,249,0.45)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

// ── Collapsible card ──────────────────────────────────────────────────────────
function FacilityCard({ icon, title, status, loading, open, onToggle, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      {/* Header tap target */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '16px 18px', cursor: 'pointer', fontFamily: 'inherit', color: '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
            {status && !loading && (
              <div style={{ marginTop: 4 }}>
                <StatusBadge status={status} />
              </div>
            )}
            {loading && (
              <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(241,245,249,0.35)' }}>Loading…</div>
            )}
          </div>
        </div>
        <span style={{
          fontSize: 20, color: 'rgba(241,245,249,0.4)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s', display: 'inline-block',
        }}>⌄</span>
      </button>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {loading
            ? <div style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(241,245,249,0.35)', fontSize: 13 }}>Loading…</div>
            : children
          }
        </div>
      )}
    </div>
  );
}

// ── Accommodation panel ───────────────────────────────────────────────────────
function AccommodationPanel({ data }) {
  if (!data?.accommodation) {
    return (
      <div style={{ padding: '16px 0', color: 'rgba(241,245,249,0.35)', fontSize: 13, textAlign: 'center' }}>
        No accommodation request submitted.
      </div>
    );
  }
  const { accommodation, allotments = [] } = data;
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div>
      <div style={{ marginTop: 14 }}>
        <InfoRow label="Status" value={<StatusBadge status={accommodation.status} />} />
        <InfoRow label="Boys" value={accommodation.total_boys} />
        <InfoRow label="Girls" value={accommodation.total_girls} />
        <InfoRow label="Contact" value={accommodation.contact_person_name} />
        <InfoRow label="Phone" value={accommodation.contact_person_phone} />
        <InfoRow label="Applied" value={fmt(accommodation.applied_at)} />
        {accommodation.admin_remarks && <InfoRow label="Remarks" value={accommodation.admin_remarks} />}
      </div>

      {allotments.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Allotments ({allotments.length})
          </div>
          {allotments.map((a, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{a.accommodation_name || 'Accommodation'}</div>
              <InfoRow label="Type" value={a.accommodation_type} />
              <InfoRow label="Boys" value={a.allotted_boys} />
              <InfoRow label="Girls" value={a.allotted_girls} />
              <InfoRow label="Contact" value={a.contact_name} />
              <InfoRow label="Phone" value={a.contact_phone} />
              <InfoRow label="Address" value={a.address} />
              {a.location_url && (
                <a
                  href={a.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    marginTop: 8, color: '#60a5fa', fontSize: 12, fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  📍 View on Map
                </a>
              )}
              {a.notes && <InfoRow label="Notes" value={a.notes} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Green Room panel ──────────────────────────────────────────────────────────
// API: GET /api/manager/green-room → { success, data: { college, participant_count, existing_request } }
// existing_request has .allocations[] with: building_name, floor_number, room_number, notes
function GreenRoomPanel({ data }) {
  const req = data?.existing_request;
  if (!req) {
    return (
      <div style={{ padding: '16px 0', color: 'rgba(241,245,249,0.35)', fontSize: 13, textAlign: 'center' }}>
        No green room request submitted.
      </div>
    );
  }
  const allocations = req.allocations || [];

  return (
    <div>
      <div style={{ marginTop: 14 }}>
        <InfoRow label="Status" value={<StatusBadge status={req.status} />} />
        <InfoRow label="Total Participants" value={req.total_participants} />
        <InfoRow label="Contact" value={req.contact_person_name} />
        <InfoRow label="Phone" value={req.contact_person_phone} />
        {req.special_requirements && <InfoRow label="Requirements" value={req.special_requirements} />}
        {req.rejection_reason && <InfoRow label="Reason" value={req.rejection_reason} />}
      </div>

      {allocations.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(241,245,249,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Rooms Allocated ({allocations.length})
          </div>
          {allocations.map((a, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
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

// ── Transport panel ───────────────────────────────────────────────────────────
const TRANSPORT_MODE_LABELS = {
  BUS_PRIVATE:     'Private Bus',
  COLLEGE_VEHICLE: 'College Vehicle',
  TRAIN:           'Train',
  FLIGHT:          'Flight',
  PUBLIC_BUS:      'Public Bus',
  OTHER:           'Other',
};

function TransportPanel({ data }) {
  if (!data) {
    return (
      <div style={{ padding: '16px 0', color: 'rgba(241,245,249,0.35)', fontSize: 13, textAlign: 'center' }}>
        No transport details submitted.
      </div>
    );
  }

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }) : null;

  return (
    <div style={{ marginTop: 14 }}>
      <InfoRow label="Mode" value={TRANSPORT_MODE_LABELS[data.transport_mode] || data.transport_mode} />
      <InfoRow label="Arrival" value={fmt(data.estimated_arrival_datetime)} />
      <InfoRow label="Total People" value={data.total_headcount} />
      <InfoRow label="Contact (Office)" value={data.contact_person_phone} />
      <InfoRow label="Contact (Vehicle)" value={data.on_vehicle_contact_phone} />
      {data.vehicle_number && <InfoRow label="Vehicle No." value={data.vehicle_number} />}
      {data.special_assistance && <InfoRow label="Assistance" value={data.special_assistance} />}
      {data.notes && <InfoRow label="Notes" value={data.notes} />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CompanionFacilities() {
  const navigate = useNavigate();
  const [open, setOpen] = useState({ accommodation: true, greenRoom: false, transport: false });

  const [accommodation, setAccommodation] = useState(null);
  const [greenRoom, setGreenRoom]         = useState(null);
  const [transport, setTransport]         = useState(null);

  const [loadingAccom, setLoadingAccom]   = useState(true);
  const [loadingGR, setLoadingGR]         = useState(true);
  const [loadingTrans, setLoadingTrans]   = useState(true);

  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    let mounted = true;
    const handleUnauth = () => { localStorage.clear(); navigate('/manager', { replace: true }); };

    // Accommodation
    apiFetch('/api/manager/accommodation', {
      method: 'POST',
      body: JSON.stringify({ action: 'get_accommodation_status' }),
    })
      .then(r => { if (r.status === 401) { handleUnauth(); return null; } return r.json(); })
      .then(d => { if (mounted && d?.success) setAccommodation(d.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingAccom(false); });

    // Green Room — returns { success, data: { college, participant_count, existing_request } }
    apiFetch('/api/manager/green-room')
      .then(r => { if (r.status === 401) { handleUnauth(); return null; } return r.json(); })
      .then(d => { if (mounted && d?.success) setGreenRoom(d.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingGR(false); });

    // Transport — returns { success, data: <row | null> }
    apiFetch('/api/transport/my-submission')
      .then(r => { if (r.status === 401) { handleUnauth(); return null; } return r.json(); })
      .then(d => { if (mounted && d?.success) setTransport(d.data || null); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingTrans(false); });

    return () => { mounted = false; };
  }, []);

  const accomStatus = accommodation?.accommodation?.status;
  const grStatus    = greenRoom?.existing_request?.status;
  const transStatus = transport ? 'SUBMITTED' : null;

  return (
    <CompanionLayout>
      <div style={{ padding: '24px 18px 8px' }}>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Facilities</div>
          <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>
            Your accommodation, green room &amp; transport status
          </div>
        </div>

        <FacilityCard
          icon="🏨"
          title="Accommodation"
          status={accomStatus}
          loading={loadingAccom}
          open={open.accommodation}
          onToggle={() => toggle('accommodation')}
        >
          <AccommodationPanel data={accommodation} />
        </FacilityCard>

        <FacilityCard
          icon="🎭"
          title="Green Room"
          status={grStatus}
          loading={loadingGR}
          open={open.greenRoom}
          onToggle={() => toggle('greenRoom')}
        >
          <GreenRoomPanel data={greenRoom} />
        </FacilityCard>

        <FacilityCard
          icon="🚌"
          title="Transport"
          status={transStatus}
          loading={loadingTrans}
          open={open.transport}
          onToggle={() => toggle('transport')}
        >
          <TransportPanel data={transport} />
        </FacilityCard>

        <div style={{ height: 12 }} />
      </div>
    </CompanionLayout>
  );
}
