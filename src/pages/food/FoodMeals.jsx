import { useState, useEffect, useCallback } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const todayStr = () => new Date().toISOString().split("T")[0];

// Generate the next 7 days from today
const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split("T")[0]);
    }
    return days;
};

const MEAL_PRESETS = ["breakfast", "tiffin", "lunch", "snacks", "dinner"];

const MEAL_COLORS = {
    breakfast: { bg: "rgba(245,158,11,0.18)", border: "#f59e0b", text: "#fbbf24" },
    tiffin: { bg: "rgba(244,114,182,0.18)", border: "#f472b6", text: "#f9a8d4" },
    lunch: { bg: "rgba(16,185,129,0.18)", border: "#10b981", text: "#34d399" },
    snacks: { bg: "rgba(96,165,250,0.18)", border: "#60a5fa", text: "#93c5fd" },
    dinner: { bg: "rgba(167,139,250,0.18)", border: "#a78bfa", text: "#c4b5fd" },
};
function getMealColor(meal) {
    return MEAL_COLORS[meal?.toLowerCase()] || { bg: "rgba(129,140,248,0.15)", border: "#818cf8", text: "#a5b4fc" };
}

const isLive = (w) => {
    const now = new Date();
    const [sh, sm] = (w.start_time || "00:00").split(":").map(Number);
    const [eh, em] = (w.end_time || "00:00").split(":").map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();
    const wDate = w.date?.split("T")[0] ?? w.date;
    return wDate === todayStr() && cur >= sh * 60 + sm && cur <= eh * 60 + em;
};

const ERROR_MSGS = {
    MEAL_TYPE_EXISTS_FOR_DATE: "This meal type is already scheduled for that date.",
    TIME_WINDOW_OVERLAPS: "Time window overlaps with an existing window on this date.",
    CANNOT_MODIFY_ACTIVE_WINDOW: "Cannot edit a currently active meal window.",
    CANNOT_DELETE_ACTIVE_WINDOW: "Cannot delete a currently active meal window.",
    REDEMPTIONS_EXIST: "Cannot delete — redemptions already exist for this window.",
    MISSING_FIELDS: "Please fill in all required fields.",
    MEAL_WINDOW_NOT_FOUND: "Meal window not found.",
};

// ── Time input: shows HH:MM with up/down arrows ───────────────────────────────
function TimeInput({ value, onChange, label }) {
    const [h, m] = (value || "00:00").split(":").map(Number);

    const pad = n => String(n).padStart(2, "0");
    const emit = (hh, mm) => onChange(`${pad(hh)}:${pad(mm)}`);

    const adjH = delta => emit((h + delta + 24) % 24, m);
    const adjM = delta => {
        let newM = m + delta;
        let newH = h;
        if (newM >= 60) { newM -= 60; newH = (newH + 1) % 24; }
        if (newM < 0) { newM += 60; newH = (newH - 1 + 24) % 24; }
        emit(newH, newM);
    };

    const btnStyle = (active) => ({
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#94a3b8", borderRadius: "4px", cursor: "pointer",
        padding: "2px 6px", fontSize: "0.75rem", lineHeight: 1,
        transition: "background 0.15s",
    });

    const segStyle = {
        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
    };

    return (
        <div>
            {label && (
                <label style={{ display: "block", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "8px" }}>
                    {label} *
                </label>
            )}
            <div style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "10px", padding: "10px 14px",
            }}>
                {/* Hour */}
                <div style={segStyle}>
                    <button style={btnStyle()} onClick={() => adjH(1)}>▲</button>
                    <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.3rem", minWidth: "30px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {pad(h)}
                    </span>
                    <button style={btnStyle()} onClick={() => adjH(-1)}>▼</button>
                </div>
                <span style={{ color: "#818cf8", fontWeight: 700, fontSize: "1.3rem", marginBottom: "2px" }}>:</span>
                {/* Minute */}
                <div style={segStyle}>
                    <button style={btnStyle()} onClick={() => adjM(15)}>▲</button>
                    <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.3rem", minWidth: "30px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {pad(m)}
                    </span>
                    <button style={btnStyle()} onClick={() => adjM(-15)}>▼</button>
                </div>
                {/* AM/PM display */}
                <span style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600, marginLeft: "6px" }}>
                    {h < 12 ? "AM" : "PM"}
                </span>
            </div>
            {/* also allow direct typed input as hidden fallback */}
            <input
                type="time"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                style={{
                    position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0,
                }}
                tabIndex={-1}
            />
        </div>
    );
}

