import { useState, useRef, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const API = `${API_BASE}/api/admin/find`;

// ─── Shared style helpers ────────────────────────────────────────────────────

const chip = (bg, color, border, text) => (
    <span style={{
        background: bg, color, border: `1px solid ${border}`,
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
        whiteSpace: "nowrap",
    }}>{text}</span>
);

// ─── QR Search sub-components ────────────────────────────────────────────────

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
                background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
            }}>{accType}</span>
        );
    }
    if (isTeamManager) {
        badges.push(
            <span key="mgr" style={{
                background: "rgba(16,185,129,0.2)", color: "#34d399",
                border: "1px solid rgba(16,185,129,0.4)",
                borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginLeft: 6,
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

    const fetchSAS = async () => {
        setLoading(true); setErr(null);
        const token = localStorage.getItem("vtufest_admin_token");
        try {
            const r = await adminFetch(`${API}/sas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ blob_url: doc.url }),
            });
            const data = await r.json();
            if (!r.ok || !data.success) throw new Error(data.message || "Failed");
            setSasUrl(data.data.sas_url);
            window.dispatchEvent(new CustomEvent("openDocModal", { detail: data.data.sas_url }));
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
                        <button onClick={() => window.dispatchEvent(new CustomEvent("openDocModal", { detail: sasUrl }))} style={{ fontSize: 11, color: "#818cf8", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Open ↗</button>
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
            {sasUrl && <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>⏱ Expires in 15 minutes</p>}
        </div>
    );
}

function StudentDocsCell({ documents }) {
    const [loading, setLoading] = useState(null);

    const openDoc = async (url, key) => {
        setLoading(key);
        const token = localStorage.getItem("vtufest_admin_token");
        try {
            const r = await adminFetch(`${API}/sas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ blob_url: url }),
            });
            const data = await r.json();
            if (!r.ok || !data.success) throw new Error(data.message || "Failed");
            window.dispatchEvent(new CustomEvent("openDocModal", { detail: data.data.sas_url }));
        } catch (e) {
            alert("Failed to open document: " + e.message);
        } finally {
            setLoading(null);
        }
    };

    if (!documents || documents.length === 0) return <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>;

    return (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "180px" }}>
            {documents.map((d, i) => (
                <button
                    key={i}
                    onClick={() => openDoc(d.url, d.key)}
                    disabled={loading === d.key}
                    style={{
                        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                        color: "#a5b4fc", borderRadius: "4px", padding: "2px 6px",
                        fontSize: "0.72rem", cursor: loading === d.key ? "wait" : "pointer",
                        whiteSpace: "nowrap"
                    }}
                >
                    {loading === d.key ? "…" : d.label}
                </button>
            ))}
        </div>
    );
}

function InfoCell({ label, value, mono }) {
    if (!value && value !== 0) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
            <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
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
                <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>{title}</h3>
                {badge}
            </div>
            {children}
        </div>
    );
}

// ─── Browse-by-College helpers ───────────────────────────────────────────────

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const tdStyle = (align = "left", extra = {}) => ({
    padding: "12px 14px",
    textAlign: align,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
    ...extra,
});

const thStyle = (align = "left") => ({
    padding: "12px 14px",
    textAlign: align,
    color: "var(--text-muted)",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    whiteSpace: "nowrap",
    background: "rgba(15,23,42,0.97)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 2,
});

