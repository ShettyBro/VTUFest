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

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SumCard = ({ icon, label, value, color }) => (
    <div className="glass-card" style={{ textAlign: "center", padding: "16px" }}>
        <div style={{ fontSize: "1.6rem" }}>{icon}</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, color, margin: "4px 0 2px" }}>{value ?? "—"}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    </div>
);

// ─── Detail Field helper ──────────────────────────────────────────────────────
const Field = ({ label, children, full = false }) => (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "5px", fontWeight: 700 }}>{label}</div>
        {children}
    </div>
);

// ─── Details Modal ────────────────────────────────────────────────────────────
function DetailsModal({ request, token, onClose }) {
    const [allotments, setAllotments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const s = cfg(request.status);

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/accommodation/${request.id}/allotments`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) setAllotments(d.data.allotments || []);
                else setErr(d.message || "Failed to load allotments");
            })
            .catch(() => setErr("Network error"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflowY: "auto" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "760px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>

                {/* Close */}
                <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>✕</button>

                {/* Header */}
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                        <h4 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.1rem" }}>🏫 {request.college_name}</h4>
                        <span style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace" }}>{request.college_code}</span>
                        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "4px 12px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700 }}>{s.label}</span>
                    </div>
                    {request.college_place && (
                        <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>📍 {request.college_place}</div>
                    )}
                </div>

                {/* ── Request Summary ── */}
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
                        📋 Request Details
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>

                        {/* Requested counts */}
                        <Field label="Requested Boys">
                            <div style={{ color: "#60a5fa", fontWeight: 800, fontSize: "1.4rem" }}>{request.total_boys}</div>
                        </Field>
                        <Field label="Requested Girls">
                            <div style={{ color: "#fb7185", fontWeight: 800, fontSize: "1.4rem" }}>{request.total_girls}</div>
                        </Field>
                        <Field label="Total Persons">
                            <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: "1.4rem" }}>{request.total_persons ?? (parseInt(request.total_boys) + parseInt(request.total_girls))}</div>
                        </Field>

                        {/* Contact */}
                        <Field label="Contact Person">
                            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{request.contact_person_name || "—"}</div>
                            {request.contact_person_phone && (
                                <a href={`tel:${request.contact_person_phone}`} style={{ color: "#60a5fa", fontSize: "0.82rem", textDecoration: "none" }}>
                                    📞 {request.contact_person_phone}
                                </a>
                            )}
                        </Field>

                        {/* Applied By */}
                        <Field label="Applied By">
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{request.applied_by_role || request.applied_by_type || "—"}</div>
                        </Field>

                        {/* Timestamps */}
                        <Field label="Applied At">
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{fmt(request.applied_at)}</div>
                        </Field>

                        {request.processed_at && (
                            <Field label="Processed At">
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{fmt(request.processed_at)}</div>
                            </Field>
                        )}

                        {/* Special requirements */}
                        {request.special_requirements && (
                            <Field label="Special Requirements" full>
                                <div style={{ color: "#f59e0b", fontSize: "0.85rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "10px 14px" }}>
                                    {request.special_requirements}
                                </div>
                            </Field>
                        )}

                        {/* Rejection reason / admin remarks */}
                        {request.admin_remarks && (
                            <Field label={request.status?.toUpperCase() === "REJECTED" ? "Rejection Reason" : "Admin Remarks"} full>
                                <div style={{ color: request.status?.toUpperCase() === "REJECTED" ? "#f87171" : "#60a5fa", fontSize: "0.85rem", background: request.status?.toUpperCase() === "REJECTED" ? "rgba(239,68,68,0.08)" : "rgba(96,165,250,0.08)", border: `1px solid ${request.status?.toUpperCase() === "REJECTED" ? "rgba(239,68,68,0.25)" : "rgba(96,165,250,0.25)"}`, borderRadius: "8px", padding: "10px 14px" }}>
                                    {request.admin_remarks}
                                </div>
                            </Field>
                        )}
                    </div>
                </div>

                {/* ── Allotment Details ── */}
                <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
                        🏨 Accommodation Allotments
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "0.88rem" }}>Loading allotment details…</div>
                    ) : err ? (
                        <div style={{ color: "#f87171", fontSize: "0.85rem", padding: "12px", background: "rgba(239,68,68,0.08)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.2)" }}>{err}</div>
                    ) : allotments.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                            {request.status?.toUpperCase() === "APPROVED"
                                ? "⚠ Approved but no allotments assigned yet."
                                : "No accommodation allotments for this request."}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {allotments.map((a, idx) => (
                                <div key={a.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 18px" }}>

                                    {/* Location header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                        <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.88rem" }}>📍 Location {idx + 1}</span>
                                        {a.accommodation_type && (
                                            <span style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "2px 10px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                                                {capitalize(a.accommodation_type)}
                                            </span>
                                        )}
                                        {/* Boys / Girls pill */}
                                        <span style={{ marginLeft: "auto", color: "#60a5fa", fontSize: "0.82rem", fontWeight: 700 }}>
                                            👦 {a.allotted_boys}
                                        </span>
                                        <span style={{ color: "#fb7185", fontSize: "0.82rem", fontWeight: 700 }}>
                                            👧 {a.allotted_girls}
                                        </span>
                                        <span style={{ color: "#a78bfa", fontSize: "0.82rem", fontWeight: 800 }}>
                                            = {parseInt(a.allotted_boys) + parseInt(a.allotted_girls)} total
                                        </span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>

                                        {/* Name */}
                                        <Field label="Accommodation Name">
                                            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>{a.accommodation_name}</div>
                                        </Field>

                                        {/* Contact */}
                                        {a.contact_name && (
                                            <Field label="Contact Person">
                                                <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{a.contact_name}</div>
                                                {a.contact_phone && (
                                                    <a href={`tel:${a.contact_phone}`} style={{ color: "#60a5fa", fontSize: "0.82rem", textDecoration: "none" }}>
                                                        📞 {a.contact_phone}
                                                    </a>
                                                )}
                                            </Field>
                                        )}

                                        {/* Assigned by */}
                                        {a.allotted_by_name && (
                                            <Field label="Assigned By">
                                                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{a.allotted_by_name}</div>
                                                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{fmt(a.allotted_at)}</div>
                                            </Field>
                                        )}

                                        {/* Address */}
                                        {a.address && (
                                            <Field label="Address" full>
                                                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>{a.address}</div>
                                            </Field>
                                        )}

                                        {/* Google Maps link */}
                                        {a.location_url && (
                                            <Field label="Google Maps" full>
                                                <a href={a.location_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#34d399", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "8px", padding: "7px 14px", transition: "all 0.2s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.2)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,0.1)"}>
                                                    🗺 Open in Google Maps ↗
                                                </a>
                                            </Field>
                                        )}

                                        {/* Notes */}
                                        {a.notes && (
                                            <Field label="Notes / Instructions" full>
                                                <div style={{ color: "#f59e0b", fontSize: "0.85rem", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "9px 13px", lineHeight: 1.5 }}>{a.notes}</div>
                                            </Field>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Allotment total summary */}
                            <div style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "10px", padding: "12px 18px", display: "flex", gap: "24px", alignItems: "center" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase" }}>Allotment Totals</span>
                                <span style={{ color: "#60a5fa", fontWeight: 700 }}>👦 {allotments.reduce((s, a) => s + parseInt(a.allotted_boys || 0), 0)} boys</span>
                                <span style={{ color: "#fb7185", fontWeight: 700 }}>👧 {allotments.reduce((s, a) => s + parseInt(a.allotted_girls || 0), 0)} girls</span>
                                <span style={{ color: "#a78bfa", fontWeight: 800 }}>
                                    {allotments.reduce((s, a) => s + parseInt(a.allotted_boys || 0) + parseInt(a.allotted_girls || 0), 0)} total
                                </span>
                                <span style={{ marginLeft: "auto", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "3px 12px", fontSize: "0.78rem", fontWeight: 700 }}>
                                    {allotments.length} location{allotments.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Close button at bottom */}
                <div style={{ marginTop: "20px", textAlign: "right" }}>
                    <button onClick={onClose} style={{ padding: "10px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminAccommodation() {
    const [requests, setRequests] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [detailTarget, setDetailTarget] = useState(null); // details modal

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
        const matchSearch = !q
            || r.college_name?.toLowerCase().includes(q)
            || r.college_code?.toLowerCase().includes(q)
            || r.contact_person_name?.toLowerCase().includes(q);
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
                        {error}
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
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
                    <div style={{ display: "flex", gap: "8px" }}>
                        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => {
                            const c = s === "ALL"
                                ? { color: "#94a3b8", border: "rgba(148,163,184,0.4)" }
                                : { color: STATUS_CFG[s].color, border: STATUS_CFG[s].border };
                            return (
                                <button key={s} onClick={() => setFilter(s)} style={{
                                    padding: "7px 16px", borderRadius: "20px", cursor: "pointer",
                                    fontSize: "0.8rem", fontWeight: 600, transition: "all 0.2s",
                                    background: filter === s ? `${c.color}22` : "rgba(255,255,255,0.05)",
                                    border: `1px solid ${filter === s ? c.color : "rgba(255,255,255,0.1)"}`,
                                    color: filter === s ? c.color : "var(--text-muted)",
                                }}>
                                    {s}
                                </button>
                            );
                        })}
                    </div>

                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search college or contact…"
                        style={{ flex: 1, minWidth: "200px", padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none" }} />

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
                                        {["College", "Code", "Status", "Boys", "Girls", "Total", "Applied At", "Details"].map(h => (
                                            <th key={h} style={{ padding: "13px 14px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(r => {
                                        const s = cfg(r.status);
                                        return (
                                            <React.Fragment key={r.id}>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
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

                                                    {/* View Details button */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <button
                                                            onClick={() => setDetailTarget(r)}
                                                            style={{ padding: "5px 14px", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.45)", color: "#60a5fa", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", transition: "all 0.2s" }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(96,165,250,0.25)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(96,165,250,0.12)"}>
                                                            🔍 View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}

                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                                {requests.length === 0 ? "No accommodation requests submitted yet." : "No requests match the current filter."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {/* Footer totals */}
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

                {/* Details Modal */}
                {detailTarget && (
                    <DetailsModal
                        request={detailTarget}
                        token={token}
                        onClose={() => setDetailTarget(null)}
                    />
                )}
            </div>
        </AdminLayout>
    );
}