import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import { isValidIndianPhone, sanitizePhone } from "../utils/phoneValidation";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const STATUS_CFG = {
    PENDING: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "#f59e0b", label: "⏳ Pending" },
    ALLOCATED: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "#10b981", label: "✅ Allocated" },
    REJECTED: { color: "#f87171", bg: "rgba(239,68,68,0.15)", border: "#ef4444", label: "❌ Rejected" },
    CANCELLED: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", border: "#94a3b8", label: "🚫 Cancelled" },
};
const scfg = (s) => STATUS_CFG[s?.toUpperCase()] || STATUS_CFG.PENDING;

export default function GreenRoom() {
    const navigate = useNavigate();
    const token = localStorage.getItem("vtufest_token");
    const { showPopup } = usePopup();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState(null); // { college, participant_count, existing_request }
    const [formData, setFormData] = useState({
        contact_person_name: "",
        contact_person_phone: "",
        special_requirements: "",
    });

    useEffect(() => {
        if (!token) { navigate("/"); return; }
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/manager/green-room`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                showPopup("Session expired", "error");
                navigate("/");
                return;
            }
            const json = await res.json();
            if (json.success) setData(json.data);
            else showPopup(json.message || "Failed to load green room status", "error");
        } catch {
            showPopup("Network error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "contact_person_phone") {
            setFormData((p) => ({ ...p, [name]: sanitizePhone(value) }));
        } else {
            setFormData((p) => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.contact_person_name.trim()) {
            showPopup("Contact person name is required", "warning"); return;
        }
        if (!isValidIndianPhone(formData.contact_person_phone)) {
            showPopup("Contact phone must be exactly 10 digits and start with 6, 7, 8, or 9", "warning"); return;
        }
        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/api/manager/green-room/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    contact_person_name: formData.contact_person_name.trim(),
                    contact_person_phone: formData.contact_person_phone.trim(),
                    special_requirements: formData.special_requirements.trim() || undefined,
                }),
            });
            const json = await res.json();
            if (json.success) {
                showPopup("Green room request submitted successfully!", "success");
                fetchStatus();
            } else {
                showPopup(json.message || "Submission failed", "error");
            }
        } catch {
            showPopup("Something went wrong", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "12px", borderRadius: "8px",
        background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)",
        color: "white", fontSize: "0.95rem", marginTop: "5px",
    };
    const labelStyle = {
        display: "block", color: "var(--text-secondary)", fontSize: "0.9rem",
        marginBottom: "5px", marginTop: "15px",
    };

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
                    <h3>Loading...</h3>
                </div>
            </Layout>
        );
    }

    const existing = data?.existing_request;
    const college = data?.college;
    const participantCount = data?.participant_count ?? 0;
    const isFinalApproved = college?.is_final_approved;

    return (
        <Layout>
            <div className="dashboard-glass-wrapper">
                <div className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Green Room</h1>
                        <p>Request Green Room for Your Team</p>
                    </div>
                </div>

                {/* Not final-approved gate */}
                {!isFinalApproved && (
                    <div className="glass-card" style={{ background: "rgba(239,68,68,0.1)", borderColor: "#ef4444", marginBottom: "20px", textAlign: "center" }}>
                        🔒 Green room requests are available only after the Principal submits the Final Approval. Please complete the final approval process first.
                    </div>
                )}

                {/* Participant count info */}
                {isFinalApproved && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.4)",
                        borderLeft: "4px solid #10b981", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px",
                    }}>
                        <span style={{ fontSize: "1.3rem" }}>👥</span>
                        <div>
                            <strong style={{ color: "#10b981", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Registered Participants
                            </strong>
                            <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                Your college has <strong style={{ color: "#34d399" }}>{participantCount}</strong> participant{participantCount !== 1 ? "s" : ""} registered.
                                The green room will be allocated based on this count.
                            </p>
                        </div>
                    </div>
                )}

                <div className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
                    {existing ? (
                        // ── EXISTING REQUEST VIEW ──
                        <div style={{ textAlign: "center", padding: "20px" }}>
                            <h2 style={{ color: "var(--academic-gold)", marginBottom: "30px" }}>Request Status</h2>

                            <div style={{
                                display: "inline-block", padding: "10px 24px", borderRadius: "50px",
                                background: scfg(existing.status).bg,
                                color: scfg(existing.status).color,
                                border: `1px solid ${scfg(existing.status).border}`,
                                fontWeight: "bold", textTransform: "uppercase", marginBottom: "30px",
                            }}>
                                {scfg(existing.status).label}
                            </div>

                            <div style={{ textAlign: "left", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px" }}>
                                <div className="detail-row">
                                    <span>Participants:</span>
                                    <span>{existing.total_participants}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Contact Person:</span>
                                    <span>{existing.contact_person_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Contact Phone:</span>
                                    <span>{existing.contact_person_phone}</span>
                                </div>
                                {existing.special_requirements && (
                                    <div className="detail-row">
                                        <span>Special Requirements:</span>
                                        <span>{existing.special_requirements}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span>Applied At:</span>
                                    <span>{fmt(existing.applied_at)}</span>
                                </div>
                                {(existing.status === "REJECTED" || existing.status === "CANCELLED") && existing.rejection_reason && (
                                    <div className="detail-row" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "10px", paddingTop: "10px" }}>
                                        <span style={{ color: "#f87171" }}>Reason:</span>
                                        <span style={{ color: "#fca5a5" }}>{existing.rejection_reason}</span>
                                    </div>
                                )}
                            </div>

                            {/* ALLOCATION DETAILS */}
                            {existing.status === "ALLOCATED" && existing.allocation_id && (
                                <div style={{ marginTop: "28px", textAlign: "left" }}>
                                    <h3 style={{ color: "var(--academic-gold)", marginBottom: "14px", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        🏢 Allocated Room
                                    </h3>
                                    <div style={{
                                        background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)",
                                        borderRadius: "12px", padding: "20px",
                                    }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            {[
                                                { label: "Building", value: existing.building_name },
                                                { label: "Floor", value: existing.floor_number },
                                                { label: "Room Number", value: existing.room_number },
                                                { label: "Capacity", value: existing.capacity },
                                            ].map(({ label, value }) => (
                                                <div key={label}>
                                                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                                                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "2px", fontSize: "1rem" }}>{value ?? "—"}</div>
                                                </div>
                                            ))}
                                            {existing.allocation_notes && (
                                                <div style={{ gridColumn: "1 / -1" }}>
                                                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</div>
                                                    <div style={{ color: "var(--text-secondary)", marginTop: "2px", fontStyle: "italic" }}>{existing.allocation_notes}</div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ marginTop: "14px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                            Allocated at: {fmt(existing.allocated_at)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : isFinalApproved ? (
                        // ── NEW REQUEST FORM ──
                        <div>
                            <h3 style={{ color: "var(--text-primary)", marginBottom: "20px" }}>Submit Green Room Request</h3>

                            {participantCount === 0 && (
                                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#fca5a5", fontSize: "0.88rem" }}>
                                    ⚠️ No participants found for your college. You need at least 1 registered participant to apply.
                                </div>
                            )}

                            <div style={{ marginBottom: "8px" }}>
                                <small style={{ color: "var(--accent-warning)", fontSize: "0.85rem" }}>
                                    ℹ️ The room will be allocated based on your registered participant count ({participantCount}).
                                </small>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div>
                                    <label style={labelStyle}>Contact Person Name *</label>
                                    <input
                                        type="text"
                                        name="contact_person_name"
                                        value={formData.contact_person_name}
                                        onChange={handleInputChange}
                                        style={inputStyle}
                                        placeholder="Name of person responsible"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Contact Phone *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        name="contact_person_phone"
                                        value={formData.contact_person_phone}
                                        onChange={handleInputChange}
                                        style={inputStyle}
                                        maxLength={10}
                                        pattern="[6-9][0-9]{9}"
                                        placeholder="e.g. 9876543210 (start with 6-9)"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Special Requirements (Optional)</label>
                                    <textarea
                                        name="special_requirements"
                                        value={formData.special_requirements}
                                        onChange={handleInputChange}
                                        style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                                        placeholder="Any specific needs..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="neon-btn"
                                    disabled={submitting || participantCount === 0}
                                    style={{ marginTop: "20px" }}
                                >
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔒</div>
                            <p>Green room requests are only available after the Principal submits the Final Approval.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
