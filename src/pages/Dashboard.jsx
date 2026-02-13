import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import CampusMap from "../components/CampusMap";
import AllocatedEventsModal from "../components/Allocatedeventsmodal";
import "../styles/dashboard-glass.css"; // UPDATED IMPORT

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

  useEffect(() => {
    if (priority1Notifications.length > 0) {
      const interval = setInterval(() => {
        setCurrentPriority1Index((prev) => (prev + 1) % priority1Notifications.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [priority1Notifications.length]);

  const handleSubmitApplication = () => {
    navigate("/student-register");
  };

  const handleCompleteApplication = () => {
    navigate("/student-register");
  };

  const handleReapply = () => {
    navigate("/student-register");
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
      <div className="skeleton-box" style={{ width: "60%", height: "20px", marginBottom: "10px", background: "rgba(255,255,255,0.2)" }}></div>
      <div className="skeleton-box" style={{ width: "80%", height: "20px", marginBottom: "10px", background: "rgba(255,255,255,0.2)" }}></div>
      <div className="skeleton-box" style={{ width: "70%", height: "20px", background: "rgba(255,255,255,0.2)" }}></div>
    </div>
  );

  const collegeDisplay = dashboardData?.college
    ? `${dashboardData.college.college_name}, ${dashboardData.college.place}`
    : "Loading...";

  const isCollegeLocked = dashboardData?.college?.is_locked || dashboardData?.college?.registration_lock || false;

  return (
    <Layout hasApplication={dashboardData?.application !== null} collegeLocked={isCollegeLocked}>
      <div className="dashboard-glass-wrapper">
        {priority1Notifications.length > 0 && (
          <div className="glass-banner">
            <div className="qr-code-section">
              <strong>QrCode:</strong>{" "}
              {loading ? (
                <span className="loading-text">Loading...</span>
              ) : dashboardData?.qr_code ? (
                <span className="qr-code-value">{dashboardData.qr_code}</span>
              ) : (
                <span className="qr-code-not-alloted">Not Allotted</span>
              )}
            </div>

            <div className="priority-ticker" style={{ flex: 1, marginLeft: '20px' }}>
              <span className="ticker-label" style={{ background: 'rgba(255,0,0,0.6)' }}>IMP:</span>
              <div className="ticker-wrapper">
                <span className="ticker-text">
                  {priority1Notifications[currentPriority1Index]?.message}
                </span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dashboard-sections">
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </div>
        ) : (
          <>
            <div className="glass-card">
              <div className="calendar-header">
                <h3>VTU HABBA 2026 – Event Calendar</h3>
              </div>

              <div className="calendar-grid">
                {eventsCalendarData.calendarEvents.map((event, idx) => (
                  <div key={idx} className="glass-event">
                    <strong>{event.title}</strong>
                    <p>{event.place}</p>
                    <p className="event-time">{event.time}</p>
                    <p className="event-date" style={{ marginTop: '5px', fontWeight: 'bold' }}>{new Date(event.date).toLocaleDateString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="glass-card">
                <h4>Registration Status</h4>

                <p>
                  <strong>Name:</strong> {dashboardData?.student?.full_name || "N/A"}
                </p>
                <p>
                  <strong>USN:</strong> {dashboardData?.student?.usn || "N/A"}
                </p>
                <p>
                  <strong>College:</strong> {collegeDisplay}
                </p>

                <hr style={{ margin: "15px 0", borderColor: "rgba(255,255,255,0.2)" }} />

                {isCollegeLocked && (
                  <div className="college-locked-message" style={{ background: "rgba(255, 193, 7, 0.2)", color: "#ffc107", border: "1px solid rgba(255, 193, 7, 0.3)" }}>
                    <p className="locked-text" style={{ margin: 0 }}>Applications are closed for your college.</p>
                  </div>
                )}

                {!dashboardData?.application ? (
                  <>
                    <p>Status: <strong className="status-badge status-pending">No Application Submitted</strong></p>
                    <button
                      className="glass-btn"
                      onClick={handleSubmitApplication}
                      disabled={isCollegeLocked}
                    >
                      Submit Application
                    </button>
                  </>
                ) : dashboardData.application.status === "SUBMITTED" ? (
                  <>
                    <p>Status: <strong className="status-badge status-submitted">Submitted - Under Review</strong></p>
                    <p className="status-info">Your application is being reviewed by the admin.</p>
                  </>
                ) : dashboardData.application.status === "UNDER_REVIEW" ? (
                  <>
                    <p>Status: <strong className="status-badge status-submitted">Under Review</strong></p>
                    <p className="status-info">Admin is currently reviewing your application.</p>
                  </>
                ) : dashboardData.application.status === "IN_PROGRESS" ? (
                  <>
                    <p>Status: <strong className="status-badge status-pending">Application In Progress</strong></p>
                    <button
                      className="glass-btn"
                      onClick={handleCompleteApplication}
                      disabled={isCollegeLocked}
                    >
                      Complete Application
                    </button>
                  </>
                ) : dashboardData.application.status === "REJECTED" ? (
                  <>
                    <p>Status: <strong className="status-badge status-rejected">Rejected</strong></p>
                    {dashboardData.application.rejected_reason && (
                      <p className="rejection-reason" style={{ background: 'rgba(244, 67, 54, 0.1)', borderLeft: '4px solid #f44336' }}>
                        <strong>Reason:</strong> {dashboardData.application.rejected_reason}
                      </p>
                    )}
                    {dashboardData.reapply_count < 2 ? (
                      <button
                        className="glass-btn"
                        style={{ background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)' }}
                        onClick={handleReapply}
                        disabled={isCollegeLocked}
                      >
                        Reapply
                      </button>
                    ) : (
                      <p className="max-attempts" style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                        Maximum reapplication limit reached (2 rejections). Cannot reapply.
                      </p>
                    )}
                  </>
                ) : dashboardData.application.status === "APPROVED" ? (
                  <>
                    <p>Status: <strong className="status-badge status-approved">Approved ✓</strong></p>
                    <p className="status-info">Your application has been approved! Event allocation in progress.</p>
                  </>
                ) : null}

                <hr style={{ margin: "15px 0", borderColor: "rgba(255,255,255,0.2)" }} />

                <button
                  className={`glass-btn-secondary ${!settingsData.allocated_events_visible ? "disabled" : ""}`}
                  onClick={handleViewAllocatedEvents}
                  disabled={!settingsData.allocated_events_visible}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
                >
                  {settingsData.allocated_events_visible
                    ? "View My Allocated Events"
                    : "View Allocated Events (Available after registration closes)"}
                </button>
              </div>

              <div className="glass-card">
                <h4>Important Instructions</h4>
                <ul>
                  <li>Carry College ID during all events</li>
                  <li>Report 30 minutes before event time</li>
                  <li>Follow VTU HABBA guidelines strictly</li>
                  <li>Respect event coordinators and volunteers</li>
                  <li>Mobile phones must be on silent during events</li>
                </ul>
              </div>

              <div className="glass-card">
                <h4>Notifications</h4>
                <ul>
                  {priority2PlusNotifications.map(notification => (
                    <li key={notification.id}>{notification.message}</li>
                  ))}
                </ul>
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
                <h3 className="section-title" style={{ color: '#a8edea' }}>Campus Map & Event Locations</h3>
                <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Click on any numbered pin to open the exact location in Google Maps
                </p>
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
          </>
        )}

        {showAllocatedEventsModal && (
          <AllocatedEventsModal onClose={handleCloseAllocatedEventsModal} />
        )}
      </div>
    </Layout>
  );
}