import { useState, useRef } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const API = `${API_BASE}/api/admin/find`;

function PersonBadge({ personType, accompanistType, isTeamManager }) {
    const badges = [];

    if (personType === "STUDENT") {
        badges.push(
            <span key="type" style={{
                background: "rgba(99,102,241,0.25)", color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.4)",
                borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
            }}>STUDENT</span>
        );
    } else {
        const accType = (accompanistType || "professional").toUpperCase();
        const styleMap = {
            FACULTY: { bg: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "rgba(251,191,36,0.4)" },
            PROFESSIONAL: { bg: "rgba(168,85,247,0.2)", color: "#c084fc", border: "rgba(168,85,247,0.4)" },
        };
        const s = styleMap[accType] || styleMap["PROFESSIONAL"];
        badges.push(
            <span key="type" style={{
                background: s.bg, color: s.color,
                border: `1px solid ${s.border}`,
                borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
            }}>{accType}</span>
        );
    }

    if (isTeamManager) {
        badges.push(
            <span key="mgr" style={{
                background: "rgba(16,185,129,0.2)", color: "#34d399",
                border: "1px solid rgba(16,185,129,0.4)",
                borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
                marginLeft: 6,
            }}>⭐ TEAM MANAGER</span>
        );
    }

    return <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{badges}</div>;
}

function RoleBadge({ role }) {
    const isP = role === "PARTICIPANT";
    return (
        <span style={{
            background: isP ? "rgba(16,185,129,0.2)" : "rgba(251,191,36,0.2)",
            color: isP ? "#34d399" : "#fbbf24",
            border: `1px solid ${isP ? "rgba(16,185,129,0.4)" : "rgba(251,191,36,0.4)"}`,
            borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700,
        }}>{role}</span>
    );
}

function LockBadge({ isLocked }) {
    return (
        <span style={{
            background: isLocked ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            color: isLocked ? "#34d399" : "#f87171",
            border: `1px solid ${isLocked ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
            borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600,
        }}>{isLocked ? "🔒 Locked" : "🔓 Open"}</span>
    );
}

function DocCard({ doc }) {
    const [sasUrl, setSasUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const [imgErr, setImgErr] = useState(false);

    const fetchSAS = async () => {
        setLoading(true); setErr(null); setImgErr(false);
        const token = localStorage.getItem("vtufest_admin_token");
        try {
            const r = await adminFetch(`${API}/sas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ blob_url: doc.url }),
            });
            const data = await r.json();
            if (!r.ok || !data.success) throw new Error(data.message || "Failed");
            setSasUrl(data.data.sas_url);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>📄 {doc.label}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {sasUrl && (
                        <a href={sasUrl} target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, color: "#818cf8", textDecoration: "underline" }}>Open ↗</a>
                    )}
                    <button onClick={fetchSAS} disabled={loading} style={{
                        background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
                        border: "1px solid rgba(99,102,241,0.35)",
                        borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer",
                        opacity: loading ? 0.6 : 1,
                    }}>
                        {loading ? "…" : sasUrl ? "Refresh" : "View"}
                    </button>
                </div>
            </div>
            {err && <p style={{ color: "#f87171", fontSize: 11, margin: 0 }}>⚠ {err}</p>}
            {sasUrl && !imgErr && (
                <img src={sasUrl} alt={doc.label} onError={() => setImgErr(true)}
                    style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 6 }} />
            )}
            {sasUrl && imgErr && (
                <div style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "12px 0",
                    textAlign: "center", fontSize: 12, color: "#94a3b8"
                }}>
                    📎 PDF —{" "}
                    <a href={sasUrl} target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>open in new tab</a>
                </div>
            )}
            {sasUrl && <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>⏱ Expires in 15 minutes</p>}
        </div>
    );
}

function InfoCell({ label, value, mono }) {
    if (!value && value !== 0) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
            <span style={{
                fontSize: 13, color: "#e2e8f0", fontWeight: 500,
                fontFamily: mono ? "monospace" : "inherit"
            }}>{value}</span>
        </div>
    );
}

function Section({ title, children, badge }) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: 18,
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{
                    margin: 0, fontSize: 12, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: 1
                }}>{title}</h3>
                {badge}
            </div>
            {children}
        </div>
    );
}

