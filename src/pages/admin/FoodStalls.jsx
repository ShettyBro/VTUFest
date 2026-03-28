import { useState, useEffect, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const ERROR_MESSAGES = {
    VOLUNTEER_ALREADY_ASSIGNED: "This volunteer is already assigned to a stall.",
    ZONAL_ALREADY_ASSIGNED_FOR_STALL: "A zonal volunteer is already assigned to this stall.",
    VOLUNTEER_NOT_FOUND: "Volunteer not found — check the ID.",
    MISSING_FIELDS: "Please fill in all required fields.",
};

function StallModal({ mode, initial, onSave, onClose, saving }) {
    const [form, setForm] = useState(initial || { name: "", location: "" });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "420px", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.1rem" }}>
                        {mode === "add" ? "➕ Add Stall" : "✏️ Edit Stall"}
                    </h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                </div>
                {[{ label: "Stall Name", key: "name", required: true }, { label: "Location", key: "location", required: false }].map(({ label, key, required }) => (
                    <div key={key} style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label} {required && "*"}</label>
                        <input value={form[key]} onChange={e => set(key, e.target.value)}
                            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.9rem", outline: "none" }} />
                    </div>
                ))}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>Cancel</button>
                    <button onClick={() => onSave(form)} disabled={saving}
                        style={{ flex: 2, padding: "10px", background: "rgba(129,140,248,0.2)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.88rem", opacity: saving ? 0.6 : 1 }}>
                        {saving ? "Saving…" : mode === "add" ? "Create Stall" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AssignModal({ stall, onClose, onChanged }) {
    const [assignments, setAssignments] = useState(stall.assigned_volunteers || []);
    const [volunteerId, setVolunteerId] = useState("");
    const [roleType, setRoleType] = useState("volunteer");
    const [assigning, setAssigning] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [assignError, setAssignError] = useState("");
    const { showPopup, showConfirm } = usePopup();

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const handleAssign = async () => {
        if (!volunteerId.trim()) { setAssignError("Enter a volunteer ID"); return; }
        setAssignError("");
        setAssigning(true);
        try {
            const res = await adminFetch(`${API_BASE}/api/food/stalls/${stall.id}/assign`, {
                method: "POST", headers, body: JSON.stringify({ volunteer_id: parseInt(volunteerId), role_type: roleType }),
            });
            const data = await res.json();
            if (data.success) {
                setAssignments(prev => [...prev, data.data]);
                setVolunteerId("");
                onChanged();
                showPopup("Volunteer assigned", "success");
            } else {
                setAssignError(ERROR_MESSAGES[data.message] || data.message || "Failed to assign");
            }
        } catch { setAssignError("Network error"); }
        finally { setAssigning(false); }
    };

    const handleRemove = async (a) => {
        const ok = await showConfirm({ title: "Remove Assignment", message: `Remove this volunteer from ${stall.name}?`, confirmLabel: "Remove", type: "warning" });
        if (!ok) return;
        setRemovingId(a.volunteer_id);
        try {
            const res = await adminFetch(`${API_BASE}/api/food/stalls/${stall.id}/assign/${a.volunteer_id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (data.success) {
                setAssignments(prev => prev.filter(x => x.volunteer_id !== a.volunteer_id));
                onChanged();
                showPopup("Assignment removed", "success");
            } else { showPopup(data.message || "Failed to remove", "error"); }
        } catch { showPopup("Network error", "error"); }
        finally { setRemovingId(null); }
    };

    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "28px", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.1rem" }}>👥 Manage Assignments — {stall.name}</h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                </div>

                {/* Current assignments */}
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px", fontWeight: 700 }}>Current Assignments ({assignments.length})</div>
                {assignments.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "12px 0 16px" }}>No volunteers assigned yet</div>
                ) : assignments.map(a => (
                    <div key={a.volunteer_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px" }}>
                        <div>
                            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.88rem" }}>{a.full_name || `Volunteer #${a.volunteer_id}`}</div>
                            <div style={{ marginTop: "3px" }}>
                                <span style={{ background: a.role_type === "zonal" ? "rgba(212,175,55,0.15)" : "rgba(96,165,250,0.15)", color: a.role_type === "zonal" ? "#d4af37" : "#60a5fa", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700 }}>
                                    {a.role_type?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => handleRemove(a)} disabled={removingId === a.volunteer_id}
                            style={{ padding: "5px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: removingId === a.volunteer_id ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700, opacity: removingId === a.volunteer_id ? 0.5 : 1 }}>
                            {removingId === a.volunteer_id ? "…" : "Remove"}
                        </button>
                    </div>
                ))}

                {/* Add assignment */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "16px", paddingTop: "18px" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", fontWeight: 700 }}>Add Assignment</div>
                    {assignError && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "8px 12px", borderRadius: "6px", marginBottom: "10px", fontSize: "0.82rem" }}>{assignError}</div>
                    )}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <input type="number" placeholder="Volunteer ID" value={volunteerId} onChange={e => setVolunteerId(e.target.value)}
                            style={{ flex: 2, minWidth: "120px", padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none" }} />
                        <select value={roleType} onChange={e => setRoleType(e.target.value)}
                            style={{ flex: 1, minWidth: "110px", padding: "9px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none" }}>
                            <option value="volunteer">Volunteer</option>
                            <option value="zonal">Zonal</option>
                        </select>
                        <button onClick={handleAssign} disabled={assigning}
                            style={{ padding: "9px 18px", background: "rgba(52,211,153,0.15)", border: "1px solid #34d399", color: "#34d399", borderRadius: "8px", cursor: assigning ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.85rem", opacity: assigning ? 0.6 : 1 }}>
                            {assigning ? "…" : "Assign"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FoodStalls() {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null);
    const [assignModal, setAssignModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState(null);
    const { showPopup, showConfirm } = usePopup();

    const token = localStorage.getItem("vtufest_admin_token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchStalls = useCallback(() => {
        setLoading(true);
        setError("");
        adminFetch(`${API_BASE}/api/food/stalls`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setStalls(d.data); else setError(d.message); })
            .catch(() => setError("Network error — could not load stalls"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchStalls(); }, [fetchStalls]);

    const handleSave = async (form) => {
        if (!form.name?.trim()) { showPopup("Stall name is required.", "error"); return; }
        setSaving(true);
        try {
            const isEdit = modal.mode === "edit";
            const url = isEdit ? `${API_BASE}/api/food/stalls/${modal.item.id}` : `${API_BASE}/api/food/stalls`;
            const res = await adminFetch(url, { method: isEdit ? "PUT" : "POST", headers, body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) {
                showPopup(isEdit ? "Stall updated" : "Stall created", "success");
                setModal(null);
                fetchStalls();
            } else {
                showPopup(data.message || "Failed to save", "error");
            }
        } catch { showPopup("Network error", "error"); }
        finally { setSaving(false); }
    };

    const handleDeactivate = async (s) => {
        const ok = await showConfirm({ title: "Deactivate Stall", message: `Deactivate "${s.name}"? It will no longer appear as active.`, confirmLabel: "Deactivate", type: "warning" });
        if (!ok) return;
        setDeactivatingId(s.id);
        try {
            const res = await adminFetch(`${API_BASE}/api/food/stalls/${s.id}`, { method: "DELETE", headers });
            const data = await res.json();
            if (data.success) { showPopup("Stall deactivated", "success"); fetchStalls(); }
            else showPopup(data.message || "Failed to deactivate", "error");
        } catch { showPopup("Network error", "error"); }
        finally { setDeactivatingId(null); }
    };

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0", display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "var(--text-primary)" }}>🏪 Food Stalls</h3>
                        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Manage stalls and volunteer assignments</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => setModal({ mode: "add" })}
                            style={{ padding: "9px 18px", background: "rgba(129,140,248,0.2)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                            ➕ Add Stall
                        </button>
                        <button onClick={fetchStalls} style={{ padding: "9px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-secondary)", borderRadius: "8px", cursor: "pointer", fontSize: "0.83rem" }}>🔄</button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
                        <span>{error}</span>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>Loading stalls…
                    </div>
                ) : stalls.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏪</div>
                        No stalls yet — add one to get started
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px", alignContent: "start", scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.4) transparent" }}>
                        {stalls.map(s => (
                            <div key={s.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s.is_active ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.25)"}`, borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", opacity: s.is_active ? 1 : 0.6 }}>
                                {/* Stall header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem" }}>{s.name}</div>
                                        {s.location && <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "3px" }}>📍 {s.location}</div>}
                                    </div>
                                    <span style={{ background: s.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: s.is_active ? "#10b981" : "#f87171", padding: "3px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                        {s.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Assigned volunteers */}
                                <div>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: 700 }}>
                                        Volunteers ({s.assigned_volunteers?.length || 0})
                                    </div>
                                    {s.assigned_volunteers?.length === 0 ? (
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>None assigned</div>
                                    ) : (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                            {s.assigned_volunteers.map(a => (
                                                <span key={a.volunteer_id} style={{ background: a.role_type === "zonal" ? "rgba(212,175,55,0.12)" : "rgba(96,165,250,0.12)", color: a.role_type === "zonal" ? "#d4af37" : "#60a5fa", border: `1px solid ${a.role_type === "zonal" ? "rgba(212,175,55,0.3)" : "rgba(96,165,250,0.3)"}`, padding: "3px 9px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600 }}>
                                                    {a.full_name || `#${a.volunteer_id}`} · {a.role_type}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                    <button onClick={() => setModal({ mode: "edit", item: s })}
                                        style={{ padding: "6px 12px", background: "rgba(251,191,36,0.12)", border: "1px solid #fbbf24", color: "#fbbf24", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => setAssignModal(s)}
                                        style={{ padding: "6px 12px", background: "rgba(129,140,248,0.12)", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
                                        👥 Assignments
                                    </button>
                                    {s.is_active && (
                                        <button onClick={() => handleDeactivate(s)} disabled={deactivatingId === s.id}
                                            style={{ padding: "6px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "6px", cursor: deactivatingId === s.id ? "not-allowed" : "pointer", fontSize: "0.78rem", fontWeight: 700, opacity: deactivatingId === s.id ? 0.5 : 1 }}>
                                            {deactivatingId === s.id ? "…" : "🔴 Deactivate"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <StallModal
                    mode={modal.mode}
                    initial={modal.mode === "edit" ? { name: modal.item.name, location: modal.item.location || "" } : undefined}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}
            {assignModal && (
                <AssignModal
                    stall={assignModal}
                    onClose={() => setAssignModal(null)}
                    onChanged={fetchStalls}
                />
            )}
        </AdminLayout>
    );
}
