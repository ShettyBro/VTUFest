import { useState, useEffect, useMemo } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

// Prettify event_snake_case → "Event Name"
const fmtEvent = (name) =>
    name.replace(/^event_/, "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// Summary stat pill
const Stat = ({ label, value, color }) => (
    <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "12px 18px",
        minWidth: "130px",
        textAlign: "center",
    }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    </div>
);

// ─── College Details Modal ───────────────────────────────────────────────────

function CollegeDetailsModal({ college, token, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/colleges/${college.id}/details`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => { if (d.success) setData(d.data); else setErr(d.message); })
            .catch(() => setErr("Network error — could not load details"))
            .finally(() => setLoading(false));
    }, [college.id]);

    // close on backdrop click
    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    const sectionTitle = (text) => (
        <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "10px", marginTop: "4px" }}>
            {text}
        </div>
    );

    const pill = (label, value, color = "#60a5fa") => (
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "12px 16px", textAlign: "center", minWidth: "100px" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{value ?? "—"}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        </div>
    );

    return (
        <div
            onClick={handleBackdrop}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "20px",
            }}
        >
            <div style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "800px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "28px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(129,140,248,0.4) transparent",
            }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "1.3rem" }}>🏫</span>
                            <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.15rem" }}>
                                {college.college_name}
                            </h2>
                            <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                                🔒 Locked
                            </span>
                        </div>
                        <div style={{ marginTop: "5px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: "4px", marginRight: "10px" }}>
                                {college.college_code}
                            </code>
                            {college.place && <span>📍 {college.place}</span>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                        ✕ Close
                    </button>
                </div>

                {loading && (
                    <div style={{ textAlign: "center", padding: "50px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>⏳</div>
                        Loading details…
                    </div>
                )}

                {err && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "14px", borderRadius: "8px" }}>
                        {err}
                    </div>
                )}

                {data && !loading && (() => {
                    const { counts, events, payment } = data;
                    const hasPaid = payment.receipts.some(r => r.status?.toLowerCase() === "verified");

                    return (
                        <>
                            {/* ── Approval info ── */}
                            {data.college.final_approved_at && (
                                <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", padding: "10px 14px", marginBottom: "20px", color: "#34d399", fontSize: "0.82rem" }}>
                                    ✅ Final approved on {fmt(data.college.final_approved_at)}
                                </div>
                            )}

                            {/* ── Participant Counts ── */}
                            {sectionTitle("👥 Participants")}
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
                                {pill("Students", counts.total_students, "#60a5fa")}
                                {pill("Accompanists", counts.total_accompanists, "#a78bfa")}
                                {pill("Faculty Acc.", counts.faculty_accompanists, "#34d399")}
                                {pill("Professional Acc.", counts.professional_accompanists, "#f59e0b")}
                                {pill("Team Managers", counts.team_managers, "#f87171")}
                                {pill("Total", Number(counts.total_students) + Number(counts.total_accompanists), "#818cf8")}
                            </div>

                            {/* ── Payment Status ── */}
                            {sectionTitle("💰 Payment")}
                            <div style={{ marginBottom: "24px" }}>
                                {payment.receipts.length === 0 ? (
                                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "12px 16px", color: "#f87171", fontSize: "0.85rem" }}>
                                        ❌ No payment receipts found for this college.
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {payment.receipts.map((r) => {
                                            const isVerified = r.status?.toLowerCase() === "verified";
                                            const isPending = r.status?.toLowerCase() === "waiting_for_verification";
                                            const statusColor = isVerified ? "#10b981" : isPending ? "#fbbf24" : "#f87171";
                                            const statusBg = isVerified ? "rgba(16,185,129,0.15)" : isPending ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)";
                                            return (
                                                <div key={r.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${isVerified ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <span style={{ fontSize: "1.1rem" }}>{isVerified ? "✅" : isPending ? "⏳" : "❌"}</span>
                                                        <div>
                                                            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>
                                                                ₹{Number(r.amount_paid).toLocaleString("en-IN")}
                                                            </div>
                                                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>
                                                                Uploaded by {r.uploaded_by_name} ({r.uploaded_by_type}) · {fmt(r.uploaded_at)}
                                                            </div>
                                                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "2px" }}>
                                                                UTR: <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>{r.utr_reference_number}</code>
                                                            </div>
                                                            {r.verified_at && (
                                                                <div style={{ color: "#34d399", fontSize: "0.72rem", marginTop: "2px" }}>
                                                                    Verified on {fmt(r.verified_at)}
                                                                </div>
                                                            )}
                                                            {r.admin_remarks && (
                                                                <div style={{ color: "#fbbf24", fontSize: "0.72rem", marginTop: "2px" }}>
                                                                    Remarks: {r.admin_remarks}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                                        <span style={{ background: statusBg, color: statusColor, padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                                            {r.status.replace(/_/g, " ").toUpperCase()}
                                                        </span>

                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div style={{ textAlign: "right", color: "#34d399", fontWeight: 700, fontSize: "0.85rem", marginTop: "4px" }}>
                                            Total Paid: ₹{payment.receipts.filter(r => r.status?.toLowerCase() === "verified").reduce((s, r) => s + Number(r.amount_paid || 0), 0).toLocaleString("en-IN")}
                                        </div>
                                    </div>
                                )}

                                {/* Pending sessions */}
                                {payment.sessions.length > 0 && (
                                    <div style={{ marginTop: "12px" }}>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Upload Sessions</div>
                                        {payment.sessions.map((s) => (
                                            <div key={s.session_id} style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
                                                <div>
                                                    <span style={{ color: "#fbbf24" }}>₹{Number(s.amount_paid).toLocaleString("en-IN")}</span>
                                                    <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>UTR: {s.utr_reference_number}</span>
                                                </div>
                                                <span style={{ color: "var(--text-muted)" }}>expires {fmt(s.expires_at)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Events ── */}
                            {sectionTitle(`🎭 Participating Events (${events.length} / 25)`)}
                            {events.length === 0 ? (
                                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "10px 0" }}>No events found in snapshot.</div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "8px", marginBottom: "8px" }}>
                                    {events.map((ev) => (
                                        <div key={ev.event_name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", padding: "10px 14px" }}>
                                            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.83rem", marginBottom: "6px" }}>
                                                {fmtEvent(ev.event_name)}
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <span style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700 }}>
                                                    👤 {ev.participants} participant{ev.participants != 1 ? "s" : ""}
                                                </span>
                                                {Number(ev.accompanists) > 0 && (
                                                    <span style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700 }}>
                                                        🎵 {ev.accompanists} acc.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}

// ─── Column Definitions ──────────────────────────────────────────────────────

const COLS = [
    { key: "college_code", label: "Code", align: "left" },
    { key: "college_name", label: "College Name", align: "left" },
    { key: "place", label: "Place", align: "left" },
    { key: "total_students", label: "Students", align: "center" },
    { key: "total_applications", label: "Applications", align: "center" },
    { key: "approved_applications", label: "Approved", align: "center" },
    { key: "participating_events", label: "Events", align: "center" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminColleges() {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState(null);
    const [sortKey, setSortKey] = useState("college_name");
    const [sortDir, setSortDir] = useState("asc");
    const [detailsCollege, setDetailsCollege] = useState(null); // college object for modal

    const token = localStorage.getItem("vtufest_admin_token");
    const isSuperAdmin = localStorage.getItem("vtufest_admin_role") === "SUPER_ADMIN";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchColleges = () => {
        setLoading(true);
        setError("");
        fetch(`${API_BASE}/api/admin/colleges`, { headers })
            .then((r) => r.json())
            .then((d) => { if (d.success) setColleges(d.data); else setError(d.message); })
            .catch(() => setError("Network error — could not fetch colleges"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchColleges(); }, []);

    const handleToggleLock = async (id) => {
        if (!isSuperAdmin) return;

        const college = colleges.find((c) => c.id === id);
        const isLocking = !college?.is_final_approved;

        if (isLocking) {
            if (!window.confirm(`Lock "${college?.college_name}"?

This will mark the college as final-approved.`)) return;
        } else {
            const confirmed = window.confirm(
                `WARNING — DESTRUCTIVE ACTION

You are about to UNLOCK "${college?.college_name}".

This will permanently delete:
  * All master participant records
  * All event participation snapshots
  * All QR code assignments for this college
  * Payment receipt record
  * Pending payment sessions

The college can re-submit final approval from scratch.

Are you absolutely sure?`
            );
            if (!confirmed) return;
        }

        setTogglingId(id);
        try {
            const res = await fetch(`${API_BASE}/api/admin/colleges/${id}/toggle-lock`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setColleges((prev) =>
                prev.map((c) => c.id === id ? { ...c, is_final_approved: data.data.is_final_approved } : c)
            );
            // Close the details modal if it's open for this college and we just unlocked it
            if (detailsCollege?.id === id && !data.data.is_final_approved) {
                setDetailsCollege(null);
            }
            if (!isLocking) {
                setSuccessMsg(data.data?.message || "College unlocked. All associated data has been cleared.");
                setTimeout(() => setSuccessMsg(""), 8000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setTogglingId(null);
        }
    };

    const handleSort = (key) => {
        if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("asc"); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return colleges.filter(
            (c) =>
                c.college_name.toLowerCase().includes(q) ||
                c.college_code.toLowerCase().includes(q) ||
                (c.place || "").toLowerCase().includes(q)
        );
    }, [colleges, search]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let av = a[sortKey] ?? "";
            let bv = b[sortKey] ?? "";
            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [filtered, sortKey, sortDir]);

    // Summary stats
    const totalStudents = colleges.reduce((s, c) => s + Number(c.total_students || 0), 0);
    const totalApproved = colleges.reduce((s, c) => s + Number(c.approved_applications || 0), 0);
    const totalLocked = colleges.filter((c) => c.is_final_approved).length;
    const activeColleges = colleges.filter((c) => Number(c.total_students) > 0).length;

    const sortIcon = (key) => {
        if (sortKey !== key) return <span style={{ opacity: 0.3 }}>↕</span>;
        return <span style={{ color: "#818cf8" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    const thStyle = (align = "left") => ({
        padding: "13px 14px",
        textAlign: align,
        color: "var(--text-muted)",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        background: "rgba(15,23,42,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 2,
    });

    const tdStyle = (align = "left", extra = {}) => ({
        padding: "13px 14px",
        textAlign: align,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        verticalAlign: "middle",
        ...extra,
    });

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>
                            🏫 Colleges
                            <span style={{ marginLeft: "10px", color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem" }}>
                                ({filtered.length} of {colleges.length})
                            </span>
                        </h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            Manage and monitor all affiliated colleges
                        </p>
                    </div>
                    <button
                        onClick={fetchColleges}
                        style={{ padding: "9px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* ── Summary Stats ── */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                    <Stat label="Total Colleges" value={colleges.length} color="#818cf8" />
                    <Stat label="With Students" value={activeColleges} color="#60a5fa" />
                    <Stat label="Total Students" value={totalStudents} color="#34d399" />
                    <Stat label="Approved Apps" value={totalApproved} color="#10b981" />
                    <Stat label="Locked" value={totalLocked} color="#f87171" />
                </div>

                {/* ── Search bar ── */}
                <div style={{ marginBottom: "16px", position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
                    <input
                        placeholder="Search by college name, code or place…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "11px 16px 11px 40px",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "10px",
                            color: "#f1f5f9",
                            fontSize: "0.92rem",
                            outline: "none",
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}
                        >✕</button>
                    )}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {/* ── Success (unlock confirmation) ── */}
                {successMsg && (
                    <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>✅ {successMsg}</span>
                        <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", color: "#34d399", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {/* ── Table ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading colleges…
                    </div>
                ) : (
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.03)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(129,140,248,0.4) transparent",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                            <thead>
                                <tr>
                                    {COLS.map((col) => (
                                        <th
                                            key={col.key}
                                            style={thStyle(col.align)}
                                            onClick={() => !["status", "actions"].includes(col.key) && handleSort(col.key)}
                                        >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                {col.label}
                                                {!["status", "actions"].includes(col.key) && sortIcon(col.key)}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLS.length} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                            {search ? `No colleges matching "${search}"` : "No colleges found"}
                                        </td>
                                    </tr>
                                ) : sorted.map((c) => {
                                    const isLocked = c.is_final_approved;
                                    return (
                                        <tr
                                            key={c.id}
                                            style={{ transition: "background 0.15s" }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        >
                                            {/* Code */}
                                            <td style={tdStyle("left")}>
                                                <code style={{ color: "var(--text-muted)", fontSize: "0.78rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>
                                                    {c.college_code}
                                                </code>
                                            </td>

                                            {/* Name */}
                                            <td style={tdStyle("left")}>
                                                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>
                                                    {c.college_name}
                                                </span>
                                            </td>

                                            {/* Place */}
                                            <td style={tdStyle("left", { color: "var(--text-secondary)", fontSize: "0.85rem" })}>
                                                {c.place || "—"}
                                            </td>

                                            {/* Students */}
                                            <td style={tdStyle("center")}>
                                                <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: "0.95rem" }}>
                                                    {c.total_students}
                                                </span>
                                            </td>

                                            {/* Applications */}
                                            <td style={tdStyle("center")}>
                                                <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.95rem" }}>
                                                    {c.total_applications}
                                                </span>
                                            </td>

                                            {/* Approved Applications */}
                                            <td style={tdStyle("center")}>
                                                <span style={{
                                                    color: Number(c.approved_applications) > 0 ? "#10b981" : "var(--text-muted)",
                                                    fontWeight: 700,
                                                    fontSize: "0.95rem",
                                                }}>
                                                    {c.approved_applications}
                                                </span>
                                            </td>

                                            {/* Participating Events */}
                                            <td style={tdStyle("center")}>
                                                <span style={{
                                                    background: Number(c.participating_events) > 0 ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                                                    color: Number(c.participating_events) > 0 ? "#fbbf24" : "var(--text-muted)",
                                                    padding: "3px 10px",
                                                    borderRadius: "12px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                }}>
                                                    {c.participating_events} / 25
                                                </span>
                                            </td>

                                            {/* Lock Status */}
                                            <td style={tdStyle("center")}>
                                                <span style={{
                                                    background: isLocked ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                                                    color: isLocked ? "#f87171" : "#10b981",
                                                    padding: "4px 12px",
                                                    borderRadius: "20px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 700,
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {isLocked ? "🔒 Locked" : "🟢 Open"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td style={tdStyle("center")}>
                                                <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>

                                                    {/* Details button — only for locked colleges */}
                                                    {isLocked && (
                                                        <button
                                                            onClick={() => setDetailsCollege(c)}
                                                            style={{
                                                                padding: "5px 12px",
                                                                background: "rgba(129,140,248,0.12)",
                                                                border: "1px solid #818cf8",
                                                                color: "#818cf8",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                fontSize: "0.78rem",
                                                                fontWeight: 700,
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            📋 Details
                                                        </button>
                                                    )}

                                                    {/* Lock / Unlock button — SUPER_ADMIN only */}
                                                    {isSuperAdmin ? (
                                                        <button
                                                            onClick={() => handleToggleLock(c.id)}
                                                            disabled={togglingId === c.id}
                                                            style={{
                                                                padding: "5px 14px",
                                                                background: isLocked ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                                                                border: `1px solid ${isLocked ? "#10b981" : "#ef4444"}`,
                                                                color: isLocked ? "#10b981" : "#f87171",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                fontSize: "0.78rem",
                                                                fontWeight: 700,
                                                                whiteSpace: "nowrap",
                                                                opacity: togglingId === c.id ? 0.6 : 1,
                                                            }}
                                                        >
                                                            {togglingId === c.id ? "…" : isLocked ? "🔓 Unlock" : "🔒 Lock"}
                                                        </button>
                                                    ) : (
                                                        !isLocked && (
                                                            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>View only</span>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Footer count ── */}
                {!loading && sorted.length > 0 && (
                    <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                        Showing {sorted.length} of {colleges.length} colleges
                        {search && ` · filtered by "${search}"`}
                    </div>
                )}
            </div>

            {/* ── College Details Modal ── */}
            {detailsCollege && (
                <CollegeDetailsModal
                    college={detailsCollege}
                    token={token}
                    onClose={() => setDetailsCollege(null)}
                />
            )}
        </AdminLayout>
    );
}