import { useState, useEffect } from "react";

/**
 * DriverAssignModal
 * Reusable across AdminTransport (adminFetch) and TransportDashboard (transportFetch).
 *
 * Props:
 *   isOpen       – bool
 *   onClose      – fn
 *   rowId        – number (transport submission id)
 *   initialData  – { driver_name, driver_phone, vehicle_number, driver_remarks } | null
 *   onSuccess    – fn(savedData) — called after successful PATCH
 *   apiBase      – string, e.g. "https://api.vtufest2026.acharyahabba.com/api/admin/transport/driver"
 *   fetchFn      – adminFetch or transportFetch
 *   authHeader   – object, e.g. { Authorization: "Bearer <token>" }
 */
export default function DriverAssignModal({
    isOpen,
    onClose,
    rowId,
    initialData,
    onSuccess,
    apiUrl,
    fetchFn,
    authHeader,
}) {
    const [form, setForm] = useState({
        driver_name: "",
        driver_phone: "",
        vehicle_number: "",
        driver_remarks: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset form whenever the modal opens for a (possibly different) row
    useEffect(() => {
        if (isOpen) {
            setForm({
                driver_name:    initialData?.driver_name    || "",
                driver_phone:   initialData?.driver_phone   || "",
                vehicle_number: initialData?.vehicle_number || "",
                driver_remarks: initialData?.driver_remarks || "",
            });
            setError("");
        }
    }, [isOpen, rowId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.driver_name.trim()) { setError("Driver name is required."); return; }
        if (!/^[6-9]\d{9}$/.test(form.driver_phone)) {
            setError("Phone must be 10 digits and start with 6–9."); return;
        }
        if (!form.vehicle_number.trim()) { setError("Vehicle number is required."); return; }

        setLoading(true); setError("");
        try {
            const res  = await fetchFn(`${apiUrl}/${rowId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...authHeader },
                body: JSON.stringify({
                    driver_name:    form.driver_name.trim(),
                    driver_phone:   form.driver_phone.trim(),
                    vehicle_number: form.vehicle_number.trim(),
                    driver_remarks: form.driver_remarks.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || "Failed to save driver details.");
            onSuccess(data.data);
            onClose();
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    /* ── Shared styles ── */
    const inp = {
        width: "100%", padding: "9px 12px", boxSizing: "border-box",
        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "7px", color: "#f1f5f9", fontSize: "0.88rem", outline: "none",
    };
    const lbl = {
        display: "block", color: "var(--text-muted)", fontSize: "0.75rem",
        marginBottom: "4px", marginTop: "14px",
    };

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
                zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
            }}
        >
            <div
                className="glass-card"
                style={{ width: "100%", maxWidth: "480px", position: "relative" }}
            >
                <button
                    onClick={onClose}
                    style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
                >✕</button>

                <h4 style={{ margin: "0 0 6px", color: "var(--text-primary)" }}>🚗 Assign Driver</h4>
                <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                    Provide driver details before marking this submission as coordinated.
                </p>

                <form onSubmit={handleSubmit}>
                    <label style={lbl}>Driver Name <span style={{ color: "#f87171" }}>*</span></label>
                    <input
                        style={inp}
                        placeholder="e.g. Ravi Kumar"
                        value={form.driver_name}
                        onChange={(e) => setForm((f) => ({ ...f, driver_name: e.target.value }))}
                    />

                    <label style={lbl}>Driver Phone <span style={{ color: "#f87171" }}>*</span> <small style={{ fontWeight: 400, color: "var(--text-muted)" }}>(10-digit Indian mobile)</small></label>
                    <input
                        style={inp}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={form.driver_phone}
                        onChange={(e) => setForm((f) => ({ ...f, driver_phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    />

                    <label style={lbl}>Vehicle Number <span style={{ color: "#f87171" }}>*</span></label>
                    <input
                        style={inp}
                        placeholder="e.g. KA-01-AB-1234"
                        value={form.vehicle_number}
                        onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value }))}
                    />

                    <label style={lbl}>Remarks <small style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</small></label>
                    <textarea
                        rows={3}
                        style={{ ...inp, resize: "vertical" }}
                        placeholder="Any additional notes about the driver or vehicle…"
                        value={form.driver_remarks}
                        onChange={(e) => setForm((f) => ({ ...f, driver_remarks: e.target.value }))}
                    />

                    {error && (
                        <div style={{
                            marginTop: "12px", padding: "9px 12px", borderRadius: "7px",
                            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                            color: "#f87171", fontSize: "0.82rem",
                        }}>
                            ⚠ {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1, padding: "12px", fontWeight: 700, borderRadius: "8px",
                                background: "rgba(16,185,129,0.18)", border: "1px solid #10b981",
                                color: "#10b981", cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Saving…" : "✓ Save Driver"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "12px 20px", background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "var(--text-secondary)", borderRadius: "8px",
                                cursor: "pointer", fontWeight: 600,
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
