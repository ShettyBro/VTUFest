import React, { useState, useEffect, useCallback } from "react";
import EMLayout from "./EMLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const STATUS_CFG = {
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", label: "⏳ Pending" },
    APPROVED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", label: "✅ Approved" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", label: "❌ Rejected" },
};
const cfg = s => STATUS_CFG[s?.toUpperCase()] || STATUS_CFG.PENDING;
const fmt = d => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const ACCOM_TYPES = ["hotel", "pg", "hostel", "dormitory", "other"];

const EMPTY_ALLOTMENT = {
    accommodation_name: "",
    accommodation_type: "hotel",
    address: "",
    location_url: "",
    contact_name: "",
    contact_phone: "",
    notes: "",
    allotted_boys: "",
    allotted_girls: "",
};

// ─── Allotment Modal ──────────────────────────────────────────────────────────
function AllotmentModal({ request, token, onClose, onSaved }) {
    const [allotments, setAllotments] = useState([{ ...EMPTY_ALLOTMENT }]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const totalBoys = request.total_boys;
    const totalGirls = request.total_girls;
    const totalPeople = totalBoys + totalGirls;

    // Derived sums
    const sumBoys = allotments.reduce((s, a) => s + (parseInt(a.allotted_boys) || 0), 0);
    const sumGirls = allotments.reduce((s, a) => s + (parseInt(a.allotted_girls) || 0), 0);
    const sumTotal = sumBoys + sumGirls;

    const boysOk = sumBoys === totalBoys;
    const girlsOk = sumGirls === totalGirls;
    const canSave = boysOk && girlsOk && allotments.every(a => a.accommodation_name.trim());

    // Load existing allotments
    useEffect(() => {
        fetch(`${API_BASE}/api/em/accommodation/${request.id}/allotments`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data.allotments.length > 0) {
                    setAllotments(d.data.allotments.map(a => ({
                        accommodation_name: a.accommodation_name || "",
                        accommodation_type: a.accommodation_type || "hotel",
                        address: a.address || "",
                        location_url: a.location_url || "",
                        contact_name: a.contact_name || "",
                        contact_phone: a.contact_phone || "",
                        notes: a.notes || "",
                        allotted_boys: String(a.allotted_boys),
                        allotted_girls: String(a.allotted_girls),
                    })));
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const updateField = (idx, field, value) => {
        setAllotments(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
    };

    const addAllotment = () => setAllotments(prev => [...prev, { ...EMPTY_ALLOTMENT }]);

    const removeAllotment = (idx) => {
        if (allotments.length === 1) return;
        setAllotments(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        setErr("");
        try {
            const res = await fetch(`${API_BASE}/api/em/accommodation/${request.id}/allotments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ allotments }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            onSaved();
        } catch (e) {
            setErr(e.message);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "8px 10px", boxSizing: "border-box",
        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "7px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none",
    };

    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                    <div>
                        <h4 style={{ margin: "0 0 4px", color: "var(--text-primary)", fontSize: "1.05rem" }}>
                            🏨 Assign Accommodation
                        </h4>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                            {request.college_name} ({request.college_code})
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>✕</button>
                </div>

                {/* Request summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                    {[
                        { label: "Requested Boys", value: totalBoys, color: "#60a5fa" },
                        { label: "Requested Girls", value: totalGirls, color: "#fb7185" },
                        { label: "Total People", value: totalPeople, color: "#a78bfa" },
                    ].map(card => (
                        <div key={card.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: card.color }}>{card.value}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "3px" }}>{card.label}</div>
                        </div>
                    ))}
                </div>

                {/* Running total progress */}
                <div style={{ marginBottom: "20px", padding: "14px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: `1px solid ${canSave ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.3)"}` }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                        Allotment Progress
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                        {[
                            { label: "Boys", sum: sumBoys, total: totalBoys, color: "#60a5fa", ok: boysOk },
                            { label: "Girls", sum: sumGirls, total: totalGirls, color: "#fb7185", ok: girlsOk },
                            { label: "Total", sum: sumTotal, total: totalPeople, color: "#a78bfa", ok: boysOk && girlsOk },
                        ].map(p => (
                            <div key={p.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{p.label}</span>
                                    <span style={{ color: p.ok ? "#10b981" : p.sum > p.total ? "#f87171" : "#f59e0b", fontSize: "0.78rem", fontWeight: 700 }}>
                                        {p.sum} / {p.total} {p.ok ? "✓" : ""}
                                    </span>
                                </div>
                                <div style={{ height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${Math.min(100, p.total > 0 ? (p.sum / p.total) * 100 : 0)}%`,
                                        background: p.ok ? "#10b981" : p.sum > p.total ? "#f87171" : p.color,
                                        borderRadius: "3px", transition: "width 0.3s",
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {!canSave && (
                        <div style={{ color: "#f59e0b", fontSize: "0.78rem", marginTop: "10px" }}>
                            {!boysOk && `⚠ Boys: assigned ${sumBoys}, need ${totalBoys}. `}
                            {!girlsOk && `⚠ Girls: assigned ${sumGirls}, need ${totalGirls}. `}
                            Totals must match exactly before saving.
                        </div>
                    )}
                </div>

                {/* Loading state */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>Loading existing allotments…</div>
                ) : (
                    <>
                        {/* Allotment cards */}
                        {allotments.map((a, idx) => (
                            <div key={idx} style={{ marginBottom: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                    <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>
                                        📍 Location {idx + 1}
                                    </span>
                                    {allotments.length > 1 && (
                                        <button onClick={() => removeAllotment(idx)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: "6px", padding: "3px 10px", cursor: "pointer", fontSize: "0.78rem" }}>
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    {/* Name */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Accommodation Name *</label>
                                        <input style={inputStyle} placeholder="e.g. Hotel Grand Palace" value={a.accommodation_name}
                                            onChange={e => updateField(idx, "accommodation_name", e.target.value)} />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Type</label>
                                        <select style={{ ...inputStyle }} value={a.accommodation_type}
                                            onChange={e => updateField(idx, "accommodation_type", e.target.value)}>
                                            {ACCOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                        </select>
                                    </div>

                                    {/* Contact phone */}
                                    <div>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Contact Phone</label>
                                        <input style={inputStyle} placeholder="10-digit number" value={a.contact_phone}
                                            onChange={e => updateField(idx, "contact_phone", e.target.value)} />
                                    </div>

                                    {/* Contact name */}
                                    <div>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Contact Person</label>
                                        <input style={inputStyle} placeholder="Name" value={a.contact_name}
                                            onChange={e => updateField(idx, "contact_name", e.target.value)} />
                                    </div>

                                    {/* Address */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Address</label>
                                        <input style={inputStyle} placeholder="Full address" value={a.address}
                                            onChange={e => updateField(idx, "address", e.target.value)} />
                                    </div>

                                    {/* Map link */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Google Maps Link</label>
                                        <input style={inputStyle} placeholder="https://maps.google.com/..." value={a.location_url}
                                            onChange={e => updateField(idx, "location_url", e.target.value)} />
                                    </div>

                                    {/* Boys & Girls — highlighted boxes */}
                                    <div>
                                        <label style={{ color: "#60a5fa", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>👦 Boys Allotted *</label>
                                        <input type="number" min="0" style={{ ...inputStyle, border: "1px solid rgba(96,165,250,0.5)", color: "#60a5fa", fontWeight: 700 }}
                                            placeholder="0" value={a.allotted_boys}
                                            onChange={e => updateField(idx, "allotted_boys", e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ color: "#fb7185", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "4px" }}>👧 Girls Allotted *</label>
                                        <input type="number" min="0" style={{ ...inputStyle, border: "1px solid rgba(251,113,133,0.5)", color: "#fb7185", fontWeight: 700 }}
                                            placeholder="0" value={a.allotted_girls}
                                            onChange={e => updateField(idx, "allotted_girls", e.target.value)} />
                                    </div>

                                    {/* Notes */}
                                    <div style={{ gridColumn: "1 / -1" }}>
                                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Notes / Additional Info</label>
                                        <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Check-in time, room details, etc."
                                            value={a.notes} onChange={e => updateField(idx, "notes", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add location button */}
                        <button onClick={addAllotment} style={{
                            width: "100%", padding: "10px", marginBottom: "16px",
                            background: "rgba(16,185,129,0.1)", border: "1px dashed rgba(16,185,129,0.5)",
                            color: "#10b981", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                        }}>
                            + Add Another Location
                        </button>
                    </>
                )}

                {err && <div style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "12px", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)" }}>{err}</div>}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleSave} disabled={!canSave || saving}
                        title={!canSave ? "Boys and girls totals must match the requested amounts exactly" : ""}
                        style={{
                            flex: 1, padding: "12px",
                            background: canSave ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${canSave ? "#10b981" : "rgba(255,255,255,0.12)"}`,
                            color: canSave ? "#10b981" : "var(--text-muted)",
                            borderRadius: "8px", cursor: canSave ? "pointer" : "not-allowed",
                            fontWeight: 700, fontSize: "0.88rem", transition: "all 0.2s",
                        }}>
                        {saving ? "Saving…" : canSave ? "✓ Save Allotments" : "Fix totals to save"}
                    </button>
                    <button onClick={onClose} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Row Detail (expand) ──────────────────────────────────────────────────────
function RowDetail({ r }) {
    return (
        <tr>
            <td colSpan={10} style={{ padding: 0 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Contact Person</div>
                        <div style={{ color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600 }}>{r.contact_person_name}</div>
                        <a href={`tel:${r.contact_person_phone}`} style={{ color: "#60a5fa", fontSize: "0.82rem", textDecoration: "none" }}>{r.contact_person_phone}</a>
                    </div>
                    {r.special_requirements && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Special Requirements</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{r.special_requirements}</div>
                        </div>
                    )}
                    {r.admin_remarks && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Admin Remarks</div>
                            <div style={{ color: "#f59e0b", fontSize: "0.85rem" }}>{r.admin_remarks}</div>
                        </div>
                    )}
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Applied At</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{fmt(r.applied_at)}</div>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EMAccommodation() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("APPROVED");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [allotTarget, setAllotTarget] = useState(null);

    const token = localStorage.getItem("vtufest_em_token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(() => {
        setLoading(true);
        fetch(`${API_BASE}/api/em/accommodation`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setRequests(d.data); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => { fetchAll(); }, []);

    const filtered = requests.filter(r => {
        const matchStatus = filter === "ALL" || r.status?.toUpperCase() === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || r.college_name?.toLowerCase().includes(q) || r.college_code?.toLowerCase().includes(q) || r.contact_person_name?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const totalBoys = filtered.reduce((s, r) => s + (parseInt(r.total_boys) || 0), 0);
    const totalGirls = filtered.reduce((s, r) => s + (parseInt(r.total_girls) || 0), 0);

    return (
        <EMLayout>
            <div style={{ padding: "8px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Accommodation Requests</h3>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {/* Filters + Search */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    {["ALL", "APPROVED", "PENDING", "REJECTED"].map(f => {
                        const count = requests.filter(r => f === "ALL" || r.status?.toUpperCase() === f).length;
                        return (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", transition: "all 0.2s",
                                background: filter === f ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
                                border: filter === f ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.12)",
                                color: filter === f ? "#10b981" : "var(--text-secondary)",
                            }}>
                                {f} ({count})
                            </button>
                        );
                    })}

                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search college or contact…"
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
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        {["College", "Code", "Status", "Boys", "Girls", "Total", "Allotted", "Applied At", "Action", ""].map(h => (
                                            <th key={h} style={{ padding: "13px 14px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(r => {
                                        const s = cfg(r.status);
                                        const isExpanded = expandedId === r.id;
                                        const fullyAllotted = r.is_fully_allotted;

                                        return (
                                            <React.Fragment key={r.id}>
                                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                                                    <td style={{ padding: "13px 14px", color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600, maxWidth: "200px" }}>{r.college_name}</td>
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace" }}>{r.college_code}</span>
                                                    </td>
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "4px 11px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</span>
                                                    </td>
                                                    <td style={{ padding: "13px 14px", color: "#60a5fa", fontWeight: 700 }}>{r.total_boys}</td>
                                                    <td style={{ padding: "13px 14px", color: "#fb7185", fontWeight: 700 }}>{r.total_girls}</td>
                                                    <td style={{ padding: "13px 14px", color: "#a78bfa", fontWeight: 800 }}>{r.total_persons}</td>

                                                    {/* Allotment status cell */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        {r.status === "APPROVED" ? (
                                                            <span style={{
                                                                background: fullyAllotted ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                                                                color: fullyAllotted ? "#10b981" : "#f59e0b",
                                                                border: `1px solid ${fullyAllotted ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
                                                                padding: "3px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap",
                                                            }}>
                                                                {fullyAllotted ? `✓ Done (${r.allotment_count})` : r.allotment_count > 0 ? `⚠ Partial (${r.allotment_count})` : "— Not assigned"}
                                                            </span>
                                                        ) : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>N/A</span>}
                                                    </td>

                                                    <td style={{ padding: "13px 14px", color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(r.applied_at)}</td>

                                                    <td style={{ padding: "13px 14px" }}>
                                                        {r.status === "APPROVED" ? (
                                                            <button onClick={() => setAllotTarget(r)}
                                                                style={{ padding: "5px 14px", background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                                                🏨 {r.allotment_count > 0 ? "Edit" : "Assign"}
                                                            </button>
                                                        ) : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Not approved</span>}
                                                    </td>

                                                    <td style={{ padding: "13px 14px" }}>
                                                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                                            style={{ padding: "4px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem" }}>
                                                            {isExpanded ? "▲" : "▼"}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && <RowDetail r={r} />}
                                            </React.Fragment>
                                        );
                                    })}

                                    {filtered.length === 0 && (
                                        <tr><td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                            {requests.length === 0 ? "No accommodation requests submitted yet." : "No requests match the current filter."}
                                        </td></tr>
                                    )}
                                </tbody>

                                {filtered.length > 0 && (
                                    <tfoot>
                                        <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                                            <td colSpan={3} style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "0.82rem", fontWeight: 700 }}>{filtered.length} requests shown</td>
                                            <td style={{ padding: "12px 14px", color: "#60a5fa", fontWeight: 800 }}>{totalBoys}</td>
                                            <td style={{ padding: "12px 14px", color: "#fb7185", fontWeight: 800 }}>{totalGirls}</td>
                                            <td style={{ padding: "12px 14px", color: "#a78bfa", fontWeight: 800 }}>{totalBoys + totalGirls}</td>
                                            <td colSpan={4} />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}

                {/* Allotment Modal */}
                {allotTarget && (
                    <AllotmentModal
                        request={allotTarget}
                        token={token}
                        onClose={() => setAllotTarget(null)}
                        onSaved={() => { setAllotTarget(null); fetchAll(); }}
                    />
                )}
            </div>
        </EMLayout>
    );
}