/**
 * MobileBlockScreen — shown to managers/principals on physical mobile devices.
 * Replaces the dashboard entirely; cannot be bypassed with desktop mode.
 */
export default function MobileBlockScreen({ role = "manager" }) {
    const roleLabel = role === "principal" ? "Principal" : "Team Manager";

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "linear-gradient(160deg, #0f172a 0%, #0f2044 60%, #1e3a8a 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
            zIndex: 9999,
            fontFamily: "'Outfit', sans-serif",
            textAlign: "center",
            gap: "20px",
        }}>
            {/* Icon */}
            <div style={{
                width: 80, height: 80,
                borderRadius: "50%",
                background: "rgba(212,175,55,0.12)",
                border: "2px solid rgba(212,175,55,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.2rem",
                marginBottom: 8,
            }}>
                🖥️
            </div>

            {/* Heading */}
            <h2 style={{
                color: "#f1f5f9",
                fontSize: "1.4rem",
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.3,
            }}>
                Desktop Access Required
            </h2>

            {/* Role badge */}
            <div style={{
                background: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.35)",
                borderRadius: 8,
                padding: "6px 18px",
                color: "#d4af37",
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "0.5px",
            }}>
                {roleLabel} Portal
            </div>

            {/* Message */}
            <p style={{
                color: "#94a3b8",
                fontSize: "0.95rem",
                lineHeight: 1.7,
                maxWidth: 320,
                margin: 0,
            }}>
                The <strong style={{ color: "#cbd5e1" }}>{roleLabel} portal</strong> is
                designed for desktop and laptop screens. Mobile access is not supported
                to ensure the best management experience.
            </p>

            {/* Instructions */}
            <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "16px 20px",
                maxWidth: 300,
                textAlign: "left",
            }}>
                <p style={{ color: "#64748b", fontSize: "0.78rem", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                    How to access
                </p>
                {[
                    "Open a desktop or laptop browser",
                    "Visit vtufest2026.acharyahabba.com",
                    `Log in as ${roleLabel}`,
                ].map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{
                            background: "#d4af37", color: "#0a1628",
                            borderRadius: "50%", width: 20, height: 20,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.4 }}>{step}</span>
                    </div>
                ))}
            </div>

            {/* Logout button */}
            <button
                onClick={handleLogout}
                style={{
                    marginTop: 8,
                    padding: "12px 32px",
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.4)",
                    borderRadius: 10,
                    color: "#f87171",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                Logout
            </button>
        </div>
    );
}
