/**
 * CompanionEvents.jsx — /manager/events
 * Shows all 25 events. Tap → fetches participants/accompanists → bottom sheet.
 * Data is cached in state so each event is only fetched once.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanionLayout from './CompanionLayout';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.vtufest2026.acharyahabba.com';

function apiFetch(path, body) {
  const token = localStorage.getItem('vtufest_token');
  return fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

// ── Event definitions (mirrors AssignEvents.jsx) ──────────────────────────────
const EVENT_CATEGORIES = [
  {
    label: 'Music Events',
    icon: '🎵',
    color: '#f472b6',
    events: [
      { name: 'Classical Vocal Solo', slug: 'classical_vocal_solo' },
      { name: 'Light Vocal Solo', slug: 'light_vocal_solo' },
      { name: 'Western Vocal Solo', slug: 'western_vocal_solo' },
      { name: 'Classical Instrumental (Percussion)', slug: 'classical_instrumental_percussion' },
      { name: 'Classical Instrumental (Non-Percussion)', slug: 'classical_instrumental_non_percussion' },
      { name: 'Group Song (Indian)', slug: 'group_song_indian' },
      { name: 'Group Song (Western)', slug: 'group_song_western' },
      { name: 'Folk Orchestra', slug: 'folk_orchestra' },
    ],
  },
  {
    label: 'Dance Events',
    icon: '💃',
    color: '#a78bfa',
    events: [
      { name: 'Classical Dance Solo', slug: 'classical_dance_solo' },
      { name: 'Folk / Tribal Dance', slug: 'folk_tribal_dance' },
    ],
  },
  {
    label: 'Theatre Events',
    icon: '🎭',
    color: '#fb923c',
    events: [
      { name: 'Mime', slug: 'mime' },
      { name: 'Mimicry', slug: 'mimicry' },
      { name: 'One Act Play', slug: 'one_act_play' },
      { name: 'Skits', slug: 'skits' },
    ],
  },
  {
    label: 'Literary Events',
    icon: '📚',
    color: '#34d399',
    events: [
      { name: 'Debate', slug: 'debate' },
      { name: 'Elocution', slug: 'elocution' },
      { name: 'Quiz', slug: 'quiz' },
    ],
  },
  {
    label: 'Fine Arts Events',
    icon: '🎨',
    color: '#fbbf24',
    events: [
      { name: 'Cartooning', slug: 'cartooning' },
      { name: 'Clay Modelling', slug: 'clay_modelling' },
      { name: 'Collage Making', slug: 'collage_making' },
      { name: 'Installation', slug: 'installation' },
      { name: 'On-Spot Painting', slug: 'on_spot_painting' },
      { name: 'Poster Making', slug: 'poster_making' },
      { name: 'Rangoli', slug: 'rangoli' },
      { name: 'Spot Photography', slug: 'spot_photography' },
    ],
  },
];

// ── Role chip ─────────────────────────────────────────────────────────────────
function RoleChip({ type }) {
  const map = {
    participant: { label: 'Participant', bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    accompanist: { label: 'Accompanist', bg: 'rgba(192,132,252,0.12)', color: '#c084fc', border: 'rgba(192,132,252,0.25)' },
    technical_support: { label: 'Tech Support', bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  };
  const m = map[type] || map.participant;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
    }}>
      {m.label}
    </span>
  );
}

// ── Person row ────────────────────────────────────────────────────────────────
function PersonRow({ person, type }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{person.full_name}</div>
        {person.usn && <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', fontFamily: 'monospace' }}>{person.usn}</div>}
      </div>
      <RoleChip type={type} />
    </div>
  );
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
function EventSheet({ eventName, data, loading, error, onClose }) {
  const participants      = data?.participants || [];
  const accompanists      = data?.accompanists || [];
  const technical_support = data?.technical_support || [];
  const total = participants.length + accompanists.length + technical_support.length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0d1424',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px 20px 0 0',
        zIndex: 201,
        maxHeight: '80dvh',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '0 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{eventName}</div>
              {!loading && !error && (
                <div style={{ fontSize: 12, color: 'rgba(241,245,249,0.4)', marginTop: 3 }}>
                  {total} registered
                  {participants.length > 0 && ` · ${participants.length} participants`}
                  {accompanists.length > 0 && ` · ${accompanists.length} accomp.`}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(241,245,249,0.6)',
                borderRadius: 20, width: 30, height: 30, cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', WebkitOverflowScrolling: 'touch' }}>
          {loading && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(241,245,249,0.4)', fontSize: 14 }}>
              Loading…
            </div>
          )}

          {error && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && total === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(241,245,249,0.35)', fontSize: 14 }}>
              No participants registered for this event.
            </div>
          )}

          {!loading && !error && participants.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SectionHeader label="Participants" count={participants.length} />
              {participants.map((p, i) => <PersonRow key={i} person={p} type="participant" />)}
            </div>
          )}

          {!loading && !error && accompanists.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SectionHeader label="Accompanists" count={accompanists.length} />
              {accompanists.map((p, i) => <PersonRow key={i} person={p} type="accompanist" />)}
            </div>
          )}

          {!loading && !error && technical_support.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <SectionHeader label="Technical Support" count={technical_support.length} />
              {technical_support.map((p, i) => <PersonRow key={i} person={p} type="technical_support" />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 4,
      fontSize: 11, fontWeight: 700, color: 'rgba(241,245,249,0.4)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>
      <span>{label}</span>
      <span style={{
        background: 'rgba(255,255,255,0.08)', borderRadius: 20,
        padding: '1px 8px', fontSize: 10,
      }}>{count}</span>
    </div>
  );
}

// ── Event row ─────────────────────────────────────────────────────────────────
function EventRow({ event, color, onTap }) {
  return (
    <button
      onClick={() => onTap(event)}
      style={{
        width: '100%', textAlign: 'left',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '13px 14px',
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        color: '#f1f5f9',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600 }}>{event.name}</span>
      <span style={{ fontSize: 18, color, flexShrink: 0 }}>›</span>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CompanionEvents() {
  const navigate = useNavigate();
  const [expandedCat, setExpandedCat]   = useState(null);
  const [sheet, setSheet]               = useState(null); // { name, slug }
  const [eventCache, setEventCache]     = useState({});   // { [slug]: { participants, accompanists, technical_support } }
  const [loadingSlug, setLoadingSlug]   = useState(null);
  const [sheetError, setSheetError]     = useState('');

  const openEvent = useCallback(async (event) => {
    setSheet({ name: event.name, slug: event.slug });
    setSheetError('');

    if (eventCache[event.slug]) return; // already cached

    setLoadingSlug(event.slug);
    try {
      const res  = await apiFetch('/api/manager/assign-events', { action: 'fetch', event_slug: event.slug });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/manager', { replace: true });
        return;
      }
      const data = await res.json();
      if (data.success) {
        setEventCache(prev => ({ ...prev, [event.slug]: data.data }));
      } else {
        setSheetError(data.error || 'Failed to load event data.');
      }
    } catch {
      setSheetError('Network error. Please try again.');
    } finally {
      setLoadingSlug(null);
    }
  }, [eventCache, navigate]);

  const closeSheet = () => {
    setSheet(null);
    setSheetError('');
  };

  return (
    <CompanionLayout>
      <div style={{ padding: '24px 18px 8px' }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Events</div>
          <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.4)', marginTop: 4 }}>
            Tap an event to see your registered participants
          </div>
        </div>

        {/* Categories */}
        {EVENT_CATEGORIES.map((cat) => {
          const isOpen = expandedCat === cat.label;
          return (
            <div key={cat.label} style={{ marginBottom: 12 }}>
              {/* Category header */}
              <button
                onClick={() => setExpandedCat(isOpen ? null : cat.label)}
                style={{
                  width: '100%', textAlign: 'left',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid rgba(255,255,255,0.09)`,
                  borderRadius: 14, padding: '14px 16px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: '#f1f5f9',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.4)', marginTop: 1 }}>
                      {cat.events.length} events
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 18,
                  color: cat.color,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                }}>›</span>
              </button>

              {/* Events list */}
              {isOpen && (
                <div style={{
                  marginTop: 6, marginLeft: 8,
                  paddingLeft: 10,
                  borderLeft: `2px solid ${cat.color}40`,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {cat.events.map(ev => (
                    <EventRow key={ev.slug} event={ev} color={cat.color} onTap={openEvent} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ height: 12 }} />
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <EventSheet
          eventName={sheet.name}
          data={eventCache[sheet.slug]}
          loading={loadingSlug === sheet.slug}
          error={sheetError}
          onClose={closeSheet}
        />
      )}
    </CompanionLayout>
  );
}
