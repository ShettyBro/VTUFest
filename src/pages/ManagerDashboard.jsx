import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import ManagerProfileModal from "./ManagerProfileModal";
import FinalApprovalOverlay from "./ApprovalOverlay";
import CampusMap from "../components/CampusMap";
import "../styles/PrincipalDashboard.css";
import notificationsData from "../data/notifications.json";
import eventsCalendarData from "../data/events-calendar.json";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("vtufest_role");
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFinalApprovalOverlay, setShowFinalApprovalOverlay] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
   const [currentPriority1Index, setCurrentPriority1Index] = useState(0);

  // Filter and sort priority 1 notifications by date (most recent first)
  const priority1Notifications = notificationsData
    .filter(n => n.priority === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter and sort priority 2+ notifications (by priority first, then date)
  const priority2PlusNotifications = notificationsData
    .filter(n => n.priority >= 2)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.date) - new Date(a.date);
    });


  useEffect(() => {
    if (!token || role !== "manager") {
      navigate("/");
      return;
    }

    fetchDashboardData();
    checkProfileCompletion();
    checkLockStatus();
  }, []);

  // Ticker animation for priority 1 notifications
  useEffect(() => {
    if (priority1Notifications.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPriority1Index(prev => 
        (prev + 1) % priority1Notifications.length
      );
    }, 20000); // 20 seconds per notification

    return () => clearInterval(interval);
  }, [priority1Notifications.length]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://dashteam10.netlify.app/.netlify/functions/manager-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      alert("Failed to load dashboard. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const response = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/manager-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "check_profile_status" }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success && !data.profile_completed) {
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error("Profile check error:", error);
    }
  };

  const checkLockStatus = async () => {
    try {
      const response = await fetch(`https://teanmdash30.netlify.app/.netlify/functions/check-lock-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setLockStatus(data);
        if (data.is_locked) {
          setShowFinalApprovalOverlay(true);
        }
      }
    } catch (error) {
      console.error("Lock status check error:", error);
    }
  };

  const blockEvents = {
    left: [
      {
        blockNo: 1,
        blockName: "Main Auditorium",
        events: [{ name: "Inauguration", room: "AUD-01", day: "Day 1" }],
      },
      {
        blockNo: 2,
        blockName: "ANA Block",
        events: [{ name: "Group Music", room: "ANA-102", day: "Day 2" }],
      },
    ],
    right: [
      {
        blockNo: 5,
        blockName: "Mechanical Block",
        events: [{ name: "Robo Race", room: "M-01", day: "Day 3" }],
      },
      {
        blockNo: 8,
        blockName: "ECE Block",
        events: [{ name: "Quiz", room: "E-105", day: "Day 2" }],
      },
    ],
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>Loading Manager Dashboard...</h3>
          <p>Please wait while we fetch your data</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {priority1Notifications.length > 0 && (
        <div className="top-banner">
           <div className="priority-ticker">
            <span className="ticker-label">IMP Notification:</span>
            <div className="ticker-wrapper">
              <span className="ticker-text">
                {priority1Notifications[currentPriority1Index]?.message}
              </span>
            </div>
          </div>
        </div>
      )}
        
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Team Manager Dashboard</h2>
          <p>VTU HABBA 2026 – Team Manager Panel</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Registrations</h4>
            <p>{dashboardData?.stats?.total_students || 0}</p>
            <small>
              With applications: {dashboardData?.stats?.students_with_applications || 0}
            </small>
          </div>

          <div
            className="stat-card warning clickable"
            onClick={() => navigate("/accompanist-form")}
          >
            <h4>Accompanists</h4>
            <p>{dashboardData?.stats?.accompanists_count || 0}</p>
          </div>

          <div
            className="stat-card success clickable"
            onClick={() => navigate("/approved-students")}
          >
            <h4>Approved Students</h4>
            <p>{dashboardData?.stats?.approved_students || 0}</p>
          </div>

          <div
            className="stat-card danger clickable"
            onClick={() => navigate("/rejected-students")}
          >
            <h4>Rejected Students</h4>
            <p>{dashboardData?.stats?.rejected_students || 0}</p>
          </div>

          <div
            className="stat-card accommodation clickable"
            onClick={() => navigate("/accommodation")}
          >
            <h4>Accommodation</h4>
            {dashboardData?.accommodation ? (
              <>
                <p>Girls: {dashboardData.accommodation.total_girls}</p>
                <p>Boys: {dashboardData.accommodation.total_boys}</p>
                <small>Status: {dashboardData.accommodation.status}</small>
              </>
            ) : (
              <p>Apply Now</p>
            )}
          </div>

          <div className="stat-card">
            <h4>College Quota</h4>
            <p>
              {dashboardData?.stats?.quota_used || 0} /{" "}
              {dashboardData?.college?.max_quota || 45}
            </p>
            <small>Remaining: {dashboardData?.stats?.quota_remaining || 0}</small>
          </div>
        </div>

        <div className="dashboard-map-wrapper">
          <div className="map-side left">
            {blockEvents.left.map((block, idx) => (
              <div className="block-card" key={idx}>
                <h4>
                  {block.blockNo}. {block.blockName}
                </h4>
                {block.events.map((e, i) => (
                  <p key={i}>
                    • {e.name} – Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="map-center">
            <h3 className="section-title">Campus Map & Event Locations</h3>
            <CampusMap />
          </div>

          <div className="map-side right">
            {blockEvents.right.map((block, idx) => (
              <div className="block-card" key={idx}>
                <h4>
                  {block.blockNo}. {block.blockName}
                </h4>
                {block.events.map((e, i) => (
                  <p key={i}>
                    • {e.name} – Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showProfileModal && <ManagerProfileModal onComplete={() => setShowProfileModal(false)} />}

      {showFinalApprovalOverlay && lockStatus && (
        <FinalApprovalOverlay
          paymentStatus={lockStatus.payment_status}
          paymentRemarks={lockStatus.payment_remarks}
        />
      )}
    </Layout>
  );
}