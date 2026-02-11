import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/navbar.css";
import collegesData from "../../data/colleges.json";
import notificationsData from "../../data/notifications.json";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [sortedNotifications, setSortedNotifications] = useState([]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const navigate = useNavigate();

  /* ================= USER DATA ================= */
  const role = localStorage.getItem("vtufest_role") || "student";
  const userName = localStorage.getItem("name") || "User";
  const userUsn = localStorage.getItem("usn") || "";
  const userPhoto = "/user.png";

  /* ================= SORT NOTIFICATIONS ================= */
  useEffect(() => {
    // Filter priority 2+ notifications and sort them
    const priority2Plus = notificationsData
      .filter(n => n.priority >= 2)
      .sort((a, b) => {
        // First sort by priority (ascending: 2, 3, 4...)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // If same priority, sort by date (most recent first)
        return new Date(b.date) - new Date(a.date);
      });

    setSortedNotifications(priority2Plus);
  }, []);

  /* ================= COLLEGE DATA ================= */

  useEffect(() => {
    const storedCollegeId = localStorage.getItem("college_id");
    if (!storedCollegeId) return;

    const fetchCollege = async () => {
      try {
        const response = await fetch(
          `https://vtu-festserver-production.up.railway.app/api/shared/college-and-usn/college/${storedCollegeId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch college");
        }

        const result = await response.json();

        // 👇 Correct path
        const college = result?.data?.college;

        if (college) {
          setCollegeName(
            `${college.college_name}, ${college.place}`
          );
        }

      } catch (err) {
        console.error("Error loading college:", err);
      }
    };

    fetchCollege();
  }, []);



  /* ================= CLOSE DROPDOWNS ON OUTSIDE CLICK ================= */
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
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
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
            <strong>{collegeName}</strong>
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
            <svg className="bell-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {sortedNotifications.length > 0 && (
              <span className="notif-badge">{sortedNotifications.length}</span>
            )}
          </div>

          {notifOpen && (
            <div className="notif-dropdown">
              {sortedNotifications.length > 0 ? (
                sortedNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notif-item priority-${notification.priority}`}
                  >
                    {notification.message}
                  </div>
                ))
              ) : (
                <div className="notif-item no-notifications">
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* PROFILE WRAPPER */}
        <div className="profile-wrapper" ref={profileRef}>
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
    </header>
  );
}