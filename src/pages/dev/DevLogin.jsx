import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const API_BASE = "https://api.vtufest2026.acharyahabba.com";

export default function DevLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [forceResetNotice, setForceResetNotice] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("vtufest_dev_token");
        if (token) navigate("/dev/dashboard");
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: "SUPER_ADMIN" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Login failed");

            if (data.data?.status === "FORCE_RESET") {
                localStorage.setItem("force_reset_token", data.data.reset_token);
                localStorage.setItem("force_reset_email", data.data.email);
                localStorage.setItem("force_reset_role", data.data.role);
                localStorage.setItem("force_reset_portal", "dev");
                setForceResetNotice(true);
                setTimeout(() => navigate("/force-reset-password"), 2500);
                return;
            }

            localStorage.setItem("vtufest_dev_token", data.data.token);
            localStorage.setItem("vtufest_dev_name", data.data.name);
            navigate("/dev/dashboard");
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

            {forceResetNotice && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                    animation: "fadeIn 0.3s ease",
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, rgba(20,20,50,0.97), rgba(50,20,90,0.97))",
                        border: "1px solid rgba(167,139,250,0.4)",
                        borderRadius: "20px", padding: "40px 36px",
                        textAlign: "center", maxWidth: "420px", width: "90%",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                        animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔐</div>
                        <h3 style={{ color: "#c4b5fd", fontSize: "1.4rem", fontWeight: 700, marginBottom: "10px" }}>
                            Password Reset Required
                        </h3>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px" }}>
                            Your account requires a password change. Redirecting…
                        </p>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", width: "100%",
                                background: "linear-gradient(to right, #818cf8, #a78bfa)",
                                animation: "progressBar 2.3s linear forwards",
                            }} />
                        </div>
                    </div>
                    <style>{`
                        @keyframes slideUp { from { opacity:0; transform:scale(0.88) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
                        @keyframes progressBar { from { transform:scaleX(0); transform-origin:left; } to { transform:scaleX(1); transform-origin:left; } }
                        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                    `}</style>
                </div>
            )}

            <div className="auth-container">
                {/* LEFT PANEL */}
                <div className="auth-info-panel" style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}>
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Fest Logo" />
                        <div className="brand-text">
                            <h3 style={{ color: "#a78bfa" }}>Developer Panel</h3>
                            <span style={{ color: "rgba(167,139,250,0.7)" }}>Super Admin Only</span>
                        </div>
                    </div>
                    <div className="auth-toggle-msg" style={{ marginTop: "30px", color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", textAlign: "center" }}>
                        <p style={{ color: "#f87171", fontWeight: 600, marginBottom: 8 }}>⚠ Restricted Access</p>
                        <p>All actions are permanently logged.</p>
                        <p>Authorized personnel only.</p>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-form-panel">
                    {error && <div className="error-msg">{error}</div>}
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2 className="form-title">Developer Panel Login</h2>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="Enter super admin email"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: "relative" }}>
                                <input type={showPassword ? "text" : "password"} placeholder="Enter password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    required style={{ paddingRight: "42px" }} />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#000", padding: 0, display: "flex", alignItems: "center" }}
                                    tabIndex={-1}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button className="auth-btn" disabled={loading}
                            style={{ background: loading ? "#4c1d95" : "linear-gradient(135deg, #534AB7, #7c3aed)" }}>
                            {loading ? "Authenticating…" : "Access Developer Panel"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
