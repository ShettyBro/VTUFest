import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { adminFetch } from "../../utils/adminFetch";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

export default function AdminSettings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(null); // key of setting being saved
    const [confirmKey, setConfirmKey] = useState(null); // key awaiting confirm dialog

    const token = localStorage.getItem("vtufest_admin_token");
    const isSuperAdmin = localStorage.getItem("vtufest_admin_role") === "SUPER_ADMIN";
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const fetchSettings = () => {
        setLoading(true);
        adminFetch(`${API_BASE}/api/admin/settings`, { headers })
            .then(r => r.json())
            .then(d => { if (d.success) setSettings(d.data); else setError(d.message); })
            .catch(() => setError("Network error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSettings(); }, []);

    // Derive registration_lock state from settings list
    const registrationLocked = settings.find(s => s.setting_key === "registration_lock")?.setting_value === "true";

    const doToggle = async (key, currentValue) => {
        if (!isSuperAdmin) return;
        setSaving(key);
        try {
            const newValue = currentValue === "true" ? false : true;
            const res = await adminFetch(`${API_BASE}/api/admin/settings/${key}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ value: newValue, reason: "Toggled from admin panel" }),
            });
            const data = await res.json();
            // Surface the exact backend error message (not a generic one)
            if (!res.ok) throw new Error(data.message || "Failed to update setting");
            fetchSettings();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(null);
        }
    };

    const handleToggle = (key, currentValue) => {
        doToggle(key, currentValue);
    };

    const friendlyLabel = (key) => {
        const map = {
            registration_lock: "Lock All Registrations",
            manager_lock: "Lock All Manager/Principal Actions",
            show_accommodation_details: "Show Accommodation Details to Managers",
        };
        return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const friendlyDesc = (key) => {
        const map = {
            registration_lock: "When ON, all new student registrations are blocked across the platform.",
            manager_lock: "When ON, Managers and Principals cannot make any further changes to event assignments or approvals across all colleges.",
            show_accommodation_details: "When ON, team managers can see their allotted accommodation details (venue, address, map, contacts). Enable this only when accommodation allotments are finalised.",
        };
        return map[key] || "";
    };

    return (
        <AdminLayout>
            <div style={{ padding: "10px 0" }}>
                <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>Settings &amp; Toggles</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "28px" }}>
                    {isSuperAdmin ? "Toggle platform-wide settings. Changes take effect immediately." : "View current platform settings. You don't have permission to change these."}
                </p>

                {error && (
                    <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error} <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", float: "right" }}>✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="glass-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading settings...</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {settings.filter(s => s.setting_key !== "allocated_events_visible" && s.setting_key !== "show_accommodation_details").map(s => {
                            const isOn = s.setting_value === "true";
                            const isSavingThis = saving === s.setting_key;
                            const canClick = isSuperAdmin && !isSavingThis;

                            return (
                                <div key={s.setting_key} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1rem", marginBottom: "4px" }}>
                                            {friendlyLabel(s.setting_key)}
                                        </div>
                                        {friendlyDesc(s.setting_key) && (
                                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                                                {friendlyDesc(s.setting_key)}
                                            </div>
                                        )}
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                            Key: <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px" }}>{s.setting_key}</code>
                                            {s.updated_at && ` · Last updated: ${new Date(s.updated_at).toLocaleString("en-IN")}`}
                                            {s.updated_by_name && ` by ${s.updated_by_name}`}
                                        </div>
                                     </div>

                                    {/* Toggle Switch */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, marginLeft: "24px" }}>
                                        <span style={{ color: isOn ? "var(--accent-success)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                                            {isOn ? "ON" : "OFF"}
                                        </span>
                                        <div
                                            onClick={() => canClick && handleToggle(s.setting_key, s.setting_value)}
                                            style={{
                                                width: "52px",
                                                height: "28px",
                                                borderRadius: "14px",
                                                background: isOn ? "var(--accent-success)" : "rgba(255,255,255,0.15)",
                                                border: `2px solid ${isOn ? "var(--accent-success)" : "rgba(255,255,255,0.2)"}`,
                                                cursor: canClick ? "pointer" : "not-allowed",
                                                position: "relative",
                                                transition: "all 0.3s",
                                                opacity: isSavingThis ? 0.6 : 1,
                                            }}
                                        >
                                            <div style={{
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                background: "#fff",
                                                position: "absolute",
                                                top: "2px",
                                                left: isOn ? "26px" : "2px",
                                                transition: "left 0.3s",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                            }} />
                                        </div>
                                        {isSavingThis && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Saving...</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {settings.length === 0 && (
                            <div className="glass-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No settings found</div>
                        )}

                        {/* ── Accommodation Visibility (confirm-gated) ── */}
                        {(() => {
                            const s = settings.find(x => x.setting_key === "show_accommodation_details");
                            if (!s) return null;
                            const isOn = s.setting_value === "true";
                            const isSavingThis = saving === s.setting_key;
                            const canClick = isSuperAdmin && !isSavingThis;
                            return (
                                <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: isOn ? "rgba(16,185,129,0.35)" : undefined }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1rem", marginBottom: "4px" }}>
                                            🏨 {friendlyLabel(s.setting_key)}
                                        </div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>
                                            {friendlyDesc(s.setting_key)}
                                        </div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                            Key: <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px" }}>{s.setting_key}</code>
                                            {s.updated_at && ` · Last updated: ${new Date(s.updated_at).toLocaleString("en-IN")}`}
                                            {s.updated_by_name && ` by ${s.updated_by_name}`}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, marginLeft: "24px" }}>
                                        <span style={{ color: isOn ? "var(--accent-success)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                                            {isOn ? "ON" : "OFF"}
                                        </span>
                                        <div
                                            onClick={() => {
                                                if (!canClick) return;
                                                if (!isOn) { setConfirmKey(s.setting_key); } // confirm before enabling
                                                else { handleToggle(s.setting_key, s.setting_value); } // disable freely
                                            }}
                                            style={{
                                                width: "52px", height: "28px", borderRadius: "14px",
                                                background: isOn ? "var(--accent-success)" : "rgba(255,255,255,0.15)",
                                                border: `2px solid ${isOn ? "var(--accent-success)" : "rgba(255,255,255,0.2)"}`,
                                                cursor: canClick ? "pointer" : "not-allowed",
                                                position: "relative", transition: "all 0.3s",
                                                opacity: isSavingThis ? 0.6 : 1,
                                            }}
                                        >
                                            <div style={{
                                                width: "20px", height: "20px", borderRadius: "50%",
                                                background: "#fff", position: "absolute", top: "2px",
                                                left: isOn ? "26px" : "2px", transition: "left 0.3s",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                            }} />
                                        </div>
                                        {isSavingThis && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Saving...</span>}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Confirmation modal for enabling allocated_events_visible */}
            {confirmKey && (() => {
                const s = settings.find(x => x.setting_key === confirmKey);
                return (
                    <div style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <div className="glass-card" style={{ maxWidth: "420px", width: "90%", padding: "28px 28px 24px" }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: "10px" }}>⚠️</div>
                            <h4 style={{ color: "var(--text-primary)", marginBottom: "10px", fontWeight: 700 }}>
                                {confirmKey === "show_accommodation_details" ? "Confirm: Show Accommodation Details" : "Confirm: Enable Event Visibility"}
                            </h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.55, marginBottom: "22px" }}>
                                {confirmKey === "show_accommodation_details"
                                    ? <><strong>This will immediately reveal allotted accommodation details (venue, address, map, contacts) to all team managers.</strong> Make sure allotments are finalised before enabling this. Are you sure?</>
                                    : <>This will <strong>immediately show allocated events and QR codes to all students.</strong> Are you sure you want to proceed?</>}
                            </p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setConfirmKey(null)}
                                    style={{
                                        padding: "8px 20px", borderRadius: "8px",
                                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                                        color: "var(--text-secondary)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { setConfirmKey(null); doToggle(s.setting_key, s.setting_value); }}
                                    style={{
                                        padding: "8px 20px", borderRadius: "8px",
                                        background: "var(--accent-warning, #f59e0b)", border: "none",
                                        color: "#000", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                                    }}
                                >
                                    Yes, Enable
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AdminLayout>
    );
}