import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* ---------- RESET FIELDS WHEN ROLE CHANGES ---------- */
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setUsername("");
    setPassword("");
  };

  /* ---------- LOGIN HANDLER ---------- */
  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    // TEMP: Hardcoded Principal / Team Manager login
    if (role === "principal" || role === "manager") {
      if (username !== "ait@acharya.ac.in" || password !== "123") {
        alert("Invalid credentials for Principal / Team Manager");
        return;
      }

      localStorage.setItem("role", role);
      navigate("/principal-dashboard");
      return;
    }

    // Student login (temporary)
    if (role === "student") {
      localStorage.setItem("role", "student");
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-page">
      {/* ================= TOP NAVBAR ================= */}
      <nav className="login-navbar">
        {/* LEFT BRAND */}
        <div className="login-brand">
          <img src="/vtu.png" alt="VTU Logo" />
          <span className="logo-separator">|</span>
          <img src="/acharya.png" alt="Acharya Logo" />

          <div className="brand-text">
            <h3>VTU HABBA 2025</h3>
            <span>Visvesvaraya Technological University</span>
          </div>
        </div>

        {/* RIGHT CONTACT */}
        <div className="login-contact">
          Contact: <strong>ait@acharya.ac.in</strong>
        </div>
      </nav>

      {/* ================= CENTER LOGIN CARD ================= */}
      <div className="login-center">
        <div className="login-card">
          {/* ROLE TABS */}
          <div className="role-tabs">
            <button
              type="button"
              className={role === "principal" ? "active" : ""}
              onClick={() => handleRoleChange("principal")}
            >
              Principal
            </button>

            <button
              type="button"
              className={role === "manager" ? "active" : ""}
              onClick={() => handleRoleChange("manager")}
            >
              Team Manager
            </button>

            <button
              type="button"
              className={role === "student" ? "active" : ""}
              onClick={() => handleRoleChange("student")}
            >
              Student
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin}>
            <label>Username</label>
            <input
              type="text"
              placeholder={`Enter ${role} username`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="login-btn">
              Log In
            </button>
          </form>

          {/* FOOTER LINKS */}
          <div className="login-footer">
            {role === "student" && (
              <>
                <span
                  className="login-link"
                  onClick={() => navigate("/register")}
                >
                  New Candidate Registration
                </span>
                <br />
              </>
            )}

            <span
              className="login-link"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM FOOTER ================= */}
      <footer className="login-bottom">
        © 2025 VTU | Government of Karnataka
      </footer>
    </div>
  );
}
