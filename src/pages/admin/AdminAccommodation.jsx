import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const STATUS_CFG = {
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", label: "⏳ Pending" },
    APPROVED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", label: "✅ Approved" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", label: "❌ Rejected" },
};

const cfg = (s) => STATUS_CFG[s?.toUpperCase()] || STATUS_CFG.PENDING;

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

// ─── Summary Card ────────────────────────────────────────────────────────────
const SumCard = ({ icon, label, value, color }) => (
    <div className="glass-card" style={{ textAlign: "center", padding: "16px" }}>
        <div style={{ fontSize: "1.6rem" }}>{icon}</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color, margin: "4px 0 2px" }}>{value ?? "—"}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    </div>
);


// ─── Row Detail Expand ────────────────────────────────────────────────────────
function RowDetail({ r }) {
    return (
        <tr>
            <td colSpan={9} style={{ padding: 0 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Contact Person</div>
                        <div style={{ color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600 }}>{r.contact_person_name}</div>
                        <a href={`tel:${r.contact_person_phone}`} style={{ color: "#60a5fa", fontSize: "0.82rem", textDecoration: "none" }}>{r.contact_person_phone}</a>
                    </div>
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>College Location</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{r.college_place || "—"}</div>
                    </div>
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Applied By</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{r.applied_by_role || r.applied_by_type || "—"}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{fmt(r.applied_at)}</div>
                    </div>
                    {r.processed_at && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Processed At</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{fmt(r.processed_at)}</div>
                        </div>
                    )}
                    {r.special_requirements && (
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Special Requirements</div>
                            <div style={{ color: "#f59e0b", fontSize: "0.85rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "6px", padding: "8px 12px" }}>{r.special_requirements}</div>
                        </div>
                    )}
                    {r.admin_remarks && (
                        <div style={{ gridColumn: "1 / -1" }}>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Admin Remarks</div>
                            <div style={{ color: "#60a5fa", fontSize: "0.85rem", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "6px", padding: "8px 12px" }}>{r.admin_remarks}</div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminAccommodation() {
    const [requests, setRequests] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [expandedId, setExpandedId] = useState(null);
    const [search, setSearch] = useState("");

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(() => {
        setLoading(true);
        Promise.all([
            fetch(`${API_BASE}/api/admin/accommodation`, { headers }).then(r => r.json()),
            fetch(`${API_BASE}/api/admin/accommodation/summary`, { headers }).then(r => r.json()),
        ]).then(([listData, sumData]) => {
            if (listData.success) setRequests(listData.data);
            else setError(listData.message || "Failed to load requests");
            if (sumData.success) setSummary(sumData.data);
        }).catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => { fetchAll(); }, []);

    const filtered = requests.filter(r => {
        const matchStatus = filter === "ALL" || r.status?.toUpperCase() === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || r.college_name?.toLowerCase().includes(q) || r.college_code?.toLowerCase().includes(q) || r.contact_person_name?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const totalBoys = filtered.reduce((s, r) => s + (r.total_boys || 0), 0);
    const totalGirls = filtered.reduce((s, r) => s + (r.total_girls || 0), 0);

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Accommodation Requests</h3>
                    <button onClick={fetchAll} style={{ padding: "8px 18px", background: "rgba(96,165,250,0.15)", border: "1px solid #60a5fa", color: "#60a5fa", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
                        ⟳ Refresh
                    </button>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {/* Summary Cards */}
                {summary && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "14px", marginBottom: "24px" }}>
                        <SumCard icon="📋" label="Total Requests" value={summary.total_requests} color="#60a5fa" />
                        <SumCard icon="⏳" label="Pending" value={summary.pending} color="#f59e0b" />
                        <SumCard icon="✅" label="Approved" value={summary.approved} color="#10b981" />
                        <SumCard icon="❌" label="Rejected" value={summary.rejected} color="#f87171" />
                        <SumCard icon="👦" label="Total Boys" value={summary.total_boys} color="#60a5fa" />
                        <SumCard icon="👧" label="Total Girls" value={summary.total_girls} color="#fb7185" />
                        <SumCard icon="👥" label="Total Persons" value={summary.total_persons} color="#a78bfa" />
                        <SumCard icon="✅👦" label="Approved Boys" value={summary.approved_boys} color="#10b981" />
                        <SumCard icon="✅👧" label="Approved Girls" value={summary.approved_girls} color="#10b981" />
                    </div>
                )}

                {/* Filter + Search Bar */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                    {/* Status filters */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => {
                            const c = s === "ALL" ? { color: "#94a3b8", border: "rgba(148,163,184,0.4)" } : { color: STATUS_CFG[s].color, border: STATUS_CFG[s].border };
                            return (
                                <button key={s} onClick={() => setFilter(s)}
                                    style={{
                                        padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s",
                                        background: filter === s ? `${c.color}22` : "rgba(255,255,255,0.05)",
                                        border: `1px solid ${filter === s ? c.color : "rgba(255,255,255,0.1)"}`,
                                        color: filter === s ? c.color : "var(--text-muted)"
                                    }}>
                                    {s}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search college or contact…"
                        style={{ flex: 1, minWidth: "200px", padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none" }} />

                    {/* Live count */}
                    {filter !== "ALL" && (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                            Showing {filtered.length} · 👦 {totalBoys} boys · 👧 {totalGirls} girls
                        </div>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>Loading accommodation requests…</div>
                ) : (
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        {["College", "Code", "Status", "Boys", "Girls", "Total", "Applied At", ""].map(h => (
                                            <th key={h} style={{ padding: "13px 14px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(r => {
                                        const s = cfg(r.status);
                                        const isExpanded = expandedId === r.id;
                                        return (
                                            <React.Fragment key={r.id}>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                                                    <td style={{ padding: "13px 14px", color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600, maxWidth: "200px" }}>
                                                        {r.college_name}
                                                    </td>
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace" }}>{r.college_code}</span>
                                                    </td>
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "4px 11px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</span>
                                                    </td>
                                                    <td style={{ padding: "13px 14px", color: "#60a5fa", fontWeight: 700, fontSize: "0.95rem" }}>{r.total_boys}</td>
                                                    <td style={{ padding: "13px 14px", color: "#fb7185", fontWeight: 700, fontSize: "0.95rem" }}>{r.total_girls}</td>
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: "0.95rem" }}>{r.total_persons}</span>
                                                    </td>
                                                    <td style={{ padding: "13px 14px", color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(r.applied_at)}</td>

                                                    <td style={{ padding: "13px 14px" }}>
                                                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                                            style={{ padding: "4px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", transition: "all 0.2s" }}>
                                                            {isExpanded ? "▲" : "▼"}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {isExpanded && <RowDetail r={r} />}
                                            </React.Fragment>
                                        );
                                    })}

                                    {filtered.length === 0 && (
                                        <tr><td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                            {requests.length === 0 ? "No accommodation requests submitted yet." : "No requests match the current filter."}
                                        </td></tr>
                                    )}
                                </tbody>

                                {/* Footer totals row */}
                                {filtered.length > 0 && (
                                    <tfoot>
                                        <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                                            <td colSpan={3} style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "0.82rem", fontWeight: 700 }}>
                                                {filtered.length} requests shown
                                            </td>
                                            <td style={{ padding: "12px 14px", color: "#60a5fa", fontWeight: 800 }}>{totalBoys}</td>
                                            <td style={{ padding: "12px 14px", color: "#fb7185", fontWeight: 800 }}>{totalGirls}</td>
                                            <td style={{ padding: "12px 14px", color: "#a78bfa", fontWeight: 800 }}>{totalBoys + totalGirls}</td>
                                            <td colSpan={2} />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}