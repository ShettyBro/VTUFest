
// ChangePassword.jsx (ResetPassword)
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/auth.css";
// ✅ Import popup hook
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Use popup instead of local error/success state
  const { showPopup } = usePopup();

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

    if (!newPassword || newPassword.length < 8) {
      showPopup("Password must be at least 8 characters", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup("Passwords do not match", "warning");
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
        showPopup(data.error || data.message || "Reset failed. Retry.", "error");
        setLoading(false);
        return;
      }

      // ✅ Success - redirect to login after 2 seconds
      showPopup(data.message, "success");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch {
      showPopup("Server not reachable. Retry.", "error");
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

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}