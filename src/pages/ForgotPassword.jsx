// ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css"; // Changed to auth.css for UI theme

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/";

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'manager', label: 'Manager' },
  { value: 'principal', label: 'Principal' },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please enter your registered email");
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

      {/* Glass Container matching AuthPage style */}
      <div className="auth-container" style={{ maxWidth: '500px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'auto', padding: '40px' }}>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Forgot Password</h3>
          <p style={{ color: '#e0f7fa', fontSize: '0.9rem' }}>
            Select your role and enter your registered email address. We will send you a password reset link.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>

          <div className="input-group">
            <label>I am a:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 15px',
                background: 'var(--input-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                color: 'white',
                outline: 'none'
              }}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value} style={{ background: '#333', color: 'white' }}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

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