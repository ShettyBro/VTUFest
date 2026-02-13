// ChangePassword.jsx (ResetPassword)
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/auth.css"; // UPDATED CSS

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const role = searchParams.get("role");

  useEffect(() => {
    // ✅ Validate all required parameters exist
    if (!role || !token || !email) {
      navigate("/");
    }
  }, [role, token, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ Same endpoint for both forgot-password and forced-reset flows
      const response = await fetch(
        `${API_BASE_URL}auth/reset-password/${role}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token.trim(),
            email: email.trim().toLowerCase(),
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || data.message || "Reset failed. Retry.");
        setLoading(false);
        return;
      }

      // ✅ Success - redirect to login after 2 seconds
      setSuccessMsg(data.message);
      setTimeout(() => {
        navigate("/");
      }, 2000);
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
          <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>Reset Password</h3>
          <p style={{ color: '#e0f7fa', fontSize: '0.9rem' }}>
            Enter your new password below.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>

          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}