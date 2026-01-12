import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

/* ---------- JWT DECODE (NO LIB REQUIRED) ---------- */
const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ---------- INITIALIZE ROLE & AUTO REDIRECT ON PAGE LOAD ---------- */
  useEffect(() => {
    // Initialize role in localStorage if missing
    let currentRole = localStorage.getItem("role");
    if (!currentRole) {
      localStorage.setItem("role", "student");
      currentRole = "student";
    }
    setRole(currentRole);

    // Check authentication
    const token = localStorage.getItem("vtufest_token");
    const storedRole = localStorage.getItem("vtufest_role");

    if (!token || !storedRole) {
      localStorage.removeItem("vtufest_token");
      localStorage.removeItem("vtufest_role");
      return;
    }

    const decoded = decodeJwt(token);

    if (!decoded || !decoded.exp) {
      localStorage.removeItem("vtufest_token");
      localStorage.removeItem("vtufest_role");
      return;
    }

    const isExpired = decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem("vtufest_token");
      localStorage.removeItem("vtufest_role");
      return;
    }

    // ✅ TOKEN VALID → REDIRECT
    if (storedRole === "principal") {
      navigate("/principal-dashboard");
    } else if (storedRole === "manager") {
      navigate("/manager-dashboard");
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  /* ---------- HANDLE ROLE CHANGE ---------- */
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem("role", newRole);
    setEmail("");
    setPassword("");
    setErrorMsg("");
  };

  /* ---------- EMAIL VALIDATION ---------- */
  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  /* ---------- LOGIN HANDLER ---------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter email ID and password");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email ID");
      return;
    }

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
      setErrorMsg("Invalid role selected");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(loginApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Login failed. Retry.");
        setLoading(false);
        return;
      }

      // ✅ STORE SESSION
      localStorage.setItem("vtufest_token", data.token);
      localStorage.setItem("vtufest_role", role);
      localStorage.setItem("college_id", data.college_id);
      localStorage.setItem("usn", data.usn);

      // ✅ REDIRECT
      if (role === "principal") {
        navigate("/principal-dashboard");
      } else if (role === "manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setErrorMsg("Server not reachable. Retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ================= TOP NAVBAR ================= */}
      <nav className="login-navbar">
        <div className="login-brand">
          <img src="/acharya.png" alt="Acharya Logo" />
          <span className="logo-separator">|</span>
          <img src="/habba.png" alt="Habba Logo" />
          <span className="logo-separator">|</span>
          <img src="/vtu.png" alt="VTU Logo" />

          <div className="brand-text">
            <h3>ACHARYA VTU HABBA 2026</h3>
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
              disabled={loading}
            >
              Principal
            </button>

            <button
              type="button"
              className={role === "manager" ? "active" : ""}
              onClick={() => handleRoleChange("manager")}
              disabled={loading}
            >
              Team Manager
            </button>

            <button
              type="button"
              className={role === "student" ? "active" : ""}
              onClick={() => handleRoleChange("student")}
              disabled={loading}
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
              disabled={loading}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            {errorMsg && (
              <div style={{ color: "red", marginTop: "8px" }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
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