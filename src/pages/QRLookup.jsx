/**
 * QRLookup.jsx — Public, no-login QR lookup page.
 * Displays the result as an ID card identical to the Dev Dashboard card design.
 */

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';

const API = 'https://api.vtufest2026.acharyahabba.com/api/shared/qr-lookup';

const TYPE_META = {
    STUDENT:      { label: 'Student',      color: '#60a5fa', dot: '#3b82f6' },
    ACCOMPANIST:  { label: 'Accompanist',  color: '#c084fc', dot: '#a855f7' },
    TEAM_MANAGER: { label: 'Team Manager', color: '#fbbf24', dot: '#f59e0b' },
};

// ── ID Card ──────────────────────────────────────────────────────────────────
function IDCard({ p }) {
    const meta = TYPE_META[p.person_type] || { label: p.person_type, color: '#94a3b8', dot: '#64748b' };
    const qrSize = Math.min(120, window.innerWidth * 0.28);

    return (
        <div style={{
            width: '100%',
            background: 'linear-gradient(160deg, #0f172a 0%, #1a1f3a 100%)',
            borderRadius: 18,
            overflow: 'hidden',
            border: '2px solid #334155',
            boxShadow: '0 0 0 4px rgba(129,140,248,0.15), 0 24px 60px rgba(0,0,0,0.6)',
            fontFamily: "'Segoe UI', 'Inter', 'Outfit', sans-serif",
        }}>

            {/* ── Header stripe ── */}
            <div style={{
                background: 'linear-gradient(90deg, #1e3a5f, #312e81)',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(129,140,248,0.3)',
            }}>
                <img src="/main.webp" alt="VTU Habba" style={{ height: 44, objectFit: 'contain' }} />
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#a5b4fc', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em' }}>
                        VTU HABBA 2026
                    </div>
                    <div style={{ color: 'rgba(165,180,252,0.6)', fontSize: 10, marginTop: 2 }}>
                        Participant ID Card
                    </div>
                </div>
            </div>

            {/* ── Card body ── */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>

                {/* QR block */}
                <div style={{
                    padding: '20px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRight: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minWidth: qrSize + 28,
                    flexShrink: 0,
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 10,
                        padding: 6,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <QRCode
                            value={p.qr_code}
                            size={qrSize}
                            level="M"
                            style={{ display: 'block' }}
                        />
                    </div>
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: '#818cf8',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        background: 'rgba(129,140,248,0.1)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(129,140,248,0.25)',
                        textAlign: 'center',
                        wordBreak: 'break-all',
                    }}>
                        {p.qr_code}
                    </div>
                </div>

                {/* Details block */}
                <div style={{
                    flex: 1,
                    padding: '20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 12,
                    minWidth: 0,
                }}>
                    {/* Name */}
                    <div>
                        <div style={{ color: 'rgba(148,163,184,0.6)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                            Participant
                        </div>
                        <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {p.full_name}
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)' }} />

                    {/* College */}
                    <div>
                        <div style={{ color: 'rgba(148,163,184,0.55)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                            College
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {p.college_name || p.college_code}
                        </div>
                    </div>

                    {/* USN if present */}
                    {p.usn && (
                        <div>
                            <div style={{ color: 'rgba(148,163,184,0.55)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                                USN
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>
                                {p.usn}
                            </div>
                        </div>
                    )}

                    {/* Role chip */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(129,140,248,0.08)',
                        border: '1px solid rgba(129,140,248,0.22)',
                        borderRadius: 20,
                        padding: '4px 10px',
                        alignSelf: 'flex-start',
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ color: meta.color, fontSize: 10, fontWeight: 700 }}>{meta.label}</span>
                    </div>
                </div>
            </div>

            {/* ── Footer stripe ── */}
            <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderTop: '1px solid #1e293b',
                padding: '8px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: 9 }}>Acharya Institute of Technology · Bengaluru</span>
                <span style={{ color: 'rgba(129,140,248,0.4)', fontSize: 9 }}>vtufest2026.acharyahabba.com</span>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function QRLookup() {
    const [query, setQuery]               = useState('');
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [participants, setParticipants] = useState(null);
    const [selected, setSelected]         = useState(null);
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
        setTimeout(() => inputRef.current?.focus(), 80);
    };

    return (
        <div style={{
            minHeight: '100dvh',
            background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 55%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '28px 16px 48px',
            fontFamily: "'Outfit', 'Segoe UI', sans-serif",
            color: '#f1f5f9',
            boxSizing: 'border-box',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; }
                input::placeholder { color: rgba(255,255,255,0.32); }
                input:focus { outline: none; border-color: #d4af37 !important; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.3s ease forwards; }
            `}</style>

            {/* Header */}
            <div style={{ width: '100%', maxWidth: 440, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: '1.9rem', marginBottom: 6 }}>🎟️</div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    QR Code Lookup
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    VTU HABBA 2026 · Enter phone number or USN
                </p>
            </div>

            {/* Search */}
            <form
                onSubmit={handleSearch}
                style={{ width: '100%', maxWidth: 440, display: 'flex', gap: 8, marginBottom: 20 }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Phone number or USN (e.g. 4VV22CS001)"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    style={{
                        flex: 1, padding: '13px 16px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1.5px solid rgba(255,255,255,0.14)',
                        borderRadius: 12, color: '#fff',
                        fontSize: '0.97rem', fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                    }}
                />
                <button
                    type="submit"
                    disabled={!query.trim() || loading}
                    style={{
                        padding: '13px 22px',
                        background: (!query.trim() || loading) ? 'rgba(212,175,55,0.35)' : '#d4af37',
                        border: 'none', borderRadius: 12,
                        color: '#0a1628', fontWeight: 700, fontSize: '0.95rem',
                        cursor: (!query.trim() || loading) ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', minWidth: 72,
                        transition: 'background 0.2s',
                    }}
                >
                    {loading ? '…' : 'Find'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="fade-up" style={{
                    width: '100%', maxWidth: 440,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 12, padding: '13px 16px',
                    color: '#fca5a5', fontSize: '0.87rem',
                    textAlign: 'center', marginBottom: 16,
                }}>
                    {error}
                </div>
            )}

            {/* Multiple results picker */}
            {participants && !selected && (
                <div className="fade-up" style={{ width: '100%', maxWidth: 440 }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                        {participants.length} records found — select one
                    </p>
                    {participants.map((p, i) => {
                        const meta = TYPE_META[p.person_type] || { label: p.person_type, color: '#94a3b8', dot: '#64748b' };
                        return (
                            <button
                                key={i}
                                onClick={() => setSelected(p)}
                                style={{
                                    width: '100%', textAlign: 'left', marginBottom: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, padding: '13px 16px',
                                    cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 5 }}>
                                    {p.full_name}
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)' }}>
                                        {p.college_code}
                                    </span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        background: 'rgba(129,140,248,0.1)',
                                        border: '1px solid rgba(129,140,248,0.2)',
                                        borderRadius: 20, padding: '2px 9px',
                                    }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
                                        <span style={{ color: meta.color, fontSize: '0.7rem', fontWeight: 700 }}>{meta.label}</span>
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                    <button onClick={reset} style={ghostBtnStyle}>Clear</button>
                </div>
            )}

            {/* ID Card display */}
            {selected && (
                <div className="fade-up" style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <IDCard p={selected} />
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
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: 'rgba(255,255,255,0.55)',
    fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
};
