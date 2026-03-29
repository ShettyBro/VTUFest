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
    const [selectedRole, setSelectedRole] = useState("EVENT_MANAGER");
    const [forceResetNotice, setForceResetNotice] = useState(false);

    useEffect(() => {
        const emToken = localStorage.getItem("vtufest_em_token");
        const emRole = localStorage.getItem("vtufest_em_role");
        if (emToken) {
            if (emRole === "GR_INCHARGE") navigate("/gr-dashboard");
            else navigate("/em-accommodation");
            return;
        }
        if (localStorage.getItem("vtufest_accounts_token")) {
            navigate("/accounts-dashboard");
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(EM_LOGIN_URL, {
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

            // ⚠️ FORCE_RESET
            if (data.data?.status === "FORCE_RESET") {
                localStorage.setItem("force_reset_token", data.data.reset_token);
                localStorage.setItem("force_reset_email", data.data.email);
                localStorage.setItem("force_reset_role", data.data.role);
                localStorage.setItem("force_reset_portal", "em");
                setForceResetNotice(true);
                setTimeout(() => navigate("/force-reset-password"), 2500);
                return;
            }

            // ✅ Normal login
            if (selectedRole === "ACCOUNTS") {
                localStorage.setItem("vtufest_accounts_token", data.data.token);
                localStorage.setItem("vtufest_accounts_name", data.data.name);
                localStorage.setItem("vtufest_accounts_role", "ACCOUNTS");
                navigate("/accounts-dashboard");
            } else {
                localStorage.setItem("vtufest_em_token", data.data.token);
                localStorage.setItem("vtufest_em_name", data.data.name);
                localStorage.setItem("vtufest_em_role", selectedRole);
                if (selectedRole === "GR_INCHARGE") navigate("/gr-dashboard");
                else navigate("/em-accommodation");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const roleLabels = {
        EVENT_MANAGER: "Accommodation Manager Portal",
        GR_INCHARGE: "Cloakroom Incharge Portal",
        ACCOUNTS: "Accounts Department Portal",
    };

    return (
        <div className="auth-page">
            <div className="shape shape-1" />
            <div className="shape shape-2" />

            {/* FORCE RESET OVERLAY */}
            {forceResetNotice && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, rgba(30,30,60,0.95), rgba(60,20,80,0.95))",
                        border: "1px solid rgba(253,230,138,0.4)",
                        borderRadius: "20px", padding: "40px 36px",
                        textAlign: "center", maxWidth: "420px", width: "90%",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                        animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔐</div>
                        <h3 style={{ color: "#fde68a", fontSize: "1.4rem", fontWeight: 700, marginBottom: "10px" }}>
                            First-Time Login Detected
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px" }}>
                            Your account requires a password change before you can continue. Redirecting you now…
                        </p>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: "100%", background: "linear-gradient(to right, #fde68a, #a78bfa)", animation: "progressBar 2.3s linear forwards" }} />
                        </div>
                    </div>
                    <style>{`
                        @keyframes slideUp { from { opacity:0; transform:scale(0.88) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
                        @keyframes progressBar { from { transform:scaleX(0); transform-origin:left; } to { transform:scaleX(1); transform-origin:left; } }
                    `}</style>
                </div>
            )}

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

                        <div className="role-tabs">
                            <button type="button" className={`role-tab ${selectedRole === "EVENT_MANAGER" ? "active" : ""}`}
                                onClick={() => { setSelectedRole("EVENT_MANAGER"); setError(""); }}>Accomodation</button>
                            <button type="button" className={`role-tab ${selectedRole === "GR_INCHARGE" ? "active" : ""}`}
                                onClick={() => { setSelectedRole("GR_INCHARGE"); setError(""); }}>Cloakroom</button>
                            <button type="button" className={`role-tab ${selectedRole === "ACCOUNTS" ? "active" : ""}`}
                                onClick={() => { setSelectedRole("ACCOUNTS"); setError(""); }}>Accounts</button>
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="Enter your email" value={email}
                                onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: "relative" }}>
                                <input type={showPassword ? "text" : "password"} placeholder="Enter password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    required style={{ paddingRight: "42px" }} />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#000", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
                                    tabIndex={-1}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button className="auth-btn" disabled={loading}>
                            {loading ? "Logging In…" : "Log In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}