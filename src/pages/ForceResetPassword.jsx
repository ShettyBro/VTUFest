import { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import "../styles/auth.css";
import PasswordStrength from "../components/PasswordStrength";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

// Routes to the correct reset endpoint based on portal
const buildResetUrl = (portal, role) => {
    if (portal === "admin" || portal === "em" || portal === "transport") {
        return `${API_BASE}/api/admin/auth/reset-password`;
    }
    return `${API_BASE}/api/auth/reset-password/${role}`;
};

// Returns the login page to send the user back to after reset
const getReturnPath = (portal) => {
    if (portal === "admin") return "/ad-login";
    if (portal === "em") return "/em-login";
    if (portal === "transport") return "/travel/login";
    if (portal === "da") return "/da-login";
    return "/";
};

// Portal display name for left panel
const getPortalLabel = (portal) => {
    if (portal === "admin") return "Admin Control Panel";
    if (portal === "em") return "Staff Portal";
    if (portal === "transport") return "Transport Manager Portal";
    if (portal === "da") return "Data Admin Portal";
    return "VTU HABBA 2026";
};

export default function ForceResetPassword() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [portal, setPortal] = useState("");
    const { showPopup } = usePopup();
    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = localStorage.getItem("force_reset_email");
        const token = localStorage.getItem("force_reset_token");
        const storedPortal = localStorage.getItem("force_reset_portal") || "";

        if (!storedEmail || !token) {
            showPopup("Invalid session. Please login again.", "error");
            navigate("/");
            return;
        }
        setEmail(storedEmail);
        setPortal(storedPortal);
    }, [navigate, showPopup]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            showPopup("Password must be at least 8 characters.", "warning");
            return;
        }
        if (newPassword !== confirmPassword) {
            showPopup("Passwords do not match.", "warning");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("force_reset_token");
        const role = localStorage.getItem("force_reset_role");
        const currentPortal = localStorage.getItem("force_reset_portal") || "";
        const url = buildResetUrl(currentPortal, role?.toLowerCase());

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    token,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Clear all force_reset keys
                ["force_reset_token", "force_reset_email", "force_reset_role", "force_reset_portal"]
                    .forEach(k => localStorage.removeItem(k));

                showPopup("Password set successfully! Redirecting to login…", "success");
                setTimeout(() => {
                    navigate(getReturnPath(currentPortal));
                }, 2000);
            } else {
                const msg = data.message || data.error || "Failed to reset password";
                const type = msg.toLowerCase().includes("same as") ? "warning" : "error";
                showPopup(msg, type);
            }
        } catch {
            showPopup("Network error. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="shape shape-1" />
            <div className="shape shape-2" />

            <div className="auth-container">
                {/* ── LEFT PANEL ── */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Habba Logo" />
                        <div className="brand-text">
                            <h3>VTU HABBA 2026</h3>
                            <span>{getPortalLabel(portal)}</span>
                        </div>
                    </div>

                    {/* First-time login notice */}
                    <div style={{
                        marginTop: "36px",
                        background: "rgba(255,200,0,0.12)",
                        border: "1px solid rgba(255,200,0,0.35)",
                        borderRadius: "14px",
                        padding: "20px 22px",
                        textAlign: "left",
                        maxWidth: "320px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                            <ShieldCheck size={22} color="#fde68a" />
                            <span style={{ color: "#fde68a", fontWeight: 700, fontSize: "0.95rem" }}>
                                First-Time Login Required
                            </span>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                            Your account was issued a default password. For security you must set a new password before continuing.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", marginTop: "10px" }}>
                            This token expires in <strong style={{ color: "#fde68a" }}>15 minutes</strong>. If it expires, log in again to get a new one.
                        </p>
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="auth-form-panel">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <h2 className="form-title">Set Your Password</h2>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", textAlign: "center", marginBottom: "24px", marginTop: "-6px" }}>
                            Logged in as <strong style={{ color: "#a8edea" }}>{email}</strong>
                        </p>

                        <div className="input-group">
                            <label>New Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    disabled={loading}
                                    style={{ paddingRight: "42px" }}
                                />
                                <button type="button" onClick={() => setShowNewPassword(v => !v)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
                                    tabIndex={-1} aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>

                        <PasswordStrength password={newPassword} confirmPassword={confirmPassword} />

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    style={{ paddingRight: "42px" }}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
                                    tabIndex={-1} aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>

                        <button className="auth-btn" type="submit" disabled={loading}>
                            {loading ? "Setting Password…" : "Set Password & Continue"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
