import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../../styles/dashboard-glass.css";
import "../../styles/admin-mobile.css";
import { isAdminTokenExpired } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";
import SessionTimerBadge from "../../components/SessionTimerBadge";

const NAV_ITEMS = [
    { path: "/ad-dashboard",     label: "Dashboard",     icon: "📊" },
    { path: "/ad-colleges",      label: "Colleges",      icon: "🏫" },
    { path: "/ad-event-metrics", label: "Event Metrics", icon: "🎭" },
    { path: "/ad-payments",      label: "Payments",      icon: "💳" },
    { path: "/ad-accommodation", label: "Accommodation", icon: "🛏️" },
    { path: "/ad-transport",     label: "Transport",     icon: "🚌" },
    { path: "/ad-green-room",    label: "Cloakroom",     icon: "🏢" },
    { path: "/ad-find-person",   label: "Find Person",   icon: "🔍" },
    { path: "/ad-feedback",      label: "Feedback",      icon: "💬" },
    { path: "/ad-calendar",      label: "Calendar",      icon: "📅" },
    { path: "/ad-notifications", label: "Notifications", icon: "🔔" },
    { path: "/ad-settings",      label: "Settings",      icon: "⚙️" },
];

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { showPopup } = usePopup();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const token       = localStorage.getItem("vtufest_admin_token");
    const role        = localStorage.getItem("vtufest_admin_role");
    const name        = localStorage.getItem("vtufest_admin_name") || "Admin";
    const isSuperAdmin = role === "SUPER_ADMIN";

    const currentPage = NAV_ITEMS.find(n => n.path === location.pathname);

    const doSessionExpiry = () => {
        localStorage.removeItem("vtufest_admin_token");
        localStorage.removeItem("vtufest_admin_role");
        localStorage.removeItem("vtufest_admin_name");
        showPopup("Session expired. Please login again.", "error");
        setTimeout(() => navigate("/ad-login", { replace: true }), 2000);
    };

    useEffect(() => {
        if (!token || !role || isAdminTokenExpired()) {
            doSessionExpiry();
            return;
        }
        const handler = () => doSessionExpiry();
        window.addEventListener("admin:session-expired", handler);
        return () => window.removeEventListener("admin:session-expired", handler);
    }, []);

    // Close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("vtufest_admin_token");
        localStorage.removeItem("vtufest_admin_role");
        localStorage.removeItem("vtufest_admin_name");
        navigate("/ad-login");
    };

    return (
        <div className="adm-shell" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

            {/* ══ MOBILE TOP BAR ══════════════════════════════════ */}
            <div className="adm-topbar">
                <div className="adm-topbar-left">
                    <button className="adm-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <img src="/main.webp" alt="Logo" className="adm-topbar-logo" />
                </div>
                <div className="adm-topbar-title">
                    {currentPage ? `${currentPage.icon} ${currentPage.label}` : "Admin Panel"}
                </div>
                <div className="adm-topbar-right">
                    <SessionTimerBadge tokenKey="vtufest_admin_token" accentColor="#d4af37" onExpired={doSessionExpiry} />
                </div>
            </div>

            {/* ══ OVERLAY (mobile) ════════════════════════════════ */}
            {drawerOpen && <div className="adm-overlay" onClick={() => setDrawerOpen(false)} />}

            {/* ══ SIDEBAR / DRAWER ════════════════════════════════ */}
            <aside
                className={`adm-sidebar ${drawerOpen ? "adm-drawer-open" : ""}`}
                style={{
                    width: "240px", flexShrink: 0,
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(20px)",
                    borderRight: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", flexDirection: "column",
                    padding: "0", zIndex: 100,
                }}
            >
                {/* Logo + close row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src="/main.webp" alt="Logo" style={{ height: "40px" }} />
                        <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem" }}>VTU HABBA</div>
                            <div style={{ color: "#d4af37", fontSize: "0.75rem", fontWeight: 600 }}>Admin Panel</div>
                        </div>
                    </div>
                    <button className="adm-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">✕</button>
                </div>

                {/* Role Badge */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "4px" }}>Logged in as</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
                    <div style={{
                        display: "inline-block", marginTop: "6px", padding: "3px 10px",
                        borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700,
                        background: isSuperAdmin ? "rgba(212,175,55,0.2)" : "rgba(96,165,250,0.2)",
                        color: isSuperAdmin ? "#d4af37" : "#60a5fa",
                        border: `1px solid ${isSuperAdmin ? "#d4af37" : "#60a5fa"}`,
                        letterSpacing: "0.5px",
                    }}>
                        {isSuperAdmin ? "SUPER ADMIN" : "SUB ADMIN"}
                    </div>
                </div>



                {/* Nav Links */}
                <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
                    {NAV_ITEMS.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setDrawerOpen(false)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "12px 20px",
                                    color: isActive ? "#d4af37" : "#cbd5e1",
                                    textDecoration: "none", fontSize: "0.9rem",
                                    fontWeight: isActive ? 600 : 400,
                                    background: isActive ? "rgba(212,175,55,0.1)" : "transparent",
                                    borderRight: isActive ? "3px solid #d4af37" : "3px solid transparent",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%", padding: "10px",
                            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                            color: "#f87171", borderRadius: "8px", cursor: "pointer",
                            fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* ══ MAIN CONTENT ════════════════════════════════════ */}
            <main className="adm-main" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

                {/* Desktop top bar */}
                <div className="adm-desktop-topbar" style={{
                    padding: "16px 28px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(15,23,42,0.8)",
                    backdropFilter: "blur(10px)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 600 }}>
                        {currentPage?.icon} {currentPage?.label || "Admin Panel"}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => {
                                const adminToken = localStorage.getItem("vtufest_admin_token");
                                const adminName  = localStorage.getItem("vtufest_admin_name") || name;
                                const adminRole  = localStorage.getItem("vtufest_admin_role") || role;
                                if (adminToken) {
                                    localStorage.setItem("vtufest_food_token", adminToken);
                                    localStorage.setItem("vtufest_food_name",  adminName);
                                    localStorage.setItem("vtufest_food_role",  adminRole);
                                }
                                navigate("/food/dashboard");
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "6px 14px", background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)",
                                border: "1px solid rgba(16,185,129,0.5)", borderRadius: "8px",
                                color: "#10b981", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                                boxShadow: "0 0 12px rgba(16,185,129,0.2)", transition: "all 0.3s ease",
                                textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "4px",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(16,185,129,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 12px rgba(16,185,129,0.2)"; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            🍽️ Food Panel
                        </button>
                        <Link to="/vm" style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "6px 14px", background: "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)",
                            border: "1px solid rgba(212,175,55,0.5)", borderRadius: "8px",
                            color: "#d4af37", fontWeight: 700, fontSize: "0.8rem", textDecoration: "none",
                            boxShadow: "0 0 12px rgba(212,175,55,0.25)", transition: "all 0.3s ease",
                            textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "8px",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(212,175,55,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 12px rgba(212,175,55,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            🥷 VM Portal
                        </Link>
                        <SessionTimerBadge tokenKey="vtufest_admin_token" accentColor="#d4af37" onExpired={doSessionExpiry} />
                        {!isSuperAdmin && (
                            <span style={{
                                padding: "4px 12px",
                                background: "rgba(96,165,250,0.15)", border: "1px solid #60a5fa",
                                color: "#60a5fa", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600,
                            }}>
                                👁 View Only Mode
                            </span>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <div className="adm-content dashboard-glass-wrapper" style={{ flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}