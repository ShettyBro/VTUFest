import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [adminRole, setAdminRole] = useState("SUPER_ADMIN");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem("vtufest_admin_token");
        const role = localStorage.getItem("vtufest_admin_role");
        if (token && role) navigate("/ad-dashboard");
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, role: adminRole }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Login failed");

            localStorage.setItem("vtufest_admin_token", data.data.token);
            localStorage.setItem("vtufest_admin_role", data.data.role);
            localStorage.setItem("vtufest_admin_name", data.data.name);
            navigate("/ad-dashboard");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                            <span>Admin Control Panel</span>
                        </div>
                    </div>
                    <div className="auth-toggle-msg" style={{ marginTop: '30px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', textAlign: 'center' }}>
                        <p>Restricted access.</p>
                        <p>Authorized personnel only.</p>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-form-panel">
                    {error && <div className="error-msg">{error}</div>}

                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2 className="form-title">Admin Login</h2>

                        {/* Role Tabs */}
                        <div className="role-tabs">
                            {["SUPER_ADMIN", "SUB_ADMIN"].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    className={`role-tab ${adminRole === r ? "active" : ""}`}
                                    onClick={() => setAdminRole(r)}
                                >
                                    {r === "SUPER_ADMIN" ? "Super Admin" : "Sub Admin"}
                                </button>
                            ))}
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder={`Enter ${adminRole === "SUPER_ADMIN" ? "super admin" : "sub admin"} email`}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '42px' }}
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', padding: 0, lineHeight: 1 }}
                                    tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >{showPassword ? '🙈' : '👁️'}</button>
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