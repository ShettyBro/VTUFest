import { useState, useEffect, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const Stat = ({ label, value, color }) => (
    <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        padding: "12px 18px",
        minWidth: "140px",
        textAlign: "center",
    }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    </div>
);

// ─── College Breakdown Modal ──────────────────────────────────────────────────

function CollegeBreakdownModal({ eventName, eventLabel, token, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        adminFetch(`${API_BASE}/api/admin/event-metrics/${eventName}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => { if (d.success) setData(d); else setErr(d.message || "Failed to load data"); })
            .catch(() => setErr("Network error — could not load college breakdown"))
            .finally(() => setLoading(false));
    }, [eventName]);

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    const thStyle = {
        padding: "11px 14px",
        color: "var(--text-muted)",
        fontSize: "0.73rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        background: "rgba(15,23,42,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        whiteSpace: "nowrap",
    };

    const tdStyle = (align = "left", extra = {}) => ({
        padding: "11px 14px",
        textAlign: align,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        verticalAlign: "middle",
        fontSize: "0.85rem",
        ...extra,
    });

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
                maxWidth: "780px",
                maxHeight: "88vh",
                overflowY: "auto",
                padding: "28px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(129,140,248,0.4) transparent",
            }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "1.3rem" }}>🎭</span>
                            <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.15rem" }}>
                                {eventLabel}
                            </h2>
                            {data && (
                                <span style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8", padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                                    {data.college_count} College{data.college_count !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        <div style={{ marginTop: "5px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            College-wise participation breakdown
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
                        Loading breakdown…
                    </div>
                )}

                {err && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "14px", borderRadius: "8px" }}>
                        {err}
                    </div>
                )}

                {data && !loading && (
                    <div style={{
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "10px",
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.02)",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, textAlign: "left" }}>#</th>
                                    <th style={{ ...thStyle, textAlign: "left" }}>College Name</th>
                                    <th style={{ ...thStyle, textAlign: "left" }}>Code</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Students</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Accompanists</th>
                                    <th style={{ ...thStyle, textAlign: "center" }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.colleges.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                                            No colleges found
                                        </td>
                                    </tr>
                                ) : data.colleges.map((c, i) => (
                                    <tr
                                        key={c.college_code}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        style={{ transition: "background 0.15s" }}
                                    >
                                        <td style={tdStyle("left", { color: "var(--text-muted)", fontSize: "0.78rem" })}>{i + 1}</td>
                                        <td style={tdStyle("left", { color: "var(--text-primary)", fontWeight: 600 })}>{c.college_name}</td>
                                        <td style={tdStyle("left")}>
                                            <code style={{ background: "rgba(255,255,255,0.07)", color: "var(--text-muted)", padding: "2px 7px", borderRadius: "4px", fontSize: "0.76rem" }}>
                                                {c.college_code}
                                            </code>
                                        </td>
                                        <td style={tdStyle("center", { color: "#60a5fa", fontWeight: 700 })}>{c.student_count}</td>
                                        <td style={tdStyle("center", { color: "#a78bfa", fontWeight: 700 })}>{c.accompanist_count}</td>
                                        <td style={tdStyle("center")}>
                                            <span style={{ background: "rgba(129,140,248,0.12)", color: "#818cf8", padding: "3px 10px", borderRadius: "10px", fontWeight: 700, fontSize: "0.82rem" }}>
                                                {c.total}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLS = [
    { key: "idx", label: "#", align: "center", sortable: false },
    { key: "event_label", label: "Event Name", align: "left", sortable: true },
    { key: "college_count", label: "Colleges", align: "center", sortable: true },
    { key: "student_count", label: "Students", align: "center", sortable: true },
    { key: "accompanist_count", label: "Accompanists", align: "center", sortable: true },
    { key: "total_participants", "label": "Total", align: "center", sortable: true },
    { key: "actions", label: "Action", align: "center", sortable: false },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminEventMetrics() {
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortKey, setSortKey] = useState("total_participants");
    const [sortDir, setSortDir] = useState("desc");
    const [modalEvent, setModalEvent] = useState(null); // { event_name, event_label }

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchMetrics = () => {
        setLoading(true);
        setError("");
        adminFetch(`${API_BASE}/api/admin/event-metrics`, { headers })
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    setEvents(d.events);
                    setSummary(d.summary);
                } else {
                    setError(d.message || "Failed to load event metrics");
                }
            })
            .catch(() => setError("Network error — could not fetch event metrics"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchMetrics(); }, []);

    const handleSort = (key) => {
        if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("desc"); }
    };

    const sorted = useMemo(() => {
        return [...events].sort((a, b) => {
            let av = a[sortKey] ?? "";
            let bv = b[sortKey] ?? "";
            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [events, sortKey, sortDir]);

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
                            🎭 Event Metrics
                            <span style={{ marginLeft: "10px", color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem" }}>
                                ({events.filter(e => e.college_count > 0).length} of {events.length} active)
                            </span>
                        </h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            Event-wise participation across all locked &amp; payment-verified colleges
                        </p>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        style={{ padding: "9px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* ── Summary Stats ── */}
                {summary && (
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                        <Stat label="Events With Entries" value={summary.total_events_with_entries} color="#818cf8" />
                        <Stat label="Colleges Participating" value={summary.grand_total_colleges} color="#60a5fa" />
                        <Stat label="Total Students" value={summary.grand_total_students} color="#34d399" />
                        <Stat label="Total Accompanists" value={summary.grand_total_accompanists} color="#a78bfa" />
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {/* ── Table ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading event metrics…
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
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                            <thead>
                                <tr>
                                    {COLS.map((col) => (
                                        <th
                                            key={col.key}
                                            style={thStyle(col.align)}
                                            onClick={() => col.sortable && handleSort(col.key)}
                                        >
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                                {col.label}
                                                {col.sortable && sortIcon(col.key)}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.length === 0 ? (
                                    <tr>
                                        <td colSpan={COLS.length} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                            No event data found
                                        </td>
                                    </tr>
                                ) : sorted.map((ev, i) => {
                                    const hasData = ev.college_count > 0;
                                    const rowStyle = hasData
                                        ? {}
                                        : { opacity: 0.45 };

                                    return (
                                        <tr
                                            key={ev.event_name}
                                            style={{ transition: "background 0.15s", ...rowStyle }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                        >
                                            {/* # */}
                                            <td style={tdStyle("center", { color: "var(--text-muted)", fontSize: "0.78rem" })}>
                                                {i + 1}
                                            </td>

                                            {/* Event Name */}
                                            <td style={tdStyle("left")}>
                                                <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                                                    {ev.event_label}
                                                </span>
                                            </td>

                                            {/* Colleges */}
                                            <td style={tdStyle("center")}>
                                                {hasData ? (
                                                    <span style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.95rem" }}>
                                                        {ev.college_count}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                )}
                                            </td>

                                            {/* Students */}
                                            <td style={tdStyle("center")}>
                                                {hasData ? (
                                                    <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: "0.95rem" }}>
                                                        {ev.student_count}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                )}
                                            </td>

                                            {/* Accompanists */}
                                            <td style={tdStyle("center")}>
                                                {hasData ? (
                                                    <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: "0.95rem" }}>
                                                        {ev.accompanist_count}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                )}
                                            </td>

                                            {/* Total */}
                                            <td style={tdStyle("center")}>
                                                {hasData ? (
                                                    <span style={{
                                                        background: "rgba(129,140,248,0.12)",
                                                        color: "#818cf8",
                                                        padding: "3px 12px",
                                                        borderRadius: "12px",
                                                        fontWeight: 700,
                                                        fontSize: "0.88rem",
                                                    }}>
                                                        {ev.total_participants}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>—</span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td style={tdStyle("center")}>
                                                {hasData ? (
                                                    <button
                                                        onClick={() => setModalEvent({ event_name: ev.event_name, event_label: ev.event_label })}
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
                                                        🏫 View Colleges
                                                    </button>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>No entries</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Footer ── */}
                {!loading && sorted.length > 0 && (
                    <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                        {events.filter(e => e.college_count > 0).length} active events out of {events.length} total
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modalEvent && (
                <CollegeBreakdownModal
                    eventName={modalEvent.event_name}
                    eventLabel={modalEvent.event_label}
                    token={token}
                    onClose={() => setModalEvent(null)}
                />
            )}
        </AdminLayout>
    );
}