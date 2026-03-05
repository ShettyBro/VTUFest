import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useDA } from "../../context/DAContext";
import "../../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.vtufest2026.acharyahabba.com";

export default function DALogin() {
    const navigate = useNavigate();
    const { token, login } = useDA();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Already logged in → go to students page
    useEffect(() => {
        if (token) navigate("/da-students", { replace: true });
    }, [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/da/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Login failed");
            login(data.data.token, { name: data.data.name, email: data.data.email });
            navigate("/da-students");
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
                        <img src="/main.webp" alt="VTU Habba Logo" />
                        <div className="brand-text">
                            <h3>VTU HABBA 2026</h3>
                            <span>Data Admin Portal</span>
                        </div>
                    </div>
                    <div style={{ marginTop: "32px", textAlign: "center" }}>
                        <div style={{
                            display: "inline-block",
                            padding: "6px 16px",
                            background: "rgba(168,85,247,0.18)",
                            border: "1px solid rgba(168,85,247,0.45)",
                            borderRadius: "20px",
                            color: "#c084fc",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            marginBottom: "16px",
                        }}>
                            🔒 DATA CORRECTION OFFICER
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                            Internal tool for authorized faculty only.<br />
                            All actions are logged and audited.
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-form-panel">
                    {error && <div className="error-msg">{error}</div>}

                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2 className="form-title">DA Portal Login</h2>
                        <p style={{ color: "#94a3b8", fontSize: "0.83rem", margin: "-8px 0 20px 0", textAlign: "center" }}>
                            Data Correction Officer access
                        </p>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPw ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: "42px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#000", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
                                    tabIndex={-1}
                                    aria-label={showPw ? "Hide password" : "Show password"}
                                >
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
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