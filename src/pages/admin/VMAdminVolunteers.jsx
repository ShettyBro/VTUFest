import { useState, useEffect, useMemo, useRef } from "react";
import VMLayout from "../vm/VMLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const STATUS_COLORS = {
    pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    approved: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    assigned: { color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
};

const DOMAIN_LABELS = {
    registration_desk: "Registration Desk",
    help_desk: "Help Desk",
    in_event: "In-Event",
    college_buddy: "College Buddy",
    food: "Food",
    general: "General",
};

function StatusBadge({ status }) {
    const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
        <span style={{ background: c.bg, color: c.color, padding: "3px 9px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {status}
        </span>
    );
}

function PhotoModal({ url, name, onClose }) {
    return (
        <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ position: "relative", maxWidth: "480px", width: "100%" }}>
                <button onClick={onClose} style={{ position: "absolute", top: "-40px", right: 0, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕ Close</button>
                <img src={url} alt={name} style={{ width: "100%", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.2)" }} onError={e => { e.target.src = ""; e.target.alt = "Photo unavailable"; }} />
                <div style={{ textAlign: "center", marginTop: "10px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{name}</div>
            </div>
        </div>
    );
}

export default function VMAdminVolunteers() {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [statusFilter, setStatusFilter] = useState("pending");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 50;

    const [selected, setSelected] = useState([]); // ids for bulk
    const [bulkLoading, setBulkLoading] = useState(false);
    const [actionId, setActionId] = useState(null);
    const [photoModal, setPhotoModal] = useState(null); // { url, name }

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const { showConfirm } = usePopup();

    const fetchVolunteers = async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ status: statusFilter, page, limit: LIMIT, ...(search ? { search } : {}) });
            const res = await adminFetch(`${API}/api/vm/admin/volunteers?${params}`, { headers });
            const data = await res.json();
            if (data.success !== false) {
                setVolunteers(data.volunteers || data.data || []);
                setTotal(data.total || 0);
            } else setError(data.message || "Failed to load");
        } catch { setError("Network error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVolunteers(); }, [statusFilter, page]);

    const flash = (msg, isErr = false) => {
        if (isErr) { setError(msg); setTimeout(() => setError(""), 5000); }
        else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 5000); }
    };

    const handleApprove = async (v) => {
        setActionId(v.id);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/volunteers/${v.id}/approve`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            flash(data.message || `${v.full_name} approved.`);
            fetchVolunteers();
        } catch (ex) { flash(ex.message, true); }
        finally { setActionId(null); }
    };

    const handleReject = async (v) => {
        const ok = await showConfirm({ title: "Reject Volunteer", message: `Delete ${v.full_name}'s registration? They can re-register.`, confirmLabel: "Yes, Delete", type: "danger" });
        if (!ok) return;
        setActionId(v.id);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/volunteers/${v.id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            flash(data.message || `${v.full_name} removed.`);
            fetchVolunteers();
        } catch (ex) { flash(ex.message, true); }
        finally { setActionId(null); }
    };

    const handleToggleActive = async (v) => {
        setActionId(`toggle-${v.id}`);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/volunteers/${v.id}/toggle-active`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            flash(`${v.full_name} ${data.is_active ? "activated" : "deactivated"}.`);
            setVolunteers(prev => prev.map(vol => vol.id === v.id ? { ...vol, is_active: data.is_active } : vol));
        } catch (ex) { flash(ex.message, true); }
        finally { setActionId(null); }
    };

    const handleBulkApprove = async () => {
        if (!selected.length) return;
        const ok = await showConfirm({ title: "Bulk Approve", message: `Approve ${selected.length} volunteer(s)?`, confirmLabel: "Approve All", type: "confirm" });
        if (!ok) return;
        setBulkLoading(true);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/volunteers/bulk-approve`, { method: "PATCH", headers, body: JSON.stringify({ ids: selected }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            flash(`${data.approved_count || selected.length} volunteer(s) approved.`);
            setSelected([]);
            fetchVolunteers();
        } catch (ex) { flash(ex.message, true); }
        finally { setBulkLoading(false); }
    };

    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const allSelected = volunteers.length > 0 && volunteers.every(v => selected.includes(v.id));
    const toggleAll = () => setSelected(allSelected ? [] : volunteers.map(v => v.id));

    const thS = { padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: 0, zIndex: 2 };
    const tdS = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" };
    const btnS = (color) => ({ padding: "4px 10px", background: `${color}18`, border: `1px solid ${color}`, color, borderRadius: "6px", cursor: "pointer", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" });

    return (
        <VMLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>🙋‍♂️ VM Volunteer Registrations <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.95rem" }}>({total})</span></h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Review photo, approve or reject volunteer applications</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {selected.length > 0 && (
                            <button onClick={handleBulkApprove} disabled={bulkLoading} style={{ padding: "9px 16px", background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem", fontWeight: 700 }}>
                                {bulkLoading ? "Approving…" : `✅ Approve ${selected.length} Selected`}
                            </button>
                        )}
                        <button onClick={() => { setPage(1); fetchVolunteers(); }} style={{ padding: "9px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>🔄 Refresh</button>
                    </div>
                </div>

                {/* Messages */}
                {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>{error}</div>}
                {successMsg && <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>✅ {successMsg}</div>}

                {/* Filters */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                    {/* Status filter tabs */}
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "3px" }}>
                        {["pending", "approved", "assigned"].map(s => (
                            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); setSelected([]); }} style={{ padding: "6px 14px", background: statusFilter === s ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: statusFilter === s ? "#f1f5f9" : "var(--text-muted)", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: statusFilter === s ? 600 : 400, textTransform: "capitalize" }}>
                                {s}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                        <input
                            placeholder="Search name, email, AUID…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && fetchVolunteers()}
                            style={{ width: "100%", boxSizing: "border-box", padding: "7px 12px 7px 32px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }}
                        />
                    </div>
                    <button onClick={() => { setPage(1); fetchVolunteers(); }} style={{ padding: "7px 14px", background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>Search</button>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading volunteers…
                    </div>
                ) : volunteers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>
                        No {statusFilter} volunteers found.
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={thS}><input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: "#818cf8" }} /></th>
                                    <th style={thS}>Photo</th>
                                    <th style={thS}>Name / AUID</th>
                                    <th style={thS}>Email / Phone</th>
                                    <th style={thS}>Domain</th>
                                    <th style={thS}>Status</th>
                                    <th style={thS}>Active</th>
                                    <th style={thS}>Registered</th>
                                    <th style={{ ...thS, textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volunteers.map(v => (
                                    <tr key={v.id} style={{ background: selected.includes(v.id) ? "rgba(99,102,241,0.05)" : "transparent" }}>
                                        <td style={tdS}><input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggleSelect(v.id)} style={{ accentColor: "#818cf8" }} /></td>
                                        <td style={tdS}>
                                            {v.photo_url ? (
                                                <img
                                                    src={v.photo_url}
                                                    alt={v.full_name}
                                                    onClick={() => setPhotoModal({ url: v.photo_url, name: v.full_name })}
                                                    style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", cursor: "zoom-in", border: "2px solid rgba(255,255,255,0.15)" }}
                                                    onError={e => { e.target.style.display = "none"; }}
                                                />
                                            ) : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>No photo</span>}
                                        </td>
                                        <td style={tdS}>
                                            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.87rem" }}>{v.full_name}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "2px" }}>{v.auid}</div>
                                        </td>
                                        <td style={tdS}>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{v.email}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{v.phone}</div>
                                        </td>
                                        <td style={tdS}>
                                            <span style={{ background: "rgba(129,140,248,0.12)", color: "#818cf8", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600 }}>
                                                {DOMAIN_LABELS[v.requested_domain] || v.requested_domain || "—"}
                                            </span>
                                        </td>
                                        <td style={tdS}><StatusBadge status={v.status} /></td>
                                        <td style={tdS}>
                                            <span style={{ color: v.is_active ? "#4ade80" : "#f87171", fontSize: "0.78rem", fontWeight: 600 }}>
                                                {v.is_active ? "✅" : "❌"}
                                            </span>
                                        </td>
                                        <td style={{ ...tdS, fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt(v.created_at)}</td>
                                        <td style={{ ...tdS, textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                {v.status === "pending" && (
                                                    <button onClick={() => handleApprove(v)} disabled={actionId === v.id} style={btnS("#4ade80")}>
                                                        {actionId === v.id ? "…" : "✅ Approve"}
                                                    </button>
                                                )}
                                                {v.status !== "assigned" && (
                                                    <button onClick={() => handleReject(v)} disabled={actionId === v.id} style={btnS("#f87171")}>
                                                        {actionId === v.id ? "…" : "🗑 Reject"}
                                                    </button>
                                                )}
                                                {v.status === "approved" && (
                                                    <button onClick={() => handleToggleActive(v)} disabled={actionId === `toggle-${v.id}`} style={btnS(v.is_active ? "#fbbf24" : "#34d399")}>
                                                        {v.is_active ? "⏸ Suspend" : "▶ Restore"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {total > LIMIT && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "14px" }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "6px", cursor: "pointer" }}>← Prev</button>
                        <span style={{ padding: "6px 12px", color: "var(--text-muted)", fontSize: "0.85rem" }}>Page {page} / {Math.ceil(total / LIMIT)}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "6px", cursor: "pointer" }}>Next →</button>
                    </div>
                )}
            </div>

            {/* Photo zoom modal */}
            {photoModal && <PhotoModal url={photoModal.url} name={photoModal.name} onClose={() => setPhotoModal(null)} />}
        </VMLayout>
    );
}
