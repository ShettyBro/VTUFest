import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SessionTimerBadge from "../SessionTimerBadge";
import "../../styles/mobile-layout.css";

const PAGE_TITLES = {
    "/dashboard": "Dashboard",
    "/student-register": "Register",
    "/principal-dashboard": "Dashboard",
    "/manager-dashboard": "Dashboard",
    "/approvals": "Applications",
    "/approved-students": "Approved",
    "/rejected-students": "Rejected",
    "/accommodation": "Accommodation",
    "/accompanist-form": "Accompanist",
    "/assign-events": "Events",
    "/fee-payment": "Fee Payment",
    "/green-room": "Green Room",
    "/rules": "Rules & Regulations",
    "/changepassword": "Change Password",
};

export default function MobileTopBar({ notificationsData = [] }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    const userName = localStorage.getItem("name") || "User";
    const userUsn = localStorage.getItem("usn") || "";
    const avatarSeed = userUsn || userName || "default";
    const userPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;

    const pageTitle = PAGE_TITLES[location.pathname] || "VTU HABBA";

    const sortedNotifications = notificationsData
        .filter(n => n.priority >= 2)
        .sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return new Date(b.date) - new Date(a.date);
        });

    useEffect(() => {
        const handleOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    return (
        <>
            <header className="mobile-top-bar">
                {/* LEFT: Logo */}
                <div className="mtb-left">
                    <img src="/main.webp" alt="VTU Fest" className="mtb-logo" />
                </div>

                {/* CENTER: Page Title */}
                <div className="mtb-title">{pageTitle}</div>

                {/* RIGHT: Session timer + Bell + Avatar */}
                <div className="mtb-right">
                    <div className="mtb-timer-wrap">
                        <SessionTimerBadge
                            tokenKey="vtufest_token"
                            accentColor="#d4af37"
                            onExpired={() => {
                                localStorage.clear();
                                navigate("/");
                            }}
                        />
                    </div>

                    {/* Notification Bell */}
                    <div className="mtb-icon-btn" ref={notifRef} onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" />
                        </svg>
                        {sortedNotifications.length > 0 && (
                            <span className="mtb-badge">{sortedNotifications.length > 9 ? "9+" : sortedNotifications.length}</span>
                        )}
                    </div>

                    {/* Profile Avatar */}
                    <div className="mtb-icon-btn" ref={profileRef} onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}>
                        <img src={userPhoto} alt="Profile" className="mtb-avatar" />
                    </div>
                </div>
            </header>

            {/* Notification Sheet */}
            {notifOpen && (
                <div className="mtb-sheet notif-sheet">
                    <div className="mtb-sheet-header">
                        <span>Notifications</span>
                        <button className="mtb-sheet-close" onClick={() => setNotifOpen(false)}>✕</button>
                    </div>
                    {sortedNotifications.length > 0 ? (
                        sortedNotifications.map(n => (
                            <div key={n.id} className={`mtb-notif-item priority-${n.priority}`}>
                                {n.message}
                            </div>
                        ))
                    ) : (
                        <div className="mtb-sheet-empty">No new notifications</div>
                    )}
                </div>
            )}

            {/* Profile Sheet */}
            {profileOpen && (
                <div className="mtb-sheet profile-sheet">
                    <div className="mtb-sheet-header">
                        <div className="mtb-profile-info">
                            <img src={userPhoto} alt="Profile" className="mtb-sheet-avatar" />
                            <div>
                                <div className="mtb-profile-name">{userName}</div>
                                {userUsn && <div className="mtb-profile-usn">{userUsn}</div>}
                            </div>
                        </div>
                        <button className="mtb-sheet-close" onClick={() => setProfileOpen(false)}>✕</button>
                    </div>
                    <div className="mtb-sheet-menu-item" onClick={() => { navigate("/changepassword"); setProfileOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Change Password
                    </div>
                    <div className="mtb-sheet-menu-item logout" onClick={() => { localStorage.clear(); navigate("/"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                        Logout
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {(profileOpen || notifOpen) && (
                <div className="mtb-backdrop" onClick={() => { setProfileOpen(false); setNotifOpen(false); }} />
            )}
        </>
    );
}
