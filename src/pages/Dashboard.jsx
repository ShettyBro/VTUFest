import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import CampusMap from "../components/CampusMap";
import AllocatedEventsModal from "../components/Allocatedeventsmodal";
import SparkleEffect from "../components/SparkleEffect";
import "../styles/dashboard-glass.css";
import { usePopup } from "../context/PopupContext";
import { ChevronDown } from "lucide-react";

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api/student/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();

  const [notificationsData, setNotificationsData] = useState([]);
  const [eventsCalendarData, setEventsCalendarData] = useState({ calendarEvents: [] });
  const [settingsData, setSettingsData] = useState({ allocated_events_visible: false });

  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPriority1Index, setCurrentPriority1Index] = useState(0);
  const [showAllocatedEventsModal, setShowAllocatedEventsModal] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const { showPopup } = usePopup();

  const priority1Notifications = notificationsData
    .filter(n => n.priority === 1)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Flash briefly then advance to next notification when ticker finishes scrolling
  const [isFlashing, setIsFlashing] = useState(false);
  const handleTickerEnd = () => {
    if (priority1Notifications.length <= 1) return;
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      setCurrentPriority1Index(prev => (prev + 1) % priority1Notifications.length);
    }, 350);
  };

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
        blockName: "Mechanical Seminar Hall",
        events: [
          { name: "CL Vocal Solo", room: "MECH Semi", day: "Day 1" },
        ],
      },
      {
        blockNo: 2,
        blockName: "CS Seminar Hall",
        events: [
          { name: "Light Vocal", room: "CS Semi", day: "Day 1" },
          { name: "CL Instrumental Percussion", room: "CS Semi", day: "Day 1" },
        ],
      },
      {
        blockNo: 3,
        blockName: "CPRD Lawn",
        events: [
          { name: "Group Indian", room: "CPRD Lawn", day: "Day 1" },
          { name: "Folk Orchestra", room: "CPRD Lawn", day: "Day 1" },
        ],
      },
      {
        blockNo: 4,
        blockName: "Pharmacy Road",
        events: [
          { name: "Group Western", room: "Pharmacy Road", day: "Day 1" },
          { name: "Western Solo", room: "Pharmacy Road", day: "Day 1" },
        ],
      },
      {
        blockNo: 5,
        blockName: "E.C Seminar Hall",
        events: [
          { name: "CL Instrumental Non-Percussion", room: "E.C Semi", day: "Day 1" },
        ],
      },
      {
        blockNo: 6,
        blockName: "Indoor Stadium",
        events: [
          { name: "One Act", room: "Indoor Stadium", day: "Day 2" },
        ],
      },
      {
        blockNo: 7,
        blockName: "Main Auditorium",
        events: [
          { name: "Skit", room: "Main Audi", day: "Day 2" },
          { name: "Mime", room: "Main Audi", day: "Day 2" },
          { name: "Folk Tribal", room: "Main Stage", day: "Day 2" },
        ],
      },
      {
        blockNo: 8,
        blockName: "Library 1st Floor",
        events: [
          { name: "Mimicry", room: "Library 1st Floor", day: "Day 2" },
          { name: "Elocution", room: "Library 1st Floor", day: "Day 2" },
        ],
      },
      {
        blockNo: 9,
        blockName: "Hall of Fame",
        events: [
          { name: "Debate", room: "Hall of Fame", day: "Day 2" },
        ],
      },
    ],

    right: [
      {
        blockNo: 10,
        blockName: "CSE Block - Main Audi",
        events: [
          { name: "Quiz", room: "C.S.E Finals (Main Audi)", day: "Day 2" },
        ],
      },
      {
        blockNo: 11,
        blockName: "MBA Seminar Hall",
        events: [
          { name: "CL Solo", room: "MBA Semi", day: "Day 2" },
        ],
      },
      {
        blockNo: 12,
        blockName: "AIHS Corridor",
        events: [
          { name: "Rangoli", room: "AIHS Corridor", day: "Day 3" },
        ],
      },
      {
        blockNo: 13,
        blockName: "Campus",
        events: [
          { name: "Photo", room: "Campus", day: "Day 3" },
        ],
      },
      {
        blockNo: 14,
        blockName: "ASD Workshop Arena",
        events: [
          { name: "Clay Modeling", room: "ASD Workshop Arena", day: "Day 3" },
          { name: "Collage", room: "ASD Studio", day: "Day 3" },
          { name: "Spot Painting", room: "ASD Studio", day: "Day 3" },
        ],
      },
      {
        blockNo: 15,
        blockName: "Architecture Block",
        events: [
          { name: "Cartooning", room: "ARCH Block", day: "Day 3" },
          { name: "Poster Making", room: "ARCH Block", day: "Day 3" },
        ],
      },
      {
        blockNo: 16,
        blockName: "E.C Block Corridor",
        events: [
          { name: "Installation", room: "E.C Block Corridor", day: "Day 3" },
        ],
      },
      {
        blockNo: 17,
        blockName: "Registration Area",
        events: [
          { name: "Registration", room: "CPRD Registration Area", day: "All Days" },
        ],
      },
      {
        blockNo: 18,
        blockName: "Food Court",
        events: [
          { name: "Food Distribution", room: "Kho Kho Court / Basketball", day: "All Days" },
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

    fetch("https://api.vtufest2026.acharyahabba.com/api/shared/settings")
      .then(r => r.json())
      .then(d => { if (d.success) setSettingsData(d.data); })
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

        {/* --- HEADER --- */}
        <div className="dashboard-header relative-header">
          <div className="welcome-text">
            <h1>Welcome, {dashboardData?.student?.full_name?.split(' ')[0] || "Student"}</h1>
          </div>

          {/* QR CODE - RIGHT SIDE */}
          <div className="qr-badge-right">
            <small style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.8rem', textAlign: 'center' }}>
              {dashboardData?.qr_code ? "Your QR Code:" : "Your QR Code:"}
            </small>
            {loading ? <span style={{ color: '#aaa' }}>Loading...</span> :
              dashboardData?.qr_code ? (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '10px', display: 'inline-block' }}>
                  <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {dashboardData.qr_code}
                  </span>
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
          <div className={`glass-banner${isFlashing ? ' ticker-flash' : ''}`}>
            <SparkleEffect trigger={currentPriority1Index} />
            <span className="ticker-label">IMP</span>
            <div className="ticker-single">
              <span
                className="ticker-message"
                key={currentPriority1Index}
                style={{
                  '--ticker-duration': `${Math.max(8, Math.min(20, (priority1Notifications[currentPriority1Index]?.message?.length || 60) * 0.12))}s`
                }}
                onAnimationEnd={handleTickerEnd}
              >
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
            <div className="glass-card hero-card desktop-only">
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
                {priority2PlusNotifications.slice(0, 3).map(notification => (
                  <li key={notification.id}>• {notification.message}</li>
                ))}
                <li>• Carry College ID at all times</li>
                <li>• Report 30 mins before events</li>
              </ul>

              {/* Allocated Events — desktop only; mobile uses My App tab */}
              <div className="desktop-only">
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

          </div>
        )}

        {/* --- MAP SECTION --- */}
        {!loading && (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              className={`accordion-header ${mapExpanded ? 'active' : ''}`}
              onClick={() => setMapExpanded(!mapExpanded)}
            >
              <div>
                <h3 style={{ marginBottom: '5px', borderBottom: 'none', paddingBottom: 0 }}>Campus Map & Locations</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', fontWeight: 'normal' }}>Tap to view interactive event locations</p>
              </div>
              <ChevronDown className="accordion-icon" />
            </div>

            <div className={`accordion-content ${mapExpanded ? 'expanded' : ''}`}>
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
      </div>
    </Layout>
  );
}