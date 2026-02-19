import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/auth.css";

const EventManagerLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { showPopup } = usePopup();
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/admin-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role: "event_manager" }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.status === "FORCE_RESET") {
                    localStorage.setItem("force_reset_token", data.reset_token);
                    localStorage.setItem("force_reset_email", data.email);
                    localStorage.setItem("force_reset_role", data.role);
                    showPopup("First-time login. Please set your password.", "info");
                    navigate("/force-reset-password");
                } else {
                    localStorage.setItem("vtufest_token", data.token);
                    localStorage.setItem("vtufest_role", "event_manager");
                    localStorage.setItem("manager_name", data.name);
                    localStorage.setItem("user_id", data.user_id);

                    showPopup(`Welcome, ${data.name}!`, "success");
                    navigate("/event-manager-dashboard");
                }
            } else {
                showPopup(data.message || "Login failed", "error");
            }
        } catch (error) {
            showPopup("Network error. Please try again.", "error");
            console.error("Login error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="auth-container">
                <div className="glass-card auth-card">
                    <h2 className="auth-title">Event Manager Login</h2>
                    <p className="auth-subtitle">Manage Events & Accommodation</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="manager@vtufest.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="neon-btn auth-btn" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default EventManagerLogin;
