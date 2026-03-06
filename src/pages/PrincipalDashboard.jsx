import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import FinalApprovalOverlay from "./ApprovalOverlay";
import CampusMap from "../components/CampusMap";
import SparkleEffect from "../components/SparkleEffect";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import { isValidIndianPhone, sanitizePhone } from "../utils/phoneValidation";
import MobileBlockScreen from "../components/MobileBlockScreen";
import { isPhysicalMobile } from "../utils/deviceDetect";
import HelpButton from "../components/HelpButton";
import GuideButton from '../components/onboarding/GuideButton';
import MandatoryTour from '../components/onboarding/MandatoryTour';
import GuideTour from '../components/onboarding/GuideTour';
import FeedbackPopup from "../components/feedback/FeedbackPopup";
import PrincipalProfileModal from "./PrincipalProfileModal";

export default function PrincipalDashboard() {
  // ── MOBILE GUARD — physical phones cannot access principal portal ──
  if (isPhysicalMobile()) return <MobileBlockScreen role="principal" />;

  const navigate = useNavigate();
  const role = localStorage.getItem("vtufest_role");
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [eventsCalendarData, setEventsCalendarData] = useState({ calendarEvents: [] });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFinalApprovalOverlay, setShowFinalApprovalOverlay] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  // null = still checking, true = show modal, false = hide
  const [showProfileModal, setShowProfileModal] = useState(
    () => localStorage.getItem("profile_completed") === "false" ? true : null
  );

  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);
  const [notificationsData, setNotificationsData] = useState([]);

  const priority1Notifications = notificationsData
    .filter(n => n.priority === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Priority 5 — targeted to principals only
  const priority5Notifications = notificationsData
    .filter(n => n.priority === 5)
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


  const { showPopup } = usePopup();

  useEffect(() => {
    if (!token || role !== "principal") {
      navigate("/");
      return;
    }

    fetchDashboardData();
    checkLockStatus();
    checkPrincipalProfileStatus();

    // Fetch Notifications
    fetch("https://api.vtufest2026.acharyahabba.com/api/shared/notifications")
      .then(r => r.json())
      .then(d => { if (d.success) setNotificationsData(d.data); });

    // Fetch Calendar Events
    fetch("https://api.vtufest2026.acharyahabba.com/api/shared/calendar-events")
      .then(r => r.json())
      .then(d => { if (d.success) setEventsCalendarData(d.data); })
      .catch(() => { });

  }, []);

  useEffect(() => {
    if (priority1Notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentPriority1Index(prev =>
          (prev + 1) % priority1Notifications.length
        );
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [priority1Notifications.length]);

  const checkPrincipalProfileStatus = async () => {
    try {
      const res = await fetch(
        "https://api.vtufest2026.acharyahabba.com/api/principal/principal-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "check_profile_status" }),
        }
      );
      if (!res.ok) return; // don't block dashboard on failure
      const data = await res.json();
      if (data.success) {
        const completed = data.profile_completed === true;
        localStorage.setItem("profile_completed", completed ? "true" : "false");
        setShowProfileModal(!completed);
      }
    } catch (err) {
      console.error("Profile status check error:", err);
      // fall back to whatever was set from localStorage on login
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`https://api.vtufest2026.acharyahabba.com/api/manager/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
        // Store user_id so navbar can show Habba ID in profile tooltip
        if (data.data?.user_id) {
          localStorage.setItem("student_id", `AVH${data.data.user_id}2026`);
        }
        // Show feedback popup if college is finally approved
        if (data.data?.college?.is_final_approved === true) {
          checkFeedbackStatus(token);
        }
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      showPopup("Failed to load dashboard. Please refresh the page.", "error");
    } finally {
      setLoading(false);
    }
  };

  const checkFeedbackStatus = async (token) => {
    try {
      const res = await fetch("https://api.vtufest2026.acharyahabba.com/api/feedback/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const status = data?.feedback_status;
      if (!status || status === "not_shown") {
        setShowFeedbackPopup(true);
      }
    } catch (_) { }
  };

  const checkLockStatus = async () => {
    try {
      const response = await fetch(`https://api.vtufest2026.acharyahabba.com/api/principal/check-lock-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
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
      showPopup("All fields are required", "warning");
      return;
    }
    if (!isValidIndianPhone(managerForm.phone)) {
      showPopup("Phone must be exactly 10 digits and start with 6, 7, 8, or 9", "warning");
      return;
    }

    try {
      setAssigningManager(true);

      const response = await fetch(`https://api.vtufest2026.acharyahabba.com/api/principal/assign-manager`, {
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
        showPopup("Session expired. Please login again.", "error");
        localStorage.clear();
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      const data = await response.json();

      if (data.success) {
        showPopup("Manager assigned successfully. Email sent with credentials.", "success");
        setShowAssignModal(false);
        setManagerForm({ name: "", email: "", phone: "" });
        fetchDashboardData();
      } else {
        showPopup(data.error || "Failed to assign manager", "error");
      }
    } catch (error) {
      console.error("Assign manager error:", error);
      showPopup("Failed to assign manager. Please try again.", "error");
    } finally {
      setAssigningManager(false);
    }
  };

  const blockEvents = {
    left: [
      // {
      //   blockNo: 1,
      //   blockName: "Main Auditorium",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 2,
      //   blockName: "ANA Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 3,
      //   blockName: "CSE Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 4,
      //   blockName: "AIGS Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 5,
      //   blockName: "Mechanical Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 6,
      //   blockName: "ASD Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 7,
      //   blockName: "Architecture Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
    ],
    right: [
      // {
      //   blockNo: 8,
      //   blockName: "EC Block",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 9,
      //   blockName: "Central Library",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 10,
      //   blockName: "Basketball Court",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 11,
      //   blockName: "Student Activity Office",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 12,
      //   blockName: "Stadium",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 13,
      //   blockName: "Udupi Canteen",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // // Block 14 skipped as requested
      // {
      //   blockNo: 15,
      //   blockName: "Two Wheeler Parking",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
      // {
      //   blockNo: 16,
      //   blockName: "Indoor Stadium",
      //   events: [
      //     // { name: "Sample Event", room: "Sample Room", day: "Day 1" }
      //   ],
      // },
    ],
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
          <div className="spinner"></div>
          <h3>Loading Principal Dashboard...</h3>
          <p>Please wait while we fetch your data</p>
        </div>
      </Layout>
    );
  }

  const participatingCount = dashboardData?.stats?.participating_event_count || 0;
  const showViewEventsButton = participatingCount >= 1;

  // Input styles for modal to match glass theme
  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--glass-border)",
    color: "white",
    fontSize: "0.95rem",
    marginTop: "5px",
    marginBottom: "15px"
  };

  const labelStyle = {
    display: "block",
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    marginBottom: "5px"
  };



  return (
    <Layout>
      <div className="dashboard-glass-wrapper">

        {!loading && <MandatoryTour />}
        {!loading && <GuideTour />}

        {/* --- HEADER --- */}
        <div className="dashboard-header relative-header">
          <div className="welcome-text">
            <h1>Principal Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>VTU HABBA 2026 – Principal Administration Panel</p>
          </div>
          <HelpButton style={{ top: '75px', right: '25px' }} />
          <GuideButton style={{ top: '75px', right: '145px' }} />
        </div>

        {/* --- TICKER (Priority 1) --- */}
        {priority1Notifications.length > 0 && (
          <div className="glass-banner">
            <SparkleEffect trigger={currentPriority1Index} />
            <span className="ticker-label">IMP</span>
            <div className="ticker-single">
              <span className="ticker-message">
                {priority1Notifications[currentPriority1Index]?.message}
              </span>
            </div>
          </div>
        )}

        {/* --- PRINCIPAL NOTICE (Priority 5) --- */}
        {priority5Notifications.length > 0 && (
          <div style={{
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid rgba(139,92,246,0.5)',
            borderLeft: '4px solid #8B5CF6',
            background: 'rgba(139,92,246,0.07)',
            padding: '14px 18px',
            boxShadow: '0 0 16px rgba(139,92,246,0.2)',
            animation: 'pulse-purple 2.5s infinite',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>📋</span>
              <strong style={{ color: '#A78BFA', fontSize: '0.95rem', letterSpacing: '0.03em' }}>Principal Notice</strong>
            </div>
            {priority5Notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: '12px', padding: '7px 0',
                borderTop: '1px solid rgba(139,92,246,0.15)',
                fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5
              }}>
                <span>• {n.message}</span>
                <span style={{ flexShrink: 0, fontSize: '0.72rem', color: 'rgba(167,139,250,0.7)' }}>
                  {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* --- ASSIGN MANAGER (hidden when manager exists) --- */}
        {dashboardData && !dashboardData.has_team_manager && (
          <div style={{ marginBottom: '16px' }}>
            <button
              id="principal-assign-manager-btn"
              className="neon-btn"
              onClick={() => setShowAssignModal(true)}
              disabled={assigningManager}
              style={{ padding: '7px 20px', fontSize: '0.85rem', width: 'fit-content' }}
            >
              {assigningManager ? 'Assigning...' : '+ Assign Manager'}
            </button>
          </div>
        )}

        {/* --- STATS GRID --- */}
        <div id="principal-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>

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

            {showViewEventsButton && (
              <button
                className="neon-btn"
                onClick={() => navigate("/assign-events")}
                style={{
                  marginTop: "15px",
                  width: "100%",
                  fontSize: "0.85rem",
                  padding: "8px 12px"
                }}
              >
                View Assigned Events
              </button>
            )}
          </div>
        </div>

        {/* --- CALENDAR SECTION --- */}
        <div className="glass-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '5px' }}>Events Calendar</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.88rem' }}>Upcoming & past event schedule</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            {eventsCalendarData.calendarEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No events scheduled.</p>
            ) : eventsCalendarData.calendarEvents
              .slice()
              .sort((a, b) => {
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                const da = new Date(a.date), db = new Date(b.date);
                const tier = (d) => d >= todayStart && d <= todayEnd ? 0 : d > todayEnd ? 1 : 2;
                const ta = tier(da), tb = tier(db);
                if (ta !== tb) return ta - tb;
                return ta <= 1 ? da - db : db - da;
              })
              .map((event, idx) => {
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                const d = new Date(event.date);
                const isToday = d >= todayStart && d <= todayEnd;
                const isFuture = d > todayEnd;
                const accentColor = isToday ? 'var(--accent-success)' : isFuture ? 'var(--gold-solid)' : 'rgba(255,255,255,0.2)';
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '10px 14px', borderRadius: '10px',
                    background: isToday ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                    borderLeft: `3px solid ${accentColor}`,
                    opacity: (!isToday && !isFuture) ? 0.55 : 1,
                  }}>
                    <div style={{ minWidth: '54px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: accentColor, lineHeight: 1.1 }}>
                        {new Date(event.date).getDate()}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isToday && <span style={{ background: 'var(--accent-success)', color: '#0f172a', fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: '10px', marginRight: '6px', verticalAlign: 'middle', textTransform: 'uppercase' }}>Today</span>}
                        {event.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {event.time} &nbsp;•&nbsp; 📍 {event.place}
                      </div>
                    </div>
                  </div>
                );
              })}
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

      </div>

      {showAssignModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '500px', background: 'var(--navy-dark)', border: '1px solid var(--academic-gold)' }}>
            <h3 style={{ color: 'var(--academic-gold)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px', marginTop: 0 }}>
              Assign Team Manager
            </h3>

            <div>
              <label style={labelStyle}>Manager Name</label>
              <input
                value={managerForm.name}
                onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                disabled={assigningManager}
                style={inputStyle}
                placeholder="Enter Full Name"
              />
            </div>
            <div>
              <label style={labelStyle}>Manager Email</label>
              <input
                value={managerForm.email}
                onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                disabled={assigningManager}
                style={inputStyle}
                placeholder="Enter Email Address"
              />
            </div>
            <div>
              <label style={labelStyle}>Manager Mobile</label>
              <input
                type="tel"
                inputMode="numeric"
                value={managerForm.phone}
                onChange={(e) => setManagerForm({ ...managerForm, phone: sanitizePhone(e.target.value) })}
                disabled={assigningManager}
                style={inputStyle}
                maxLength={10}
                pattern="[6-9][0-9]{9}"
                placeholder="e.g. 9876543210 (start with 6-9)"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="neon-btn"
                onClick={handleAssignManager}
                disabled={assigningManager}
              >
                {assigningManager ? "Assigning..." : "Assign Manager"}
              </button>
              <button
                className="neon-btn"
                onClick={() => setShowAssignModal(false)}
                disabled={assigningManager}
                style={{ background: 'transparent', borderColor: '#64748b', color: '#cbd5e1', boxShadow: 'none' }}
              >
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

      {showFeedbackPopup && (
        <FeedbackPopup
          role="principal"
          triggerEvent="final_approval_given"
          onClose={() => setShowFeedbackPopup(false)}
        />
      )}

      {showProfileModal && (
        <PrincipalProfileModal
          onComplete={() => setShowProfileModal(false)}
        />
      )}
    </Layout>
  );
}
