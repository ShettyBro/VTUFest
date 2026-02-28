import { useEffect } from "react";
import "../styles/dashboard-glass.css";

/**
 * GlassConfirm — a custom styled confirm dialog.
 * Props:
 *   title       – dialog heading (e.g. "Delete Notification")
 *   message     – body text / description
 *   confirmLabel– text on the confirm button (default "Confirm")
 *   cancelLabel – text on cancel button (default "Cancel")
 *   type        – "danger" | "warning" | "info" (controls accent colour)
 *   onConfirm   – called when user clicks the confirm button
 *   onCancel    – called when user clicks cancel or backdrop
 */
export default function GlassConfirm({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    type = "danger",
    onConfirm,
    onCancel,
}) {
    // Keyboard: Escape → cancel, Enter → confirm
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter") onConfirm();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onConfirm, onCancel]);

    const accentColor =
        type === "danger" ? "#ef4444" :
            type === "warning" ? "#f59e0b" :
                "var(--gold-solid)";

    const confirmBtnStyle = {
        flex: 1,
        padding: "12px",
        borderRadius: "10px",
        border: `2px solid ${accentColor}`,
        background: `${accentColor}22`,
        color: accentColor,
        fontWeight: 700,
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "background 0.2s",
    };

    const cancelBtnStyle = {
        flex: 1,
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
        color: "var(--text-secondary)",
        fontWeight: 600,
        fontSize: "0.95rem",
        cursor: "pointer",
    };

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
            style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(5px)",
                zIndex: 10000,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "20px",
                animation: "fadeIn 0.18s ease-out",
            }}
        >
            <style>{`
                @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            <div
                className="glass-card"
                style={{
                    minWidth: "320px",
                    maxWidth: "440px",
                    width: "100%",
                    padding: "30px",
                    border: `1px solid ${accentColor}`,
                    boxShadow: `0 0 28px ${accentColor}30`,
                    animation: "scaleIn 0.25s ease-out",
                    textAlign: "center",
                }}
            >
                {/* Icon */}
                <div style={{ fontSize: "2.2rem", marginBottom: "10px" }}>
                    {type === "danger" ? "⚠️" : type === "warning" ? "🔔" : "ℹ️"}
                </div>

                {/* Title */}
                <h3 style={{
                    margin: "0 0 12px",
                    color: accentColor,
                    fontSize: "1.2rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                }}>
                    {title}
                </h3>

                {/* Message */}
                <p style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.93rem",
                    lineHeight: "1.55",
                    margin: "0 0 26px",
                    whiteSpace: "pre-line",  /* respect \n in message */
                }}>
                    {message}
                </p>

                {/* Buttons */}
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        style={cancelBtnStyle}
                        onClick={onCancel}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        style={confirmBtnStyle}
                        onClick={onConfirm}
                        onMouseEnter={e => e.currentTarget.style.background = `${accentColor}44`}
                        onMouseLeave={e => e.currentTarget.style.background = `${accentColor}22`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
