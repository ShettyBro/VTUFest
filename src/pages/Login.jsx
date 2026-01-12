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

    // ✅ TOKEN VALID → REDIRECT BASED ON ROLE
    redirectBasedOnRole(storedRole);
  }, [navigate]);

  /* ---------- REDIRECT HELPER ---------- */
  const redirectBasedOnRole = (userRole) => {
    switch (userRole) {
      case "principal":
        navigate("/principal-dashboard");
        break;
      case "manager":
        navigate("/principal-dashboard");
        break;
      case "student":
      default:
        navigate("/dashboard");
        break;
    }
  };

  /* ---------- HANDLE ROLE CHANGE ---------- */
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem("role", newRole);
    setEmail("");
    setPassword("");
    setErrorMsg("");
  };

  /* ---------- EMAIL VALIDATION ---------- */
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

    // Single unified login API endpoint
    const loginApi = "https://vtubackend2026.netlify.app/.netlify/functions/login";

    try {
      setLoading(true);

      const response = await fetch(loginApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role, // Send the current role to backend
        }),
      });

      const data = await response.json();

      console.log("Login response:", data); // Debug log

      if (!response.ok) {
        setErrorMsg(data.message || "Login failed. Retry.");
        setLoading(false);
        return;
      }

      // ✅ STORE SESSION - FIXED: Store name correctly
      localStorage.setItem("vtufest_token", data.token);
      localStorage.setItem("vtufest_role", role);
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
      
      // ✅ CRITICAL FIX: Store name from response
      if (data.name) {
        localStorage.setItem("name", data.name);
        console.log("Name stored:", data.name); // Debug log
      }
=======
>>>>>>> parent of 8b7e373 (V 1.0)
=======
>>>>>>> parent of 8b7e373 (V 1.0)
=======
>>>>>>> parent of 8b7e373 (V 1.0)
      
      // Store college_id and usn if present (for students, principals, managers)
      if (data.college_id) {
        localStorage.setItem("college_id", data.college_id);
      }
      
      if (data.usn) {
        localStorage.setItem("usn", data.usn);
      }
      
      if (data.user_id) {
        localStorage.setItem("user_id", data.user_id);
      }
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD

      console.log("All localStorage after login:", {
        name: localStorage.getItem("name"),
        usn: localStorage.getItem("usn"),
        role: localStorage.getItem("vtufest_role")
      }); // Debug log
=======
>>>>>>> parent of 8b7e373 (V 1.0)
=======
>>>>>>> parent of 8b7e373 (V 1.0)
=======
>>>>>>> parent of 8b7e373 (V 1.0)

      // ✅ REDIRECT BASED ON ROLE
      redirectBasedOnRole(role);
    } catch (err) {
      console.error("Login error:", err);
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
      <footer className="login-bottom">© 2026 ACHARYA | VTU</footer>
    </div>
  );
}