import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import CampusMap from "../components/CampusMap";
import "../styles/dashboard.css";

// Import JSON data
import collegesData from "../data/colleges.json";
import settingsData from "../data/settings.json";
import notificationsData from "../data/notifications.json";
import eventsCalendarData from "../data/events-calendar.json";

const API_BASE_URL = "https://vtu13.netlify.app/.netlify/functions/student-dashboard";

export default function Dashboard() {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [collegeName, setCollegeName] = useState("");
  const [canRefresh, setCanRefresh] = useState(false);
  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);

  // Filter priority 1 and 2+ notifications
  const priority1Notifications = notificationsData.filter(n => n.priority === 1);
  const priority2PlusNotifications = notificationsData.filter(n => n.priority >= 2);

  /* ================= EVENT BLOCK DATA (READ-ONLY) ================= */
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

  // Check if 12 hours have passed
  const check12HoursPassed = () => {
    const lastFetch = localStorage.getItem("last_dashboard_fetch_at");
    if (!lastFetch) return true;

    const lastFetchTime = new Date(lastFetch).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - lastFetchTime) / (1000 * 60 * 60);

    return hoursPassed >= 12;
  };

  // Fetch dashboard data
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

      // Handle token expiry (401)
      if (response.status === 401 && data.redirect) {
        alert(data.message || "Session expired. Redirecting to login...");
        
        setTimeout(() => {
          // Clear all localStorage except important data
          const lastFetch = localStorage.getItem("last_dashboard_fetch_at");
          localStorage.clear();
          if (lastFetch) {
            localStorage.setItem("last_dashboard_fetch_at", lastFetch);
          }
          window.location.href = data.redirect;
        }, 2000);
        return;
      }

      // Handle server error (500)
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

      // Success - store data
      setDashboardData(data.data);
      setRetryCount(0);

      // Store last fetch timestamp in localStorage
      if (data.data.last_dashboard_fetch_at) {
        localStorage.setItem("last_dashboard_fetch_at", data.data.last_dashboard_fetch_at);
      }

      // Get college name from JSON
      const storedCollegeId = localStorage.getItem("college_id");
      if (storedCollegeId) {
        const college = collegesData.find(c => c.college_id === parseInt(storedCollegeId));
        if (college) {
          setCollegeName(`${college.college_name}, ${college.place}`);
        }
      }

      // Check if can refresh
      setCanRefresh(check12HoursPassed());

    } catch (error) {
      console.error("Dashboard fetch error:", error);
      
      if (retryCount < 4) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchDashboardData(isManualRefresh);
        }, 2000);
      } else {
        alert("Network error. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
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

  // Handle manual refresh
  const handleRefresh = () => {
    if (canRefresh) {
      fetchDashboardData(true);
    }
  };

  // Handle reapply
  const handleReapply = () => {
    navigate("/submit-application");
  };

  // Handle view allocated events
  const handleViewAllocatedEvents = () => {
    if (settingsData.allocated_events_visible) {
      navigate("/allocated-events");
    }
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="skeleton-loader">
      <div className="skeleton-box" style={{ width: "100%", height: "50px", marginBottom: "20px" }}></div>
      <div className="skeleton-box" style={{ width: "80%", height: "30px", marginBottom: "15px" }}></div>
      <div className="skeleton-box" style={{ width: "60%", height: "30px", marginBottom: "15px" }}></div>
      <div className="skeleton-box" style={{ width: "90%", height: "100px" }}></div>
    </div>
  );

  return (
    <Layout>
      {/* ================= QR CODE + PRIORITY 1 TICKER ================= */}
      {priority1Notifications.length > 0 && (
        <div className="top-banner">
          <div className="qr-code-section">
            <strong>8 Digit Code:</strong>{" "}
            {loading ? (
              <span className="loading-text">Loading...</span>
            ) : dashboardData?.qr_code ? (
              <span className="qr-code-value">{dashboardData.qr_code}</span>
            ) : (
              <span className="qr-code-not-alloted">Not Allotted</span>
            )}
          </div>

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

      {/* ================= REFRESH BUTTON ================= */}
      {canRefresh && !loading && (
        <button className="refresh-button" onClick={handleRefresh}>
          🔄 Refresh Data
        </button>
      )}

      {/* ================= LOADING STATE ================= */}
      {loading ? (
        <div className="dashboard-sections">
          <div className="info-card">
            <SkeletonLoader />
          </div>
          <div className="info-card">
            <SkeletonLoader />
          </div>
          <div className="info-card">
            <SkeletonLoader />
          </div>
        </div>
      ) : (
        <>
          {/* ================= EVENT CALENDAR ================= */}
          <div className="calendar-card">
            <div className="calendar-header">
              <h3>VTU HABBA 2026 – Event Calendar</h3>
            </div>

            <div className="calendar-grid">
              {eventsCalendarData.calendarEvents.map((event, idx) => (
                <div key={idx} className={`event ${event.type}`}>
                  <strong>{event.title}</strong>
                  <p>{event.place}</p>
                  <p>{event.time}</p>
                  <p className="event-date">{new Date(event.date).toLocaleDateString("en-IN")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ================= DASHBOARD INFO CARDS ================= */}
          <div className="dashboard-sections">
            {/* Registration Status Card */}
            <div className="info-card">
              <h4>Registration Status</h4>

              {/* Student Info */}
              <p>
                <strong>Name:</strong> {localStorage.getItem("name") || "N/A"}
              </p>
              <p>
                <strong>USN:</strong> {localStorage.getItem("usn") || "N/A"}
              </p>
              <p>
                <strong>College:</strong> {collegeName || "Loading..."}
              </p>

              <hr style={{ margin: "15px 0" }} />

              {/* Application Status Logic */}
              {!dashboardData?.application ? (
                <>
                  <p>Status: <strong className="status-pending">No Application Submitted</strong></p>
                  <button className="submit-button" onClick={() => navigate("/submit-application")}>
                    Submit Application
                  </button>
                </>
              ) : dashboardData.application.status === "SUBMITTED" ? (
                <>
                  <p>Status: <strong className="status-submitted">Submitted - Under Review</strong></p>
                  <p className="status-info">Your application is being reviewed by the admin.</p>
                </>
              ) : dashboardData.application.status === "UNDER_REVIEW" ? (
                <>
                  <p>Status: <strong className="status-review">Under Review</strong></p>
                  <p className="status-info">Admin is currently reviewing your application.</p>
                </>
              ) : dashboardData.application.status === "IN_PROGRESS" ? (
                <>
                  <p>Status: <strong className="status-progress">Application In Progress</strong></p>
                  <button className="submit-button" onClick={() => navigate("/submit-application")}>
                    Complete Application
                  </button>
                </>
              ) : dashboardData.application.status === "REJECTED" ? (
                <>
                  <p>Status: <strong className="status-rejected">Rejected</strong></p>
                  {dashboardData.application.rejected_reason && (
                    <p className="rejection-reason">
                      <strong>Reason:</strong> {dashboardData.application.rejected_reason}
                    </p>
                  )}
                  {dashboardData.reapply_count < 2 ? (
                    <button className="reapply-button" onClick={handleReapply}>
                      Reapply
                    </button>
                  ) : (
                    <p className="max-attempts">
                      Maximum reapplication limit reached (2 rejections). Cannot reapply.
                    </p>
                  )}
                </>
              ) : dashboardData.application.status === "APPROVED" ? (
                <>
                  <p>Status: <strong className="status-approved">Approved ✓</strong></p>
                  <p className="status-info">Your application has been approved! Event allocation in progress.</p>
                </>
              ) : null}

              <hr style={{ margin: "15px 0" }} />

              {/* Allocated Events Button */}
              <button
                className={`allocated-events-button ${!settingsData.allocated_events_visible ? "disabled" : ""}`}
                onClick={handleViewAllocatedEvents}
                disabled={!settingsData.allocated_events_visible}
              >
                {settingsData.allocated_events_visible 
                  ? "View My Allocated Events" 
                  : "View Allocated Events (Available after registration closes)"}
              </button>
              {!settingsData.allocated_events_visible && (
                <p className="events-info">
                  You can see your allocated events after the registration date ends.
                </p>
              )}
            </div>

            {/* Important Instructions Card */}
            <div className="info-card">
              <h4>Important Instructions</h4>
              <ul>
                <li>Carry College ID during all events</li>
                <li>Report 30 minutes before event time</li>
                <li>Follow VTU HABBA guidelines strictly</li>
                <li>Respect event coordinators and volunteers</li>
                <li>Mobile phones must be on silent during events</li>
              </ul>
            </div>

            {/* Notifications Card */}
            <div className="info-card">
              <h4>Notifications</h4>
              <ul>
                {priority2PlusNotifications.map(notification => (
                  <li key={notification.id}>{notification.message}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* ================= CAMPUS MAP + BLOCK EVENTS ================= */}
          <div className="dashboard-map-wrapper">
            {/* LEFT BLOCK EVENTS */}
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

            {/* CENTER MAP */}
            <div className="map-center">
              <h3 className="section-title">Campus Map & Event Locations</h3>
              <p className="section-subtitle">
                Click on any numbered pin to open the exact location in Google Maps
              </p>
              <CampusMap />
            </div>

            {/* RIGHT BLOCK EVENTS */}
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
    </Layout>
  );
}