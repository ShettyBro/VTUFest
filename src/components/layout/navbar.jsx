import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/navbar.css";
import collegesData from "../data/colleges.json";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  /* ================= USER DATA ================= */



  const role = localStorage.getItem("vtufest_role") || "student";

  const userName = localStorage.getItem("name") || "User";
  const userUsn = localStorage.getItem("usn") || "";
  const userPhoto = "/user.png";

  const storedCollegeId = localStorage.getItem("college_id");

  if (storedCollegeId) {
    const college = collegesData.find(
      c => c.college_id === parseInt(storedCollegeId)
    );

    if (college) {
      // For UI (optional)
      setCollegeName(`${college.college_name}, ${college.place}`);

      // REQUIRED: build CollegeName-CODE
      const collegeCode = `${college.college_name}-${college.college_code}`;

      // If you want to keep it in React state
      setCollegeCode(collegeCode);

      // If you want to persist it
      localStorage.setItem("college_code", collegeCode);
    }
  }


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

  const goHome = () => {
    if (role === "student") navigate("/dashboard");
    else navigate("/principal-dashboard");
  };

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

        {/* HOME BUTTON */}
        <button className="home-btn" onClick={goHome}>
          Home
        </button>

        {/* NOTIFICATIONS */}
        <div className="notif-wrapper" ref={notifRef}>
          <div
            className="notif-icon"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <svg className="bell-icon" viewBox="0 0 24 24" fill="none">
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
        <div
          className="profile-trigger"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <img src={userPhoto} alt="User" className="profile-avatar" />

          <div className="profile-name-wrapper">
            <span className="username">{userName}</span>
            {userUsn && <span className="usn-tooltip">{userUsn}</span>}
          </div>
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
    </header >
  );
}
