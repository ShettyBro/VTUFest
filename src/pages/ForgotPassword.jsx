import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/forgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your registered email");
      return;
    }

    // TEMP: frontend simulation
    alert(
      "If this email is registered, a password reset link will be sent."
    );

    navigate("/");
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h2>Forgot Password</h2>
        <p>
          Enter your registered email address.  
          We will send you a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit">Send Reset Link</button>
        </form>

        <div className="forgot-footer">
          <span onClick={() => navigate("/")}>
            ← Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}
