import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const EMPTY_FORM = { date: "", title: "", type: "blue", place: "", time: "" };

export default function AdminCalendar() {
    const [events, setEvents] = useState([]);
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

    const fetchEvents = () => {
        setLoading(true);
        adminFetch(`${API_BASE}/api/admin/calendar-events`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setEvents(d.data); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId
                ? `${API_BASE}/api/admin/calendar-events/${editingId}`
                : `${API_BASE}/api/admin/calendar-events`;
            const method = editingId ? "PUT" : "POST";
            const res = await adminFetch(url, { method, headers, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setShowForm(false); setForm(EMPTY_FORM); setEditingId(null);
            fetchEvents();
        } catch (err) { setError(err.message); } finally { setSaving(false); }
    };

    const handleToggle = async (id) => {
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/calendar-events/${id}/toggle`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchEvents();
        } catch (err) { setError(err.message); }
    };

    const handleDelete = async (id) => {
        const ok = await showConfirm({
            title: "Delete Event",
            message: "Delete this calendar event permanently? This cannot be undone.",
            confirmLabel: "Yes, Delete",
            type: "danger",
        });
        if (!ok) return;
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/calendar-events/${id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            fetchEvents();
        } catch (err) { setError(err.message); }
    };

    const handleEdit = (ev) => {
        setForm({ date: ev.date, title: ev.title, type: ev.type, place: ev.place, time: ev.time });
        setEditingId(ev.id);
        setShowForm(true);
    };

    const typeColor = (t) => t === "green" ? "#10b981" : t === "red" ? "#f87171" : "#60a5fa";

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Calendar Events</h3>
                    {isSuperAdmin && (
                        <button className="neon-btn" style={{ width: "auto", marginTop: 0, padding: "10px 24px" }}
                            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
                            + Add Event
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {/* Form */}
                {showForm && isSuperAdmin && (
                    <div className="glass-card" style={{ marginBottom: "24px" }}>
                        <h4 style={{ marginTop: 0 }}>{editingId ? "Edit Event" : "New Calendar Event"}</h4>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Date *</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Time *</label>
                                    <input type="text" placeholder="e.g. 9:00 AM" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} required
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Title *</label>
                                    <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Place *</label>
                                    <input type="text" value={form.place} onChange={e => setForm(p => ({ ...p, place: e.target.value }))} required
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Color Tag</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem" }}>
                                        <option value="blue">Blue</option>
                                        <option value="green">Green</option>
                                        <option value="red">Red</option>
                                    </select>
                                </div>
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
                                    {["Date", "Time", "Title", "Place", "Type", "Status", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(ev => (
                                    <tr key={ev.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.9rem" }}>{new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>{ev.time}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.9rem" }}>{ev.title}</td>
                                        <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>{ev.place}</td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ background: `${typeColor(ev.type)}20`, color: typeColor(ev.type), padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize" }}>{ev.type}</span>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            <span style={{ background: ev.is_active ? "rgba(16,185,129,0.2)" : "rgba(156,163,175,0.2)", color: ev.is_active ? "#10b981" : "#9ca3af", padding: "3px 10px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 600 }}>
                                                {ev.is_active ? "Visible" : "Hidden"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                            {isSuperAdmin ? (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button onClick={() => handleToggle(ev.id)} style={{ padding: "5px 12px", background: "rgba(96,165,250,0.15)", border: "1px solid #60a5fa", color: "#60a5fa", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                                                        {ev.is_active ? "Hide" : "Show"}
                                                    </button>
                                                    <button onClick={() => handleEdit(ev)} style={{ padding: "5px 12px", background: "rgba(212,175,55,0.15)", border: "1px solid #d4af37", color: "#d4af37", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                                                    <button onClick={() => handleDelete(ev.id)} style={{ padding: "5px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
                                                </div>
                                            ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>View only</span>}
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && (
                                    <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No events found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}