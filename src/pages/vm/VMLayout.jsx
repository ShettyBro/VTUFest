import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { isAdminTokenExpired } from "../../utils/adminFetch";
import { usePopup } from "../../context/PopupContext";
import SessionTimerBadge from "../../components/SessionTimerBadge";
import "../../styles/dashboard-glass.css";

const NAV_ITEMS = [
    { path: "/vm",                  label: "Dashboard",         icon: "📊" },
    { path: "/vm/volunteers",       label: "Volunteer Regs",    icon: "🙋‍♂️" },
    { path: "/vm/coordinator",      label: "Assign Volunteers", icon: "📋" },
    { path: "/vm/faculty",          label: "Faculty Regs",      icon: "👨‍🏫" },
    { path: "/vm/faculty/assign",   label: "Assign Faculty",    icon: "🎓" },
];

export default function VMLayout({ children }) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { showPopup } = usePopup();

    const token = localStorage.getItem("vtufest_admin_token");
    const role  = localStorage.getItem("vtufest_admin_role");
    const name  = localStorage.getItem("vtufest_admin_name") || "Admin";

    const doSessionExpiry = () => {
        localStorage.removeItem("vtufest_admin_token");
        localStorage.removeItem("vtufest_admin_role");
        localStorage.removeItem("vtufest_admin_name");
        showPopup("Session expired. Please login again.", "error");
        setTimeout(() => navigate("/ad-login", { replace: true }), 2000);
    };

    useEffect(() => {
        if (!token || !role || isAdminTokenExpired()) { doSessionExpiry(); return; }
        const handler = () => doSessionExpiry();
        window.addEventListener("admin:session-expired", handler);
        return () => window.removeEventListener("admin:session-expired", handler);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("vtufest_admin_token");
        localStorage.removeItem("vtufest_admin_role");
        localStorage.removeItem("vtufest_admin_name");
        navigate("/ad-login");
    };

    const currentNav = NAV_ITEMS.find(n => location.pathname === n.path || (n.path !== "/vm" && location.pathname.startsWith(n.path)));

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            {/* ── SIDEBAR ── */}
            <aside style={{ width: "240px", flexShrink: 0, background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", zIndex: 100 }}>
                {/* Logo */}
                <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src="/main.webp" alt="Logo" style={{ height: "40px" }} />
                        <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem" }}>VTU HABBA</div>
                            <div style={{ color: "#a8edea", fontSize: "0.72rem", fontWeight: 600 }}>VM Event Portal</div>
                        </div>
                    </div>
                </div>

                {/* User */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ color: "#cbd5e1", fontSize: "0.78rem", marginBottom: "3px" }}>Logged in as</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem" }}>{name}</div>
                    <div style={{ display: "inline-block", marginTop: "5px", padding: "2px 9px", borderRadius: "20px", fontSize: "0.68rem", fontWeight: 700, background: "rgba(168,237,234,0.12)", color: "#a8edea", border: "1px solid #a8edea" }}>
                        {role?.replace(/_/g, " ") || "SUPER ADMIN"}
                    </div>
                </div>

                {/* Back to Admin */}
                <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link to="/ad-dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", textDecoration: "none", padding: "6px 0" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
                        ← Back to Admin Panel
                    </Link>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
                    {NAV_ITEMS.map(item => {
                        const isActive = item.path === "/vm"
                            ? location.pathname === "/vm"
                            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                        return (
                            <Link key={item.path} to={item.path} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", color: isActive ? "#a8edea" : "#cbd5e1", textDecoration: "none", fontSize: "0.88rem", fontWeight: isActive ? 600 : 400, background: isActive ? "rgba(168,237,234,0.08)" : "transparent", borderRight: isActive ? "3px solid #a8edea" : "3px solid transparent", transition: "all 0.2s" }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                <span style={{ fontSize: "1.05rem" }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <button onClick={handleLogout} style={{ width: "100%", padding: "10px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Topbar */}
                <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.05rem", fontWeight: 600 }}>
                        {currentNav?.icon} {currentNav?.label || "VM Event Portal"}
                    </h2>
                    <SessionTimerBadge tokenKey="vtufest_admin_token" accentColor="#a8edea" onExpired={doSessionExpiry} />
                </div>

                <div className="dashboard-glass-wrapper" style={{ flex: 1 }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
