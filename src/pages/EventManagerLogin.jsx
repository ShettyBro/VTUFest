
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://vtu-festserver-production.up.railway.app";
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`;

export default function EventManagerLogin() {
    const navigate = useNavigate();
    const { showPopup } = usePopup();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(LOGIN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    role: "event_manager" // Dedicated role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("vtufest_token", data.token);
                localStorage.setItem("vtufest_role", "event_manager");
                localStorage.setItem("manager_name", data.name || "Event Manager");

                showPopup("Welcome, Event Manager!", "success");
                navigate("/event-manager-dashboard");
            } else {
                showPopup(data.message || "Invalid credentials", "error");
            }
        } catch (error) {
            showPopup("Server error. Check connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>

            <div className="auth-container">
                {/* LEFT PANEL */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Fest Logo" style={{ maxWidth: '100%', maxHeight: '120px' }} />
                    </div>
                    <div className="brand-text">
                        <h3>Event Manager</h3>
                        <span>Event Coordination & Logistics</span>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-form-panel">
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2 className="form-title">Manager Login</h2>

                        <div className="input-group">
                            <label>Official Email</label>
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
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="auth-btn" disabled={loading}>
                            {loading ? "Authenticating..." : "Access Event Panel"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
