import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import FinalApprovalOverlay from "./ApprovalOverlay";
import CampusMap from "../components/CampusMap";
import "../styles/PrincipalDashboard.css";
import notificationsData from "../data/notifications.json";
import eventsCalendarData from "../data/events-calendar.json";

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("vtufest_role");
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
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

  const [assigningManager, setAssigningManager] = useState(false);

  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!token || role !== "principal") {
      navigate("/");
      return;
    }

    fetchDashboardData();
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
        alert("Session expired. Please login again.");
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

  const handleAssignManager = async () => {
    if (!managerForm.name || !managerForm.email || !managerForm.phone) {
      alert("All fields are required");
      return;
    }

    try {
      setAssigningManager(true);

      const response = await fetch(`https://vtu-festserver-production.up.railway.app/api/principal/assign-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          manager_name: managerForm.name,
          manager_email: managerForm.email,
          manager_phone: managerForm.phone,
        }),
      });

      if (response.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert("Manager assigned successfully. Email sent with credentials.");
        setShowAssignModal(false);
        setManagerForm({ name: "", email: "", phone: "" });
        fetchDashboardData();
      } else {
        alert(data.error || "Failed to assign manager");
      }
    } catch (error) {
      console.error("Assign manager error:", error);
      alert("Failed to assign manager. Please try again.");
    } finally {
      setAssigningManager(false);
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
          <h3>Loading Principal Dashboard...</h3>
          <p>Please wait while we fetch your data</p>
        </div>
      </Layout>
    );
  }

  const participatingCount = dashboardData?.stats?.participating_event_count || 0;
  const showViewEventsButton = participatingCount >= 1;

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
          <h2>Principal Dashboard</h2>
          <p>VTU HABBA 2026 — Principal Administration Panel</p>

          {dashboardData && !dashboardData.has_team_manager && (
            <button
              className="assign-manager-btn"
              onClick={() => setShowAssignModal(true)}
              disabled={assigningManager}
            >
              {assigningManager ? "Assigning..." : "Assign Manager"}
            </button>
          )}
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
            
            {showViewEventsButton && (
              <button
                onClick={() => navigate("/assign-events")}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "8px 12px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#2563eb";
                }}
              >
                View Assigned Events
              </button>
            )}
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
                    • {e.name} — Room {e.room} ({e.day})
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
                    • {e.name} — Room {e.room} ({e.day})
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Assign Team Manager</h3>
            <label>Manager Name</label>
            <input
              value={managerForm.name}
              onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
              disabled={assigningManager}
            />
            <label>Manager Email</label>
            <input
              value={managerForm.email}
              onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
              disabled={assigningManager}
            />
            <label>Manager Mobile</label>
            <input
              value={managerForm.phone}
              onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
              disabled={assigningManager}
            />
            <div className="modal-actions">
              <button onClick={handleAssignManager} disabled={assigningManager}>
                {assigningManager ? "Assigning..." : "Submit"}
              </button>
              <button onClick={() => setShowAssignModal(false)} disabled={assigningManager}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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