// ChangePassword.jsx (ResetPassword)
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/auth.css";
// ✅ Import popup hook
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api/";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        const errorMsg = data.error || data.message || "Reset failed. Retry.";
        // Use warning style for same-password validation, error for everything else
        const popupType = errorMsg.includes("same as your current password") ? "warning" : "error";
        showPopup(errorMsg, popupType);
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
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowNewPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', padding: 0, lineHeight: 1 }}
                tabIndex={-1} aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >{showNewPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '42px' }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', padding: 0, lineHeight: 1 }}
                tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >{showConfirmPassword ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}