export default function AdminFindPerson() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState(null);
    const inputRef = useRef(null);

    const token = localStorage.getItem("vtufest_admin_token");

    const search = async (e) => {
        e?.preventDefault();
        const qr = query.trim();
        if (!qr) return;
        setLoading(true); setErr(null); setResult(null);
        try {
            const r = await adminFetch(`${API}/person?qr=${encodeURIComponent(qr)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await r.json();
            if (!r.ok || !data.success) throw new Error(data.message || "Not found");
            setResult(data.data);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setQuery(""); setResult(null); setErr(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const { participant: p, college, events, documents } = result || {};

    const grid = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 16,
    };

    return (
        <AdminLayout>
            <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto", color: "#e2e8f0" }}>

                <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>🔍 Find Person</h1>
                <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>
                    Scan or enter the QR code to look up a finalised participant.
                </p>

                {/* Search */}
                <form onSubmit={search} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <span style={{
                            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                            fontSize: 16, pointerEvents: "none"
                        }}>🔍</span>
                        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                            placeholder="Enter QR code (e.g. AVHHDL04)" autoFocus
                            style={{
                                width: "100%", boxSizing: "border-box",
                                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: 8, padding: "10px 12px 10px 38px",
                                color: "#f1f5f9", fontSize: 14, fontFamily: "monospace", outline: "none",
                            }} />
                    </div>
                    <button type="submit" disabled={!query.trim() || loading} style={{
                        background: "rgba(99,102,241,0.25)", color: "#a5b4fc",
                        border: "1px solid rgba(99,102,241,0.4)",
                        borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600,
                        cursor: !query.trim() || loading ? "not-allowed" : "pointer",
                        opacity: !query.trim() || loading ? 0.5 : 1,
                    }}>{loading ? "Searching…" : "Search"}</button>
                    {(result || err) && (
                        <button type="button" onClick={clear} style={{
                            background: "rgba(255,255,255,0.06)", color: "#94a3b8",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer",
                        }}>Clear</button>
                    )}
                </form>

                {/* Error */}
                {err && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 13,
                    }}>⚠ {err}</div>
                )}

                {/* Empty state */}
                {!loading && !result && !err && (
                    <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                        <p style={{ margin: 0, fontSize: 14 }}>Enter a QR code above to look up a participant.</p>
                    </div>
                )}

                {/* Skeleton */}
                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[120, 80, 100].map((h, i) => (
                            <div key={i} style={{
                                height: h, borderRadius: 12, background: "rgba(255,255,255,0.04)",
                                animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                        ))}
                    </div>
                )}

                {/* Results */}
                {result && p && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* 1. Identity */}
                        <div style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 14, overflow: "hidden",
                        }}>
                            <div style={{
                                background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                                padding: "14px 18px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                flexWrap: "wrap", gap: 10,
                            }}>
                                <div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>{p.full_name}</div>
                                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontFamily: "monospace" }}>
                                        QR: <span style={{ color: "#818cf8" }}>{p.qr_code}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <PersonBadge
                                        personType={p.person_type}
                                        accompanistType={p.accompanist_type}
                                        isTeamManager={p.is_team_manager}
                                    />
                                    {college && (
                                        <span style={{
                                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#cbd5e1",
                                        }}>{college.college_name}</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ padding: 18 }}>
                                <div style={grid}>
                                    {p.usn && <InfoCell label="USN" value={p.usn} mono />}
                                    <InfoCell label="Phone" value={p.phone} />
                                    <InfoCell label="Email" value={p.email} />
                                    <InfoCell label="Gender" value={p.gender} />
                                    <InfoCell label="Blood Group" value={p.blood_group} />
                                    {p.department && <InfoCell label="Department" value={p.department} />}
                                    {(p.year_of_study || p.semester) && (
                                        <InfoCell label="Year / Semester"
                                            value={[p.year_of_study && `Year ${p.year_of_study}`, p.semester && `Sem ${p.semester}`]
                                                .filter(Boolean).join(", ")} />
                                    )}
                                    <InfoCell label="Final Approved"
                                        value={p.final_approved_at ? new Date(p.final_approved_at).toLocaleString() : null} />
                                    {p.address && <InfoCell label="Address" value={p.address} />}
                                </div>
                            </div>
                        </div>

                        {/* 2. College */}
                        {college && (
                            <Section title="🏛 College">
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16 }}>
                                    <InfoCell label="College Name" value={college.college_name} />
                                    <InfoCell label="Code" value={college.college_code} mono />
                                    <InfoCell label="Place" value={college.place} />
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                            Lock Status
                                        </span>
                                        <LockBadge isLocked={college.is_final_approved} />
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* 3. Events */}
                        <Section
                            title="🎭 Event Participation"
                            badge={
                                <span style={{
                                    background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
                                    border: "1px solid rgba(99,102,241,0.35)",
                                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                                }}>
                                    {events.length} event{events.length !== 1 ? "s" : ""}
                                </span>
                            }
                        >
                            {events.length === 0 ? (
                                <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>
                                    Not assigned to any specific events.
                                </p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                                    {events.map((ev, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                            borderRadius: 8, padding: "8px 12px",
                                        }}>
                                            <span style={{ fontSize: 13, color: "#cbd5e1" }}>
                                                {ev.event_name
                                                    .replace(/^event_/, "")
                                                    .replace(/_/g, " ")
                                                    .replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                            <RoleBadge role={ev.role} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* 4. Documents */}
                        {documents && documents.length > 0 && (
                            <Section title="📎 Documents">
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                    gap: 12,
                                }}>
                                    {documents.map((doc, i) => <DocCard key={i} doc={doc} />)}
                                </div>
                            </Section>
                        )}

                        {/* 5. Read-only notice */}
                        <div style={{
                            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#94a3b8",
                        }}>
                            ℹ This is a read-only view. Only officially finalised participants can be looked up here.
                        </div>

                    </div>
                )}

                <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        input::placeholder { color: #475569; }
        input:focus { border-color: rgba(99,102,241,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
            </div>
        </AdminLayout>
    );
}