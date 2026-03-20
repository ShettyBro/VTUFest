import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

const API = "https://api.vtufest2026.acharyahabba.com";

export default function TransportLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("transport_token")) navigate("/travel");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/transport-manager/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");
      localStorage.setItem("transport_token", data.data?.token || data.token);
      localStorage.setItem("transport_role", data.data?.role || "TRANSPORT_MANAGER");
      navigate("/travel");
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
              <span>Transport Manager Portal</span>
            </div>
          </div>
          <div style={{ marginTop: "30px", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", textAlign: "center" }}>
            <p>🚌 Transport Coordination Dashboard</p>
            <p>Restricted access for transport coordinators only.</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-form-panel">
          {error && <div className="error-msg">{error}</div>}
          <form className="auth-form" onSubmit={handleLogin}>
            <h2 className="form-title">Transport Manager Login</h2>

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
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#000", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
                  tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
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
