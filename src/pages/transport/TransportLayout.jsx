import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "../../styles/dashboard-glass.css";

const NAV_ITEMS = [
  { path: "/travel", label: "Dashboard", icon: "🚌" },
];

export default function TransportLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("transport_role") || "Transport Manager";

  useEffect(() => {
    if (!localStorage.getItem("transport_token")) navigate("/travel/login", { replace: true });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("transport_token");
    localStorage.removeItem("transport_role");
    navigate("/travel/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: "220px", flexShrink: 0,
        background: "rgba(15,23,42,0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        display: "flex", flexDirection: "column", zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/main.webp" alt="Logo" style={{ height: "40px" }} />
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.9rem" }}>VTU HABBA</div>
              <div style={{ color: "#d4af37", fontSize: "0.75rem", fontWeight: 600 }}>Transport Portal</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "#cbd5e1", fontSize: "0.8rem", marginBottom: "4px" }}>Logged in as</div>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>Transport Manager</div>
          <div style={{
            display: "inline-block", marginTop: "6px", padding: "3px 10px",
            borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700,
            background: "rgba(212,175,55,0.2)", color: "#d4af37",
            border: "1px solid #d4af37", letterSpacing: "0.5px",
          }}>TRANSPORT MGR</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
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
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "10px",
            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
            color: "#f87171", borderRadius: "8px", cursor: "pointer",
            fontWeight: 600, fontSize: "0.85rem",
          }}>🚪 Logout</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "16px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "1.1rem", fontWeight: 600 }}>
            🚌 Transport Coordination Dashboard
          </h2>
        </div>
        <div className="dashboard-glass-wrapper" style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
