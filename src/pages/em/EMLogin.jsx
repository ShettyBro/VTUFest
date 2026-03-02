import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";
const EM_LOGIN_URL = `${API_BASE}/api/em/auth/login`;

export default function EMLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedRole, setSelectedRole] = useState("em");

    useEffect(() => {
        // EM / GR already logged in
        const emToken = localStorage.getItem("vtufest_em_token");
        const emRole = localStorage.getItem("vtufest_em_role");
        if (emToken) {
            if (emRole === "GR_INCHARGE") navigate("/gr-dashboard");
            else navigate("/em-dashboard");
            return;
        }
        // Accounts already logged in
        if (localStorage.getItem("vtufest_accounts_token")) {
            navigate("/accounts-dashboard");
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (selectedRole === "ACCOUNTS") {
                // ── Accounts login — same /api/em/auth/login endpoint, role: "ACCOUNTS" ──
                const res = await fetch(EM_LOGIN_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password,
                        role: "ACCOUNTS",
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Login failed");

                localStorage.setItem("vtufest_accounts_token", data.data.token);
                localStorage.setItem("vtufest_accounts_name", data.data.name);
                localStorage.setItem("vtufest_accounts_role", "ACCOUNTS");
                navigate("/accounts-dashboard");
            } else {
                // ── EM / GR_INCHARGE login — existing endpoint ──────────────
                const res = await fetch(`${API_BASE}/api/em/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password,
                        role: selectedRole,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Login failed");

                localStorage.setItem("vtufest_em_token", data.data.token);
                localStorage.setItem("vtufest_em_name", data.data.name);
                localStorage.setItem("vtufest_em_role", selectedRole);

                if (selectedRole === "GR_INCHARGE") navigate("/gr-dashboard");
                else navigate("/em-dashboard");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const roleLabels = {
        em: "Event Manager Portal",
        GR_INCHARGE: "Green Room Incharge Portal",
        ACCOUNTS: "Accounts Department Portal",
    };

    return (
        <div className="auth-page">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
            <div className="auth-container">
                {/* LEFT PANEL */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Fest Logo" />
                        <div className="brand-text">
                            <h3>VTU HABBA 2026</h3>
                            <span>Staff Portal</span>
                        </div>
                    </div>
                    <div style={{ marginTop: "30px", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", textAlign: "center" }}>
                        <p>{roleLabels[selectedRole]}</p>
                        <p>Restricted access.</p>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-form-panel">
                    {error && <div className="error-msg">{error}</div>}
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2 className="form-title">Staff Login</h2>

                        {/* ROLE TABS */}
                        <div className="role-tabs">
                            <button
                                type="button"
                                className={`role-tab ${selectedRole === "em" ? "active" : ""}`}
                                onClick={() => { setSelectedRole("em"); setError(""); }}
                            >
                                Event Manager
                            </button>
                            <button
                                type="button"
                                className={`role-tab ${selectedRole === "GR_INCHARGE" ? "active" : ""}`}
                                onClick={() => { setSelectedRole("GR_INCHARGE"); setError(""); }}
                            >
                                GR Incharge
                            </button>
                            <button
                                type="button"
                                className={`role-tab ${selectedRole === "ACCOUNTS" ? "active" : ""}`}
                                onClick={() => { setSelectedRole("ACCOUNTS"); setError(""); }}
                            >
                                Accounts
                            </button>
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="Enter your email" value={email}
                                onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: "42px" }}
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
                                    tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}
                                >{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>
                        <button className="auth-btn" disabled={loading}>
                            {loading ? "Logging In..." : "Log In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}