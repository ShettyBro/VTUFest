import { useState, useEffect, useCallback } from "react";
import FoodLayout from "./FoodLayout";
import { foodFetch, getFoodHeaders } from "../../utils/foodFetch";
import { usePopup } from "../../context/PopupContext";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

const ERROR_MESSAGES = {
    VOLUNTEER_ALREADY_ASSIGNED: "This volunteer is already assigned to a stall.",
    ZONAL_ALREADY_ASSIGNED_FOR_STALL: "A zonal volunteer is already assigned to this stall.",
    VOLUNTEER_NOT_FOUND: "Volunteer not found.",
    MISSING_FIELDS: "Please fill in all required fields.",
};

// ── Stall create/edit modal ───────────────────────────────────────────────────
function StallModal({ mode, initial, onSave, onClose, saving }) {
    const [form, setForm] = useState(initial || { name: "", location: "" });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
                background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px", width: "100%", maxWidth: "420px", padding: "28px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 700 }}>
                        {mode === "add" ? "➕ Add Stall" : "✏️ Edit Stall"}
                    </h3>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem",
                    }}>✕</button>
                </div>

                {[{ label: "Stall Name", key: "name", required: true, placeholder: "e.g. North Canteen" },
                { label: "Location", key: "location", required: false, placeholder: "e.g. Near Main Gate" }
                ].map(({ label, key, required, placeholder }) => (
                    <div key={key} style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "7px" }}>
                            {label} {required && "*"}
                        </label>
                        <input
                            value={form[key]}
                            onChange={e => set(key, e.target.value)}
                            placeholder={placeholder}
                            style={{
                                width: "100%", boxSizing: "border-box",
                                padding: "10px 12px", background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
                                color: "#f1f5f9", fontSize: "0.9rem", outline: "none",
                            }}
                        />
                    </div>
                ))}

                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: "10px",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                    }}>Cancel</button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={saving}
                        style={{
                            flex: 2, padding: "10px",
                            background: "rgba(129,140,248,0.2)", border: "1px solid #818cf8",
                            color: "#818cf8", borderRadius: "8px",
                            cursor: saving ? "not-allowed" : "pointer",
                            fontWeight: 700, fontSize: "0.88rem", opacity: saving ? 0.6 : 1,
                        }}
                    >
                        {saving ? "Saving…" : mode === "add" ? "Create Stall" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Assignment modal — fetches volunteer list, searchable ─────────────────────
function AssignModal({ stall, onClose, onChanged }) {
    const [assignments, setAssignments] = useState(stall.assigned_volunteers || []);
    const [volunteers, setVolunteers] = useState([]);  // all active vm_volunteers
    const [volLoading, setVolLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null); // volunteer object
    const [roleType, setRoleType] = useState("volunteer");
    const [assigning, setAssigning] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [assignError, setAssignError] = useState("");
    const { showPopup, showConfirm } = usePopup();

    // Fetch available volunteers from the helper endpoint
    useEffect(() => {
        setVolLoading(true);
        foodFetch(`${API_BASE}/api/food/volunteers`, { headers: getFoodHeaders() })
            .then(r => r.json())
            .then(d => { if (d.success) setVolunteers(d.data); })
            .catch(() => { })
            .finally(() => setVolLoading(false));
    }, []);

    // Filtered volunteers based on search
    const assignedIds = new Set(assignments.map(a => a.volunteer_id));
    const filtered = volunteers.filter(v => {
        const q = search.toLowerCase();
        return (
            !assignedIds.has(v.id) &&
            (v.full_name?.toLowerCase().includes(q) ||
                v.email?.toLowerCase().includes(q) ||
                String(v.id).includes(q))
        );
    });

    const handleAssign = async () => {
        if (!selected) { setAssignError("Select a volunteer from the list."); return; }
        setAssignError(""); setAssigning(true);
        try {
            const res = await foodFetch(`${API_BASE}/api/food/stalls/${stall.id}/assign`, {
                method: "POST",
                headers: getFoodHeaders(),
                body: JSON.stringify({ volunteer_id: selected.id, role_type: roleType }),
            });
            const data = await res.json();
            if (data.success) {
                // Enrich with name for immediate display
                setAssignments(prev => [...prev, {
                    ...data.data,
                    full_name: selected.full_name,
                    role_level: selected.role_level,
                }]);
                setSelected(null);
                setSearch("");
                onChanged();
                showPopup(`${selected.full_name} assigned as ${roleType}.`, "success");
            } else {
                setAssignError(ERROR_MESSAGES[data.message] || data.message || "Failed to assign.");
            }
        } catch { setAssignError("Network error."); }
        finally { setAssigning(false); }
    };

    const handleRemove = async (a) => {
        const ok = await showConfirm({
            title: "Remove Assignment",
            message: `Remove ${a.full_name || `Volunteer #${a.volunteer_id}`} from ${stall.name}?`,
            confirmLabel: "Remove", type: "warning",
        });
        if (!ok) return;
        setRemovingId(a.volunteer_id);
        try {
            const res = await foodFetch(`${API_BASE}/api/food/stalls/${stall.id}/assign/${a.volunteer_id}`, { method: "DELETE", headers: getFoodHeaders() });
            const data = await res.json();
            if (data.success) {
                setAssignments(prev => prev.filter(x => x.volunteer_id !== a.volunteer_id));
                onChanged();
                showPopup("Assignment removed.", "success");
            } else {
                showPopup(data.message || "Failed to remove.", "error");
            }
        } catch { showPopup("Network error.", "error"); }
        finally { setRemovingId(null); }
    };

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
                background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px", width: "100%", maxWidth: "560px",
                maxHeight: "88vh", overflowY: "auto", padding: "28px",
                scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent",
            }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                    <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 700 }}>
                        👥 Assignments — {stall.name}
                    </h3>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#94a3b8", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem",
                    }}>✕</button>
                </div>

                {/* Current assignments */}
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ color: "#475569", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginBottom: "10px" }}>
                        Current ({assignments.length})
                    </div>
                    {assignments.length === 0 ? (
                        <div style={{ color: "#334155", fontSize: "0.84rem", padding: "12px 0" }}>None assigned yet</div>
                    ) : assignments.map(a => (
                        <div key={a.volunteer_id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "8px", padding: "10px 14px", marginBottom: "8px",
                        }}>
                            <div>
                                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem" }}>
                                    {a.full_name || `Volunteer #${a.volunteer_id}`}
                                </div>
                                <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "2px" }}>
                                    ID: {a.volunteer_id}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{
                                    background: a.role_type === "zonal" ? "rgba(212,175,55,0.15)" : "rgba(96,165,250,0.12)",
                                    color: a.role_type === "zonal" ? "#d4af37" : "#60a5fa",
                                    border: `1px solid ${a.role_type === "zonal" ? "rgba(212,175,55,0.35)" : "rgba(96,165,250,0.3)"}`,
                                    padding: "2px 10px", borderRadius: "20px",
                                    fontSize: "0.7rem", fontWeight: 700,
                                }}>
                                    {a.role_type}
                                </span>
                                <button
                                    onClick={() => handleRemove(a)}
                                    disabled={removingId === a.volunteer_id}
                                    style={{
                                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                        color: "#f87171", borderRadius: "6px", padding: "4px 10px",
                                        cursor: removingId === a.volunteer_id ? "not-allowed" : "pointer",
                                        fontSize: "0.75rem", fontWeight: 700,
                                        opacity: removingId === a.volunteer_id ? 0.5 : 1,
                                    }}
                                >
                                    {removingId === a.volunteer_id ? "…" : "Remove"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: "20px" }} />

                {/* Add assignment */}
                <div>
                    <div style={{ color: "#475569", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700, marginBottom: "12px" }}>
                        Add Assignment
                    </div>

                    {/* Search input */}
                    <input
                        type="text"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setSelected(null); }}
                        placeholder="Search by name, email or ID…"
                        style={{
                            width: "100%", boxSizing: "border-box",
                            padding: "10px 12px", marginBottom: "8px",
                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none",
                        }}
                    />

                    {/* Selected volunteer display */}
                    {selected && (
                        <div style={{
                            background: "rgba(129,140,248,0.12)", border: "1px solid #818cf8",
                            borderRadius: "8px", padding: "10px 14px", marginBottom: "8px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                            <div>
                                <span style={{ color: "#a5b4fc", fontWeight: 700, fontSize: "0.88rem" }}>{selected.full_name}</span>
                                <span style={{ color: "#64748b", fontSize: "0.78rem", marginLeft: "8px" }}>{selected.email}</span>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                        </div>
                    )}

                    {/* Volunteer list */}
                    {!selected && (
                        <div style={{
                            maxHeight: "180px", overflowY: "auto",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
                            marginBottom: "12px",
                            scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent",
                        }}>
                            {volLoading ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "#475569", fontSize: "0.84rem" }}>
                                    Loading volunteers…
                                </div>
                            ) : filtered.length === 0 ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "#334155", fontSize: "0.84rem" }}>
                                    {search ? "No volunteers match your search" : "All eligible volunteers are already assigned"}
                                </div>
                            ) : filtered.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => setSelected(v)}
                                    style={{
                                        padding: "10px 14px", cursor: "pointer",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        transition: "background 0.1s",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(129,140,248,0.08)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <div>
                                        <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.86rem" }}>{v.full_name}</div>
                                        <div style={{ color: "#475569", fontSize: "0.74rem", marginTop: "1px" }}>{v.email} · ID {v.id}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        {v.current_stall_name && (
                                            <span style={{ color: "#f87171", fontSize: "0.7rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", padding: "2px 8px", borderRadius: "10px" }}>
                                                @ {v.current_stall_name}
                                            </span>
                                        )}
                                        <span style={{
                                            color: v.role_level === "zonal" ? "#d4af37" : "#60a5fa",
                                            background: v.role_level === "zonal" ? "rgba(212,175,55,0.1)" : "rgba(96,165,250,0.1)",
                                            fontSize: "0.7rem", padding: "2px 8px", borderRadius: "10px",
                                            fontWeight: 600,
                                        }}>
                                            {v.role_level}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Role selector + assign button */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <select
                            value={roleType}
                            onChange={e => setRoleType(e.target.value)}
                            style={{
                                flex: 1, padding: "10px 12px",
                                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "8px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none",
                            }}
                        >
                            <option value="volunteer">Volunteer</option>
                            <option value="zonal">Zonal</option>
                        </select>
                        <button
                            onClick={handleAssign}
                            disabled={assigning || !selected}
                            style={{
                                flex: 2, padding: "10px 18px",
                                background: (!selected || assigning) ? "rgba(129,140,248,0.06)" : "rgba(129,140,248,0.2)",
                                border: "1px solid #818cf8", color: "#818cf8", borderRadius: "8px",
                                cursor: (!selected || assigning) ? "not-allowed" : "pointer",
                                fontWeight: 700, fontSize: "0.88rem",
                                opacity: (!selected || assigning) ? 0.5 : 1,
                                transition: "all 0.15s",
                            }}
                        >
                            {assigning ? "Assigning…" : "Assign"}
                        </button>
                    </div>

                    {assignError && (
                        <div style={{
                            marginTop: "10px", background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)", color: "#f87171",
                            padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem",
                        }}>
                            {assignError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FoodStalls() {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null);
    const [assignModal, setAssignModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState(null);
    const { showPopup, showConfirm } = usePopup();

    const fetchStalls = useCallback(() => {
        setLoading(true); setError("");
        foodFetch(`${API_BASE}/api/food/stalls`, { headers: getFoodHeaders() })
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
            const res = await foodFetch(url, { method: isEdit ? "PUT" : "POST", headers: getFoodHeaders(), body: JSON.stringify(form) });
            const data = await res.json();
            if (data.success) { showPopup(isEdit ? "Stall updated." : "Stall created.", "success"); setModal(null); fetchStalls(); }
            else showPopup(data.message || "Failed to save.", "error");
        } catch { showPopup("Network error.", "error"); }
        finally { setSaving(false); }
    };

    const handleDeactivate = async (s) => {
        const ok = await showConfirm({ title: "Deactivate Stall", message: `Deactivate "${s.name}"? It will no longer appear in scan flows.`, confirmLabel: "Deactivate", type: "warning" });
        if (!ok) return;
        setDeactivatingId(s.id);
        try {
            const res = await foodFetch(`${API_BASE}/api/food/stalls/${s.id}`, { method: "DELETE", headers: getFoodHeaders() });
            const data = await res.json();
            if (data.success) { showPopup("Stall deactivated.", "success"); fetchStalls(); }
            else showPopup(data.message || "Failed.", "error");
        } catch { showPopup("Network error.", "error"); }
        finally { setDeactivatingId(null); }
    };

    return (
        <FoodLayout>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h3 style={{ margin: 0, color: "#f1f5f9", fontWeight: 700 }}>Food Stalls</h3>
                        <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.8rem" }}>Manage stalls and volunteer assignments</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => setModal({ mode: "add" })}
                            style={{
                                padding: "9px 18px", background: "rgba(129,140,248,0.2)",
                                border: "1px solid #818cf8", color: "#818cf8",
                                borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
                            }}
                        >
                            ➕ Add Stall
                        </button>
                        <button
                            onClick={fetchStalls}
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
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>Loading stalls…
                    </div>
                ) : stalls.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#334155" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏪</div>
                        No stalls yet — add one to get started
                    </div>
                ) : (
                    <div style={{
                        flex: 1, overflowY: "auto",
                        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "14px", alignContent: "start",
                        scrollbarWidth: "thin", scrollbarColor: "rgba(129,140,248,0.3) transparent",
                    }}>
                        {stalls.map(s => (
                            <div key={s.id} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: `1px solid ${s.is_active ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.2)"}`,
                                borderRadius: "14px", padding: "18px",
                                display: "flex", flexDirection: "column", gap: "12px",
                                opacity: s.is_active ? 1 : 0.6,
                            }}>
                                {/* Stall header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>{s.name}</div>
                                        {s.location && <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: "3px" }}>📍 {s.location}</div>}
                                    </div>
                                    <span style={{
                                        background: s.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                        color: s.is_active ? "#10b981" : "#f87171",
                                        padding: "3px 10px", borderRadius: "20px",
                                        fontSize: "0.7rem", fontWeight: 700,
                                    }}>
                                        {s.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Assigned volunteers */}
                                <div>
                                    <div style={{ color: "#475569", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontWeight: 700 }}>
                                        Volunteers ({s.assigned_volunteers?.length || 0})
                                    </div>
                                    {!s.assigned_volunteers?.length ? (
                                        <div style={{ color: "#334155", fontSize: "0.8rem" }}>None assigned</div>
                                    ) : (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                                            {s.assigned_volunteers.map(a => (
                                                <span key={a.volunteer_id} style={{
                                                    background: a.role_type === "zonal" ? "rgba(212,175,55,0.12)" : "rgba(96,165,250,0.1)",
                                                    color: a.role_type === "zonal" ? "#d4af37" : "#60a5fa",
                                                    border: `1px solid ${a.role_type === "zonal" ? "rgba(212,175,55,0.3)" : "rgba(96,165,250,0.25)"}`,
                                                    padding: "3px 9px", borderRadius: "10px",
                                                    fontSize: "0.71rem", fontWeight: 600,
                                                }}>
                                                    {a.full_name || `#${a.volunteer_id}`}
                                                    <span style={{ opacity: 0.65, marginLeft: "4px" }}>· {a.role_type}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{
                                    display: "flex", gap: "7px", flexWrap: "wrap",
                                    paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.05)",
                                }}>
                                    <button
                                        onClick={() => setModal({ mode: "edit", item: s })}
                                        style={{
                                            padding: "6px 12px", background: "rgba(251,191,36,0.1)",
                                            border: "1px solid #fbbf24", color: "#fbbf24",
                                            borderRadius: "6px", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700,
                                        }}
                                    >✏️ Edit</button>
                                    <button
                                        onClick={() => setAssignModal(s)}
                                        style={{
                                            padding: "6px 12px", background: "rgba(129,140,248,0.1)",
                                            border: "1px solid #818cf8", color: "#818cf8",
                                            borderRadius: "6px", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700,
                                        }}
                                    >👥 Assign</button>
                                    {s.is_active && (
                                        <button
                                            onClick={() => handleDeactivate(s)}
                                            disabled={deactivatingId === s.id}
                                            style={{
                                                padding: "6px 12px", background: "rgba(239,68,68,0.1)",
                                                border: "1px solid #ef4444", color: "#f87171",
                                                borderRadius: "6px",
                                                cursor: deactivatingId === s.id ? "not-allowed" : "pointer",
                                                fontSize: "0.76rem", fontWeight: 700,
                                                opacity: deactivatingId === s.id ? 0.5 : 1,
                                            }}
                                        >
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
                <AssignModal stall={assignModal} onClose={() => setAssignModal(null)} onChanged={fetchStalls} />
            )}
        </FoodLayout>
    );
}