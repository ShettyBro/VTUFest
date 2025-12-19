import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/navbar.css";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  // Role from login
  const role = localStorage.getItem("role") || "student";

  // TEMP: Secret college code (later from backend)
  const collegeCode = "ACH-VTU-2025";

  /* -------- CLOSE DROPDOWNS ON OUTSIDE CLICK -------- */
  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <header className="navbar">
      {/* LEFT LOGOS */}
      <div className="navbar-left">
        <img src="/vtu.png" alt="VTU" className="logo" />
        <span className="logo-divider">|</span>
        <img src="/acharya.png" alt="Acharya" className="logo" />
      </div>

      {/* CENTER – COLLEGE CODE (ADMIN ONLY) */}
      {(role === "principal" || role === "manager") && (
        <div className="navbar-center">
          <span className="college-code">
            College Code: <strong>{collegeCode}</strong>
          </span>
        </div>
      )}

      {/* RIGHT ACTIONS */}
      <div className="navbar-right">
        {/* NOTIFICATIONS */}
        <div className="notif-wrapper" ref={notifRef}>
          <div
            className="notif-icon"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            🔔
            <span className="notif-badge">3</span>
          </div>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-item">New registration submitted</div>
              <div className="notif-item">Approval pending</div>
              <div className="notif-item">Event updated</div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="profile-wrapper" ref={profileRef}>
          <div
            className="profile-trigger"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <img src="/user.png" alt="User" />
            <span className="username">Rohith</span>
          </div>

          {profileOpen && (
            <div className="profile-menu">
              <div
                className="menu-item"
                onClick={() => navigate("/change-password")}
              >
                Change Password
              </div>
              <div
                className="menu-item logout"
                onClick={() => {
                  localStorage.clear();
                  navigate("/");
                }}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