// ─── Document Modal Viewer ────────────────────────────────────────────────────
const DocumentModal = () => {
    const [url, setUrl] = useState(null);
    const [isPdf, setIsPdf] = useState(false);

    useEffect(() => {
        const handleOpen = (e) => {
            const docUrl = e.detail;
            setUrl(docUrl);
            setIsPdf(docUrl ? docUrl.toLowerCase().includes(".pdf") : false);
        };
        window.addEventListener("openDocModal", handleOpen);
        return () => window.removeEventListener("openDocModal", handleOpen);
    }, []);

    if (!url) return null;

    return (
        <div
            onClick={() => setUrl(null)}
            style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", width: "100%", maxWidth: "800px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden" }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontWeight: 600, color: "#f1f5f9", display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "1.05rem" }}>📄 Document Viewer</span>
                        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "4px 12px", borderRadius: "100px", textDecoration: "none", fontWeight: 700, letterSpacing: "0.2px", border: "1px solid rgba(96,165,250,0.3)" }}>Open in new tab ↗</a>
                    </div>
                    <button onClick={() => setUrl(null)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", cursor: "pointer", fontSize: "1.2rem", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>×</button>
                </div>
                <div style={{ padding: "8px", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.4)", minHeight: "400px", overflow: "hidden", position: "relative" }}>
                    {isPdf ? (
                        <iframe
                            src={url}
                            style={{ width: "100%", height: "100%", border: "none", background: "#fff", borderRadius: "6px" }}
                            title="Document Preview"
                        />
                    ) : (
                        <img
                            src={url}
                            alt="Document"
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "6px" }}
                            onError={() => setIsPdf(true)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminFindPerson() {

    // ── Tab state ──
    const [view, setView] = useState("qr"); // 'qr' | 'colleges' | 'students'

    // ── QR Search state ──
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState(null);
    const inputRef = useRef(null);

    // ── Browse by College state ──
    const [colleges, setColleges] = useState([]);
    const [collegesLoading, setCollegesLoading] = useState(false);
    const [collegesErr, setCollegesErr] = useState(null);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [selectedCollege, setSelectedCollege] = useState(null); // { college, students, total }
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsErr, setStudentsErr] = useState(null);
    const debounceRef = useRef(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { Authorization: `Bearer ${token}` };

    // ── QR Search ──
    const search = async (e) => {
        e?.preventDefault();
        const qr = query.trim();
        if (!qr) return;
        setLoading(true); setErr(null); setResult(null);
        try {
            const r = await adminFetch(`${API}/person?qr=${encodeURIComponent(qr)}`, { headers });
            const data = await r.json();
            if (!r.ok || !data.success) throw new Error(data.message || "Not found");
            setResult(data.data);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    };

    const clearQR = () => {
        setQuery(""); setResult(null); setErr(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // ── Fetch colleges (with optional search) ──
    const fetchColleges = useCallback((searchVal = "") => {
        setCollegesLoading(true);
        setCollegesErr(null);
        const url = searchVal
            ? `${API_BASE}/api/admin/find/colleges?search=${encodeURIComponent(searchVal)}`
            : `${API_BASE}/api/admin/find/colleges`;
        adminFetch(url, { headers })
            .then(r => r.json())
            .then(d => {
                if (d.success) setColleges(d.data?.colleges || []);
                else setCollegesErr(d.message || "Failed to load colleges");
            })
            .catch(() => setCollegesErr("Network error — could not load colleges"))
            .finally(() => setCollegesLoading(false));
    }, [token]);

    // Fetch colleges when switching to colleges tab
    useEffect(() => {
        if (view === "colleges" && colleges.length === 0) {
            fetchColleges();
        }
    }, [view]);

    // Debounced search
    const handleCollegeSearch = (val) => {
        setCollegeSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchColleges(val), 300);
    };

    // ── Fetch students for a college ──
    const fetchStudents = (college) => {
        setView("students");
        setStudentsLoading(true);
        setStudentsErr(null);
        setSelectedCollege(null);
        adminFetch(`${API_BASE}/api/admin/find/college/${college.college_id}/students`, { headers })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setSelectedCollege({
                        college: d.data.college,
                        students: d.data.students || [],
                        total: d.data.total,
                    });
                } else {
                    setStudentsErr(d.message || "Failed to load students");
                }
            })
            .catch(() => setStudentsErr("Network error — could not load students"))
            .finally(() => setStudentsLoading(false));
    };

    const backToColleges = () => {
        setView("colleges");
        setSelectedCollege(null);
        setStudentsErr(null);
    };

    // ── QR result destructure ──
    const { participant: p, college: qrCollege, events, documents } = result || {};

    const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 };

    // ── Tab button style ──
    const tabBtn = (active) => ({
        padding: "9px 20px",
        borderRadius: "8px",
        border: `1px solid ${active ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)"}`,
        background: active ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
        color: active ? "#a5b4fc" : "#94a3b8",
        fontWeight: 700,
        fontSize: "0.85rem",
        cursor: "pointer",
        transition: "all 0.15s",
    });

    return (
        <AdminLayout>
            <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto", color: "#e2e8f0" }}>

                {/* ── Page Header ── */}
                <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>🔍 Find Person</h1>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
                    Search participants by QR code, or browse students by college.
                </p>

                {/* ── Tab Toggle ── */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                    <button style={tabBtn(view === "qr")} onClick={() => setView("qr")}>
                        🔍 Search by QR
                    </button>
                    <button style={tabBtn(view === "colleges" || view === "students")} onClick={() => {
                        setView("colleges");
                        if (colleges.length === 0) fetchColleges();
                    }}>
                        🏫 Browse by College
                    </button>
                </div>

                {/* ════════════════════════════════════════
                    QR SEARCH TAB
                ════════════════════════════════════════ */}
                {view === "qr" && (
                    <>
                        <form onSubmit={search} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <span style={{
                                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                                    fontSize: 16, pointerEvents: "none",
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
                                <button type="button" onClick={clearQR} style={{
                                    background: "rgba(255,255,255,0.06)", color: "#94a3b8",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer",
                                }}>Clear</button>
                            )}
                        </form>

                        {err && (
                            <div style={{
                                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#f87171", fontSize: 13,
                            }}>⚠ {err}</div>
                        )}

                        {!loading && !result && !err && (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                                <p style={{ margin: 0, fontSize: 14 }}>Enter a QR code above to look up a participant.</p>
                            </div>
                        )}

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

                        {result && p && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                {/* Identity */}
                                <div style={{
                                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 14, overflow: "hidden",
                                }}>
                                    <div style={{
                                        background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)",
                                        padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                                        flexWrap: "wrap", gap: 10,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>{p.full_name}</div>
                                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontFamily: "monospace" }}>
                                                QR: <span style={{ color: "#818cf8" }}>{p.qr_code}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <PersonBadge personType={p.person_type} accompanistType={p.accompanist_type} isTeamManager={p.is_team_manager} />
                                            {qrCollege && (
                                                <span style={{
                                                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#cbd5e1",
                                                }}>{qrCollege.college_name}</span>
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

                                {/* College */}
                                {qrCollege && (
                                    <Section title="🏛 College">
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 16 }}>
                                            <InfoCell label="College Name" value={qrCollege.college_name} />
                                            <InfoCell label="Code" value={qrCollege.college_code} mono />
                                            <InfoCell label="Place" value={qrCollege.place} />
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Lock Status</span>
                                                <LockBadge isLocked={qrCollege.is_final_approved} />
                                            </div>
                                        </div>
                                    </Section>
                                )}

                                {/* Events */}
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
                                        <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>Not assigned to any specific events.</p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                                            {events.map((ev, i) => (
                                                <div key={i} style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                                                    borderRadius: 8, padding: "8px 12px",
                                                }}>
                                                    <span style={{ fontSize: 13, color: "#cbd5e1" }}>
                                                        {ev.event_name.replace(/^event_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                                    </span>
                                                    <RoleBadge role={ev.role} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Section>

                                {/* Documents */}
                                {documents && documents.length > 0 && (
                                    <Section title="📎 Documents">
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                                            {documents.map((doc, i) => <DocCard key={i} doc={doc} />)}
                                        </div>
                                    </Section>
                                )}

                                {/* Read-only notice */}
                                <div style={{
                                    background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                                    borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#94a3b8",
                                }}>
                                    ℹ This is a read-only view. Only officially finalised participants can be looked up here.
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════
                    BROWSE BY COLLEGE TAB — College List
                ════════════════════════════════════════ */}
                {view === "colleges" && (
                    <>
                        {/* Search bar (same style as AdminColleges) */}
                        <div style={{ marginBottom: "16px", position: "relative" }}>
                            <span style={{
                                position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                                color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none",
                            }}>🔍</span>
                            <input
                                placeholder="Search by college name, code or place…"
                                value={collegeSearch}
                                onChange={(e) => handleCollegeSearch(e.target.value)}
                                style={{
                                    width: "100%", boxSizing: "border-box",
                                    padding: "11px 16px 11px 40px",
                                    background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: "10px",
                                    color: "#f1f5f9", fontSize: "0.92rem", outline: "none",
                                }}
                            />
                            {collegeSearch && (
                                <button
                                    onClick={() => { setCollegeSearch(""); fetchColleges(""); }}
                                    style={{
                                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem",
                                    }}
                                >✕</button>
                            )}
                        </div>

                        {collegesErr && (
                            <div style={{
                                background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171",
                                padding: "12px 16px", borderRadius: "8px", marginBottom: "14px",
                            }}>{collegesErr}</div>
                        )}

                        {collegesLoading ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading colleges…
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    overflowY: "auto", overflowX: "auto",
                                    border: "1px solid rgba(255,255,255,0.09)",
                                    borderRadius: "14px", background: "rgba(255,255,255,0.03)",
                                    scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent",
                                    maxHeight: "65vh",
                                }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                                        <thead>
                                            <tr>
                                                {["College Name", "Code", "Place", "Registered Students", "Lock Status", ""].map((h, i) => (
                                                    <th key={i} style={thStyle(i >= 3 ? "center" : "left")}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {colleges.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                                        {collegeSearch ? `No colleges matching "${collegeSearch}"` : "No colleges found"}
                                                    </td>
                                                </tr>
                                            ) : colleges.map((c) => {
                                                const isLocked = c.is_final_approved;
                                                const count = Number(c.student_count || 0);
                                                return (
                                                    <tr
                                                        key={c.college_id}
                                                        style={{ transition: "background 0.15s" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        {/* College Name */}
                                                        <td style={tdStyle("left")}>
                                                            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>
                                                                {c.college_name}
                                                            </span>
                                                        </td>
                                                        {/* Code */}
                                                        <td style={tdStyle("left")}>
                                                            <code style={{ color: "var(--text-muted)", fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>
                                                                {c.college_code}
                                                            </code>
                                                        </td>
                                                        {/* Place */}
                                                        <td style={tdStyle("left", { color: "var(--text-secondary)", fontSize: "0.85rem" })}>
                                                            {c.place || "—"}
                                                        </td>
                                                        {/* Student count */}
                                                        <td style={tdStyle("center")}>
                                                            <span style={{
                                                                color: count === 0 ? "var(--text-muted)" : "#60a5fa",
                                                                fontWeight: count === 0 ? 400 : 700,
                                                                fontSize: "0.95rem",
                                                            }}>
                                                                {count === 0 ? "0 students" : count}
                                                            </span>
                                                        </td>
                                                        {/* Lock status */}
                                                        <td style={tdStyle("center")}>
                                                            {isLocked
                                                                ? chip("rgba(16,185,129,0.15)", "#34d399", "rgba(16,185,129,0.35)", "✅ Locked")
                                                                : chip("rgba(245,158,11,0.15)", "#f59e0b", "rgba(245,158,11,0.35)", "🔓 Open")
                                                            }
                                                        </td>
                                                        {/* Action */}
                                                        <td style={tdStyle("center")}>
                                                            <button
                                                                onClick={() => fetchStudents(c)}
                                                                style={{
                                                                    padding: "5px 14px",
                                                                    background: "rgba(99,102,241,0.15)",
                                                                    border: "1px solid rgba(99,102,241,0.4)",
                                                                    color: "#a5b4fc",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    fontSize: "0.78rem",
                                                                    fontWeight: 700,
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                View Students →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {colleges.length > 0 && (
                                    <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                                        {colleges.length} college{colleges.length !== 1 ? "s" : ""}
                                        {collegeSearch && ` · filtered by "${collegeSearch}"`}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════
                    BROWSE BY COLLEGE TAB — Student List
                ════════════════════════════════════════ */}
                {view === "students" && (
                    <>
                        {/* Back header */}
                        <div style={{ marginBottom: "18px" }}>
                            <button
                                onClick={backToColleges}
                                style={{
                                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                                    color: "#94a3b8", borderRadius: "7px", padding: "6px 14px",
                                    cursor: "pointer", fontSize: "0.82rem", marginBottom: "14px",
                                }}
                            >
                                ← Back to Colleges
                            </button>

                            {selectedCollege && (
                                <div style={{
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "12px", padding: "14px 18px",
                                    display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
                                }}>
                                    <code style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", padding: "4px 10px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700 }}>
                                        {selectedCollege.college.college_code}
                                    </code>
                                    <div>
                                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>
                                            {selectedCollege.college.college_name}
                                        </div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>
                                            {selectedCollege.college.place}{" "}
                                            {selectedCollege.college.is_final_approved
                                                ? chip("rgba(16,185,129,0.15)", "#34d399", "rgba(16,185,129,0.35)", "✅ Locked")
                                                : chip("rgba(245,158,11,0.15)", "#f59e0b", "rgba(245,158,11,0.35)", "🔓 Open")
                                            }
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                        <div style={{ color: "#60a5fa", fontWeight: 800, fontSize: "1.4rem" }}>{selectedCollege.total}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Students Registered</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {studentsErr && (
                            <div style={{
                                background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171",
                                padding: "12px 16px", borderRadius: "8px", marginBottom: "14px",
                            }}>{studentsErr}</div>
                        )}

                        {studentsLoading ? (
                            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading students…
                            </div>
                        ) : selectedCollege && (
                            selectedCollege.students.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                                    <p style={{ margin: 0, fontSize: 14 }}>No students registered for this college yet.</p>
                                </div>
                            ) : (
                                <div style={{
                                    overflowY: "auto", overflowX: "auto",
                                    border: "1px solid rgba(255,255,255,0.09)",
                                    borderRadius: "14px", background: "rgba(255,255,255,0.03)",
                                    scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent",
                                    maxHeight: "60vh",
                                }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "780px" }}>
                                        <thead>
                                            <tr>
                                                {["Internal ID", "Full Name", "USN", "Department", "Documents", "Account", "Registered On"].map((h, i) => (
                                                    <th key={i} style={thStyle(i === 0 ? "center" : "left")}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedCollege.students.map((s, idx) => {
                                                const inactive = s.is_active === false;
                                                return (
                                                    <tr
                                                        key={s.id}
                                                        style={{ opacity: inactive ? 0.5 : 1, transition: "background 0.15s" }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        <td style={tdStyle("center", { color: "var(--text-muted)", fontSize: "0.82rem" })}>
                                                            #{s.id}
                                                        </td>
                                                        <td style={tdStyle("left")}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>
                                                                    {s.full_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={tdStyle("left")}>
                                                            <code style={{ color: "var(--text-muted)", fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>
                                                                {s.usn || "—"}
                                                            </code>
                                                        </td>
                                                        <td style={tdStyle("left", { color: "var(--text-secondary)", fontSize: "0.83rem" })}>
                                                            {s.department || "—"}
                                                        </td>
                                                        <td style={tdStyle("left")}>
                                                            <StudentDocsCell documents={s.documents} />
                                                        </td>
                                                        <td style={tdStyle("left")}>
                                                            {inactive ?
                                                                chip("rgba(239,68,68,0.15)", "#f87171", "rgba(239,68,68,0.35)", "Inactive") :
                                                                chip("rgba(16,185,129,0.15)", "#34d399", "rgba(16,185,129,0.35)", "✅ Active")
                                                            }
                                                        </td>
                                                        <td style={tdStyle("left", { color: "var(--text-muted)", fontSize: "0.78rem" })}>
                                                            {fmtDate(s.created_at)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </>
                )}

                <DocumentModal />

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