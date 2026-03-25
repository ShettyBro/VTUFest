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

    // ── Transport toggle state ──
    const [transportEnabled, setTransportEnabled] = useState(false);
    const [transportSaving, setTransportSaving] = useState(false);
    const [transportSuccess, setTransportSuccess] = useState(false);

    // ── Show transport details toggle state ──
    const [showTransportDetails, setShowTransportDetails] = useState(false);
    const [showTransportSaving, setShowTransportSaving] = useState(false);
    const [showTransportSuccess, setShowTransportSuccess] = useState(false);

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

    useEffect(() => {
        fetchSettings();
        // Hydrate transport enabled toggle from transport-status endpoint
        fetch(`${API_BASE}/api/settings/transport-status`, { headers })
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data?.enabled !== undefined) setTransportEnabled(!!d.data.enabled);
            })
            .catch(() => {});
    }, []);

    // Derive show_transport_details from the settings list (set after fetchSettings resolves)
    // We handle it in the JSX via settings array, but also keep local state for optimistic updates
    // Load it when settings load:
    useEffect(() => {
        const row = settings.find(s => s.setting_key === 'show_transport_details');
        if (row) setShowTransportDetails(row.setting_value === 'true');
    }, [settings]);

    const handleTransportToggle = async () => {
        if (!isSuperAdmin || transportSaving) return;
        setTransportSaving(true); setTransportSuccess(false);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/settings/transport-toggle`, {
                method: "POST",
                headers,
                body: JSON.stringify({ enabled: !transportEnabled }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to update");
            setTransportEnabled(!!data.data?.enabled);
            setTransportSuccess(true);
            setTimeout(() => setTransportSuccess(false), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setTransportSaving(false);
        }
    };

    const handleShowTransportToggle = async () => {
        if (!isSuperAdmin || showTransportSaving || !transportEnabled) return;
        setShowTransportSaving(true); setShowTransportSuccess(false);
        try {
            const res = await adminFetch(`${API_BASE}/api/admin/settings/show_transport_details`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ value: !showTransportDetails }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Failed to update");
            setShowTransportDetails(!showTransportDetails);
            setShowTransportSuccess(true);
            setTimeout(() => setShowTransportSuccess(false), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setShowTransportSaving(false);
        }
    };

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
            registration_lock:         "Lock All Registrations",
            manager_lock:              "Lock All Manager/Principal Actions",
            show_accommodation_details:"Show Accommodation Details to Managers",
            transport_collection:      "Collect Transport Details from Managers",
            show_transport_details:    "Show Transport Details to Managers",
        };
        return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const friendlyDesc = (key) => {
        const map = {
            registration_lock:         "When ON, all new student registrations are blocked across the platform.",
            manager_lock:              "When ON, Managers and Principals cannot make any further changes to event assignments or approvals across all colleges.",
            show_accommodation_details:"When ON, team managers can see their allotted accommodation details (venue, address, map, contacts). Enable this only when accommodation allotments are finalised.",
            transport_collection:      "When ON, team managers see a transport form to submit their travel details. Once submitted, they cannot edit.",
            show_transport_details:    "When ON, managers can view their submitted status, coordination badge, and assigned driver info. Requires Collection to be ON.",
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
                        {settings.filter(s =>
                            s.setting_key !== "allocated_events_visible" &&
                            s.setting_key !== "show_accommodation_details" &&
                            s.setting_key !== "transport_collection_enabled" &&
                            s.setting_key !== "show_transport_details"
                        ).map(s => {
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

                        {/* ── Transport Collection + Show Details (dependent) ── */}
                        {(() => {
                            const tcRow  = settings.find(x => x.setting_key === "transport_collection_enabled");
                            const stdRow = settings.find(x => x.setting_key === "show_transport_details");
                            if (!tcRow) return null;
                            const tcOn      = tcRow.setting_value   === "true";
                            const stdOn     = stdRow?.setting_value === "true";
                            const tcSaving  = saving === "transport_collection_enabled";
                            const stdSaving = saving === "show_transport_details";

                            const ToggleSwitch = ({ isOn, disabled, onClick, sv }) => (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginLeft: "20px" }}>
                                    <span style={{ color: isOn ? "#10b981" : "var(--text-muted)", fontSize: "0.82rem", fontWeight: 700, minWidth: "28px" }}>
                                        {isOn ? "ON" : "OFF"}
                                    </span>
                                    <div onClick={disabled ? undefined : onClick}
                                        style={{
                                            width: "52px", height: "28px", borderRadius: "14px",
                                            background: isOn ? "#10b981" : "rgba(255,255,255,0.12)",
                                            border: `2px solid ${isOn ? "#10b981" : "rgba(255,255,255,0.2)"}`,
                                            cursor: disabled ? "not-allowed" : "pointer",
                                            position: "relative", transition: "all 0.3s",
                                            opacity: (sv || disabled) ? 0.5 : 1, flexShrink: 0,
                                        }}>
                                        <div style={{
                                            width: "20px", height: "20px", borderRadius: "50%",
                                            background: "#fff", position: "absolute", top: "2px",
                                            left: isOn ? "26px" : "2px", transition: "left 0.3s",
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                                        }} />
                                    </div>
                                    {sv && <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>Saving…</span>}
                                </div>
                            );

                            return (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {/* Card 1: Collect Transport */}
                                    <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: tcOn ? "rgba(212,175,55,0.4)" : undefined }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.98rem", marginBottom: "3px" }}>🚌 Collect Transport Details from Managers</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "0.83rem", marginBottom: "5px" }}>When ON, managers see a one-time form to submit travel details. No editing after submit.</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                                Key: <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 5px", borderRadius: "3px" }}>transport_collection_enabled</code>
                                                {tcRow.updated_at && ` · ${new Date(tcRow.updated_at).toLocaleString("en-IN")}`}
                                                {tcRow.updated_by_name && ` by ${tcRow.updated_by_name}`}
                                                <span style={{ marginLeft: "8px", color: tcOn ? "#10b981" : "var(--text-muted)", fontWeight: 600 }}>{tcOn ? "Active" : "Inactive"}</span>
                                            </div>
                                        </div>
                                        <ToggleSwitch isOn={tcOn} disabled={!isSuperAdmin || tcSaving} onClick={() => handleToggle("transport_collection_enabled", tcRow.setting_value)} sv={tcSaving} />
                                    </div>

                                    {/* Card 2: Show Transport Details — locked unless tcOn */}
                                    <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: stdOn ? "rgba(167,139,250,0.4)" : undefined, opacity: !tcOn ? 0.5 : 1, transition: "opacity 0.3s" }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.98rem", marginBottom: "3px" }}>👁 Show Transport Details to Managers</div>
                                            <div style={{ color: "var(--text-secondary)", fontSize: "0.83rem", marginBottom: "5px" }}>
                                                When ON, managers see coordination status and assigned driver info on their submitted form.
                                                {!tcOn && <span style={{ color: "#f59e0b", marginLeft: "6px", fontWeight: 600 }}>⚠ Enable Collection first.</span>}
                                            </div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                                Key: <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 5px", borderRadius: "3px" }}>show_transport_details</code>
                                                {stdRow?.updated_at && ` · ${new Date(stdRow.updated_at).toLocaleString("en-IN")}`}
                                                {stdRow?.updated_by_name && ` by ${stdRow.updated_by_name}`}
                                                <span style={{ marginLeft: "8px", color: stdOn ? "#10b981" : "var(--text-muted)", fontWeight: 600 }}>{stdOn ? "Active" : "Inactive"}</span>
                                            </div>
                                        </div>
                                        <ToggleSwitch isOn={stdOn} disabled={!isSuperAdmin || stdSaving || !tcOn} onClick={() => handleToggle("show_transport_details", stdRow?.setting_value ?? "false")} sv={stdSaving} />
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