import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import CampusMap from "../components/CampusMap";
import AllocatedEventsModal from "../components/Allocatedeventsmodal";
import "../styles/dashboard-glass.css";

import settingsData from "../data/settings.json";
import notificationsData from "../data/notifications.json";
import eventsCalendarData from "../data/events-calendar.json";

const API_BASE_URL = "https://vtu-festserver-production.up.railway.app/api/student/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);
  const [showAllocatedEventsModal, setShowAllocatedEventsModal] = useState(false);

  const priority1Notifications = notificationsData
    .filter(n => n.priority === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Rotate through priority 1 notifications every 6 seconds
  useEffect(() => {
    if (priority1Notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentPriority1Index((prevIndex) =>
          (prevIndex + 1) % priority1Notifications.length
        );
      }, 6000); // Change notification every 6 seconds

      return () => clearInterval(interval);
    }
  }, [priority1Notifications.length]);

  const priority2PlusNotifications = notificationsData
    .filter(n => n.priority >= 2)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.date) - new Date(a.date);
    });

  const blockEvents = {
    left: [
      {
        blockNo: 1,
        blockName: "Main Auditorium",
        events: [
          { name: "Inauguration", room: "AUD-01", day: "Day 1" },
          { name: "Dance Finals", room: "AUD-01", day: "Day 3" },
        ],
      },
      {
        blockNo: 2,
        blockName: "ANA Block",
        events: [
          { name: "Group Music", room: "ANA-102", day: "Day 2" },
        ],
      },
      {
        blockNo: 3,
        blockName: "CSE Block",
        events: [
          { name: "Coding Contest", room: "CS-301", day: "Day 2" },
        ],
      },
      {
        blockNo: 4,
        blockName: "AIGS Block",
        events: [
          { name: "Paper Presentation", room: "AIGS-02", day: "Day 2" },
        ],
      },
    ],
    right: [
      {
        blockNo: 5,
        blockName: "Mechanical Block",
        events: [
          { name: "Robo Race", room: "M-01", day: "Day 3" },
        ],
      },
      {
        blockNo: 6,
        blockName: "ASD Block",
        events: [
          { name: "Design Showcase", room: "D-12", day: "Day 1" },
        ],
      },
      {
        blockNo: 7,
        blockName: "Architecture Block",
        events: [
          { name: "Sketching", room: "A-12", day: "Day 3" },
        ],
      },
      {
        blockNo: 8,
        blockName: "ECE Block",
        events: [
          { name: "Solo Singing", room: "E-201", day: "Day 1" },
          { name: "Quiz", room: "E-105", day: "Day 2" },
        ],
      },
      {
        blockNo: 9,
        blockName: "Central Library",
        events: [
          { name: "Debate", room: "L-01", day: "Day 1" },
        ],
      },
    ],
  };

  const fetchDashboardData = async (isManualRefresh = false) => {
    const token = localStorage.getItem("vtufest_token");

    if (!token) {
      localStorage.clear();
      window.location.href = "https://vtufest2026.acharyahabba.com/";
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401 && data.redirect) {
        alert(data.message || "Session expired. Redirecting to login...");

        setTimeout(() => {
          localStorage.clear();
          window.location.href = data.redirect;
        }, 2000);
        return;
      }

      if (!response.ok) {
        if (retryCount < 4) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchDashboardData(isManualRefresh);
          }, 2000);
        } else {
          alert("Failed to load dashboard after multiple attempts. Please contact support.");
        }
        return;
      }

      setDashboardData(data.data);
      setRetryCount(0);

    } catch (error) {
      if (retryCount < 4) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchDashboardData(isManualRefresh);
        }, 2000);
      } else {
        alert("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- REMOVED AUTO-ROTATION FOR TICKER ---
  // The priority1Notifications are now joined in the render for smooth scrolling
  // and no sudden content changes. 

  const handleSubmitApplication = () => {
    navigate("/Student-Register");
  };

  const handleCompleteApplication = () => {
    navigate("/Student-Register");
  };

  const handleReapply = () => {
    navigate("/Student-Register");
  };

  const handleViewAllocatedEvents = () => {
    if (settingsData.allocated_events_visible) {
      setShowAllocatedEventsModal(true);
    }
  };

  const handleCloseAllocatedEventsModal = () => {
    setShowAllocatedEventsModal(false);
  };

  const SkeletonLoader = () => (
    <div className="glass-card">
      <div className="skeleton-box" style={{ width: "60%", height: "20px", marginBottom: "10px", background: "rgba(255,255,255,0.1)" }}></div>
      <div className="skeleton-box" style={{ width: "80%", height: "20px", marginBottom: "10px", background: "rgba(255,255,255,0.1)" }}></div>
      <div className="skeleton-box" style={{ width: "70%", height: "20px", background: "rgba(255,255,255,0.1)" }}></div>
    </div>
  );

  const collegeDisplay = dashboardData?.college
    ? `${dashboardData.college.college_name}, ${dashboardData.college.place}`
    : "Loading...";

  const isCollegeLocked = dashboardData?.college?.is_locked || dashboardData?.college?.registration_lock || false;

  const getStatusBadgeClass = () => {
    if (!dashboardData?.application) return "pending";
    switch (dashboardData.application.status) {
      case 'SUBMITTED': case 'UNDER_REVIEW': return "submitted";
      case 'APPROVED': return "approved";
      case 'REJECTED': return "rejected";
      case 'IN_PROGRESS': return "pending";
      default: return "pending";
    }
  };

  const getStatusText = () => {
    if (!dashboardData?.application) return "NOT SUBMITTED";
    return dashboardData.application.status.replace("_", " ");
  };

  return (
    <Layout hasApplication={dashboardData?.application !== null} collegeLocked={isCollegeLocked}>
      <div className="dashboard-glass-wrapper">

        {/* --- HEADER --- */}
        <div className="dashboard-header relative-header">
          <div className="welcome-text">
            <h1>Welcome, {dashboardData?.student?.full_name?.split(' ')[0] || "Student"}</h1>
            {/* <p>Dashboard Overview</p> */}
          </div>

          {/* QR CODE - RIGHT SIDE */}
          <div className="qr-badge-right">
            <small style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.8rem', textAlign: 'center' }}>
              {dashboardData?.qr_code ? "Your QR Code:" : "Your QR Code:"}
            </small>
            {loading ? <span style={{ color: '#aaa' }}>Loading...</span> :
              dashboardData?.qr_code ? (
                <div style={{ background: 'rgba(102,126,234,0.1)', padding: '5px 15px', borderRadius: '10px', display: 'inline-block' }}>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {dashboardData.qr_code}
                  </span>
                </div>
              ) : (
                <div style={{ border: '1px dashed var(--text-secondary)', padding: '5px 15px', borderRadius: '10px', display: 'inline-block' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Not Yet Allotted</span>
                </div>
              )
            }
          </div>
        </div>

        {/* --- TICKER --- */}
        {priority1Notifications.length > 0 && (
          <div className="glass-banner">
            <span className="ticker-label">Important</span>
            <div className="ticker-single">
              <span className="ticker-message" key={currentPriority1Index}>
                {priority1Notifications[currentPriority1Index]?.message}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dashboard-grid">
            <SkeletonLoader /><SkeletonLoader /><SkeletonLoader />
          </div>
        ) : (
          <div className="dashboard-grid">

            {/* --- LEFT COL: CALENDAR --- */}
            <div className="glass-card calendar-card">
              <h3>Upcoming Events</h3>
              <div className="calendar-list">
                {eventsCalendarData.calendarEvents.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="calendar-item">
                    <span className="cal-date">{new Date(event.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })} • {event.time}</span>
                    <span className="cal-title">{event.title}</span>
                    <span className="cal-loc">📍 {event.place}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- CENTER COL: HERO STATUS --- */}
            <div className="glass-card hero-card">
              <h4>Application Status</h4>

              <div className={`status-badge-lg ${getStatusBadgeClass()}`}>
                {getStatusText()}
              </div>

              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <div className="detail-row">
                  <span>Full Name</span>
                  <span>{dashboardData?.student?.full_name || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>USN</span>
                  <span>{dashboardData?.student?.usn || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>College</span>
                  <span style={{ textAlign: 'left', paddingLeft: '20px', flex: 1 }}>{dashboardData?.college?.college_name || "N/A"}</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {!dashboardData?.application ? (
                <button className="neon-btn" onClick={handleSubmitApplication} disabled={isCollegeLocked}>
                  Submit Application
                </button>
              ) : dashboardData.application.status === 'IN_PROGRESS' ? (
                <button className="neon-btn" onClick={handleCompleteApplication} disabled={isCollegeLocked}>
                  Complete Application
                </button>
              ) : dashboardData.application.status === 'REJECTED' && dashboardData.reapply_count < 2 ? (
                <button className="neon-btn" onClick={handleReapply} disabled={isCollegeLocked}>
                  Reapply Now
                </button>
              ) : null}

              {isCollegeLocked && (
                <div style={{ marginTop: '15px', color: '#FFC107', fontSize: '0.9rem' }}>
                  ⚠️ Applications Closed
                </div>
              )}
            </div>

            {/* --- RIGHT COL: NOTIFICATIONS & LINKS --- */}
            <div className="glass-card">
              <h4>Quick Links & Info</h4>
              <ul className="instruction-list">
                {priority2PlusNotifications.slice(0, 3).map(notification => (
                  <li key={notification.id}>• {notification.message}</li>
                ))}
                <li>• Carry College ID at all times</li>
                <li>• Report 30 mins before events</li>
              </ul>

              <button
                className={`neon-btn ${!settingsData.allocated_events_visible ? "disabled" : ""}`}
                onClick={handleViewAllocatedEvents}
                disabled={!settingsData.allocated_events_visible}
                style={{ fontSize: '0.9rem', padding: '10px 20px', marginTop: '30px' }}
              >
                {settingsData.allocated_events_visible ? "Allocated Events" : "Allocated Events (Locked)"}
              </button>
            </div>

          </div>
        )}

        {/* --- MAP SECTION --- */}
        {!loading && (
          <div className="glass-card">
            <h3 style={{ marginBottom: '5px' }}>Campus Map</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Interactive Event Locations</p>

            <div className="map-container-full">
              <div className="map-blocks-left">
                {blockEvents.left.map((block, idx) => (
                  <div className="block-item" key={idx}>
                    <strong>{block.blockNo}. {block.blockName}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      {block.events.map((e, i) => <div key={i}>• {e.name}</div>)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="map-card">
                <CampusMap />
              </div>

              <div className="map-blocks-right">
                {blockEvents.right.map((block, idx) => (
                  <div className="block-item" key={idx}>
                    <strong>{block.blockNo}. {block.blockName}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      {block.events.map((e, i) => <div key={i}>• {e.name}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAllocatedEventsModal && (
          <AllocatedEventsModal onClose={handleCloseAllocatedEventsModal} />
        )}
      </div>
    </Layout>
  );
}