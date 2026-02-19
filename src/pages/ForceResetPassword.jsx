import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/auth.css";

const ForceResetPassword = () => {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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
                            <input
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
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
