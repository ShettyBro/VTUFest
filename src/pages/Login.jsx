import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---------- RESET FIELDS WHEN ROLE CHANGES ---------- */
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setEmail("");
    setPassword("");
  };

  /* ---------- EMAIL VALIDATION ---------- */
  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  /* ---------- LOGIN HANDLER ---------- */
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email ID and password");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Please enter a valid email ID");
      return;
    }

    // 🔗 ROLE-BASED API ENDPOINTS
    let loginApi = "";

    if (role === "student") {
      loginApi =
        "https://vtubackend2026.netlify.app/.netlify/functions/login";
    } else if (role === "principal") {
      loginApi =
        "https://vtubackend2026.netlify.app/.netlify/functions/principal-login";
    } else if (role === "manager") {
      loginApi =
        "https://vtubackend2026.netlify.app/.netlify/functions/team-manager-login";
    } else {
      alert("Invalid role selected");
      return;
    }

    try {
      const response = await fetch(loginApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ STORE TOKEN
      localStorage.setItem("vtufest_token", data.token);
      localStorage.setItem("vtufest_role", role);

      // ✅ ROLE-BASED REDIRECT
      if (role === "student") {
        navigate("/dashboard");
      } else if (role === "principal") {
        navigate("/principal-dashboard");
      } else if (role === "manager") {
        navigate("/dashboard");
      }
    } catch (error) {
      alert("Server not reachable. Try again.");
    }
  };

  return (
    <div className="login-page">
      {/* ================= TOP NAVBAR ================= */}
      <nav className="login-navbar">
        <div className="login-brand">
          <img src="/acharya.png" alt="Acharya Logo" />
          <span className="logo-separator">|</span>
          <img src="/vtu.png" alt="VTU Logo" />

          <div className="brand-text">
            <h3>VTU HABBA 2026</h3>
            <span>Visvesvaraya Technological University</span>
          </div>
        </div>

        <div className="login-contact">
          Contact: <strong>adsa@acharya.ac.in</strong>
          <br />
          <strong>1234567890</strong>
        </div>
      </nav>

      {/* ================= CENTER LOGIN CARD ================= */}
      <div className="login-center">
        <div className={`login-card ${role}`}>
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
            <label>Email ID</label>
            <input
              type="email"
              placeholder={`Enter ${role} email ID`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                  onClick={() => navigate("/register-student")}
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
        © 2026 ACHARYA | VTU
      </footer>
    </div>
  );
}
