import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";

/**
 * Food Portal Login
 *
 * Two login paths — tried in order:
 *  1. Food Manager (faculty assigned domain=food → admins table, role=FOOD_MANAGER)
 *     POST /api/em/auth/login  { email, password, role: "FOOD_MANAGER" }
 *
 *  2. Super / Sub Admin —uses the main admin token, already a valid food JWT.
 *     POST /api/admin/auth/login  { email, password }
 *
 * Token stored as  vtufest_food_token  /  vtufest_food_name  /  vtufest_food_role
 */
export default function FoodLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const save = (token, name, role) => {
        localStorage.setItem("vtufest_food_token", token);
        localStorage.setItem("vtufest_food_name", name || "Coordinator");
        localStorage.setItem("vtufest_food_role", role || "FOOD_MANAGER");
        navigate("/food/dashboard", { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) { setError("Email and password are required."); return; }
        setLoading(true); setError("");

        try {
            // Food Manager login via /api/em/auth/login with role=FOOD_MANAGER
            const res = await fetch(`${API_BASE}/api/em/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: "FOOD_MANAGER" }),
            });
            const data = await res.json();
            const d = data.data ?? data;

            if (res.ok && data.success !== false) {
                // ── First-time login: redirect to force-reset flow ──────────────
                if (d.status === "FORCE_RESET") {
                    localStorage.setItem("force_reset_token",  d.reset_token);
                    localStorage.setItem("force_reset_email",  d.email);
                    localStorage.setItem("force_reset_role",   d.role);
                    localStorage.setItem("force_reset_portal", "food");
                    navigate("/force-reset-password");
                    return;
                }
                // ── Normal login ────────────────────────────────────────────────
                if (d.token) { save(d.token, d.name, "FOOD_MANAGER"); return; }
            }

            // 401 = wrong password
            if (res.status === 401) { setError("Invalid email or password."); return; }

            // Any other error (e.g. 400 Invalid role — not a FOOD_MANAGER account)
            setError(
                d.message || data.message ||
                "Login failed. If you are an Admin or Super-Admin, please use the \"🍽️ Food Panel\" button inside the Admin Panel instead."
            );
        } catch { setError("Network error — unable to reach server."); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            {/* Background shapes matching main auth page */}
            <div className="shape shape-1" />
            <div className="shape shape-2" />

            <div className="auth-container">
                {/* LEFT — Branding */}
                <div className="auth-info-panel">
                    <div className="auth-brand">
                        <img src="/main.webp" alt="VTU Fest Logos"
                            style={{ height: "auto", maxWidth: "100%", maxHeight: "120px" }} />
                    </div>
                    <div className="brand-text">
                        <h3>Acharya VTU HABBA 2026</h3>
                        <span>Food Management Portal</span>
                    </div>
                    <div className="auth-toggle-msg">
                        <p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "6px" }}>
                            🍽️ Food Coordinator access
                        </p>
                        <p style={{ fontSize: "0.78rem", opacity: 0.5, marginBottom: "6px" }}>
                            Use credentials sent to you by the event team
                        </p>
                        <p style={{ fontSize: "0.75rem", opacity: 0.45, lineHeight: 1.5 }}>
                            Super/Sub Admin? Use the <strong style={{ color: "#d4af37" }}>🍽️ Food Panel</strong> button in the Admin Panel instead.
                        </p>
                    </div>
                </div>

                {/* RIGHT — Form */}
                <div className="auth-form-panel">
                    {error && <div className="error-msg">{error}</div>}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <h2 className="form-title"></h2>

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button className="auth-btn" disabled={loading}>
                            {loading ? "Signing in…" : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
