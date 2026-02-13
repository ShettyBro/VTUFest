// ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css"; // Using Auth CSS for redesign

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/";

const ALLOWED_ROLES = ['student', 'manager', 'principal', 'admin', 'sub_admin'];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Check role on mount
    const role = localStorage.getItem("role");

    // Strict validation: If missing or invalid, redirect
    if (!role || !ALLOWED_ROLES.includes(role.toLowerCase())) {
      // Fallback: If invalid but present, maybe clear it? 
      // For now, strict redirect to match original logic intent
      window.location.href = "https://vtufest2026.acharyahabba.com/";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please enter your registered email");
      return;
    }

    // Get role again
    let role = localStorage.getItem("role");

    // Safety check
    if (!role) {
      window.location.href = "https://vtufest2026.acharyahabba.com/";
      return;
    }

    // Normalize role
    role = role.toLowerCase();
    if (!ALLOWED_ROLES.includes(role)) {
      setErrorMsg("Invalid user role. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}auth/forgot-password/${role}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || data.message || "Request failed. Retry.");
        setLoading(false);
        return;
      }

      setSuccessMsg(data.message);
      setEmail("");
    } catch {
      setErrorMsg("Server not reachable. Retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* BACKGROUND SHAPES */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>

      <div className="auth-container" style={{ maxWidth: '500px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'auto', padding: '40px' }}>

        {/* BRANDING SHORT */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Forgot Password</h3>
          <p style={{ color: '#e0f7fa', fontSize: '0.9rem' }}>
            Enter your registered email address. We will send you a password reset link.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {errorMsg && (
            <div className="error-msg">{errorMsg}</div>
          )}

          {successMsg && (
            <div className="success-msg">{successMsg}</div>
          )}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Sending reset link..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            className="text-btn"
            onClick={() => navigate("/")}
            style={{ marginTop: '20px' }}
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}