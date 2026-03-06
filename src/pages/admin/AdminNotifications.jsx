import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const EMPTY_FORM = { message: "", type: "announcement", priority: 2, expires_at: "" };

const PRIORITY_META = {
    1: { label: "P1 · All — Ticker Banner", color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: "📢" },
    2: { label: "P2 · All — Bell Icon", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "🔔" },
    3: { label: "P3 · Students — Guidelines", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", icon: "🎓" },
    4: { label: "P4 · Managers — Notice Card", color: "#fb923c", bg: "rgba(251,146,60,0.12)", icon: "📋" },
    5: { label: "P5 · Principals — Notice Card", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "🏛️" },
};

const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    outline: "none",
};

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const token = localStorage.getItem("vtufest_admin_token");
    const isSuperAdmin = localStorage.getItem("vtufest_admin_role") === "SUPER_ADMIN";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const { showConfirm } = usePopup();

    const fetchNotifications = () => {
        setLoading(true);
        adminFetch(`${API_BASE}/api/admin/notifications`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setNotifications(d.data); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId
                ? `${API_BASE}/api/admin/notifications/${editingId}`
                : `${API_BASE}/api/admin/notifications`;
            const method = editingId ? "PUT" : "POST";
            const body = { ...form, priority: Number(form.priority), expires_at: form.expires_at || null };
            const res = await adminFetch(url, { method, headers, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShowForm(false);
            setForm(EMPTY_FORM);
            setEditingId(null);
            fetchNotifications();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/notifications/${id}/toggle`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchNotifications();
        } catch (err) { setError(err.message); }
    };

    const handleDelete = async (id) => {
        const ok = await showConfirm({
            title: "Delete Notification",
            message: "Delete this notification permanently? This cannot be undone.",
            confirmLabel: "Yes, Delete",
            type: "danger",
        });
        if (!ok) return;
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/notifications/${id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchNotifications();
        } catch (err) { setError(err.message); }
    };

    const handleEdit = (n) => {
        setForm({ message: n.message, type: n.type, priority: n.priority, expires_at: n.expires_at?.slice(0, 10) || "" });
        setEditingId(n.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const pm = PRIORITY_META[form.priority] || PRIORITY_META[2];

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>

                {/* ── HEADER ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.4rem" }}>Notifications</h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                            Manage system-wide notifications by priority and audience
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <button
                            className="neon-btn"
                            style={{ width: "auto", marginTop: 0, padding: "10px 24px" }}
                            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(v => !v); }}
                        >
                            {showForm && !editingId ? "✕ Cancel" : "+ Add Notification"}
                        </button>
                    )}
                </div>

                {/* ── ERROR BANNER ── */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
                    </div>
                )}

                {/* ── PRIORITY LEGEND ── */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                    {Object.entries(PRIORITY_META).map(([p, m]) => (
                        <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, background: m.bg, color: m.color, border: `1px solid ${m.color}40` }}>
                            {m.icon} {m.label}
                        </span>
                    ))}
                </div>

                {/* ── CREATE / EDIT FORM ── */}
                {showForm && isSuperAdmin && (
                    <div className="glass-card" style={{ marginBottom: "24px", borderLeft: `4px solid ${pm.color}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                            <span style={{ fontSize: "1.3rem" }}>{pm.icon}</span>
                            <div>
                                <h4 style={{ margin: 0, color: "var(--text-primary)" }}>
                                    {editingId ? "Edit Notification" : "New Notification"}
                                </h4>
                                <small style={{ color: pm.color }}>{pm.label}</small>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block", marginBottom: "6px" }}>Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                                        {["announcement", "deadline", "info", "reminder"].map(t => (
                                            <option key={t} value={t} style={{ background: "#1e293b" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block", marginBottom: "6px" }}>Priority & Audience</label>
                                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ ...inputStyle, borderColor: pm.color + "80" }}>
                                        {Object.entries(PRIORITY_META).map(([p, m]) => (
                                            <option key={p} value={p} style={{ background: "#1e293b" }}>{m.icon} {m.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block", marginBottom: "6px" }}>Message *</label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    required rows={3}
                                    placeholder="Type your notification message here..."
                                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.82rem", display: "block", marginBottom: "6px" }}>Expires At <span style={{ color: "var(--text-muted)" }}>(optional — leave blank for no expiry)</span></label>
                                <input
                                    type="date"
                                    value={form.expires_at}
                                    onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                                    style={{ ...inputStyle, width: "auto" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" className="neon-btn" style={{ width: "auto", marginTop: 0, padding: "10px 28px" }} disabled={saving}>
                                    {saving ? "Saving..." : editingId ? "Update" : "Create"}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                                    style={{ padding: "10px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── NOTIFICATIONS LIST ── */}
                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>
                        <div className="spinner" style={{ margin: "0 auto 12px" }} />
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔕</div>
                        <p style={{ margin: 0 }}>No notifications yet. Click <strong>+ Add Notification</strong> to create one.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {notifications.map(n => {
                            const meta = PRIORITY_META[n.priority] || PRIORITY_META[2];
                            return (
                                <div key={n.id} className="glass-card" style={{ padding: "16px 20px", borderLeft: `4px solid ${meta.color}`, opacity: n.is_active ? 1 : 0.55, transition: "opacity 0.2s" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>

                                        {/* LEFT: Content */}
                                        <div style={{ flex: 1, minWidth: "220px" }}>
                                            {/* Priority + Type + Status badges */}
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}>
                                                    {meta.icon} {meta.label}
                                                </span>
                                                <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                                                    {n.type}
                                                </span>
                                                <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: n.is_active ? "rgba(16,185,129,0.15)" : "rgba(156,163,175,0.12)", color: n.is_active ? "#10b981" : "#9ca3af" }}>
                                                    {n.is_active ? "● Active" : "○ Hidden"}
                                                </span>
                                                {n.expires_at && (
                                                    <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                                                        Expires {new Date(n.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Message */}
                                            <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.6 }}>{n.message}</p>
                                            {/* Date */}
                                            <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                                Created {new Date(n.date || n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>

                                        {/* RIGHT: Actions */}
                                        {isSuperAdmin ? (
                                            <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                                                <button onClick={() => handleToggle(n.id)}
                                                    style={{ padding: "6px 14px", background: n.is_active ? "rgba(156,163,175,0.12)" : "rgba(96,165,250,0.12)", border: `1px solid ${n.is_active ? "#9ca3af" : "#60a5fa"}`, color: n.is_active ? "#9ca3af" : "#60a5fa", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                                                    {n.is_active ? "Hide" : "Show"}
                                                </button>
                                                <button onClick={() => handleEdit(n)}
                                                    style={{ padding: "6px 14px", background: "rgba(212,175,55,0.12)", border: "1px solid #d4af37", color: "#d4af37", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(n.id)}
                                                    style={{ padding: "6px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0 }}>View only</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}