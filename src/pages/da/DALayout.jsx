import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDA } from "../../context/DAContext";
import { usePopup } from "../../context/PopupContext";
import SessionTimerBadge from "../../components/SessionTimerBadge";
import "../../styles/dashboard-glass.css";

const NAV_ITEMS = [
    { path: "/da-students", label: "Students", icon: "🎓" },
    { path: "/da-managers", label: "Managers", icon: "👤" },
    { path: "/da-principals", label: "Principals", icon: "🏫" },
    { path: "/da-college-unlock", label: "College Unlock", icon: "🔓" },
    { path: "/da-audit", label: "Audit Log", icon: "📋" },
];

export default function DALayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, officer, clearToken } = useDA();
    const { showPopup } = usePopup();

    // Guard: redirect if no in-memory token
    useEffect(() => {
        if (!token) {
            navigate("/da-login", { replace: true });
        }
    }, [token]);

    // Listen for 401 events fired by daFetch
    useEffect(() => {
        const handler = () => {
            clearToken();
            showPopup("Session expired. Please login again.", "error");
            setTimeout(() => navigate("/da-login", { replace: true }), 1500);
        };
        window.addEventListener("da:session-expired", handler);
        return () => window.removeEventListener("da:session-expired", handler);
    }, []);

    const handleLogout = () => {
        clearToken();
        navigate("/da-login");
    };

    const currentNav = NAV_ITEMS.find(n => n.path === location.pathname);

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

            {/* ===== SIDEBAR ===== */}
            <aside style={{
                width: "240px",
                flexShrink: 0,
                background: "rgba(15, 23, 42, 0.97)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                zIndex: 100,
            }}>
                {/* Logo */}
                <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src="/main.webp" alt="Logo" style={{ height: "40px" }} />
                        <div>
                            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem" }}>VTU HABBA</div>
                            <div style={{ color: "#c084fc", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.4px" }}>Data Admin Portal</div>
                        </div>
                    </div>
                </div>

                {/* Officer Info */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "#64748b", fontSize: "0.74rem", marginBottom: "3px" }}>Logged in as</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.88rem", marginBottom: "6px" }}>
                        {officer?.name || "Officer"}
                    </div>
                    <div style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        background: "rgba(168,85,247,0.18)",
                        color: "#c084fc",
                        border: "1px solid rgba(168,85,247,0.4)",
                        letterSpacing: "0.4px",
                    }}>
                        DATA CORRECTION OFFICER
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
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 20px",
                                    color: isActive ? "#c084fc" : "#94a3b8",
                                    textDecoration: "none",
                                    fontSize: "0.9rem",
                                    fontWeight: isActive ? 600 : 400,
                                    background: isActive ? "rgba(168,85,247,0.12)" : "transparent",
                                    borderRight: isActive ? "3px solid #c084fc" : "3px solid transparent",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: "100%",
                            padding: "10px",
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.35)",
                            color: "#f87171",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            fontFamily: "inherit",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Top Bar */}
                <div style={{
                    padding: "16px 28px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(15,23,42,0.85)",
                    backdropFilter: "blur(10px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.05rem", fontWeight: 600 }}>
                        {currentNav?.icon} {currentNav?.label || "DA Portal"}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <SessionTimerBadge
                            tokenKey="vtufest_da_token"
                            accentColor="#c084fc"
                            onExpired={handleLogout}
                        />
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "4px 12px",
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "20px",
                            color: "#f87171",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                        }}>
                            ⚠️ Internal Tool — All actions are audited
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="dashboard-glass-wrapper" style={{ flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}