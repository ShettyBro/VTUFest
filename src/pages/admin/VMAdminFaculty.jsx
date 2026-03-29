import { useState, useEffect } from "react";
import VMLayout from "../vm/VMLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";
const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const PANEL_OPTIONS = [
    { value: "transport", label: "Transport", role: "TRANSPORT_MANAGER", login: "/api/transport-manager/login", qrOnly: false },
    { value: "event_manager", label: "Event Manager", role: "EVENT_MANAGER", login: "/api/em/auth/login", qrOnly: false },
    { value: "accounts", label: "Accounts", role: "ACCOUNTS", login: "/api/em/auth/login", qrOnly: false },
    { value: "gr_incharge", label: "GR Incharge", role: "GR_INCHARGE", login: "/api/em/auth/login", qrOnly: false },
    { value: "food", label: "Food Manager", role: "FOOD_MANAGER", login: "/api/em/auth/login (future)", qrOnly: false },
    { value: "core_team", label: "👥 Core Team (Faculty)", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
    { value: "special_access", label: "🔑 Admin / Developer", role: "QR Pass Only", login: "No portal — QR code issued", qrOnly: true },
];

const STATUS_COLORS = {
    pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    approved: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    assigned: { color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
};

function StatusBadge({ status }) {
    const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return <span style={{ background: c.bg, color: c.color, padding: "3px 9px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>{status}</span>;
}

function PhotoModal({ url, name, onClose }) {
    return (
        <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ position: "relative", maxWidth: "420px", width: "100%" }}>
                <button onClick={onClose} style={{ position: "absolute", top: "-40px", right: 0, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: "8px", padding: "6px 14px", cursor: "pointer" }}>✕ Close</button>
                <img src={url} alt={name} style={{ width: "100%", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.2)" }} onError={e => { e.target.alt = "Photo unavailable"; }} />
                <div style={{ textAlign: "center", marginTop: "10px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>{name}</div>
            </div>
        </div>
    );
}

/* ── Assign Panel Modal ── */
function AssignPanelModal({ faculty, token, onClose, onDone }) {
    // Only pre-select if requested_domain maps to a valid PANEL_OPTIONS entry
    const validDefault = faculty.requested_domain && PANEL_OPTIONS.find(p => p.value === faculty.requested_domain)
        ? faculty.requested_domain
        : "";
    const [panel, setPanel] = useState(validDefault);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [result, setResult] = useState(null);
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const handleAssign = async () => {
        if (!panel) return setErr("Please select a panel.");
        setSaving(true); setErr("");
        try {
            const res = await adminFetch(`${API}/api/vm/admin/faculty/${faculty.id}/assign`, { method: "PATCH", headers, body: JSON.stringify({ panel }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Assignment failed.");
            setResult(data);
        } catch (ex) { setErr(ex.message); }
        finally { setSaving(false); }
    };

    const selPanel = PANEL_OPTIONS.find(p => p.value === panel);
    const is = { padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none", width: "100%", boxSizing: "border-box" };

    return (
        <div onClick={e => e.target === e.currentTarget && !result && onClose()} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem" }}>👨‍🏫 Assign Panel</h2>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "3px" }}>{faculty.full_name} — {faculty.email}</div>
                    </div>
                    <button onClick={result ? onDone : onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>
                        {result ? "✕ Close" : "✕ Cancel"}
                    </button>
                </div>

                {result ? (
                    <div>
                        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: "10px", padding: "16px", marginBottom: "14px" }}>
                            <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: "6px" }}>✅ Panel Assigned!</div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{result.message}</div>
                        </div>
                        <button onClick={onDone} style={{ width: "100%", padding: "10px", background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>Done</button>
                    </div>
                ) : (
                    <>
                        {/* Panel → Portal info table */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflowY: "auto", maxHeight: "280px", marginBottom: "18px" }}>
                            <div style={{ position: "sticky", top: 0, background: "#111827", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", zIndex: 10 }}>Panel → Portal Mapping</div>
                            {PANEL_OPTIONS.map(p => (
                                <div key={p.value} onClick={() => setPanel(p.value)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: panel === p.value ? "rgba(99,102,241,0.1)" : "transparent", transition: "background 0.15s" }}>
                                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: panel === p.value ? "none" : "2px solid rgba(255,255,255,0.2)", background: panel === p.value ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", color: "white", fontWeight: 900, flexShrink: 0 }}>
                                        {panel === p.value ? "✓" : ""}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: panel === p.value ? "#f1f5f9" : "var(--text-secondary)", fontWeight: panel === p.value ? 600 : 400, fontSize: "0.87rem" }}>{p.label}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{p.role} → <code style={{ color: "rgba(168,237,234,0.7)" }}>{p.login}</code></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selPanel && !selPanel.qrOnly && (
                            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.82rem", color: "#818cf8" }}>
                                📧 An email with credentials and the portal URL will be sent to <strong>{faculty.email}</strong> on assignment.
                            </div>
                        )}
                        {selPanel?.qrOnly && (
                            <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.82rem", color: "#fbbf24" }}>
                                🔑 A unique <strong>QR Access Pass</strong> will be generated and emailed to <strong>{faculty.email}</strong>. No portal account is created.
                            </div>
                        )}

                        {err && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "0.85rem" }}>{err}</div>}

                        <button onClick={handleAssign} disabled={saving || !panel} style={{ width: "100%", padding: "11px", background: selPanel?.qrOnly ? (saving || !panel ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.15)") : (saving || !panel ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.2)"), border: `1px solid ${selPanel?.qrOnly ? "#d4af37" : "#6366f1"}`, color: selPanel?.qrOnly ? "#fbbf24" : "#818cf8", borderRadius: "10px", cursor: saving || !panel ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.9rem" }}>
                            {saving ? "Assigning…" : selPanel?.qrOnly ? `🔑 Grant Special Access` : `✅ Assign as ${selPanel?.label || "Panel"}`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function VMAdminFaculty() {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const LIMIT = 50;

    const [actionId, setActionId] = useState(null);
    const [photoModal, setPhotoModal] = useState(null);
    const [assignModal, setAssignModal] = useState(null); // faculty object
    const [unassignId, setUnassignId] = useState(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const { showConfirm } = usePopup();

    const fetchFaculty = async () => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ status: statusFilter, page, limit: LIMIT, ...(search ? { search } : {}) });
            const res = await adminFetch(`${API}/api/vm/admin/faculty?${params}`, { headers });
            const data = await res.json();
            setFaculty(data.faculty || data.data || []);
            setTotal(data.total || 0);
        } catch { setError("Network error"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFaculty(); }, [statusFilter, page]);

    const flash = (msg, isErr = false) => {
        if (isErr) { setError(msg); setTimeout(() => setError(""), 5000); }
        else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 5000); }
    };

    const handleApprove = async (f) => {
        setActionId(f.id);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/faculty/${f.id}/approve`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            flash(data.message || `${f.full_name} approved.`);
            fetchFaculty();
        } catch (ex) { flash(ex.message, true); }
        finally { setActionId(null); }
    };

    const handleReject = async (f) => {
        const ok = await showConfirm({ title: "Reject Faculty", message: `Delete ${f.full_name}'s registration? They can re-register.`, confirmLabel: "Yes, Delete", type: "danger" });
        if (!ok) return;
        setActionId(f.id);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/faculty/${f.id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            flash(data.message || "Removed.");
            fetchFaculty();
        } catch (ex) { flash(ex.message, true); }
        finally { setActionId(null); }
    };

    const handleUnassign = async (f) => {
        const ok = await showConfirm({ title: "Remove Assigned Faculty", message: `Remove ${f.full_name} from their ${f.domain} role? Their QR/account will be freed and status reset to approved.`, confirmLabel: "Yes, Remove", type: "danger" });
        if (!ok) return;
        setUnassignId(f.id);
        try {
            const res = await adminFetch(`${API}/api/vm/admin/faculty/${f.id}/unassign`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Unassign failed.");
            flash(data.message || `${f.full_name} unassigned.`);
            fetchFaculty();
        } catch (ex) { flash(ex.message, true); }
        finally { setUnassignId(null); }
    };

    const thS = { padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: 0, zIndex: 2 };
    const tdS = { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" };
    const btnS = (color) => ({ padding: "4px 10px", background: `${color}18`, border: `1px solid ${color}`, color, borderRadius: "6px", cursor: "pointer", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" });

    return (
        <VMLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>👨‍🏫 VM Faculty Registrations <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.95rem" }}>({total})</span></h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Review photo, approve or assign faculty to panels → they get portal credentials by email</p>
                    </div>
                    <button onClick={() => { setPage(1); fetchFaculty(); }} style={{ padding: "9px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>🔄 Refresh</button>
                </div>

                {/* Panel → Portal info card */}
                <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
                    <div style={{ color: "#818cf8", fontWeight: 700, fontSize: "0.8rem", marginBottom: "8px" }}>📌 Panel → Portal Mapping (for reference)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {PANEL_OPTIONS.map(p => (
                            <div key={p.value} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "5px 10px", fontSize: "0.73rem" }}>
                                <span style={{ color: "#818cf8", fontWeight: 700 }}>{p.label}</span>
                                <span style={{ color: "var(--text-muted)" }}> → </span>
                                <code style={{ color: "rgba(168,237,234,0.8)", fontSize: "0.7rem" }}>{p.login}</code>
                            </div>
                        ))}
                    </div>
                </div>

                {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>{error}</div>}
                {successMsg && <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>✅ {successMsg}</div>}

                {/* Filters */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "3px" }}>
                        {["pending", "approved", "assigned"].map(s => (
                            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{ padding: "6px 14px", background: statusFilter === s ? "rgba(255,255,255,0.15)" : "transparent", border: "none", color: statusFilter === s ? "#f1f5f9" : "var(--text-muted)", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: statusFilter === s ? 600 : 400, textTransform: "capitalize" }}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <div style={{ position: "relative", flex: "1 1 200px" }}>
                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                        <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchFaculty()} style={{ width: "100%", boxSizing: "border-box", padding: "7px 12px 7px 32px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }} />
                    </div>
                    <button onClick={() => { setPage(1); fetchFaculty(); }} style={{ padding: "7px 14px", background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>Search</button>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}><div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading faculty…</div>
                ) : faculty.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}><div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📭</div>No {statusFilter} faculty found.</div>
                ) : (
                    <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={thS}>Photo</th>
                                    <th style={thS}>Name</th>
                                    <th style={thS}>Email</th>
                                    <th style={thS}>Phone</th>
                                    <th style={thS}>Requested Panel</th>
                                    <th style={thS}>Assigned Panel</th>
                                    <th style={thS}>Status</th>
                                    <th style={thS}>Approved By</th>
                                    <th style={thS}>Registered</th>
                                    <th style={{ ...thS, textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {faculty.map(f => (
                                    <tr key={f.id}>
                                        <td style={tdS}>
                                            {f.photo_url ? (
                                                <img src={f.photo_url} alt={f.full_name} onClick={() => setPhotoModal({ url: f.photo_url, name: f.full_name })} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", cursor: "zoom-in", border: "2px solid rgba(255,255,255,0.15)" }} onError={e => { e.target.style.display = "none"; }} />
                                            ) : <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>}
                                        </td>
                                        <td style={tdS}><span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.87rem" }}>{f.full_name}</span></td>
                                        <td style={tdS}><span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{f.email}</span></td>
                                        <td style={tdS}><span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{f.phone || "—"}</span></td>
                                        <td style={tdS}>
                                            {f.requested_domain ? (
                                                <span style={{ background: "rgba(129,140,248,0.12)", color: "#818cf8", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600 }}>
                                                    {PANEL_OPTIONS.find(p => p.value === f.requested_domain)?.label || f.requested_domain}
                                                </span>
                                            ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                        </td>
                                        <td style={tdS}>
                                            {f.domain ? (
                                                <span style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600 }}>
                                                    {PANEL_OPTIONS.find(p => p.value === f.domain)?.label || f.domain}
                                                </span>
                                            ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                        </td>
                                        <td style={tdS}><StatusBadge status={f.status} /></td>
                                        <td style={{ ...tdS, fontSize: "0.78rem", color: "var(--text-muted)" }}>{f.approved_by_name || "—"}</td>
                                        <td style={{ ...tdS, fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt(f.created_at)}</td>
                                        <td style={{ ...tdS, textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                {f.status === "pending" && (
                                                    <button onClick={() => handleApprove(f)} disabled={actionId === f.id} style={btnS("#60a5fa")}>
                                                        {actionId === f.id ? "…" : "✅ Approve"}
                                                    </button>
                                                )}
                                                {f.status === "approved" && (
                                                    <button onClick={() => setAssignModal(f)} style={btnS("#a78bfa")}>
                                                        📋 Assign Panel
                                                    </button>
                                                )}
                                                {f.status !== "assigned" && (
                                                    <button onClick={() => handleReject(f)} disabled={actionId === f.id} style={btnS("#f87171")}>
                                                        {actionId === f.id ? "…" : "🗑 Reject"}
                                                    </button>
                                                )}
                                                {f.status === "assigned" && (
                                                    <button onClick={() => handleUnassign(f)} disabled={unassignId === f.id} style={btnS("#ef4444")}>
                                                        {unassignId === f.id ? "…" : "🗑 Remove"}
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

            {photoModal && <PhotoModal url={photoModal.url} name={photoModal.name} onClose={() => setPhotoModal(null)} />}
        </VMLayout>
    );
}
