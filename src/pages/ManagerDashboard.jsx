import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import ManagerProfileModal from "./ManagerProfileModal";
import FinalApprovalOverlay from "./ApprovalOverlay";
import CampusMap from "../components/CampusMap";
import SparkleEffect from "../components/SparkleEffect";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import MobileBlockScreen from "../components/MobileBlockScreen";
import { isPhysicalMobile } from "../utils/deviceDetect";
import HelpButton from "../components/HelpButton";
import GuideButton from '../components/onboarding/GuideButton';
import MandatoryTour from '../components/onboarding/MandatoryTour';
import GuideTour from '../components/onboarding/GuideTour';
import { useOnboarding } from '../context/OnboardingContext';
import FeedbackPopup from "../components/feedback/FeedbackPopup";

export default function ManagerDashboard() {
  // ── MOBILE GUARD — physical phones cannot access manager portal ──
  if (isPhysicalMobile()) return <MobileBlockScreen role="manager" />;

  const navigate = useNavigate();
  const role = localStorage.getItem("vtufest_role");
  const token = localStorage.getItem("vtufest_token");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [eventsCalendarData, setEventsCalendarData] = useState({ calendarEvents: [] });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFinalApprovalOverlay, setShowFinalApprovalOverlay] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);
  const [notificationsData, setNotificationsData] = useState([]);

  const priority1Notifications = notificationsData
    .filter(n => n.priority === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Priority 4 — targeted to managers only
  const priority4Notifications = notificationsData
    .filter(n => n.priority === 4)
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
        if (data.data?.user_id) {
          localStorage.setItem("student_id", `AVH${data.data.user_id}2026`);
        }
        // Show feedback popup if payment receipt uploaded
        const hasPayment = data.data?.payment_receipts?.length > 0 || !!data.data?.payment_receipt_url;
        if (hasPayment) {
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

  const checkProfileCompletion = async () => {
    try {
      const response = await fetch(`https://api.vtufest2026.acharyahabba.com/api/manager/manager-profile`, {
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
        navigate("/");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setLockStatus(data);
        const isLocked = data.is_locked || data.manager_lock;
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

  return (
    <Layout hasApplication={false} collegeLocked={null}>
      <div className="dashboard-glass-wrapper">

        {!loading && <MandatoryTour />}
        {!loading && <GuideTour />}

        {/* --- HEADER --- */}
        <div className="dashboard-header relative-header">
          <div className="welcome-text">
            <h1>Manager Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>VTU HABBA 2026 – Team Manager Panel</p>
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

        {/* --- MANAGER NOTICE (Priority 4) --- */}
        {priority4Notifications.length > 0 && (
          <div style={{
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid rgba(245,158,11,0.5)',
            borderLeft: '4px solid #F59E0B',
            background: 'rgba(245,158,11,0.07)',
            padding: '14px 18px',
            boxShadow: '0 0 16px rgba(245,158,11,0.15)',
            animation: 'pulse-amber 2.5s infinite',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>📢</span>
              <strong style={{ color: '#F59E0B', fontSize: '0.95rem', letterSpacing: '0.03em' }}>Manager Notice</strong>
            </div>
            {priority4Notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: '12px', padding: '7px 0',
                borderTop: '1px solid rgba(245,158,11,0.15)',
                fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.5
              }}>
                <span>• {n.message}</span>
                <span style={{ flexShrink: 0, fontSize: '0.72rem', color: 'rgba(245,158,11,0.7)' }}>
                  {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
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
            <div id="manager-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>

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
                id="manager-approvals-card"
                className="glass-card clickable"
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-success)' }}
                onClick={() => navigate("/approvals")}
              >
                <h4 style={{ color: 'var(--accent-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>Approved Students</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-success)', margin: '10px 0' }}>
                  {dashboardData?.stats?.approved_students || 0}
                </div>
              </div>

              <div
                className="glass-card clickable"
                style={{ cursor: 'pointer', borderLeft: '4px solid #EF5350' }}
                onClick={() => navigate("/approvals")}
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
                <h4 style={{ color: 'rgb(209 204 220)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>Accommodation</h4>
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
                  <p style={{ marginTop: '10px', color: 'rgb(209 204 220)' }}>Apply Now</p>
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

            {/* --- CALENDAR SECTION --- */}
            <div className="glass-card" style={{ marginTop: '0' }}>
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
          </>
        )}

      </div>

      {showProfileModal && <ManagerProfileModal onComplete={() => setShowProfileModal(false)} />}

      {showFeedbackPopup && (
        <FeedbackPopup
          role="manager"
          triggerEvent="payment_proof_uploaded"
          onClose={() => setShowFeedbackPopup(false)}
        />
      )}

      {/* {showFinalApprovalOverlay && lockStatus && (
        <FinalApprovalOverlay
          paymentStatus={lockStatus.payment_status}
          paymentRemarks={lockStatus.payment_remarks}
          isManagerLock={lockStatus.manager_lock}
        />
      )} */}
    </Layout>
  );
}