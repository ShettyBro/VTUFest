import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext";

// Removed Layout import to ensure standalone full-screen page

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";
const LOGIN_URL = `${API_BASE_URL}/api/auth/admin-login`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("super_admin");
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
          role
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === "FORCE_RESET") {
          localStorage.setItem("force_reset_token", data.reset_token);
          localStorage.setItem("force_reset_email", data.email);
          localStorage.setItem("force_reset_role", data.role);
          navigate("/force-reset-password");
          return;
        }

        localStorage.setItem("vtufest_token", data.token);
        localStorage.setItem("vtufest_role", data.role);
        localStorage.setItem("admin_name", data.name);
        localStorage.setItem("admin_id", String(data.admin_id));

        showPopup("Login Successful!", "success");
        navigate("/admin-dashboard");
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
      {/* Background Shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <div className="auth-container">
        {/* Left Panel: Branding */}
        <div className="auth-info-panel">
          <div className="auth-brand">
            <img src="/main.webp" alt="VTU Fest Logos" style={{ height: 'auto', maxWidth: '100%', maxHeight: '120px' }} />
          </div>
          <div className="brand-text">
            <h3>Acharya VTU HABBA 2026</h3>
            <span className="badge" style={{ fontSize: '1rem', marginTop: '10px', display: 'inline-block' }}>
              Admin Portal
            </span>
            <p style={{ marginTop: '20px', opacity: 0.8 }}>
              Secure access for System Administrators.
              Warning: Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="auth-form-panel">
          <form onSubmit={handleLogin} className="auth-form">
            <h2 className="form-title">Admin Login</h2>

            <div className="role-tabs">
              <button
                type="button"
                className={`role-tab ${role === "super_admin" ? "active" : ""}`}
                onClick={() => setRole("super_admin")}
              >
                Super Admin
              </button>
              <button
                type="button"
                className={`role-tab ${role === "sub_admin" ? "active" : ""}`}
                onClick={() => setRole("sub_admin")}
              >
                Sub Admin
              </button>
            </div>

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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Logging in..." : "Access Dashboard"}
            </button>

            <p className="auth-footer" style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', opacity: 0.6 }}>
              Contact System Administrator for access issues.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}