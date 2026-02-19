import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const EMPTY_FORM = { message: "", type: "announcement", priority: 2, expires_at: "" };

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

    const fetchNotifications = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/admin/notifications`, { headers })
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
            const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
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
            const res = await fetch(`${API_BASE}/api/admin/notifications/${id}/toggle`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchNotifications();
        } catch (err) { setError(err.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this notification permanently?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/notifications/${id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchNotifications();
        } catch (err) { setError(err.message); }
    };

    const handleEdit = (n) => {
        setForm({ message: n.message, type: n.type, priority: n.priority, expires_at: n.expires_at?.slice(0, 10) || "" });
        setEditingId(n.id);
        setShowForm(true);
    };

    const priorityColor = (p) => p === 1 ? "#f87171" : p === 2 ? "var(--accent-warning)" : "var(--accent-info)";

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Notifications</h3>
                    {isSuperAdmin && (
                        <button className="neon-btn" style={{ width: "auto", marginTop: 0, padding: "10px 24px" }}
                            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
                            + Add Notification
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {/* Create/Edit Form */}
                {showForm && isSuperAdmin && (
                    <div className="glass-card" style={{ marginBottom: "24px" }}>
                        <h4 style={{ marginTop: 0 }}>{editingId ? "Edit Notification" : "New Notification"}</h4>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem" }}>
                                        {["announcement", "deadline", "info", "reminder"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Priority (1=highest)</label>
                                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem" }}>
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Message *</label>
                                <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required rows={3}
                                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box" }} />
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Expires At (optional)</label>
                                <input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                                    style={{ padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem" }} />
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" className="neon-btn" style={{ width: "auto", marginTop: 0, padding: "10px 28px" }} disabled={saving}>
                                    {saving ? "Saving..." : editingId ? "Update" : "Create"}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                                    style={{ padding: "10px 24px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading...</div>
                ) : (
                    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                    {["Priority", "Type", "Message", "Status", "Expires", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map(n => (
                                    <tr key={n.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ background: `${priorityColor(n.priority)}20`, color: priorityColor(n.priority), padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700 }}>P{n.priority}</span>
                                        </td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "capitalize" }}>{n.type}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.9rem", maxWidth: "350px" }}>{n.message}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ background: n.is_active ? "rgba(16,185,129,0.2)" : "rgba(156,163,175,0.2)", color: n.is_active ? "#10b981" : "#9ca3af", padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                                                {n.is_active ? "Active" : "Hidden"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                            {n.expires_at ? new Date(n.expires_at).toLocaleDateString("en-IN") : "—"}
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            {isSuperAdmin ? (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button onClick={() => handleToggle(n.id)}
                                                        style={{ padding: "5px 12px", background: "rgba(96,165,250,0.15)", border: "1px solid #60a5fa", color: "#60a5fa", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        {n.is_active ? "Hide" : "Show"}
                                                    </button>
                                                    <button onClick={() => handleEdit(n)}
                                                        style={{ padding: "5px 12px", background: "rgba(212,175,55,0.15)", border: "1px solid #d4af37", color: "#d4af37", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(n.id)}
                                                        style={{ padding: "5px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        Delete
                                                    </button>
                                                </div>
                                            ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>View only</span>}
                                        </td>
                                    </tr>
                                ))}
                                {notifications.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No notifications found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}