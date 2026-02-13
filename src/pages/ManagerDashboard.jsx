import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import ManagerProfileModal from "./ManagerProfileModal";
import FinalApprovalOverlay from "./ApprovalOverlay";
import CampusMap from "../components/CampusMap";
import "../styles/dashboard-glass.css";
import notificationsData from "../data/notifications.json";
import eventsCalendarData from "../data/events-calendar.json";
import { usePopup } from "../context/PopupContext";

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

  const priority1Notifications = notificationsData
    .filter(n => n.priority === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const priority2PlusNotifications = notificationsData
    .filter(n => n.priority >= 2)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.date) - new Date(a.date);
    });


  const { showPopup } = usePopup();

  useEffect(() => {
    if (!token || role !== "manager") {
      navigate("/");
      return;
    }

    fetchDashboardData();
    checkProfileCompletion();
    checkLockStatus();
  }, []);

  useEffect(() => {
    if (priority1Notifications.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPriority1Index(prev =>
        (prev + 1) % priority1Notifications.length
      );
    }, 20000);

    return () => clearInterval(interval);
  }, [priority1Notifications.length]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/manager/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
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
      showPopup("Failed to load dashboard. Please refresh the page.", "error");
    } finally {
      setLoading(false);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/manager/manager-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "check_profile_status" }),
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
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
      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/principal/check-lock-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setLockStatus(data);
        const isLocked = data.is_locked || data.registration_lock;
        if (isLocked) {
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

  return (
    <Layout hasApplication={false} collegeLocked={null}>
      <div className="dashboard-glass-wrapper">

        {/* --- HEADER --- */}
        <div className="dashboard-header relative-header">
          <div className="welcome-text">
            <h1>Manager Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>VTU HABBA 2026 – Team Manager Panel</p>
          </div>
        </div>

        {/* --- TICKER --- */}
        {priority1Notifications.length > 0 && (
          <div className="glass-banner">
            <span className="ticker-label">IMP Notification</span>
            <div className="ticker-single">
              <span className="ticker-message">
                {priority1Notifications[currentPriority1Index]?.message}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
            <div className="spinner"></div>
            <h3>Loading Manager Dashboard...</h3>
            <p>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            {/* --- STATS GRID --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>

              <div className="glass-card">
                <h4>Total Registrations</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-info)', margin: '10px 0' }}>
                  {dashboardData?.stats?.total_students || 0}
                </div>
                <small style={{ color: 'var(--text-secondary)' }}>
                  With applications: {dashboardData?.stats?.students_with_applications || 0}
                </small>
              </div>

              <div
                className="glass-card clickable"
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-warning)' }}
                onClick={() => navigate("/accompanist-form")}
              >
                <h4 style={{ color: 'var(--accent-warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>Accompanists</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-warning)', margin: '10px 0' }}>
                  {dashboardData?.stats?.accompanists_count || 0}
                </div>
                <small style={{ color: 'var(--text-secondary)' }}>Click to manage accompanists</small>
              </div>

              <div
                className="glass-card clickable"
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-success)' }}
                onClick={() => navigate("/approved-students")}
              >
                <h4 style={{ color: 'var(--accent-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>Approved Students</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-success)', margin: '10px 0' }}>
                  {dashboardData?.stats?.approved_students || 0}
                </div>
              </div>

              <div
                className="glass-card clickable"
                style={{ cursor: 'pointer', borderLeft: '4px solid #EF5350' }}
                onClick={() => navigate("/rejected-students")}
              >
                <h4 style={{ color: '#EF5350', borderColor: 'rgba(239, 83, 80, 0.2)' }}>Rejected Students</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF5350', margin: '10px 0' }}>
                  {dashboardData?.stats?.rejected_students || 0}
                </div>
              </div>

              <div
                className="glass-card clickable"
                style={{ cursor: 'pointer', borderLeft: '4px solid #8B5CF6' }}
                onClick={() => navigate("/accommodation")}
              >
                <h4 style={{ color: '#8B5CF6', borderColor: 'rgba(139, 92, 246, 0.2)' }}>Accommodation</h4>
                {dashboardData?.accommodation ? (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>Girls:</span> <strong style={{ color: '#fff' }}>{dashboardData.accommodation.total_girls}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>Boys:</span> <strong style={{ color: '#fff' }}>{dashboardData.accommodation.total_boys}</strong>
                    </div>
                    <small style={{ display: 'block', marginTop: '10px', color: '#A78BFA' }}>Status: {dashboardData.accommodation.status}</small>
                  </div>
                ) : (
                  <p style={{ marginTop: '10px', color: '#A78BFA' }}>Apply Now</p>
                )}
              </div>

              <div className="glass-card">
                <h4>College Quota</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '10px 0' }}>
                  {dashboardData?.stats?.quota_used || 0} / {dashboardData?.college?.max_quota || 45}
                </div>
                <small style={{ color: 'var(--text-secondary)' }}>Remaining: {dashboardData?.stats?.quota_remaining || 0}</small>
              </div>

            </div>

            {/* --- MAP SECTION --- */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '5px' }}>Campus Map</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Event Locations & Blocks</p>

              <div className="map-container-full">
                <div className="map-blocks-left">
                  {blockEvents.left.map((block, idx) => (
                    <div className="block-item" key={idx}>
                      <strong style={{ color: 'var(--academic-gold)' }}>{block.blockNo}. {block.blockName}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        {block.events.map((e, i) => <div key={i}>• {e.name} – Room {e.room} ({e.day})</div>)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="map-card" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CampusMap />
                </div>

                <div className="map-blocks-right">
                  {blockEvents.right.map((block, idx) => (
                    <div className="block-item" key={idx}>
                      <strong style={{ color: 'var(--academic-gold)' }}>{block.blockNo}. {block.blockName}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        {block.events.map((e, i) => <div key={i}>• {e.name} – Room {e.room} ({e.day})</div>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {showProfileModal && <ManagerProfileModal onComplete={() => setShowProfileModal(false)} />}

      {/* {showFinalApprovalOverlay && lockStatus && (
        <FinalApprovalOverlay
          paymentStatus={lockStatus.payment_status}
          paymentRemarks={lockStatus.payment_remarks}
          isRegistrationLock={lockStatus.registration_lock}
        />
      )} */}
    </Layout>
  );
}