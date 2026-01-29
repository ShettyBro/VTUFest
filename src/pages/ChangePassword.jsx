// ChangePassword.jsx (ResetPassword)
// ✅ NO CHANGES NEEDED - Already handles token-based reset for both flows
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/ForgotPassword.css";

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
      // Backend differentiates based on token and force_password_reset flag
      const response = await fetch(
        `https://vtubackend2026.netlify.app/.netlify/functions/reset-password/${role}`,
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
    <div className="forgot-page">
      <div className="forgot-card">
        <h2>Reset Password</h2>
        <p>Enter your new password</p>

        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}