/**
 * QRLookup.jsx — Public, no-login QR code display page.
 *
 * Enter a phone number or USN → fetch QR from the master table → show it big.
 * Used by reg-desk staff to pull up a participant's QR without any login.
 */

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';

const API = 'https://api.vtufest2026.acharyahabba.com/api/shared/qr-lookup';

const TYPE_LABEL = {
    STUDENT:      { text: 'Student',      bg: 'rgba(59,130,246,0.18)',  color: '#60a5fa' },
    ACCOMPANIST:  { text: 'Accompanist',  bg: 'rgba(168,85,247,0.18)', color: '#c084fc' },
    TEAM_MANAGER: { text: 'Team Manager', bg: 'rgba(245,158,11,0.18)', color: '#fbbf24' },
};

function Badge({ type }) {
    const m = TYPE_LABEL[type] || { text: type, bg: 'rgba(255,255,255,0.1)', color: '#ccc' };
    return (
        <span style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 20,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
            background: m.bg, color: m.color,
        }}>
            {m.text}
        </span>
    );
}

export default function QRLookup() {
    const [query, setQuery]           = useState('');
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [participants, setParticipants] = useState(null); // array | null
    const [selected, setSelected]     = useState(null);     // single participant
    const inputRef = useRef(null);

    const handleSearch = async (e) => {
        e?.preventDefault();
        const q = query.trim();
        if (!q) return;

        setLoading(true);
        setError('');
        setParticipants(null);
        setSelected(null);

        try {
            const res  = await fetch(`${API}?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.message || 'Not found.');
                return;
            }

            if (data.participants.length === 1) {
                setSelected(data.participants[0]);
            } else {
                setParticipants(data.participants);
            }
        } catch {
            setError('Network error. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setQuery('');
        setParticipants(null);
        setSelected(null);
        setError('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const qrSize = Math.min(260, window.innerWidth - 80);

    return (
        <div style={{
            minHeight: '100dvh',
            background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 60%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px 40px',
            fontFamily: "'Outfit', 'Segoe UI', sans-serif",
            color: '#f1f5f9',
            boxSizing: 'border-box',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                input::placeholder { color: rgba(255,255,255,0.35); }
                input:focus { outline: none; border-color: #d4af37 !important; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.3s ease; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ width: '100%', maxWidth: 420, marginBottom: 28, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 4 }}>🎟️</div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    QR Lookup
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: '0.83rem', color: 'rgba(255,255,255,0.45)' }}>
                    VTU HABBA 2026 · Enter phone or USN
                </p>
            </div>

            {/* ── Search box ── */}
            <form
                onSubmit={handleSearch}
                style={{ width: '100%', maxWidth: 420, display: 'flex', gap: 8, marginBottom: 20 }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Phone number or USN"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    style={{
                        flex: 1, padding: '13px 16px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1.5px solid rgba(255,255,255,0.15)',
                        borderRadius: 12, color: '#fff',
                        fontSize: '1rem', fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                    }}
                />
                <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    style={{
                        padding: '13px 20px',
                        background: loading ? 'rgba(212,175,55,0.4)' : '#d4af37',
                        border: 'none', borderRadius: 12,
                        color: '#0a1628', fontWeight: 700, fontSize: '0.95rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                        transition: 'background 0.2s',
                        minWidth: 72,
                    }}
                >
                    {loading ? '…' : 'Find'}
                </button>
            </form>

            {/* ── Error ── */}
            {error && (
                <div className="fade-up" style={{
                    width: '100%', maxWidth: 420,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: 12, padding: '14px 16px',
                    color: '#fca5a5', fontSize: '0.88rem',
                    textAlign: 'center', marginBottom: 16,
                }}>
                    {error}
                </div>
            )}

            {/* ── Multiple results — pick one ── */}
            {participants && !selected && (
                <div className="fade-up" style={{ width: '100%', maxWidth: 420 }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                        {participants.length} records found — select one
                    </p>
                    {participants.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setSelected(p)}
                            style={{
                                width: '100%', textAlign: 'left', marginBottom: 10,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 12, padding: '14px 16px',
                                cursor: 'pointer', color: '#fff',
                                fontFamily: 'inherit',
                            }}
                        >
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
                                {p.full_name}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                                    {p.college_code}
                                </span>
                                <Badge type={p.person_type} />
                            </div>
                        </button>
                    ))}
                    <button onClick={reset} style={ghostBtnStyle}>
                        Clear
                    </button>
                </div>
            )}

            {/* ── QR display ── */}
            {selected && (
                <div className="fade-up" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
                    {/* Name + college */}
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 14, padding: '14px 18px',
                        marginBottom: 20,
                    }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                            {selected.full_name}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                                {selected.college_code}
                            </span>
                            <Badge type={selected.person_type} />
                        </div>
                    </div>

                    {/* QR Code */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        padding: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 18,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                    }}>
                        <QRCode
                            value={selected.qr_code}
                            size={qrSize}
                            level="M"
                            style={{ display: 'block' }}
                        />
                    </div>

                    {/* QR code string */}
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, padding: '12px 16px',
                        fontFamily: 'monospace', fontSize: '1.1rem',
                        fontWeight: 700, letterSpacing: '3px',
                        color: '#d4af37', marginBottom: 20,
                    }}>
                        {selected.qr_code}
                    </div>

                    <button onClick={reset} style={ghostBtnStyle}>
                        🔍 Search Another
                    </button>
                </div>
            )}
        </div>
    );
}

const ghostBtnStyle = {
    width: '100%', padding: '13px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, color: 'rgba(255,255,255,0.6)',
    fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    marginTop: 4,
};
