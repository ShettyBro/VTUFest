
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://vtu-festserver-production.up.railway.app";
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`;

export default function VolunteerLogin() {
    const navigate = useNavigate();
    const { showPopup } = usePopup();

    // "registration_desk", "helpdesk", "inevent"
    const [volunteerType, setVolunteerType] = useState("volunteer_registration");
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
                    role: volunteerType // Sending specific volunteer role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("vtufest_token", data.token);
                localStorage.setItem("vtufest_role", volunteerType);
                localStorage.setItem("volunteer_name", data.name || "Volunteer");

                showPopup(`Logged in as ${volunteerType.replace('volunteer_', '').toUpperCase()}`, "success");
                navigate("/volunteer-dashboard");
            } else {
                showPopup(data.message || "Login failed", "error");
            }
        } catch (error) {
            showPopup("Connection failed.", "error");
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
                        <h3>Volunteer Portal</h3>
                        <span>Registration • Helpdesk • In-Event</span>
                    </div>
                    <div className="auth-toggle-msg">
                        <p>Support Team Access</p>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-form-panel">
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2 className="form-title">Volunteer Login</h2>

                        {/* Volunteer Type Selector */}
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Select Department</label>
                            <div className="role-tabs" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className={`role-tab ${volunteerType === "volunteer_registration" ? "active" : ""}`}
                                    onClick={() => setVolunteerType("volunteer_registration")}
                                    style={{ flex: 1, fontSize: '0.8rem' }}
                                >
                                    Registration
                                </button>
                                <button
                                    type="button"
                                    className={`role-tab ${volunteerType === "volunteer_helpdesk" ? "active" : ""}`}
                                    onClick={() => setVolunteerType("volunteer_helpdesk")}
                                    style={{ flex: 1, fontSize: '0.8rem' }}
                                >
                                    Help Desk
                                </button>
                                <button
                                    type="button"
                                    className={`role-tab ${volunteerType === "volunteer_inevent" ? "active" : ""}`}
                                    onClick={() => setVolunteerType("volunteer_inevent")}
                                    style={{ flex: 1, fontSize: '0.8rem' }}
                                >
                                    In-Event
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Registered Email</label>
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
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button className="auth-btn" disabled={loading}>
                            {loading ? "Checking details..." : "Start Shift"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
