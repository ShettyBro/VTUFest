import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const API = "https://api.vtufest2026.acharyahabba.com";

export default function IDCardLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("id_card_editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect to appropriate portal
  useEffect(() => {
    const token = localStorage.getItem("vtufest_idcard_token");
    const storedRole = localStorage.getItem("vtufest_idcard_role");
    if (token) {
      navigate(storedRole === "id_card_team" ? "/media/team" : "/media/editor", { replace: true });
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/volunteer/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Invalid credentials");

      localStorage.setItem("vtufest_idcard_token", data.token);
      localStorage.setItem("vtufest_idcard_role", data.role);
      localStorage.setItem("vtufest_idcard_name", data.full_name || data.email);

      navigate(data.role === "id_card_team" ? "/media/team" : "/media/editor", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
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
              <span>ID Card Portal</span>
            </div>
          </div>
          <div style={{ marginTop: "30px", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", textAlign: "center" }}>
            <p>🪪 ID Card Management Portal</p>
            <p>Restricted access for authorised volunteers only.</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-form-panel">
          {error && <div className="error-msg">{error}</div>}
          <form className="auth-form" onSubmit={handleLogin}>
            <h2 className="form-title">ID Card Volunteer Login</h2>

            {/* Role Selector */}
            <div className="input-group">
              <label>Select Your Role</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                {[
                  { value: "id_card_editor", label: "📸 Photo Editor" },
                  { value: "id_card_team", label: "📦 ID Card Team" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      border: role === opt.value ? "2px solid #818cf8" : "2px solid rgba(255,255,255,0.15)",
                      background: role === opt.value ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)",
                      color: role === opt.value ? "#818cf8" : "#94a3b8",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)", background: "none", border: "none",
                    cursor: "pointer", color: "#000", padding: 0, lineHeight: 1,
                    display: "flex", alignItems: "center",
                  }}
                  tabIndex={-1}
                >
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
