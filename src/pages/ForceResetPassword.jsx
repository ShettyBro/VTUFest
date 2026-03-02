import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/auth.css";
import PasswordStrength from "../components/PasswordStrength";

const ForceResetPassword = () => {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showPopup } = usePopup();
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    useEffect(() => {
        const storedEmail = localStorage.getItem("force_reset_email");
        const token = localStorage.getItem("force_reset_token");

        if (!storedEmail || !token) {
            showPopup("Invalid session. Please login again.", "error");
            navigate("/");
            return;
        }
        setEmail(storedEmail);
    }, [navigate, showPopup]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            showPopup("Password must be at least 8 characters.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showPopup("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("force_reset_token");
        const role = localStorage.getItem("force_reset_role"); // super_admin, sub_admin, event_manager

        try {
            const response = await fetch(`${API_BASE}/api/auth/reset-password/${role}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: newPassword, confirm_password: confirmPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                showPopup("Password set successfully. Please login.", "success");
                // Clear all force_reset keys
                localStorage.removeItem("force_reset_token");
                localStorage.removeItem("force_reset_email");
                localStorage.removeItem("force_reset_role");

                // Navigate based on role
                if (role === "event_manager") {
                    navigate("/event-manager-login");
                } else {
                    navigate("/admin-login");
                }
            } else {
                showPopup(data.message || "Failed to reset password", "error");
            }
        } catch (error) {
            showPopup("Network error. Please try again.", "error");
            console.error("Reset password error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="auth-container">
                <div className="glass-card auth-card">
                    <h2 className="auth-title">Set Password</h2>
                    <p className="auth-subtitle">First-time login requirement</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="disabled-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    style={{ paddingRight: '42px' }}
                                />
                                <button type="button" onClick={() => setShowNewPassword(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                                    tabIndex={-1} aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                >{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>

                        <PasswordStrength password={newPassword} confirmPassword={confirmPassword} />

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '42px' }}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                                    tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>

                        <button type="submit" className="neon-btn auth-btn" disabled={loading}>
                            {loading ? "Setting Password..." : "Set Password & Login"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default ForceResetPassword;
