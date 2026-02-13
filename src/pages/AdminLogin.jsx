
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://vtu-festserver-production.up.railway.app";
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

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
          role: "admin" // Hardcoded role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("vtufest_token", data.token);
        localStorage.setItem("vtufest_role", "admin");
        localStorage.setItem("admin_name", data.name || "Admin");

        showPopup("Login Successful!", "success");
        navigate("/admin-dashboard"); // Assuming this route will exist
      } else {
        showPopup(data.message || "Login failed", "error");
      }
    } catch (error) {
      showPopup("Network error. Please try again.", "error");
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
            <h3>Admin Portal</h3>
            <span>VTU HABBA 2026 Administration</span>
          </div>
          <div className="auth-toggle-msg">
            <p>Authorized personnel only.</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-form-panel">
          <form className="auth-form" onSubmit={handleLogin}>
            <h2 className="form-title">Admin Login</h2>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="admin@vtufest.com"
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
              {loading ? "Verifying..." : "Login to Dashboard"}
            </button>

            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', opacity: 0.7 }}>
              Contact System Administrator for access issues.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}