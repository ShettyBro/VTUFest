// ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css";

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
    <div className="forgot-page">
      <div className="forgot-card">
        <h2>Forgot Password</h2>
        <p>
          Select your role and enter your registered email address. We will send you a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <label>I am a:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          {errorMsg && (
            <div style={{ color: "red", marginTop: "8px" }}>{errorMsg}</div>
          )}

          {successMsg && (
            <div style={{ color: "green", marginTop: "8px" }}>
              {successMsg}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Sending reset link..." : "Send Reset Link"}
          </button>
        </form>

        <div className="forgot-footer">
          <span onClick={() => navigate("/")}>← Back to Login</span>
        </div>
      </div>
    </div>
  );
}