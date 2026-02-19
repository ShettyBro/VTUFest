import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../context/PopupContext";
import Layout from "../components/layout/layout";
import "../styles/auth.css";

const VolunteerLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("registration"); // registration, helpdesk, event
    const [loading, setLoading] = useState(false);
    const { showPopup } = usePopup();
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

    const getRolePayload = () => {
        switch (activeTab) {
            case "registration":
                return "volunteer_registration";
            case "helpdesk":
                return "volunteer_helpdesk";
            case "event":
                return "volunteer_event";
            default:
                return "volunteer_registration";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role: getRolePayload() }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("vtufest_token", data.token);
                localStorage.setItem("vtufest_role", data.role); // Backend returns exact role
                localStorage.setItem("volunteer_name", data.name);

                showPopup(`Welcome, ${data.name}!`, "success");
                navigate("/volunteer-dashboard");
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
                    <h2 className="auth-title">Volunteer Login</h2>

                    <div className="role-tabs">
                        <button
                            className={`role-tab ${activeTab === "registration" ? "active" : ""}`}
                            onClick={() => setActiveTab("registration")}
                        >
                            Registration
                        </button>
                        <button
                            className={`role-tab ${activeTab === "helpdesk" ? "active" : ""}`}
                            onClick={() => setActiveTab("helpdesk")}
                        >
                            Help Desk
                        </button>
                        <button
                            className={`role-tab ${activeTab === "event" ? "active" : ""}`}
                            onClick={() => setActiveTab("event")}
                        >
                            In-Event
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="volunteer@vtufest.com"
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

export default VolunteerLogin;
