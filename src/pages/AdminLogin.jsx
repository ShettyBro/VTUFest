
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.vtufest2026.acharyahabba.com";
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
    <Layout>
      <div className="auth-container">
        <div className="glass-card auth-card">
          <h2 className="auth-title">Admin Login</h2>

          <div className="role-tabs">
            <button
              className={`role-tab ${role === "super_admin" ? "active" : ""}`}
              onClick={() => setRole("super_admin")}
            >
              Super Admin
            </button>
            <button
              className={`role-tab ${role === "sub_admin" ? "active" : ""}`}
              onClick={() => setRole("sub_admin")}
            >
              Sub Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Email</label>
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

            <button type="submit" className="neon-btn auth-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}