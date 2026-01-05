import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/navbar.css";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  /* ================= USER DATA ================= */
  const role = localStorage.getItem("role") || "student";
  const userProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  const userName = userProfile.name || "User";
  const userPhoto = userProfile.photo || "/user.png";

  const collegeCode = "ACH-VTU-2026";

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
        <img src="/acharya.png" alt="Acharya" className="logo big-logo" />
        <span className="logo-divider">|</span>
        <img src="/vtu.png" alt="VTU" className="logo big-logo" />
      </div>

      {/* CENTER – COLLEGE CODE */}
      {(role === "principal" || role === "manager" || role === "admin") && (
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
            {/* BLUE BELL SVG */}
            <svg
              className="bell-icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

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
            <img
              src={userPhoto}
              alt="User"
              className="profile-avatar"
            />
            <span className="username">{userName}</span>
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
