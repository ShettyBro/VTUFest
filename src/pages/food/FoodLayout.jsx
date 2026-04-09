import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../../styles/food-mobile.css";

/**
 * FoodLayout.jsx
 *
 * FIXED (2026-03-28):
 *  - "← Admin Panel" button only shows when admin-bridged (sessionStorage flag set by FoodRoute).
 *  - Name/role reads from sessionStorage bridge values when admin-bridged.
 *  - Token expiry reads the correct token based on bridge state.
 *
 * UPDATED (2026-04-05):
 *  - Mobile-responsive: hamburger → sliding drawer + fixed top bar (≤768px).
 */

function isFoodTokenExpired() {
    const isBridge = sessionStorage.getItem("food_is_admin_bridge") === "true";
    const token = isBridge
        ? localStorage.getItem("vtufest_admin_token")
        : localStorage.getItem("vtufest_food_token");
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return Date.now() / 1000 > payload.exp;
    } catch { return true; }
}

const NAV_ITEMS = [
    { path: "/food/dashboard",   label: "Dashboard",   icon: "📊" },
    { path: "/food/meals",       label: "Meals",       icon: "🕐" },
    { path: "/food/stalls",      label: "Stalls",      icon: "🏪" },
    { path: "/food/redemptions", label: "Redemptions", icon: "🎟️" },
    { path: "/food/logs",        label: "Scan Logs",   icon: "📋" },
    { path: "/food/analytics",   label: "Analytics",   icon: "📈" },
];

export default function FoodLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const isBridge = sessionStorage.getItem("food_is_admin_bridge") === "true";
    const name = isBridge
        ? (sessionStorage.getItem("food_bridge_name") || "Admin")
        : (localStorage.getItem("vtufest_food_name") || "Coordinator");
    const role = isBridge
        ? (sessionStorage.getItem("food_bridge_role") || "SUPER_ADMIN")
        : (localStorage.getItem("vtufest_food_role") || "");

    const currentPage = NAV_ITEMS.find(n => n.path === location.pathname);

    const doExpiry = () => {
        localStorage.removeItem("vtufest_food_token");
        localStorage.removeItem("vtufest_food_name");
        localStorage.removeItem("vtufest_food_role");
        sessionStorage.removeItem("food_is_admin_bridge");
        sessionStorage.removeItem("food_bridge_name");
        sessionStorage.removeItem("food_bridge_role");
        navigate(isBridge ? "/ad-login" : "/food/login", { replace: true });
    };

    useEffect(() => {
        if (isFoodTokenExpired()) { doExpiry(); return; }
        const handler = () => doExpiry();
        window.addEventListener("food:session-expired", handler);
        return () => window.removeEventListener("food:session-expired", handler);
    }, []);

    // Close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("vtufest_food_token");
        localStorage.removeItem("vtufest_food_name");
        localStorage.removeItem("vtufest_food_role");
        sessionStorage.removeItem("food_is_admin_bridge");
        sessionStorage.removeItem("food_bridge_name");
        sessionStorage.removeItem("food_bridge_role");
        navigate(isBridge ? "/ad-dashboard" : "/food/login");
    };

    return (
        <div className="food-shell" style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

            {/* ══ MOBILE TOP BAR ══════════════════════════════════ */}
            <div className="food-topbar">
                <div className="food-topbar-left">
                    <button className="food-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <img src="/main.webp" alt="Logo" className="food-topbar-logo" />
                </div>
                <div className="food-topbar-title">
                    {currentPage ? `${currentPage.icon} ${currentPage.label}` : "🍽️ Food Portal"}
                </div>
                <div className="food-topbar-right">
                    <span style={{ color: "#64748b", fontSize: "0.7rem" }}>VTU 2026</span>
                </div>
            </div>

            {/* ══ OVERLAY ═════════════════════════════════════════ */}
            {drawerOpen && <div className="food-overlay" onClick={() => setDrawerOpen(false)} />}

            {/* ══ SIDEBAR / DRAWER ════════════════════════════════ */}
            <aside
                className={`food-sidebar ${drawerOpen ? "food-drawer-open" : ""}`}
                style={{
                    width: "230px", flexShrink: 0,
                    background: "rgba(15,23,42,0.97)",
                    backdropFilter: "blur(20px)",
                    borderRight: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", flexDirection: "column", zIndex: 100,
                }}
            >
                {/* Logo + close row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src="/main.webp" alt="Logo" style={{ height: "34px" }} />
                        <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.83rem" }}>VTU HABBA</div>
                            <div style={{ color: "#d4af37", fontSize: "0.68rem", fontWeight: 600 }}>🍽️ Food Portal</div>
                        </div>
                    </div>
                    <button className="food-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">✕</button>
                </div>

                {/* User */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "3px" }}>Logged in as</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem" }}>{name}</div>
                    <div style={{
                        display: "inline-block", marginTop: "5px", padding: "2px 9px",
                        borderRadius: "20px", fontSize: "0.68rem", fontWeight: 700,
                        background: "rgba(212,175,55,0.15)", color: "#d4af37",
                        border: "1px solid rgba(212,175,55,0.4)", letterSpacing: "0.4px",
                    }}>
                        {role.replace(/_/g, " ")}
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
                    {NAV_ITEMS.map(item => {
                        const active = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setDrawerOpen(false)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "11px 20px",
                                    color: active ? "#d4af37" : "#cbd5e1",
                                    textDecoration: "none", fontSize: "0.88rem",
                                    fontWeight: active ? 600 : 400,
                                    background: active ? "rgba(212,175,55,0.1)" : "transparent",
                                    borderRight: active ? "3px solid #d4af37" : "3px solid transparent",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom actions */}
                <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {isBridge && (
                        <Link
                            to="/ad-dashboard"
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "8px 12px",
                                background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)",
                                color: "#60a5fa", borderRadius: "8px", textDecoration: "none",
                                fontSize: "0.8rem", fontWeight: 600,
                            }}
                        >
                            ← Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%", padding: "9px",
                            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                            color: "#f87171", borderRadius: "8px", cursor: "pointer",
                            fontWeight: 600, fontSize: "0.82rem", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                    >
                        🚪 {isBridge ? "Back to Admin" : "Logout"}
                    </button>
                </div>
            </aside>

            {/* ══ MAIN ════════════════════════════════════════════ */}
            <main className="food-main" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#0f172a" }}>

                {/* Desktop top bar */}
                <div className="food-desktop-topbar" style={{
                    padding: "14px 26px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.05rem", fontWeight: 600 }}>
                        {currentPage ? `${currentPage.icon} ${currentPage.label}` : "🍽️ Food Management"}
                    </h2>
                    <span style={{ color: "#64748b", fontSize: "0.78rem" }}>VTU Youth Fest 2026</span>
                </div>

                <div className="food-content dashboard-glass-wrapper" style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}