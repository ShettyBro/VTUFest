import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const STATUS_CFG = {
    PENDING:   { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.45)",  label: "⏳ Pending"   },
    ALLOCATED: { color: "#10b981", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.45)",  label: "✅ Allocated" },
    REJECTED:  { color: "#f87171", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.45)",   label: "❌ Rejected"  },
    CANCELLED: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.4)",  label: "🚫 Cancelled" },
};
const scfg = (s) => STATUS_CFG[s?.toUpperCase()] || STATUS_CFG.PENDING;

const STATUS_TABS = ["ALL", "PENDING", "ALLOCATED", "REJECTED", "CANCELLED"];

// ─── Allocate / Reassign Modal ─────────────────────────────────────────────────
function AllocateModal({ request, onClose, onDone }) {
    const token = localStorage.getItem("vtufest_admin_token");
    const [form, setForm] = useState({
        building_name: request.building_name || "",
        floor_number:  request.floor_number  || "",
        room_number:   request.room_number   || "",
        capacity:      request.capacity ? String(request.capacity) : "",
        notes:         request.allocation_notes || "",
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const isReassign = !!request.allocation_id;

    const handleSave = async () => {
        if (!form.building_name.trim() || !form.floor_number.trim() || !form.room_number.trim() || !form.capacity) {
            setErr("Building name, floor, room number and capacity are required."); return;
        }
        const cap = parseInt(form.capacity);
        if (isNaN(cap) || cap < 1) { setErr("Capacity must be a positive number."); return; }
        setSaving(true); setErr("");
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/green-room/${request.id}/allocate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    building_name: form.building_name.trim(),
                    floor_number:  form.floor_number.trim(),
                    room_number:   form.room_number.trim(),
                    capacity:      cap,
                    notes:         form.notes.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Allocation failed");
            onDone();
        } catch (e) { setErr(e.message); }
        finally { setSaving(false); }
    };

    const inp = {
        width: "100%", padding: "9px 11px", boxSizing: "border-box",
        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "7px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none",
    };

    return (
        <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "520px", position: "relative" }}>
                <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
                <h4 style={{ margin: "0 0 4px", color: "var(--text-primary)" }}>
                    {isReassign ? "🏢 Reassign Room" : "🏢 Allocate Room"}
                </h4>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "20px" }}>
                    {request.college_name} <span style={{ opacity: 0.6 }}>({request.college_code})</span>
                    &nbsp;·&nbsp; 👥 <strong>{request.final_participant_count ?? request.requested_participants}</strong> participants
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Building Name <span style={{ color: "#f87171" }}>*</span></label>
                        <input style={inp} placeholder="e.g. Block A" value={form.building_name} onChange={(e) => setForm((p) => ({ ...p, building_name: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Floor <span style={{ color: "#f87171" }}>*</span></label>
                        <input style={inp} placeholder="e.g. Ground Floor" value={form.floor_number} onChange={(e) => setForm((p) => ({ ...p, floor_number: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Room Number <span style={{ color: "#f87171" }}>*</span></label>
                        <input style={inp} placeholder="e.g. GR-101" value={form.room_number} onChange={(e) => setForm((p) => ({ ...p, room_number: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Capacity <span style={{ color: "#f87171" }}>*</span></label>
                        <input type="number" min="1" style={inp} placeholder="e.g. 30" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
                        {request.final_participant_count != null && (
                            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "3px" }}>
                                Min required: {request.final_participant_count} (confirmed count)
                            </div>
                        )}
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>Notes (Optional)</label>
                        <textarea rows={3} style={{ ...inp, resize: "vertical" }} placeholder="Any special instructions..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                </div>

                {err && <div style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "14px", padding: "9px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.3)" }}>{err}</div>}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", fontWeight: 700, borderRadius: "8px", background: "rgba(16,185,129,0.18)", border: "1px solid #10b981", color: "#10b981", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                        {saving ? "Saving…" : isReassign ? "✅ Reassign Room" : "✅ Allocate Room"}
                    </button>
                    <button onClick={onClose} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

// ─── Action Modal (reject / cancel / reset) ───────────────────────────────────
function ActionModal({ request, action, onClose, onDone }) {
    const token = localStorage.getItem("vtufest_admin_token");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const needsReason = action !== "reset";

    const cfg = {
        reject: { label: "Reject Request",   color: "#f87171", confirmLabel: "❌ Confirm Reject" },
        cancel: { label: "Cancel Request",   color: "#f87171", confirmLabel: "🚫 Confirm Cancel" },
        reset:  { label: "Reset to Pending", color: "#a78bfa", confirmLabel: "🔄 Confirm Reset"  },
    }[action];

    const handleAction = async () => {
        if (needsReason && !reason.trim()) { setErr("Reason is required."); return; }
        setSaving(true); setErr("");
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/green-room/${request.id}/${action}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: needsReason ? JSON.stringify({ reason: reason.trim() }) : undefined,
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Action failed");
            onDone();
        } catch (e) { setErr(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "440px", position: "relative" }}>
                <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
                <h4 style={{ margin: "0 0 4px", color: cfg.color }}>{cfg.label}</h4>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "20px" }}>
                    {request.college_name} <span style={{ opacity: 0.6 }}>({request.college_code})</span>
                </div>
                {needsReason && (
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block", marginBottom: "6px" }}>
                            Reason <span style={{ color: "#f87171", fontWeight: 700 }}>*</span>
                        </label>
                        <textarea value={reason} onChange={(e) => { setReason(e.target.value); if (err) setErr(""); }}
                            rows={4} placeholder={`Reason for ${action}…`}
                            style={{ width: "100%", padding: "10px 12px", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: `1px solid ${err ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.12)"}`, borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", resize: "vertical", outline: "none" }}
                        />
                    </div>
                )}
                {err && <div style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "14px", padding: "9px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.3)" }}>{err}</div>}
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleAction} disabled={saving || (needsReason && !reason.trim())}
                        style={{ flex: 1, padding: "12px", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", background: (reason.trim() || !needsReason) ? `${cfg.color}22` : "rgba(255,255,255,0.04)", border: `1px solid ${(reason.trim() || !needsReason) ? cfg.color : "rgba(255,255,255,0.1)"}`, color: (reason.trim() || !needsReason) ? cfg.color : "var(--text-muted)", cursor: (saving || (needsReason && !reason.trim())) ? "not-allowed" : "pointer" }}>
                        {saving ? "Processing…" : cfg.confirmLabel}
                    </button>
                    <button onClick={onClose} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

// ─── Expanded Row Detail ───────────────────────────────────────────────────────
function RowDetail({ r }) {
    return (
        <tr>
            <td colSpan={9} style={{ padding: 0 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Contact Person</div>
                        <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{r.contact_person_name}</div>
                        <a href={`tel:${r.contact_person_phone}`} style={{ color: "#60a5fa", fontSize: "0.82rem", textDecoration: "none" }}>{r.contact_person_phone}</a>
                    </div>
                    {r.special_requirements && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Special Requirements</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{r.special_requirements}</div>
                        </div>
                    )}
                    {r.rejection_reason && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Reason</div>
                            <div style={{ color: "#f87171", fontSize: "0.85rem", background: "rgba(239,68,68,0.08)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>{r.rejection_reason}</div>
                        </div>
                    )}
                    {r.allocation_id && (
                        <div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Room</div>
                            <div style={{ color: "#10b981", fontWeight: 600, fontSize: "0.88rem" }}>{r.building_name} · Floor {r.floor_number} · Room {r.room_number}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Cap: {r.capacity} · {fmt(r.allocated_at)}</div>
                            {r.allocation_notes && <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "4px" }}>{r.allocation_notes}</div>}
                        </div>
                    )}
                    <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Applied At</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{fmt(r.applied_at)}</div>
                    </div>
                </div>
            </td>
        </tr>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminGreenRoom() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [allocateTarget, setAllocateTarget] = useState(null);
    const [actionTarget, setActionTarget] = useState(null); // { request, action }

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(() => {
        setLoading(true);
        adminFetch(`${API_BASE}/api/admin/green-room`, { headers })
            .then((r) => r.json())
            .then((d) => { if (d.success) setRequests(d.data); else setError(d.message || "Failed to load"); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => { fetchAll(); }, []);

    const filtered = requests.filter((r) => {
        const matchStatus = filter === "ALL" || r.status?.toUpperCase() === filter;
        const q = search.toLowerCase();
        const matchSearch = !q
            || r.college_name?.toLowerCase().includes(q)
            || r.college_code?.toLowerCase().includes(q)
            || r.contact_person_name?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    return (
        <AdminLayout>
            <div style={{ padding: "8px 0" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>🏢 Green Room Requests</h3>
                    <button onClick={fetchAll} style={{ padding: "8px 18px", background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#10b981", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
                        ⟳ Refresh
                    </button>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error}
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {/* Filter tabs + search */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                    {STATUS_TABS.map((f) => {
                        const count = requests.filter((r) => f === "ALL" || r.status?.toUpperCase() === f).length;
                        const c = f === "ALL" ? { color: "#94a3b8" } : { color: scfg(f).color };
                        return (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: "7px 14px", borderRadius: "20px", cursor: "pointer",
                                fontWeight: 600, fontSize: "0.8rem", transition: "all 0.2s",
                                background: filter === f ? `${c.color}25` : "rgba(255,255,255,0.06)",
                                border: `1px solid ${filter === f ? c.color : "rgba(255,255,255,0.12)"}`,
                                color: filter === f ? c.color : "var(--text-secondary)",
                            }}>
                                {f} ({count})
                            </button>
                        );
                    })}
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search college or contact…"
                        style={{ flex: 1, minWidth: "200px", padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none" }} />
                    <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{filtered.length} shown</div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>Loading green room requests…
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        {["College", "Code", "Status", "Req. Participants", "Final Count", "Applied At", "🏢 Room / Allocate", "Actions", ""].map((h) => (
                                            <th key={h} style={{ padding: "13px 14px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.73rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", background: "rgba(15,23,42,0.97)", position: "sticky", top: 0, zIndex: 2 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r) => {
                                        const s = scfg(r.status);
                                        const isExpanded   = expandedId === r.id;
                                        const isPending    = r.status?.toUpperCase() === "PENDING";
                                        const isAllocated  = r.status?.toUpperCase() === "ALLOCATED";
                                        const isDoneOrCancel = r.status?.toUpperCase() === "REJECTED" || r.status?.toUpperCase() === "CANCELLED";

                                        return (
                                            <React.Fragment key={r.id}>
                                                <tr
                                                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                >
                                                    {/* College */}
                                                    <td style={{ padding: "13px 14px", color: "var(--text-primary)", fontSize: "0.88rem", fontWeight: 600, maxWidth: "200px" }}>{r.college_name}</td>
                                                    {/* Code */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ background: "rgba(212,175,55,0.12)", color: "#d4af37", padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace" }}>{r.college_code}</span>
                                                    </td>
                                                    {/* Status */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: "4px 11px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>{s.label}</span>
                                                    </td>
                                                    {/* Req participants */}
                                                    <td style={{ padding: "13px 14px", color: "#a78bfa", fontWeight: 700 }}>{r.requested_participants ?? "—"}</td>
                                                    {/* Final count */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <span style={{ color: "#10b981", fontWeight: 700 }}>{r.final_participant_count ?? "—"}</span>
                                                        {r.final_participant_count != null && parseInt(r.final_participant_count) !== parseInt(r.requested_participants) && (
                                                            <span style={{ marginLeft: "4px", fontSize: "0.7rem", color: "#f59e0b" }}>⚠</span>
                                                        )}
                                                    </td>
                                                    {/* Applied at */}
                                                    <td style={{ padding: "13px 14px", color: "var(--text-muted)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fmt(r.applied_at)}</td>
                                                    {/* Room / Allocate */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        {isAllocated && r.allocation_id ? (
                                                            <div style={{ fontSize: "0.78rem" }}>
                                                                <div style={{ color: "#10b981", fontWeight: 600 }}>{r.building_name} / {r.floor_number} / {r.room_number}</div>
                                                                <div style={{ color: "var(--text-muted)" }}>Cap: {r.capacity}</div>
                                                            </div>
                                                        ) : !isDoneOrCancel ? (
                                                            <button onClick={() => setAllocateTarget(r)} style={{
                                                                padding: "6px 14px",
                                                                background: "rgba(212,175,55,0.15)", border: "1px solid #d4af37", color: "#d4af37",
                                                                borderRadius: "7px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", transition: "all 0.2s",
                                                            }}>
                                                                🏢 {isPending ? "Allocate" : "Reassign"}
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>—</span>
                                                        )}
                                                    </td>
                                                    {/* Actions */}
                                                    <td style={{ padding: "13px 14px" }}>
                                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                            {!isDoneOrCancel && (
                                                                <>
                                                                    <button onClick={() => setActionTarget({ request: r, action: "reject" })}
                                                                        style={{ padding: "5px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.45)", color: "#f87171", borderRadius: "7px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                                                                        ❌ Reject
                                                                    </button>
                                                                    {isAllocated && (
                                                                        <button onClick={() => setActionTarget({ request: r, action: "cancel" })}
                                                                            style={{ padding: "5px 12px", background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#94a3b8", borderRadius: "7px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                                                                            🚫 Cancel
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {isDoneOrCancel && (
                                                                <button onClick={() => setActionTarget({ request: r, action: "reset" })}
                                                                    style={{ padding: "5px 12px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.4)", color: "#a78bfa", borderRadius: "7px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}>
                                                                    🔄 Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Expand toggle */}
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
                                        <tr>
                                            <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                                {requests.length === 0 ? "No green room requests submitted yet." : "No requests match the current filter."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modals */}
                {allocateTarget && (
                    <AllocateModal
                        request={allocateTarget}
                        onClose={() => setAllocateTarget(null)}
                        onDone={() => { setAllocateTarget(null); fetchAll(); }}
                    />
                )}
                {actionTarget && (
                    <ActionModal
                        request={actionTarget.request}
                        action={actionTarget.action}
                        onClose={() => setActionTarget(null)}
                        onDone={() => { setActionTarget(null); fetchAll(); }}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
