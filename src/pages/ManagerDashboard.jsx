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
  const [transportStatus, setTransportStatus] = useState(null); // { enabled, submitted, showDetails }
  const [showDownloadsModal, setShowDownloadsModal] = useState(false);
  const [downloadStates, setDownloadStates] = useState({});

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

    // Fetch Transport Status
    fetch(`https://api.vtufest2026.acharyahabba.com/api/settings/transport-status?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(async d => {
        if (!d.success || !d.data?.enabled) { setTransportStatus({ enabled: false, submitted: false, showDetails: false }); return; }
        const showDetails = !!d.data?.show_details;
        // Check if already submitted
        let submitted = false;
        try {
          const sub = await fetch("https://api.vtufest2026.acharyahabba.com/api/transport/my-submission", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (sub.ok) { const sd = await sub.json(); submitted = !!(sd.success && sd.data); }
        } catch { }
        setTransportStatus({ enabled: true, submitted, showDetails });
      })
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
        // dashboard API returns payment_status object when a receipt has been submitted
        const hasPayment = !!data.data?.payment_status || data.data?.payment_receipts?.length > 0 || !!data.data?.payment_receipt_url;
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
        if (data.is_locked || data.manager_lock) {
          setShowFinalApprovalOverlay(true);
        }
      }
    } catch (error) {
      console.error("Lock status check error:", error);
    }
  };

  const handleDownload = (type, url) => {
    if (!url) {
      showPopup("File not available yet.", "error");
      return;
    }
    setDownloadStates(prev => ({ ...prev, [type]: 'loading' }));
    setTimeout(() => {
      setDownloadStates(prev => ({ ...prev, [type]: 'success' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'annexure' ? 'Annexure.pdf' : '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        setDownloadStates(prev => ({ ...prev, [type]: null }));
      }, 2000);
    }, 1500);
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
          <HelpButton style={{ bottom: '25px', right: '25px' }} />

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

              {/* ── TRANSPORT CARD ── */}
              {transportStatus?.enabled && (() => {
                const { submitted, showDetails } = transportStatus;

                // State 3: Submitted + show_details ON → glowing purple/teal allocated card
                if (submitted && showDetails) {
                  return (
                    <div
                      className="glass-card clickable"
                      onClick={() => navigate('/manager/transport')}
                      style={{
                        cursor: 'pointer',
                        position: 'relative', overflow: 'hidden',
                        borderLeft: '4px solid #7c3aed',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(16,185,129,0.12) 100%)',
                        boxShadow: '0 0 28px rgba(124,58,237,0.35), 0 0 60px rgba(16,185,129,0.12)',
                        animation: 'glow-pulse-purple 2.2s ease-in-out infinite',
                      }}
                    >
                      <style>{`
                        @keyframes glow-pulse-purple {
                          0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.35), 0 0 40px rgba(16,185,129,0.1); }
                          50% { box-shadow: 0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(16,185,129,0.25); }
                        }
                        @keyframes blink-gold {
                          0%,100% { opacity: 1; box-shadow: 0 0 16px rgba(212,175,55,0.5); border-color: rgba(212,175,55,0.8); }
                          50% { opacity: 0.65; box-shadow: 0 0 32px rgba(212,175,55,0.9); border-color: rgba(212,175,55,0.3); }
                        }
                        @keyframes shimmer-text {
                          0%,100% { color: #a78bfa; } 50% { color: #10b981; }
                        }
                      `}</style>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🚗</span>
                        <h4 style={{ margin: 0, color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700, animation: 'shimmer-text 3s ease-in-out infinite' }}>Transport Details</h4>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#10b981', margin: '8px 0 4px', letterSpacing: '0.02em' }}>
                        ✅ Vehicle Alloted!
                      </div>
                      <div style={{
                        display: 'inline-block', marginTop: '8px',
                        padding: '7px 16px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700,
                        background: 'linear-gradient(90deg,#7c3aed,#10b981)',
                        color: '#fff', letterSpacing: '0.03em',
                        boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
                      }}>👁 View Allocated Details →</div>
                    </div>
                  );
                }

                // State 2: Submitted, details not shared yet → calm green
                if (submitted) {
                  return (
                    <div
                      className="glass-card clickable"
                      onClick={() => navigate('/manager/transport')}
                      style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-success)' }}
                    >
                      <h4 style={{ color: 'var(--accent-success)' }}>🚌 Transport Details</h4>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-success)', margin: '10px 0' }}>✅</div>
                      <small style={{ color: 'var(--text-secondary)' }}>Submitted — we'll notify you when details are shared</small>
                    </div>
                  );
                }

                // State 1: Not submitted → urgent gold blinking CTA
                return (
                  <div
                    className="glass-card clickable"
                    onClick={() => navigate('/manager/transport')}
                    style={{
                      cursor: 'pointer',
                      borderLeft: '4px solid #d4af37',
                      animation: 'blink-gold 1.6s ease-in-out infinite',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>🚌</span>
                      <h4 style={{ margin: 0, color: '#d4af37', fontSize: '0.95rem', fontWeight: 700 }}>Transport Details</h4>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fbbf24', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚠ Action Required</div>
                    <div style={{
                      display: 'inline-block', marginTop: '8px',
                      padding: '7px 18px', borderRadius: '20px', fontSize: '0.83rem', fontWeight: 800,
                      background: 'linear-gradient(90deg, #d4af37, #f59e0b)',
                      color: '#0f172a', letterSpacing: '0.04em',
                      boxShadow: '0 2px 14px rgba(212,175,55,0.55)',
                    }}>🚌 Submit Transport Details →</div>
                  </div>
                );
              })()}

              {/* ── MANAGER DOWNLOADS CARD ── */}
              {dashboardData?.show_manager_downloads && (
                <div
                  className="glass-card clickable"
                  onClick={() => setShowDownloadsModal(true)}
                  style={{
                    cursor: 'pointer',
                    position: 'relative', overflow: 'hidden',
                    borderLeft: '4px solid #f59e0b',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(212,175,55,0.05) 100%)',
                    boxShadow: '0 0 28px rgba(245,158,11,0.25), 0 0 60px rgba(212,175,55,0.1)',
                    animation: 'glow-pulse-ambient 2.5s ease-in-out infinite',
                  }}
                >
                  <style>{`
                    @keyframes glow-pulse-ambient {
                      0%,100% { box-shadow: 0 0 20px rgba(245,158,11,0.2), 0 0 40px rgba(212,175,55,0.05); }
                      50% { box-shadow: 0 0 35px rgba(245,158,11,0.4), 0 0 70px rgba(212,175,55,0.15); }
                    }
                    @keyframes shimmer-gold-text {
                      0%,100% { color: #f59e0b; } 50% { color: #fbbf24; }
                    }
                  `}</style>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📥</span>
                    <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '0.98rem', fontWeight: 700, animation: 'shimmer-gold-text 3s ease-in-out infinite' }}>Download Files</h4>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24', margin: '8px 0 4px', letterSpacing: '0.01em' }}>
                    Official documents available
                  </div>
                  <div style={{
                    display: 'inline-block', marginTop: '10px',
                    padding: '8px 18px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800,
                    background: 'linear-gradient(90deg,#f59e0b,#d4af37)',
                    color: '#000', letterSpacing: '0.03em',
                    boxShadow: '0 2px 14px rgba(245,158,11,0.4)',
                  }}>View & Download ⬇</div>
                </div>
              )}

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

      {showDownloadsModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "30px", position: "relative" }}>
            <button onClick={() => setShowDownloadsModal(false)} style={{
              position: "absolute", top: "15px", right: "20px", background: "none", border: "none",
              color: "var(--text-muted)", fontSize: "1.5rem", cursor: "pointer"
            }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <span style={{ fontSize: "2.5rem" }}>📥</span>
              <h3 style={{ color: "var(--text-primary)", marginTop: "10px", fontSize: "1.4rem" }}>Manager Downloads</h3>
              <p style={{ color: "var(--accent-warning)", fontSize: "0.95rem", marginTop: "10px", background: "rgba(245, 158, 11, 0.1)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)" }}>
                Instructions related to these PDFs are sent on your email.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {[
                { id: 'annexure', title: '1. Final Annexure', icon: '📄', url: dashboardData?.annexure_url },
                { id: 'cloakroom', title: '2. Cloak Room Acknowledgement', icon: '🎒', url: 'public/cloak-room-ack.docx' },
                { id: 'accommodation', title: '3. Accommodation Acknowledgement', icon: '🏨', url: 'public/accommodation-ack.docx' }
              ].map(file => (
                <div key={file.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "rgba(255,255,255,0.05)", padding: "14px 18px", borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.3rem" }}>{file.icon}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{file.title}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(file.id, file.url)}
                    style={{
                      background: downloadStates[file.id] === 'success' ? 'var(--accent-success)' : 'linear-gradient(90deg, #d4af37, #f59e0b)',
                      border: "none", padding: "8px 20px", borderRadius: "20px",
                      color: downloadStates[file.id] === 'success' ? '#fff' : '#000',
                      fontWeight: 700, cursor: "pointer", minWidth: "130px",
                      transition: "all 0.3s ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                    }}
                  >
                    {downloadStates[file.id] === 'loading' ? (
                      <>
                        <div style={{
                          width: "14px", height: "14px", borderRadius: "50%",
                          border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000",
                          animation: "spin 1s linear infinite"
                        }} /> Fetching
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </>
                    ) : downloadStates[file.id] === 'success' ? (
                      "✅ Downloaded"
                    ) : (
                      "Download ⬇"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
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