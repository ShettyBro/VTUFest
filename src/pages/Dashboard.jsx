import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import CampusMap from "../components/CampusMap";
import AllocatedEventsModal from "../components/Allocatedeventsmodal";
import SparkleEffect from "../components/SparkleEffect";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import { ChevronDown } from "lucide-react";
import QRCode from "react-qr-code";
import { isPhysicalMobile } from "../utils/deviceDetect";
import FeedbackPopup from "../components/feedback/FeedbackPopup";
import MandatoryTour from "../components/onboarding/MandatoryTour";
import GuideTour from "../components/onboarding/GuideTour";
import HelpButton from "../components/HelpButton";

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api/student/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [notificationsData, setNotificationsData] = useState([]);
  const [eventsCalendarData, setEventsCalendarData] = useState({ calendarEvents: [] });

  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);
  const [showAllocatedEventsModal, setShowAllocatedEventsModal] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const isMobile = isPhysicalMobile();
  const { showPopup } = usePopup();

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
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [priority1Notifications.length]);

  // Priority 3 — shown only in student dashboard Quick Links card
  const priority3Notifications = notificationsData
    .filter(n => n.priority === 3)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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
        showPopup(data.message || "Session expired. Redirecting to login...", "error");
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
          showPopup("Failed to load dashboard after multiple attempts. Please contact support.", "error");
        }
        return;
      }

      setDashboardData(data.data);
      setRetryCount(0);

      // Persist student_id so other components (e.g. navbar) can read it
      if (data.data?.student?.id) {
        localStorage.setItem("student_id", `AVH${data.data.student.id}2026`);
      }

      // Show feedback popup if student has an application.
      // We call /api/feedback/my directly so this works even if the dashboard
      // API doesn't yet include feedback_status in its response.
      if (data.data?.application) {
        checkFeedbackStatus(token);
      }

    } catch (error) {
      if (retryCount < 4) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchDashboardData(isManualRefresh);
        }, 2000);
      } else {
        showPopup("Network error. Please check your connection.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check feedback status independently so the popup works even if
  // the dashboard API doesn't yet return feedback_status.
  const checkFeedbackStatus = async (token) => {
    try {
      const res = await fetch(
        "https://api.vtufest2026.acharyahabba.com/api/feedback/my",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return; // API not ready yet — skip silently
      const data = await res.json();
      const status = data?.feedback_status;
      if (status === "not_shown") {
        setShowFeedbackPopup(true);
      }
    } catch (_) {
      // Network error — don't block the dashboard
    }
  };

  useEffect(() => {
    fetchDashboardData();

    fetch("https://api.vtufest2026.acharyahabba.com/api/shared/notifications")
      .then(r => r.json())
      .then(d => { if (d.success) setNotificationsData(d.data); })
      .catch(() => { });

    fetch("https://api.vtufest2026.acharyahabba.com/api/shared/calendar-events")
      .then(r => r.json())
      .then(d => { if (d.success) setEventsCalendarData(d.data); })
      .catch(() => { });
  }, []);

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
    if (dashboardData?.qr_code) {
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
  const isRegistrationLocked = dashboardData?.college?.registration_lock || false;

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

  const renderStepper = () => {
    const status = dashboardData?.application?.status || 'NOT_SUBMITTED';
    const isRejected = status === 'REJECTED';

    // Define 3 steps based on status
    let currentStep = 0;
    if (status === 'IN_PROGRESS') currentStep = 1; // "Applied" (Started)
    if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') currentStep = 2; // "Submitted"
    if (status === 'APPROVED' || status === 'REJECTED') currentStep = 3; // "Approved" / "Rejected"

    const steps = [
      { label: 'Applied', active: currentStep >= 0, completed: currentStep > 0 },
      { label: 'Submitted', active: currentStep >= 2, completed: currentStep > 2 },
      {
        label: isRejected ? 'Rejected' : 'Approved',
        active: currentStep >= 3,
        completed: currentStep >= 3 && !isRejected,
        rejected: isRejected
      },
    ];

    return (
      <div className="stepper-container" style={{ margin: '30px 20px 20px 20px' }}>
        {steps.map((step, index) => (
          <div key={index} className={`step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''} ${step.rejected ? 'rejected' : ''}`}>
            <div className="step-circle">{index + 1}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout hasApplication={dashboardData?.application !== null} collegeLocked={isCollegeLocked}>
      <div className="dashboard-glass-wrapper">

        {!loading && <MandatoryTour />}
        {!loading && <GuideTour />}
        <HelpButton style={{ bottom: '25px', right: '25px' }} />

        {/* --- HEADER --- */}
        <div className="dashboard-header relative-header" id="student-dashboard-header">
          <div className="welcome-text">
            <h1>Welcome, {dashboardData?.student?.full_name?.split(' ')[0] || "Student"}</h1>
          </div>

          {/* QR CODE - RIGHT SIDE / BOTTOM ON MOBILE */}
          <div className="qr-badge-right" id="student-qr-area" style={{ textAlign: isMobile ? 'center' : 'right', marginTop: isMobile ? '10px' : '0' }}>
            <small style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.8rem' }}>
              Your QR Code:
            </small>
            {loading ? <span style={{ color: '#aaa' }}>Loading...</span> :
              dashboardData?.qr_code ? (
                // Unified View: Show small, blurred QR preview with overlay text
                <div
                  onClick={() => setShowQrModal(true)}
                  style={{
                    position: 'relative',
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s ease',
                    overflow: 'hidden',
                    width: '60px',
                    height: '60px'
                  }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1.05)' })}
                  onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1)' })}
                  title="Click to view QR Code"
                >
                  {/* Blurred QR Code background */}
                  <div style={{ position: 'absolute', filter: 'blur(2.5px)', opacity: 0.7 }}>
                    <QRCode value={dashboardData.qr_code} size={50} level="L" />
                  </div>

                  {/* Overlay Text */}
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    background: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    padding: '4px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    Click to<br />View QR
                  </div>
                </div>
              ) : (
                <div style={{ border: '1px dashed var(--text-secondary)', padding: '5px 15px', borderRadius: '10px', display: 'inline-block' }}>
                  <span style={{ color: 'rgba(224, 214, 214, 0.99)', fontSize: '0.9rem' }}>Not Yet Allotted</span>
                </div>
              )
            }
          </div>
        </div>

        {/* --- TICKER --- */}
        {priority1Notifications.length > 0 && (
          <div className="glass-banner">
            <SparkleEffect trigger={currentPriority1Index} />
            <span className="ticker-label ticker-imp-label">Important Notification</span>
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
              <h3>Events Calendar</h3>
              <div className="calendar-mobile-scroll calendar-list">
                {eventsCalendarData.calendarEvents
                  .slice()
                  .sort((a, b) => {
                    const now = new Date();
                    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                    const da = new Date(a.date);
                    const db = new Date(b.date);
                    const aIsToday = da >= todayStart && da <= todayEnd;
                    const bIsToday = db >= todayStart && db <= todayEnd;
                    const aIsFuture = da > todayEnd;
                    const bIsFuture = db > todayEnd;
                    // Tier: today (0) → upcoming/future (1) → past (2)
                    const tier = (isToday, isFuture) => isToday ? 0 : isFuture ? 1 : 2;
                    const ta = tier(aIsToday, aIsFuture);
                    const tb = tier(bIsToday, bIsFuture);
                    if (ta !== tb) return ta - tb;
                    if (ta === 0 || ta === 1) return da - db; // earliest first within today/future
                    return db - da; // most recent past first
                  })
                  .map((event, idx) => {
                    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                    const d = new Date(event.date);
                    const isToday = d >= todayStart && d <= todayEnd;
                    const isFuture = d > todayEnd;
                    const tierClass = isToday ? "cal-today" : isFuture ? "cal-upcoming" : "cal-past";
                    return (
                      <div key={idx} className={`calendar-item ${tierClass}`}>
                        {isToday && <span className="cal-badge">Today</span>}
                        <span className="cal-date">{new Date(event.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })} • {event.time}</span>
                        <span className="cal-title">{event.title}</span>
                        <span className="cal-loc">📍 {event.place}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* --- CENTER COL: HERO STATUS (desktop only — mobile uses My App tab) --- */}
            <div className="glass-card hero-card desktop-only" id="student-status-card">
              <h4>Application Progress</h4>

              {renderStepper()}

              <div style={{ textAlign: 'left', marginTop: '30px' }}>
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
                  Start Application
                </button>
              ) : dashboardData.application.status === 'IN_PROGRESS' ? (
                <button className="neon-btn" onClick={handleCompleteApplication} disabled={isCollegeLocked}>
                  Resume Application
                </button>
              ) : dashboardData.application.status === 'REJECTED' && dashboardData.reapply_count < 2 ? (
                <button className="neon-btn" onClick={handleReapply} disabled={isCollegeLocked}>
                  Reapply Now
                </button>
              ) : null}

              {!dashboardData?.application && (
                isRegistrationLocked ? (
                  <div className="alert-banner alert-warning">
                    ⚠️ Registration is closed for this year
                  </div>
                ) : dashboardData?.college?.is_locked ? (
                  <div className="alert-banner alert-warning">
                    ⚠️ Your college doesn't accept applications anymore
                  </div>
                ) : null
              )}
            </div>

            {/* --- RIGHT COL: NOTIFICATIONS & LINKS --- */}
            <div className="glass-card">
              <h4 className="mobile-info-heading">Quick Links &amp; Guidelines</h4>
              <ul className="instruction-list">
                {priority3Notifications.slice(0, 3).map(notification => (
                  <li key={notification.id}>{notification.message}</li>
                ))}
                <li>Carry College ID at all times</li>
                <li>Report 30 mins before events</li>
              </ul>

              {/* Allocated Events — desktop only; mobile uses My App tab */}
              <div className="desktop-only">
                <button
                  className="neon-btn"
                  onClick={handleViewAllocatedEvents}
                  disabled={!dashboardData?.qr_code}
                  style={{ fontSize: '0.9rem', padding: '10px 20px', marginTop: '30px', opacity: dashboardData?.qr_code ? 1 : 0.45, cursor: dashboardData?.qr_code ? 'pointer' : 'not-allowed' }}
                >
                  {dashboardData?.qr_code ? "View Allocated Events" : "Allocated Events (Not Yet Allotted)"}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* --- MAP SECTION --- */}
        {!loading && (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              className={`accordion-header ${(mapExpanded || !isMobile) ? 'active' : ''}`}
              onClick={() => {
                if (isMobile) setMapExpanded(!mapExpanded);
              }}
              style={{ cursor: isMobile ? 'pointer' : 'default' }}
            >
              <div>
                <h3 style={{ marginBottom: '5px', borderBottom: 'none', paddingBottom: 0 }}>Campus Map & Locations</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', fontWeight: 'normal' }}>
                  {isMobile ? "Tap to view interactive event locations" : "Interactive event locations"}
                </p>
              </div>
              {isMobile && <ChevronDown className="accordion-icon" />}
            </div>

            <div className={`accordion-content ${(mapExpanded || !isMobile) ? 'expanded' : ''}`}>
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
          </div>
        )}

        {showAllocatedEventsModal && (
          <AllocatedEventsModal onClose={handleCloseAllocatedEventsModal} />
        )}

        {/* ── QR CODE OVERLAY MODAL ── */}
        {showQrModal && dashboardData?.qr_code && (
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10000, padding: 20
            }}
            onClick={() => setShowQrModal(false)}
          >
            <div
              style={{
                background: '#ffffff', padding: '30px', borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)', textAlign: 'center',
                maxWidth: '300px', width: '100%', position: 'relative',
                animation: 'fadeInMessage 0.3s ease-out'
              }}
              onClick={e => e.stopPropagation()} // Prevent close when clicking card
            >
              {/* Close button */}
              <button
                onClick={() => setShowQrModal(false)}
                style={{
                  position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.05)',
                  border: 'none', borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#666', transition: 'all 0.2s'
                }}
                onMouseOver={e => Object.assign(e.currentTarget.style, { background: 'rgba(0,0,0,0.1)', color: '#000' })}
                onMouseOut={e => Object.assign(e.currentTarget.style, { background: 'rgba(0,0,0,0.05)', color: '#666' })}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h3 style={{ color: '#1a2f6e', marginBottom: 20, marginTop: 5, fontSize: '1.2rem', fontWeight: 600 }}>
                Scan QR Code
              </h3>

              <div style={{ background: '#fff', padding: 10, borderRadius: 12, display: 'inline-block' }}>
                <QRCode value={dashboardData.qr_code} size={200} level="M" />
              </div>

              <div style={{
                marginTop: 24, padding: '12px', background: '#f5f7fa',
                borderRadius: '12px', color: '#333', fontFamily: 'monospace',
                fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '3px'
              }}>
                {dashboardData.qr_code}
              </div>
              <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 15, marginBottom: 0 }}>
                Present this code at the event venue.
              </p>
            </div>
          </div>
        )}

      </div>

      {showFeedbackPopup && (
        <FeedbackPopup
          role="student"
          triggerEvent="application_submitted"
          onClose={() => setShowFeedbackPopup(false)}
        />
      )}
    </Layout>
  );
}