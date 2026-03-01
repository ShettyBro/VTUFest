import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/layout";
import AllocatedEventsModal from "../components/Allocatedeventsmodal";
import "../styles/dashboard-glass.css";
import "../styles/mobile-layout.css";
import { usePopup } from "../context/PopupContext";

const API_BASE_URL = "https://api.vtufest2026.acharyahabba.com/api/student/dashboard";

export default function StudentApplication() {
    const navigate = useNavigate();
    const { showPopup } = usePopup();

    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [dashboardData, setDashboardData] = useState(null);
    const [settingsData, setSettingsData] = useState({ allocated_events_visible: false });
    const [showAllocatedEventsModal, setShowAllocatedEventsModal] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem("vtufest_token");
        if (!token) {
            localStorage.clear();
            window.location.href = "/";
            return;
        }
        try {
            setLoading(true);
            const res = await fetch(API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (res.status === 401 && data.redirect) {
                showPopup(data.message || "Session expired.", "error");
                setTimeout(() => { localStorage.clear(); window.location.href = data.redirect; }, 2000);
                return;
            }
            if (!res.ok) {
                if (retryCount < 4) setTimeout(() => { setRetryCount(p => p + 1); fetchData(); }, 2000);
                else showPopup("Failed to load. Please refresh.", "error");
                return;
            }
            setDashboardData(data.data);
            setRetryCount(0);
        } catch {
            if (retryCount < 4) setTimeout(() => { setRetryCount(p => p + 1); fetchData(); }, 2000);
            else showPopup("Network error. Please check your connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetch("https://api.vtufest2026.acharyahabba.com/api/shared/settings")
            .then(r => r.json())
            .then(d => { if (d.success) setSettingsData(d.data); })
            .catch(() => { });
    }, []);

    const isCollegeLocked = dashboardData?.college?.is_locked || dashboardData?.college?.registration_lock || false;
    const isRegistrationLocked = dashboardData?.college?.registration_lock || false;

    const renderStepper = () => {
        const status = dashboardData?.application?.status || 'NOT_SUBMITTED';
        const isRejected = status === 'REJECTED';
        let currentStep = 0;
        if (status === 'IN_PROGRESS') currentStep = 1;
        if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') currentStep = 2;
        if (status === 'APPROVED' || status === 'REJECTED') currentStep = 3;
        const steps = [
            { label: 'Applied', active: currentStep >= 0, completed: currentStep > 0 },
            { label: 'Submitted', active: currentStep >= 2, completed: currentStep > 2 },
            {
                label: isRejected ? 'Rejected' : 'Approved',
                active: currentStep >= 3,
                completed: currentStep >= 3 && !isRejected,
                rejected: isRejected,
            },
        ];
        return (
            <div className="stepper-container" style={{ margin: '20px 10px' }}>
                {steps.map((step, i) => (
                    <div key={i} className={`step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''} ${step.rejected ? 'rejected' : ''}`}>
                        <div className="step-circle">{i + 1}</div>
                        <div className="step-label">{step.label}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Layout hasApplication={dashboardData ? dashboardData.application !== null : undefined} collegeLocked={isCollegeLocked}>
            <div className="dashboard-glass-wrapper">

                {/* ── PAGE TITLE ──────────────────────────────── */}
                <div className="dashboard-header relative-header">
                    <div className="welcome-text">
                        {loading ? (
                            <div style={{ height: 36, width: 160, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'none' }} />
                        ) : (
                            <h1>My Application</h1>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {/* Refresh button removed per request */}

                        {/* QR Code badge */}
                        <div className="qr-badge-right">
                            <small style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.8rem', textAlign: 'center' }}>
                                Your QR Code:
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
                </div>

                {loading ? (
                    /* ── IMPROVED SKELETON — mirrors actual card layout ── */
                    <div style={{ padding: '0 12px' }}>
                        <div className="glass-card" style={{ margin: '0 0 12px' }}>
                            {/* Card title bar */}
                            <div style={{ height: 18, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />
                            {/* Stepper placeholder */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 10px', gap: 8 }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ width: 48, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
                                    </div>
                                ))}
                            </div>
                            {/* Detail rows */}
                            {[80, 60, 95, 50].map((w, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ height: 14, width: '30%', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
                                    <div style={{ height: 14, width: `${w - 30}%`, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                                </div>
                            ))}
                            {/* Button placeholder */}
                            <div style={{ height: 44, width: '100%', borderRadius: 10, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', marginTop: 20 }} />
                        </div>
                        {/* Second card skeleton */}
                        <div className="glass-card" style={{ margin: '0 0 12px' }}>
                            <div style={{ height: 18, width: '50%', borderRadius: 6, background: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
                            <div style={{ height: 14, width: '85%', borderRadius: 4, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
                            <div style={{ height: 14, width: '65%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 20 }} />
                            <div style={{ height: 44, width: '100%', borderRadius: 10, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }} />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── APPLICATION PROGRESS ────────────────── */}
                        <div className="glass-card" style={{ margin: '16px 12px 12px' }}>
                            <h4>Application Progress</h4>
                            {renderStepper()}

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
                                    <span style={{ textAlign: 'left', paddingLeft: '10px', flex: 1 }}>
                                        {dashboardData?.college?.college_name || "N/A"}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span>Status</span>
                                    <span>
                                        {dashboardData?.application
                                            ? dashboardData.application.status.replace(/_/g, " ")
                                            : "NOT SUBMITTED"}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ marginTop: '20px' }}>
                                {!dashboardData?.application ? (
                                    <button className="neon-btn" onClick={() => navigate("/student-register")} disabled={isCollegeLocked}>
                                        Start Application
                                    </button>
                                ) : dashboardData.application.status === 'IN_PROGRESS' ? (
                                    <button className="neon-btn" onClick={() => navigate("/student-register")} disabled={isCollegeLocked}>
                                        Resume Application
                                    </button>
                                ) : dashboardData.application.status === 'REJECTED' && dashboardData.reapply_count < 2 ? (
                                    <button className="neon-btn" onClick={() => navigate("/student-register")} disabled={isCollegeLocked}>
                                        Reapply Now
                                    </button>
                                ) : null}

                                {!dashboardData?.application && (
                                    isRegistrationLocked ? (
                                        <div className="alert-banner alert-warning">⚠️ Registration is closed for this year</div>
                                    ) : dashboardData?.college?.is_locked ? (
                                        <div className="alert-banner alert-warning">⚠️ Your college doesn't accept applications anymore</div>
                                    ) : null
                                )}
                            </div>
                        </div>

                        {/* ── ALLOCATED EVENTS ─────────────────────── */}
                        <div className="glass-card" style={{ margin: '12px' }}>
                            <h4>Allocated Events</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                {settingsData.allocated_events_visible
                                    ? "Your event allocations are ready. Tap below to view."
                                    : "Event allocations haven't been published yet. Check back later."}
                            </p>
                            <button
                                className={`neon-btn ${!settingsData.allocated_events_visible ? "disabled" : ""}`}
                                onClick={() => { if (settingsData.allocated_events_visible) setShowAllocatedEventsModal(true); }}
                                disabled={!settingsData.allocated_events_visible}
                            >
                                {settingsData.allocated_events_visible ? "View Allocated Events" : "Allocated Events (Locked)"}
                            </button>
                        </div>
                    </>
                )}

                {showAllocatedEventsModal && (
                    <AllocatedEventsModal onClose={() => setShowAllocatedEventsModal(false)} />
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </Layout>
    );
}
