import { useState, useEffect, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

const fmt = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const VOLUNTEER_TYPES = [
    { value: "registration_desk", label: "Registration Desk" },
    { value: "help_desk", label: "Help Desk" },
    { value: "in_event", label: "In-Event" },
    { value: "food_volunteer", label: "Food Volunteer" },
    { value: "college_buddy", label: "College Buddy" },
    { value: "general", label: "General (QR Only)" },
];

const TYPE_COLORS = {
    registration_desk: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
    help_desk: { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
    in_event: { color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    food_volunteer: { color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    college_buddy: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    general: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
};

function TypeBadge({ type }) {
    const t = VOLUNTEER_TYPES.find((v) => v.value === type);
    const c = TYPE_COLORS[type] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
    return (
        <span style={{
            background: c.bg, color: c.color,
            padding: "3px 9px", borderRadius: "12px",
            fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
        }}>
            {t?.label || type}
        </span>
    );
}

// ─── Input helper ────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
    return (
        <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}{required && <span style={{ color: "#f87171" }}> *</span>}
            </label>
            {children}
        </div>
    );
}

const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "8px",
    color: "#f1f5f9", fontSize: "0.88rem", outline: "none",
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function VolunteerFormModal({ mode, volunteer, token, allEvents, onClose, onSaved }) {
    const [form, setForm] = useState(() => ({
        full_name: volunteer?.full_name || "",
        email: volunteer?.email || "",
        phone: volunteer?.phone || "",
        auid: volunteer?.auid || "",
        volunteer_type: volunteer?.volunteer_type || "",
        college_id: volunteer?.college_id || "",
        event_tables: [],
    }));
    const [colleges, setColleges] = useState([]);
    const [collegeSearch, setCollegeSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        adminFetch(`${API_BASE}/api/da/colleges`, { headers })
            .then((r) => r.json())
            .then((d) => { if (d.success) setColleges(d.data || []); })
            .catch(() => { });
    }, []);

    // Pre-populate event_tables from volunteer assigned_events if editing
    useEffect(() => {
        if (mode === "edit" && volunteer?.volunteer_type === "in_event" && volunteer?.assigned_events) {
            setForm((f) => ({ ...f, event_tables: volunteer.assigned_events.map((e) => e.table) }));
        }
    }, []);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const toggleEvent = (table) =>
        setForm((f) => ({
            ...f,
            event_tables: f.event_tables.includes(table)
                ? f.event_tables.filter((t) => t !== table)
                : [...f.event_tables, table],
        }));

    const filteredColleges = useMemo(() => {
        const q = collegeSearch.toLowerCase();
        return colleges.filter((c) =>
            c.name?.toLowerCase().includes(q) ||
            c.college_code?.toLowerCase().includes(q)
        );
    }, [colleges, collegeSearch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setSaving(true);
        try {
            const body = {
                full_name: form.full_name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                auid: form.auid.trim(),
            };
            if (mode === "add") {
                body.volunteer_type = form.volunteer_type;
                if (form.volunteer_type === "college_buddy") body.college_id = form.college_id;
                if (form.volunteer_type === "in_event") body.event_tables = form.event_tables;
            } else {
                if (volunteer.volunteer_type === "college_buddy") body.college_id = form.college_id;
            }

            const url = mode === "add"
                ? `${API_BASE}/api/admin/volunteers`
                : `${API_BASE}/api/admin/volunteers/${volunteer.id}`;
            const method = mode === "add" ? "POST" : "PATCH";

            const res = await adminFetch(url, { method, headers, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save volunteer");
            onSaved();
        } catch (ex) {
            setErr(ex.message);
        } finally {
            setSaving(false);
        }
    };

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };
    const vType = mode === "edit" ? volunteer.volunteer_type : form.volunteer_type;

    return (
        <div
            onClick={handleBackdrop}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
            }}
        >
            <div style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px", width: "100%", maxWidth: "540px",
                maxHeight: "90vh", overflowY: "auto", padding: "28px",
                scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.1rem" }}>
                        {mode === "add" ? "➕ Add Volunteer" : "✏️ Edit Volunteer"}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                        ✕ Close
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === "add" && (
                        <Field label="Volunteer Type" required>
                            <select
                                required
                                value={form.volunteer_type}
                                onChange={(e) => set("volunteer_type", e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer" }}
                            >
                                <option value="">— Select type —</option>
                                {VOLUNTEER_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </Field>
                    )}

                    {mode === "edit" && (
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Volunteer Type</label>
                            <div style={{ marginTop: "6px" }}>
                                <TypeBadge type={volunteer.volunteer_type} />
                                <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "0.78rem" }}>(not editable)</span>
                            </div>
                        </div>
                    )}

                    <Field label="Full Name" required>
                        <input required type="text" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} style={inputStyle} placeholder="e.g. Rahul Sharma" />
                    </Field>

                    <Field label="Email" required>
                        <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} placeholder="volunteer@example.com" />
                    </Field>

                    <Field label="Phone" required>
                        <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} placeholder="+91 9876543210" />
                    </Field>

                    <Field label="AUID" required>
                        <input required type="text" value={form.auid} onChange={(e) => set("auid", e.target.value)} style={inputStyle} placeholder="e.g. 1AY22CS001" />
                    </Field>

                    {vType === "college_buddy" && (
                        <Field label="Allocated College" required>
                            <input
                                type="text"
                                placeholder="Search college…"
                                value={collegeSearch}
                                onChange={(e) => setCollegeSearch(e.target.value)}
                                style={{ ...inputStyle, marginBottom: "6px" }}
                            />
                            <select
                                required
                                value={form.college_id}
                                onChange={(e) => set("college_id", e.target.value)}
                                style={{ ...inputStyle, cursor: "pointer", maxHeight: "160px" }}
                                size={Math.min(6, filteredColleges.length + 1)}
                            >
                                <option value="">— Select College —</option>
                                {filteredColleges.map((c) => (
                                    <option key={c.college_id} value={c.college_id}>
                                        [{c.college_code}] {c.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}

                    {vType === "in_event" && mode === "add" && (
                        <Field label="Assign Events" required>
                            <div style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.14)",
                                borderRadius: "8px",
                                maxHeight: "200px", overflowY: "auto",
                                padding: "10px 12px",
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(129,140,248,0.4) transparent",
                            }}>
                                {allEvents.map((ev) => (
                                    <label key={ev.table} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={form.event_tables.includes(ev.table)}
                                            onChange={() => toggleEvent(ev.table)}
                                            style={{ accentColor: "#818cf8", width: "15px", height: "15px" }}
                                        />
                                        {ev.label}
                                    </label>
                                ))}
                            </div>
                            {form.event_tables.length > 0 && (
                                <div style={{ marginTop: "6px", color: "#818cf8", fontSize: "0.76rem" }}>
                                    {form.event_tables.length} event{form.event_tables.length !== 1 ? "s" : ""} selected
                                </div>
                            )}
                        </Field>
                    )}

                    {err && (
                        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>
                            {err}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: "100%", padding: "11px", borderRadius: "10px",
                            background: saving ? "rgba(129,140,248,0.3)" : "rgba(99,102,241,0.2)",
                            border: "1px solid #6366f1", color: "#818cf8",
                            fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer",
                            transition: "opacity 0.15s",
                        }}
                    >
                        {saving ? "Saving…" : mode === "add" ? "✅ Create Volunteer" : "✅ Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Manage Events Modal (in_event only) ──────────────────────────────────────
function ManageEventsModal({ volunteer, token, onClose, onSaved }) {
    const [allEvents, setAllEvents] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    useEffect(() => {
        setLoading(true);
        adminFetch(`${API_BASE}/api/admin/volunteers/${volunteer.id}/events`, { headers })
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    setAllEvents(d.data.all_events || []);
                    setSelected((d.data.assigned_events || []).map((e) => e.table));
                } else {
                    setErr(d.message || "Failed to load events");
                }
            })
            .catch(() => setErr("Network error — could not load events"))
            .finally(() => setLoading(false));
    }, [volunteer.id]);

    const toggle = (table) =>
        setSelected((prev) =>
            prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
        );

    const handleSave = async () => {
        setSaving(true);
        setErr("");
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/volunteers/${volunteer.id}/events`, {
                method: "POST", headers,
                body: JSON.stringify({ event_tables: selected }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
            onSaved();
        } catch (ex) {
            setErr(ex.message);
        } finally {
            setSaving(false);
        }
    };

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div
            onClick={handleBackdrop}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
            }}
        >
            <div style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px", width: "100%", maxWidth: "480px",
                maxHeight: "90vh", overflowY: "auto", padding: "28px",
                scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                    <div>
                        <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.05rem" }}>🎭 Manage Events</h2>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "3px" }}>{volunteer.full_name}</div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                        ✕ Close
                    </button>
                </div>

                {loading && (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>⏳</div>Loading events…
                    </div>
                )}

                {!loading && (
                    <>
                        <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Select events to assign</span>
                            <span style={{ color: "#818cf8", fontSize: "0.78rem", fontWeight: 700 }}>
                                {selected.length} / {allEvents.length}
                            </span>
                        </div>
                        <div style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "10px", padding: "10px 14px",
                            maxHeight: "340px", overflowY: "auto",
                            scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent",
                        }}>
                            {allEvents.map((ev) => (
                                <label key={ev.table} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", cursor: "pointer", color: selected.includes(ev.table) ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "0.87rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(ev.table)}
                                        onChange={() => toggle(ev.table)}
                                        style={{ accentColor: "#818cf8", width: "15px", height: "15px", flexShrink: 0 }}
                                    />
                                    {ev.label}
                                </label>
                            ))}
                        </div>

                        {err && (
                            <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "10px 14px", borderRadius: "8px", margin: "14px 0", fontSize: "0.85rem" }}>
                                {err}
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                marginTop: "16px", width: "100%", padding: "11px", borderRadius: "10px",
                                background: saving ? "rgba(129,140,248,0.3)" : "rgba(99,102,241,0.2)",
                                border: "1px solid #6366f1", color: "#818cf8",
                                fontWeight: 700, fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer",
                            }}
                        >
                            {saving ? "Saving…" : "✅ Save Event Assignments"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminVolunteers() {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [activeFilter, setActiveFilter] = useState("all");

    const [qrStats, setQrStats] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrGenerating, setQrGenerating] = useState(false);
    const [qrMsg, setQrMsg] = useState("");
    const [qrErr, setQrErr] = useState("");

    const [allEvents, setAllEvents] = useState([]);

    const [addModal, setAddModal] = useState(false);
    const [editVolunteer, setEditVolunteer] = useState(null);
    const [manageEventsVolunteer, setManageEventsVolunteer] = useState(null);

    const [actionLoadingId, setActionLoadingId] = useState(null);

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const { showConfirm } = usePopup();

    const fetchVolunteers = () => {
        setLoading(true);
        setError("");
        adminFetch(`${API_BASE}/api/admin/volunteers`, { headers })
            .then((r) => r.json())
            .then((d) => { if (d.success) setVolunteers(d.data || []); else setError(d.message); })
            .catch(() => setError("Network error — could not fetch volunteers"))
            .finally(() => setLoading(false));
    };

    const fetchQrStats = () => {
        setQrLoading(true);
        adminFetch(`${API_BASE}/api/admin/volunteers/qr-pool-stats`, { headers })
            .then((r) => r.json())
            .then((d) => { if (d.success) setQrStats(d.data); })
            .catch(() => { })
            .finally(() => setQrLoading(false));
    };

    const fetchEvents = () => {
        adminFetch(`${API_BASE}/api/admin/volunteers/events-list`, { headers })
            .then((r) => r.json())
            .then((d) => { if (d.success) setAllEvents(d.data || []); })
            .catch(() => { });
    };

    useEffect(() => {
        fetchVolunteers();
        fetchQrStats();
        fetchEvents();
    }, []);

    const handleGenerateQR = async () => {
        setQrGenerating(true);
        setQrMsg("");
        setQrErr("");
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/volunteers/generate-qr`, { method: "POST", headers });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to generate QR codes");
            setQrMsg(data.data?.message || "1000 QR codes generated successfully!");
            fetchQrStats();
        } catch (ex) {
            setQrErr(ex.message);
        } finally {
            setQrGenerating(false);
        }
    };

    const handleResetPassword = async (v) => {
        const ok = await showConfirm({
            title: "Reset Password",
            message: `Reset password for "${v.full_name}" to the default? They will be required to change it on next login.`,
            confirmLabel: "Yes, Reset",
            type: "warning",
        });
        if (!ok) return;
        setActionLoadingId(`reset-${v.id}`);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/volunteers/${v.id}/reset-password`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to reset password");
            setSuccessMsg(data.message || "Password reset successfully.");
            setTimeout(() => setSuccessMsg(""), 5000);
        } catch (ex) {
            setError(ex.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleToggleActive = async (v) => {
        const isDeactivating = v.is_active;
        if (isDeactivating) {
            const ok = await showConfirm({
                title: "Deactivate Volunteer",
                message: `Deactivate "${v.full_name}"? They will no longer be able to log in.`,
                confirmLabel: "Yes, Deactivate",
                type: "danger",
            });
            if (!ok) return;
        }
        setActionLoadingId(`toggle-${v.id}`);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/volunteers/${v.id}/toggle-active`, { method: "PATCH", headers });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to toggle status");
            setVolunteers((prev) =>
                prev.map((vol) => vol.id === v.id ? { ...vol, is_active: data.data.is_active } : vol)
            );
            setSuccessMsg(data.message || `Volunteer ${data.data.is_active ? "activated" : "deactivated"}.`);
            setTimeout(() => setSuccessMsg(""), 5000);
        } catch (ex) {
            setError(ex.message);
        } finally {
            setActionLoadingId(null);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return volunteers.filter((v) => {
            if (typeFilter !== "all" && v.volunteer_type !== typeFilter) return false;
            if (activeFilter === "active" && !v.is_active) return false;
            if (activeFilter === "inactive" && v.is_active) return false;
            if (!q) return true;
            return (
                (v.full_name || "").toLowerCase().includes(q) ||
                (v.email || "").toLowerCase().includes(q) ||
                (v.auid || "").toLowerCase().includes(q) ||
                (v.volunteer_type || "").toLowerCase().includes(q)
            );
        });
    }, [volunteers, search, typeFilter, activeFilter]);

    const thStyle = (align = "left") => ({
        padding: "12px 14px",
        textAlign: align,
        color: "var(--text-muted)",
        fontSize: "0.73rem", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.5px",
        whiteSpace: "nowrap",
        background: "rgba(15,23,42,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        position: "sticky", top: 0, zIndex: 2,
    });

    const tdStyle = (align = "left", extra = {}) => ({
        padding: "12px 14px",
        textAlign: align,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        verticalAlign: "middle",
        ...extra,
    });

    const actionBtnStyle = (color, bg) => ({
        padding: "4px 11px",
        background: bg || `${color}18`,
        border: `1px solid ${color}`,
        color,
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.74rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
    });

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>
                            🙋 Volunteers
                            <span style={{ marginLeft: "10px", color: "var(--text-muted)", fontWeight: 400, fontSize: "1rem" }}>
                                ({filtered.length} of {volunteers.length})
                            </span>
                        </h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            Manage all event volunteers, QR codes and event assignments
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                            onClick={() => setAddModal(true)}
                            style={{ padding: "9px 18px", background: "rgba(99,102,241,0.2)", border: "1px solid #6366f1", color: "#818cf8", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem", fontWeight: 700 }}
                        >
                            ➕ Add Volunteer
                        </button>
                        <button
                            onClick={() => { fetchVolunteers(); fetchQrStats(); }}
                            style={{ padding: "9px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* ── QR Pool Section ── */}
                <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px", padding: "16px 20px",
                    marginBottom: "20px",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <div style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "10px" }}>
                                🎟️ QR Code Pool
                            </div>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                {qrLoading ? (
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>Loading stats…</span>
                                ) : qrStats ? (
                                    <>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#818cf8" }}>{Number(qrStats.total).toLocaleString()}</div>
                                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399" }}>{Number(qrStats.available).toLocaleString()}</div>
                                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Available</div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f87171" }}>{Number(qrStats.used).toLocaleString()}</div>
                                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Used</div>
                                        </div>
                                    </>
                                ) : (
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>Could not load stats</span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleGenerateQR}
                            disabled={qrGenerating}
                            style={{
                                padding: "9px 18px",
                                background: qrGenerating ? "rgba(251,191,36,0.1)" : "rgba(251,191,36,0.15)",
                                border: "1px solid #fbbf24",
                                color: "#fbbf24",
                                borderRadius: "8px", cursor: qrGenerating ? "not-allowed" : "pointer",
                                fontSize: "0.83rem", fontWeight: 700, opacity: qrGenerating ? 0.7 : 1,
                            }}
                        >
                            {qrGenerating ? "Generating…" : "⚡ Generate 1000 QR Codes"}
                        </button>
                    </div>
                    {qrMsg && (
                        <div style={{ marginTop: "10px", color: "#34d399", fontSize: "0.82rem", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "6px", padding: "8px 12px" }}>
                            ✅ {qrMsg}
                        </div>
                    )}
                    {qrErr && (
                        <div style={{ marginTop: "10px", color: "#f87171", fontSize: "0.82rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", padding: "8px 12px" }}>
                            ❌ {qrErr}
                        </div>
                    )}
                </div>

                {/* ── Filters ── */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
                        <input
                            placeholder="Search by name, email, AUID, type…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                padding: "9px 16px 9px 36px",
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "8px", color: "#f1f5f9",
                                fontSize: "0.85rem", outline: "none",
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ ...inputStyle, width: "auto", minWidth: "160px", flex: "0 0 auto", cursor: "pointer" }}
                    >
                        <option value="all">All Types</option>
                        {VOLUNTEER_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>

                    {/* Active filter */}
                    {["all", "active", "inactive"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            style={{
                                padding: "8px 14px",
                                background: activeFilter === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                                border: `1px solid ${activeFilter === f ? "#6366f1" : "rgba(255,255,255,0.12)"}`,
                                color: activeFilter === f ? "#818cf8" : "var(--text-secondary)",
                                borderRadius: "8px", cursor: "pointer",
                                fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {f === "all" ? `All (${volunteers.length})` : f === "active" ? `Active (${volunteers.filter((v) => v.is_active).length})` : `Inactive (${volunteers.filter((v) => !v.is_active).length})`}
                        </button>
                    ))}
                </div>

                {/* ── Error / Success banners ── */}
                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
                    </div>
                )}
                {successMsg && (
                    <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>✅ {successMsg}</span>
                        <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", color: "#34d399", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {/* ── Table ── */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading volunteers…
                    </div>
                ) : (
                    <div style={{
                        flex: 1, overflowY: "auto", overflowX: "auto",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.03)",
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(129,140,248,0.4) transparent",
                    }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "980px" }}>
                            <thead>
                                <tr>
                                    <th style={thStyle("left")}>Name</th>
                                    <th style={thStyle("left")}>Type</th>
                                    <th style={thStyle("left")}>AUID</th>
                                    <th style={thStyle("left")}>Email</th>
                                    <th style={thStyle("left")}>Phone</th>
                                    <th style={thStyle("left")}>QR Code</th>
                                    <th style={thStyle("center")}>Status</th>
                                    <th style={thStyle("left")}>Last Login</th>
                                    <th style={thStyle("center")}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)" }}>
                                            {search || typeFilter !== "all" || activeFilter !== "all"
                                                ? "No volunteers match the current filters"
                                                : "No volunteers found"}
                                        </td>
                                    </tr>
                                ) : filtered.map((v) => (
                                    <tr
                                        key={v.id}
                                        style={{ transition: "background 0.15s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        {/* Name */}
                                        <td style={tdStyle("left")}>
                                            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{v.full_name}</div>
                                            {v.volunteer_type === "college_buddy" && v.allocated_college_name && (
                                                <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: "2px" }}>🏫 {v.allocated_college_name}</div>
                                            )}
                                            {v.volunteer_type === "in_event" && v.assigned_events?.length > 0 && (
                                                <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                    {v.assigned_events.slice(0, 3).map((ev) => (
                                                        <span key={ev.table} style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", padding: "1px 6px", borderRadius: "8px", fontSize: "0.67rem" }}>{ev.label}</span>
                                                    ))}
                                                    {v.assigned_events.length > 3 && (
                                                        <span style={{ color: "var(--text-muted)", fontSize: "0.67rem" }}>+{v.assigned_events.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Type */}
                                        <td style={tdStyle("left")}>
                                            <TypeBadge type={v.volunteer_type} />
                                        </td>

                                        {/* AUID */}
                                        <td style={tdStyle("left")}>
                                            <code style={{ color: "var(--text-secondary)", fontSize: "0.8rem", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px" }}>
                                                {v.auid || "—"}
                                            </code>
                                        </td>

                                        {/* Email */}
                                        <td style={tdStyle("left", { color: "var(--text-secondary)", fontSize: "0.82rem" })}>{v.email}</td>

                                        {/* Phone */}
                                        <td style={tdStyle("left", { color: "var(--text-secondary)", fontSize: "0.82rem" })}>{v.phone || "—"}</td>

                                        {/* QR Code */}
                                        <td style={tdStyle("left")}>
                                            {v.qr_code ? (
                                                <code style={{ color: "#818cf8", fontSize: "0.8rem", background: "rgba(99,102,241,0.1)", padding: "2px 7px", borderRadius: "4px" }}>
                                                    {v.qr_code}
                                                </code>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>None</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td style={tdStyle("center")}>
                                            <span style={{
                                                background: v.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                                color: v.is_active ? "#10b981" : "#f87171",
                                                padding: "3px 10px", borderRadius: "20px",
                                                fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap",
                                            }}>
                                                {v.is_active ? "🟢 Active" : "🔴 Inactive"}
                                            </span>
                                        </td>

                                        {/* Last Login */}
                                        <td style={tdStyle("left", { color: "var(--text-muted)", fontSize: "0.78rem" })}>
                                            {v.volunteer_type === "general"
                                                ? <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>QR Only</span>
                                                : fmt(v.last_login_at)
                                            }
                                        </td>

                                        {/* Actions */}
                                        <td style={tdStyle("center")}>
                                            <div style={{ display: "flex", gap: "5px", justifyContent: "center", flexWrap: "wrap" }}>
                                                <button
                                                    onClick={() => setEditVolunteer(v)}
                                                    style={actionBtnStyle("#60a5fa")}
                                                >
                                                    ✏️ Edit
                                                </button>

                                                {v.volunteer_type !== "general" && (
                                                    <button
                                                        onClick={() => handleResetPassword(v)}
                                                        disabled={actionLoadingId === `reset-${v.id}`}
                                                        style={{ ...actionBtnStyle("#fbbf24"), opacity: actionLoadingId === `reset-${v.id}` ? 0.6 : 1 }}
                                                    >
                                                        {actionLoadingId === `reset-${v.id}` ? "…" : "🔑 Reset Pwd"}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleToggleActive(v)}
                                                    disabled={actionLoadingId === `toggle-${v.id}`}
                                                    style={{
                                                        ...actionBtnStyle(v.is_active ? "#f87171" : "#34d399"),
                                                        opacity: actionLoadingId === `toggle-${v.id}` ? 0.6 : 1,
                                                    }}
                                                >
                                                    {actionLoadingId === `toggle-${v.id}` ? "…" : v.is_active ? "🚫 Deactivate" : "✅ Activate"}
                                                </button>

                                                {v.volunteer_type === "in_event" && (
                                                    <button
                                                        onClick={() => setManageEventsVolunteer(v)}
                                                        style={actionBtnStyle("#fbbf24", "rgba(251,191,36,0.1)")}
                                                    >
                                                        🎭 Events
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

                {/* ── Footer count ── */}
                {!loading && filtered.length > 0 && (
                    <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "right" }}>
                        Showing {filtered.length} of {volunteers.length} volunteers
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {addModal && (
                <VolunteerFormModal
                    mode="add"
                    volunteer={null}
                    token={token}
                    allEvents={allEvents}
                    onClose={() => setAddModal(false)}
                    onSaved={() => { setAddModal(false); fetchVolunteers(); setSuccessMsg("Volunteer created successfully."); setTimeout(() => setSuccessMsg(""), 5000); }}
                />
            )}

            {editVolunteer && (
                <VolunteerFormModal
                    mode="edit"
                    volunteer={editVolunteer}
                    token={token}
                    allEvents={allEvents}
                    onClose={() => setEditVolunteer(null)}
                    onSaved={() => { setEditVolunteer(null); fetchVolunteers(); setSuccessMsg("Volunteer updated successfully."); setTimeout(() => setSuccessMsg(""), 5000); }}
                />
            )}

            {manageEventsVolunteer && (
                <ManageEventsModal
                    volunteer={manageEventsVolunteer}
                    token={token}
                    onClose={() => setManageEventsVolunteer(null)}
                    onSaved={() => { setManageEventsVolunteer(null); fetchVolunteers(); setSuccessMsg("Event assignments updated."); setTimeout(() => setSuccessMsg(""), 5000); }}
                />
            )}
        </AdminLayout>
    );
}
