import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../../styles/dashboard-glass.css";
import "../../styles/em-mobile.css";
import { isEMTokenExpired } from "../../utils/emFetch";
import { usePopup } from "../../context/PopupContext";
import SessionTimerBadge from "../../components/SessionTimerBadge";

const NAV_ITEMS = [
    { path: "/em-dashboard",     label: "Dashboard",    icon: "📊" },
    { path: "/em-accommodation", label: "Accommodation", icon: "🛏️" },
    { path: "/em-green-room",    label: "Green Room",   icon: "🏢" },
    { path: "/em-accounts",      label: "Accounts",     icon: "💰" },
];

export default function EMLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { showPopup } = usePopup();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const token = localStorage.getItem("vtufest_em_token");
    const name  = localStorage.getItem("vtufest_em_name") || "Event Manager";

    const currentPage = NAV_ITEMS.find(n => n.path === location.pathname);

    const doSessionExpiry = () => {
        localStorage.removeItem("vtufest_em_token");
        localStorage.removeItem("vtufest_em_name");
        localStorage.removeItem("vtufest_em_role");
        showPopup("Session expired. Please login again.", "error");
        setTimeout(() => navigate("/em-login", { replace: true }), 2000);
    };

    useEffect(() => {
        if (!token || isEMTokenExpired()) { doSessionExpiry(); return; }
        const handler = () => doSessionExpiry();
        window.addEventListener("em:session-expired", handler);
        return () => window.removeEventListener("em:session-expired", handler);
    }, []);

    // Close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("vtufest_em_token");
        localStorage.removeItem("vtufest_em_name");
        navigate("/em-login");
    };

    return (
        <div className="em-shell" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

            {/* ══ MOBILE TOP BAR ══════════════════════════════════ */}
            <div className="em-topbar">
                <div className="em-topbar-left">
                    <button className="em-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <img src="/main.webp" alt="Logo" className="em-topbar-logo" />
                </div>
                <div className="em-topbar-title">
                    {currentPage ? `${currentPage.icon} ${currentPage.label}` : "Event Manager"}
                </div>
                <div className="em-topbar-right">
                    <SessionTimerBadge tokenKey="vtufest_em_token" accentColor="#10b981" onExpired={doSessionExpiry} />
                </div>
            </div>

            {/* ══ OVERLAY ═════════════════════════════════════════ */}
            {drawerOpen && <div className="em-overlay" onClick={() => setDrawerOpen(false)} />}

            {/* ══ SIDEBAR / DRAWER ════════════════════════════════ */}
            <aside
                className={`em-sidebar ${drawerOpen ? "em-drawer-open" : ""}`}
                style={{
                    width: "220px", flexShrink: 0,
                    background: "rgba(15,23,42,0.95)",
                    backdropFilter: "blur(20px)",
                    borderRight: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", flexDirection: "column", zIndex: 100,
                }}
            >
                {/* Logo + close row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src="/main.webp" alt="Logo" style={{ height: "38px" }} />
                        <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem" }}>VTU HABBA</div>
                            <div style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: 600 }}>Event Manager</div>
                        </div>
                    </div>
                    <button className="em-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">✕</button>
                </div>

                {/* Name badge */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "4px" }}>Logged in as</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
                    <div style={{
                        display: "inline-block", marginTop: "6px", padding: "3px 10px",
                        borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700,
                        background: "rgba(16,185,129,0.2)", color: "#10b981",
                        border: "1px solid #10b981", letterSpacing: "0.5px",
                    }}>EVENT MANAGER</div>
                </div>

                {/* Nav */}
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
                                    color: isActive ? "#10b981" : "#cbd5e1",
                                    textDecoration: "none", fontSize: "0.9rem",
                                    fontWeight: isActive ? 600 : 400,
                                    background: isActive ? "rgba(16,185,129,0.1)" : "transparent",
                                    borderRight: isActive ? "3px solid #10b981" : "3px solid transparent",
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
                            fontWeight: 600, fontSize: "0.85rem",
                        }}
                    >🚪 Logout</button>
                </div>
            </aside>

            {/* ══ MAIN ════════════════════════════════════════════ */}
            <main className="em-main" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

                {/* Desktop top bar */}
                <div className="em-desktop-topbar" style={{
                    padding: "16px 28px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 600 }}>
                        {currentPage?.icon} {currentPage?.label || "Event Manager"}
                    </h2>
                    <SessionTimerBadge tokenKey="vtufest_em_token" accentColor="#10b981" onExpired={doSessionExpiry} />
                </div>

                <div className="em-content dashboard-glass-wrapper" style={{ flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}