// ── Meal window modal ─────────────────────────────────────────────────────────
function MealModal({ mode, initial, onSave, onClose, saving }) {
    const [form, setForm] = useState(
        initial || { date: todayStr(), meal_type: "", start_time: "08:00", end_time: "10:00" }
    );
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const weekDays = getWeekDays();

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
            }}
        >
            <div style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "18px", width: "100%", maxWidth: "500px", padding: "30px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 700 }}>
                        {mode === "add" ? "➕ Schedule Meal Window" : "✏️ Edit Meal Window"}
                    </h3>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "#94a3b8", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem",
                    }}>✕</button>
                </div>

                {/* Date — quick-select day buttons */}
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "10px" }}>
                        Date *
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                        {weekDays.map(d => {
                            const label = new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                            const active = form.date === d;
                            return (
                                <button
                                    key={d}
                                    onClick={() => set("date", d)}
                                    style={{
                                        padding: "6px 11px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: active ? 700 : 500, cursor: "pointer",
                                        background: active ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.05)",
                                        border: active ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.1)",
                                        color: active ? "#a5b4fc" : "#94a3b8",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Also allow manual date input */}
                    <input
                        type="date"
                        value={form.date}
                        onChange={e => set("date", e.target.value)}
                        style={{
                            padding: "8px 12px", background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                            color: "#f1f5f9", fontSize: "0.84rem", outline: "none",
                        }}
                    />
                </div>

                {/* Meal type */}
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "10px" }}>
                        Meal Type *
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                        {MEAL_PRESETS.map(m => {
                            const col = getMealColor(m);
                            const active = form.meal_type === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => set("meal_type", m)}
                                    style={{
                                        padding: "7px 14px", borderRadius: "20px", fontSize: "0.8rem",
                                        fontWeight: active ? 700 : 500, cursor: "pointer",
                                        textTransform: "capitalize",
                                        background: active ? col.bg : "rgba(255,255,255,0.04)",
                                        border: active ? `1px solid ${col.border}` : "1px solid rgba(255,255,255,0.1)",
                                        color: active ? col.text : "#64748b",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </div>
                    <input
                        type="text"
                        value={form.meal_type}
                        onChange={e => set("meal_type", e.target.value.toLowerCase())}
                        placeholder="or type custom…"
                        style={{
                            width: "100%", boxSizing: "border-box",
                            padding: "9px 12px", background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
                            color: "#f1f5f9", fontSize: "0.88rem", outline: "none",
                        }}
                    />
                </div>

                {/* Time pickers */}
                <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
                    <TimeInput label="Start Time" value={form.start_time} onChange={v => set("start_time", v)} />
                    <TimeInput label="End Time" value={form.end_time} onChange={v => set("end_time", v)} />
                </div>

                {/* Preview */}
                {form.meal_type && form.start_time && form.end_time && (
                    <div style={{
                        background: getMealColor(form.meal_type).bg,
                        border: `1px solid ${getMealColor(form.meal_type).border}`,
                        borderRadius: "8px", padding: "10px 14px", marginBottom: "20px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <span style={{ color: getMealColor(form.meal_type).text, fontWeight: 700, textTransform: "capitalize", fontSize: "0.9rem" }}>
                            {form.meal_type}
                        </span>
                        <span style={{ color: "#94a3b8", fontSize: "0.84rem" }}>
                            {form.start_time} — {form.end_time} · {form.date}
                        </span>
                    </div>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: "11px",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                    }}>Cancel</button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={saving}
                        style={{
                            flex: 2, padding: "11px",
                            background: saving ? "rgba(129,140,248,0.08)" : "rgba(129,140,248,0.2)",
                            border: "1px solid #818cf8", color: "#818cf8",
                            borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer",
                            fontWeight: 700, fontSize: "0.88rem", opacity: saving ? 0.6 : 1,
                            transition: "all 0.15s",
                        }}
                    >
                        {saving ? "Saving…" : mode === "add" ? "Schedule Window" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Day column for week view ───────────────────────────────────────────────────
function DayCard({ date, windows, onEdit, onDelete, deletingId }) {
    const label = new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    const isToday = date === todayStr();

    return (
        <div style={{
            background: isToday ? "rgba(129,140,248,0.06)" : "rgba(255,255,255,0.02)",
            border: isToday ? "1px solid rgba(129,140,248,0.3)" : "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px", padding: "14px", minWidth: "160px",
        }}>
            <div style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: isToday ? "#818cf8" : "#94a3b8", fontWeight: 700, fontSize: "0.82rem" }}>{label}</div>
                {isToday && <div style={{ color: "#818cf8", fontSize: "0.68rem", marginTop: "2px", fontWeight: 600 }}>TODAY</div>}
            </div>

            {windows.length === 0 ? (
                <div style={{ color: "#334155", fontSize: "0.75rem", textAlign: "center", padding: "12px 0" }}>No meals</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {windows.map(w => {
                        const col = getMealColor(w.meal_type);
                        const live = isLive(w);
                        return (
                            <div key={w.id} style={{
                                background: col.bg,
                                border: `1px solid ${col.border}40`,
                                borderLeft: `3px solid ${col.border}`,
                                borderRadius: "8px", padding: "8px 10px",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ color: col.text, fontWeight: 700, fontSize: "0.78rem", textTransform: "capitalize" }}>
                                            {w.meal_type}
                                            {live && (
                                                <span style={{ marginLeft: "6px", background: "#10b981", color: "#fff", padding: "1px 6px", borderRadius: "10px", fontSize: "0.6rem", fontWeight: 700 }}>
                                                    LIVE
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "2px" }}>
                                            {w.start_time?.slice(0, 5)} – {w.end_time?.slice(0, 5)}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button
                                            onClick={() => !live && onEdit(w)}
                                            disabled={live}
                                            title={live ? "Cannot edit active window" : "Edit"}
                                            style={{
                                                background: "rgba(255,255,255,0.08)", border: "none",
                                                color: live ? "#334155" : "#94a3b8", borderRadius: "4px",
                                                cursor: live ? "not-allowed" : "pointer", padding: "2px 6px",
                                                fontSize: "0.7rem",
                                            }}
                                        >✏️</button>
                                        <button
                                            onClick={() => !live && onDelete(w)}
                                            disabled={deletingId === w.id || live}
                                            title={live ? "Cannot delete active window" : "Delete"}
                                            style={{
                                                background: "rgba(239,68,68,0.1)", border: "none",
                                                color: (deletingId === w.id || live) ? "#334155" : "#f87171",
                                                borderRadius: "4px",
                                                cursor: (deletingId === w.id || live) ? "not-allowed" : "pointer",
                                                padding: "2px 6px", fontSize: "0.7rem",
                                            }}
                                        >{deletingId === w.id ? "…" : "🗑️"}</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FoodMeals() {
    const [windows, setWindows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit', item? }
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [viewMode, setViewMode] = useState("week"); // 'week' | 'table'
    const { showPopup, showConfirm } = usePopup();

    const fetchWindows = useCallback(() => {
        setLoading(true); setError("");
        foodFetch(`${API_BASE}/api/food/meals`, { headers: getFoodHeaders() })
            .then(r => r.json())
            .then(d => { if (d.success) setWindows(d.data); else setError(d.message); })
            .catch(() => setError("Network error — could not load meal windows"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchWindows(); }, [fetchWindows]);

    const handleSave = async (form) => {
        if (!form.date || !form.meal_type || !form.start_time || !form.end_time) {
            showPopup("Please fill in all required fields.", "error"); return;
        }
        setSaving(true);
        try {
            const isEdit = modal.mode === "edit";
            const url = isEdit ? `${API_BASE}/api/food/meals/${modal.item.id}` : `${API_BASE}/api/food/meals`;
            const res = await foodFetch(url, { method: isEdit ? "PUT" : "POST", headers: getFoodHeaders(), body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) {
                showPopup(isEdit ? "Meal window updated." : "Meal window scheduled.", "success");
                setModal(null);
                fetchWindows();
            } else {
                showPopup(ERROR_MSGS[data.message] || data.message || "Failed to save.", "error");
            }
        } catch { showPopup("Network error.", "error"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (w) => {
        if (isLive(w)) { showPopup("Cannot delete an active meal window.", "error"); return; }
        const ok = await showConfirm({
            title: "Delete Meal Window",
            message: `Delete ${w.meal_type} on ${w.date?.split("T")[0] ?? w.date}?`,
            confirmLabel: "Yes, Delete",
            type: "danger",
        });
        if (!ok) return;
        setDeletingId(w.id);
        try {
            const res = await foodFetch(`${API_BASE}/api/food/meals/${w.id}`, { method: "DELETE", headers: getFoodHeaders() });
            const data = await res.json();
            if (data.success) { showPopup("Meal window deleted.", "success"); fetchWindows(); }
            else showPopup(ERROR_MSGS[data.message] || data.message || "Failed to delete.", "error");
        } catch { showPopup("Network error.", "error"); }
        finally { setDeletingId(null); }
    };

    // Group windows by date for week view
    const weekDays = getWeekDays();
    const byDate = {};
    windows.forEach(w => {
        const d = w.date?.split("T")[0] ?? w.date;
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(w);
    });
    // Sort windows by start_time within each day
    Object.values(byDate).forEach(arr => arr.sort((a, b) => (a.start_time > b.start_time ? 1 : -1)));

    const thS = { padding: "11px 14px", textAlign: "left", color: "#475569", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,23,42,0.97)", position: "sticky", top: 0, zIndex: 2 };
    const tdS = { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle", color: "#f1f5f9", fontSize: "0.88rem" };

    return (
        <FoodLayout>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700 }}>Meal Windows</h3>
                        <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.8rem" }}>
                            Schedule and manage daily meal redemption time slots
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {/* View toggle */}
                        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", overflow: "hidden" }}>
                            {["week", "table"].map(v => (
                                <button key={v} onClick={() => setViewMode(v)} style={{
                                    padding: "7px 14px", background: viewMode === v ? "rgba(129,140,248,0.2)" : "transparent",
                                    border: "none", color: viewMode === v ? "#818cf8" : "#64748b",
                                    cursor: "pointer", fontWeight: viewMode === v ? 700 : 400,
                                    fontSize: "0.8rem", textTransform: "capitalize",
                                }}>
                                    {v === "week" ? "📅 Week View" : "📋 Table View"}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setModal({ mode: "add" })}
                            style={{
                                padding: "9px 18px", background: "rgba(129,140,248,0.2)",
                                border: "1px solid #818cf8", color: "#818cf8",
                                borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                            }}
                        >
                            ➕ Add Meal Window
                        </button>
                        <button
                            onClick={fetchWindows}
                            style={{
                                padding: "9px 14px", background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)", color: "#64748b",
                                borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem",
                            }}
                        >🔄</button>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", padding: "12px 16px", borderRadius: "8px",
                        marginBottom: "14px", display: "flex", justifyContent: "space-between",
                    }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#475569" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>Loading…
                    </div>
                ) : viewMode === "week" ? (
                    /* ── Week view ── */
                    <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent" }}>
                        <div style={{ display: "flex", gap: "12px", minWidth: "max-content", paddingBottom: "8px", alignItems: "flex-start" }}>
                            {weekDays.map(d => (
                                <DayCard
                                    key={d}
                                    date={d}
                                    windows={byDate[d] || []}
                                    onEdit={w => setModal({ mode: "edit", item: w })}
                                    onDelete={handleDelete}
                                    deletingId={deletingId}
                                />
                            ))}
                        </div>
                        {/* Non-week windows (past or future beyond 7 days) */}
                        {windows.filter(w => !weekDays.includes(w.date?.split("T")[0] ?? w.date)).length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                                <div style={{ color: "#475569", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                                    Other Dates
                                </div>
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                    {Object.entries(byDate)
                                        .filter(([d]) => !weekDays.includes(d))
                                        .map(([d, ws]) => (
                                            <DayCard
                                                key={d}
                                                date={d}
                                                windows={ws}
                                                onEdit={w => setModal({ mode: "edit", item: w })}
                                                onDelete={handleDelete}
                                                deletingId={deletingId}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                        {windows.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px", color: "#334155" }}>
                                No meal windows scheduled — click "Add Meal Window" to get started
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Table view ── */
                    <div style={{
                        flex: 1, overflowY: "auto", overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px",
                        background: "rgba(255,255,255,0.02)",
                        scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "580px" }}>
                            <thead>
                                <tr>
                                    {["Date", "Meal Type", "Start", "End", "Status", "Actions"].map(h => (
                                        <th key={h} style={thS}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {windows.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#334155" }}>
                                        No meal windows — add one to get started
                                    </td></tr>
                                ) : [...windows].sort((a, b) => {
                                    const da = a.date?.split("T")[0] ?? a.date;
                                    const db = b.date?.split("T")[0] ?? b.date;
                                    if (da !== db) return da > db ? 1 : -1;
                                    return a.start_time > b.start_time ? 1 : -1;
                                }).map(w => {
                                    const live = isLive(w);
                                    const col = getMealColor(w.meal_type);
                                    const wDate = w.date?.split("T")[0] ?? w.date;
                                    return (
                                        <tr key={w.id}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            style={{ transition: "background 0.15s" }}
                                        >
                                            <td style={{ ...tdS, color: "#94a3b8" }}>{wDate}</td>
                                            <td style={tdS}>
                                                <span style={{
                                                    background: col.bg, color: col.text,
                                                    border: `1px solid ${col.border}50`,
                                                    padding: "3px 10px", borderRadius: "20px",
                                                    fontSize: "0.78rem", fontWeight: 700, textTransform: "capitalize",
                                                }}>
                                                    {w.meal_type}
                                                </span>
                                            </td>
                                            <td style={{ ...tdS, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>{w.start_time?.slice(0, 5)}</td>
                                            <td style={{ ...tdS, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>{w.end_time?.slice(0, 5)}</td>
                                            <td style={tdS}>
                                                {live
                                                    ? <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700 }}>🟢 LIVE</span>
                                                    : <span style={{ background: "rgba(255,255,255,0.05)", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 600 }}>Scheduled</span>
                                                }
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ display: "flex", gap: "6px" }}>
                                                    <button
                                                        onClick={() => !live && setModal({ mode: "edit", item: w })}
                                                        disabled={live}
                                                        style={{
                                                            padding: "5px 11px", background: "rgba(251,191,36,0.1)",
                                                            border: "1px solid #fbbf24", color: "#fbbf24",
                                                            borderRadius: "6px", cursor: live ? "not-allowed" : "pointer",
                                                            fontSize: "0.76rem", fontWeight: 700, opacity: live ? 0.35 : 1,
                                                        }}
                                                    >✏️ Edit</button>
                                                    <button
                                                        onClick={() => !live && handleDelete(w)}
                                                        disabled={deletingId === w.id || live}
                                                        style={{
                                                            padding: "5px 11px", background: "rgba(239,68,68,0.1)",
                                                            border: "1px solid #ef4444", color: "#f87171",
                                                            borderRadius: "6px", cursor: (deletingId === w.id || live) ? "not-allowed" : "pointer",
                                                            fontSize: "0.76rem", fontWeight: 700, opacity: (deletingId === w.id || live) ? 0.35 : 1,
                                                        }}
                                                    >{deletingId === w.id ? "…" : "🗑️"}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modal && (
                <MealModal
                    mode={modal.mode}
                    initial={modal.mode === "edit" ? {
                        date: modal.item.date?.split("T")[0] ?? modal.item.date,
                        meal_type: modal.item.meal_type,
                        start_time: modal.item.start_time?.slice(0, 5),
                        end_time: modal.item.end_time?.slice(0, 5),
                    } : undefined}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}
        </FoodLayout>
    );
}