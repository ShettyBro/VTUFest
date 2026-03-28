import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const today = () => new Date().toISOString().split("T")[0];

const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];

// Check if a meal window is currently active
const isLive = (w) => {
    const now = new Date();
    const [sh, sm] = (w.start_time || "00:00").split(":").map(Number);
    const [eh, em] = (w.end_time || "00:00").split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const cur = now.getHours() * 60 + now.getMinutes();
    const wDate = w.date?.split("T")[0] ?? w.date;
    return wDate === today() && cur >= start && cur <= end;
};

const ERROR_MESSAGES = {
    MEAL_TYPE_EXISTS_FOR_DATE: "This meal type is already scheduled for that date.",
    TIME_WINDOW_OVERLAPS: "Time window overlaps with an existing window on this date.",
    CANNOT_MODIFY_ACTIVE_WINDOW: "Cannot edit a currently active meal window.",
    CANNOT_DELETE_ACTIVE_WINDOW: "Cannot delete a currently active meal window.",
    REDEMPTIONS_EXIST: "Cannot delete — active redemptions already exist for this window.",
    MISSING_FIELDS: "Please fill in all required fields.",
};

function MealModal({ mode, initial, onSave, onClose, saving }) {
    const [form, setForm] = useState(initial || { date: today(), meal_type: "", start_time: "", end_time: "" });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "460px", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.1rem" }}>
                        {mode === "add" ? "➕ Add Meal Window" : "✏️ Edit Meal Window"}
                    </h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕ Close</button>
                </div>
                {[
                    { label: "Date", key: "date", type: "date" },
                    { label: "Meal Type", key: "meal_type", type: "select" },
                    { label: "Start Time", key: "start_time", type: "time" },
                    { label: "End Time", key: "end_time", type: "time" },
                ].map(({ label, key, type }) => (
                    <div key={key} style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label} *</label>
                        {type === "select" ? (
                            <select value={form[key]} onChange={e => set(key, e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: form[key] ? "#f1f5f9" : "var(--text-muted)", fontSize: "0.9rem", outline: "none" }}>
                                <option value="">Select meal type…</option>
                                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        ) : (
                            <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", outline: "none" }} />
                        )}
                    </div>
                ))}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
                    <button onClick={() => onSave(form)} disabled={saving}
                        style={{ flex: 2, padding: "10px", background: "rgba(129,140,248,0.2)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", opacity: saving ? 0.6 : 1 }}>
                        {saving ? "Saving…" : mode === "add" ? "Create Window" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FoodMeals() {
    const [windows, setWindows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [date, setDate] = useState("");
    const [modal, setModal] = useState(null); // null | { mode:'add' } | { mode:'edit', item }
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const { showPopup, showConfirm } = usePopup();

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchWindows = useCallback(() => {
        setLoading(true);
        setError("");
        const url = date ? `${API_BASE}/api/food/meals?date=${date}` : `${API_BASE}/api/food/meals`;
        adminFetch(url, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setWindows(d.data); else setError(d.message); })
            .catch(() => setError("Network error — could not load meal windows"))
            .finally(() => setLoading(false));
    }, [date]);

    useEffect(() => { fetchWindows(); }, [fetchWindows]);

    const handleSave = async (form) => {
        if (!form.date || !form.meal_type || !form.start_time || !form.end_time) {
            showPopup("Please fill in all required fields.", "error"); return;
        }
        setSaving(true);
        try {
            const isEdit = modal.mode === "edit";
            const url = isEdit ? `${API_BASE}/api/food/meals/${modal.item.id}` : `${API_BASE}/api/food/meals`;
            const res = await adminFetch(url, { method: isEdit ? "PUT" : "POST", headers, body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) {
                showPopup(isEdit ? "Meal window updated" : "Meal window created", "success");
                setModal(null);
                fetchWindows();
            } else {
                showPopup(ERROR_MESSAGES[data.message] || data.message || "Failed to save", "error");
            }
        } catch {
            showPopup("Network error", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (w) => {
        if (isLive(w)) { showPopup("Cannot delete an active meal window.", "error"); return; }
        const ok = await showConfirm({ title: "Delete Meal Window", message: `Delete ${w.meal_type} on ${w.date}? This cannot be undone.`, confirmLabel: "Yes, Delete", type: "danger" });
        if (!ok) return;
        setDeletingId(w.id);
        try {
            const res = await adminFetch(`${API_BASE}/api/food/meals/${w.id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (data.success) { showPopup("Meal window deleted", "success"); fetchWindows(); }
            else showPopup(ERROR_MESSAGES[data.message] || data.message || "Failed to delete", "error");
        } catch { showPopup("Network error", "error"); }
        finally { setDeletingId(null); }
    };

    const thS = { padding: "12px 14px", textAlign: "left", color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,23,42,0.97)", position: "sticky", top: 0, zIndex: 2 };
    const tdS = { padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle", color: "var(--text-primary)", fontSize: "0.88rem" };

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>🕐 Meal Windows</h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Manage daily meal redemption time slots</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            style={{ padding: "8px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.85rem", outline: "none" }} />
                        {date && <button onClick={() => setDate("")} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem" }}>Clear Filter</button>}
                        <button onClick={() => setModal({ mode: "add" })}
                            style={{ padding: "9px 18px", background: "rgba(129,140,248,0.2)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                            ➕ Add Meal Window
                        </button>
                        <button onClick={fetchWindows} style={{ padding: "9px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>🔄</button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading meal windows…
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: "auto", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px", background: "rgba(255,255,255,0.03)", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                            <thead>
                                <tr>
                                    {["Date", "Meal Type", "Start Time", "End Time", "Status", "Actions"].map(h => (
                                        <th key={h} style={thS}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {windows.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                                        {date ? `No meal windows on ${date}` : "No meal windows found — add one to get started"}
                                    </td></tr>
                                ) : windows.map(w => {
                                    const live = isLive(w);
                                    return (
                                        <tr key={w.id}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            style={{ transition: "background 0.15s" }}>
                                            <td style={tdS}>{w.date?.split("T")[0] ?? w.date}</td>
                                            <td style={tdS}>
                                                <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{w.meal_type}</span>
                                            </td>
                                            <td style={{ ...tdS, color: "#60a5fa" }}>{w.start_time?.slice(0, 5)}</td>
                                            <td style={{ ...tdS, color: "#60a5fa" }}>{w.end_time?.slice(0, 5)}</td>
                                            <td style={tdS}>
                                                {live ? (
                                                    <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "4px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>🟢 LIVE</span>
                                                ) : (
                                                    <span style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>Scheduled</span>
                                                )}
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button onClick={() => setModal({ mode: "edit", item: w })} disabled={live}
                                                        style={{ padding: "5px 12px", background: "rgba(251,191,36,0.12)", border: "1px solid #fbbf24", color: "#fbbf24", borderRadius: "6px", cursor: live ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700, opacity: live ? 0.4 : 1 }}>
                                                        ✏️ Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(w)} disabled={deletingId === w.id || live}
                                                        style={{ padding: "5px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: (deletingId === w.id || live) ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700, opacity: (deletingId === w.id || live) ? 0.4 : 1 }}>
                                                        {deletingId === w.id ? "…" : "🗑️ Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && windows.length > 0 && (
                    <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                        {windows.length} window{windows.length !== 1 ? "s" : ""}{date ? ` on ${date}` : ""}
                    </div>
                )}
            </div>

            {modal && (
                <MealModal
                    mode={modal.mode}
                    initial={modal.mode === "edit" ? { date: modal.item.date?.split("T")[0] ?? modal.item.date, meal_type: modal.item.meal_type, start_time: modal.item.start_time?.slice(0, 5), end_time: modal.item.end_time?.slice(0, 5) } : undefined}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}
        </AdminLayout>
    );
}
